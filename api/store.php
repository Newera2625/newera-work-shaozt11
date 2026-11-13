<?php
/**
 * 数据层：MySQL（PDO）与 JSON 文件双模式
 *
 * - MySQL 模式下，每个逻辑表对应一张 `bc_xxx` 表，字段为 id / data / created_at，
 *   data 存储整行 JSON，便于无 SQL 差异地兼容不同数据库环境。
 * - JSON 模式下，数据写入 api/data/*.json，服务器无需任何扩展即可运行。
 * - 两种模式对上层接口完全透明。
 */

declare(strict_types=1);

if (!function_exists('cfg')) {
    require_once __DIR__ . '/bootstrap.php';
}

class Store
{
    /** @var PDO|null */
    private static $pdo = null;

    /** @var string mysql|json */
    private static $mode = '';

    /** @var array<string,array> */
    private static $cache = [];

    /** 当前存储模式 */
    public static function mode(): string
    {
        if (self::$mode !== '') {
            return self::$mode;
        }
        self::$mode = 'json';
        if (!cfg('db.enabled', true) || !class_exists('PDO')) {
            return self::$mode;
        }
        try {
            $dsn = sprintf(
                'mysql:host=%s;port=%d;dbname=%s;charset=%s',
                (string)cfg('db.host', '127.0.0.1'),
                (int)cfg('db.port', 3306),
                (string)cfg('db.name', 'bililite'),
                (string)cfg('db.charset', 'utf8mb4')
            );
            $pdo = new PDO(
                $dsn,
                (string)cfg('db.user', 'root'),
                (string)cfg('db.pass', ''),
                [
                    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_TIMEOUT            => 3,
                ]
            );
            self::$pdo = $pdo;
            self::$mode = 'mysql';
        } catch (Throwable $e) {
            self::$pdo = null;
            self::$mode = 'json';
        }
        return self::$mode;
    }

    /** 数据库模式下的物理表名 */
    private static function table_name(string $table): string
    {
        $prefix = (string)cfg('db.prefix', 'bc_');
        $safe = preg_replace('/[^a-zA-Z0-9_]/', '', $table);
        return $prefix . $safe;
    }

    /** MySQL 模式下确保表存在 */
    private static function ensure_table(string $table): void
    {
        if (self::mode() !== 'mysql' || !self::$pdo instanceof PDO) {
            return;
        }
        $sql = 'CREATE TABLE IF NOT EXISTS `' . self::table_name($table) . '` (
            `id` VARCHAR(96) NOT NULL,
            `data` LONGTEXT NOT NULL,
            `created_at` INT NOT NULL DEFAULT 0,
            PRIMARY KEY (`id`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4';
        self::$pdo->exec($sql);
    }

    /* ---------------- JSON 模式底层 ---------------- */

    private static function json_dir(): string
    {
        $dir = (string)cfg('json_dir', __DIR__ . '/data');
        if (!is_dir($dir)) {
            @mkdir($dir, 0775, true);
        }
        return $dir;
    }

    private static function json_load(string $table): array
    {
        if (isset(self::$cache[$table])) {
            return self::$cache[$table];
        }
        $file = self::json_dir() . '/' . preg_replace('/[^a-zA-Z0-9_]/', '', $table) . '.json';
        $rows = [];
        if (is_file($file)) {
            $raw = @file_get_contents($file);
            if (is_string($raw) && $raw !== '') {
                $decoded = json_decode($raw, true);
                if (is_array($decoded)) {
                    $rows = $decoded;
                }
            }
        }
        self::$cache[$table] = $rows;
        return $rows;
    }

    private static function json_save(string $table, array $rows): void
    {
        $file = self::json_dir() . '/' . preg_replace('/[^a-zA-Z0-9_]/', '', $table) . '.json';
        $json = json_encode(array_values($rows), JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        if ($json === false) {
            return;
        }
        @file_put_contents($file, $json, LOCK_EX);
        self::$cache[$table] = array_values($rows);
    }

    /* ---------------- 通用 CRUD ---------------- */

    /** 读取整表 */
    public static function all(string $table): array
    {
        if (self::mode() === 'mysql') {
            self::ensure_table($table);
            $stmt = self::$pdo->prepare('SELECT data FROM `' . self::table_name($table) . '`');
            $stmt->execute();
            $rows = [];
            foreach ($stmt->fetchAll() as $row) {
                $decoded = json_decode((string)$row['data'], true);
                if (is_array($decoded)) {
                    $rows[] = $decoded;
                }
            }
            return $rows;
        }
        return self::json_load($table);
    }

    /** 按主键读取 */
    public static function find(string $table, string $id): ?array
    {
        if ($id === '') {
            return null;
        }
        foreach (self::all($table) as $row) {
            if ((string)($row['id'] ?? '') === $id) {
                return $row;
            }
        }
        return null;
    }

    /** 按字段等值筛选 */
    public static function where(string $table, string $field, $value): array
    {
        $value = (string)$value;
        $result = [];
        foreach (self::all($table) as $row) {
            if ((string)($row[$field] ?? '') === $value) {
                $result[] = $row;
            }
        }
        return $result;
    }

    /** 插入一行（已存在同 id 则覆盖） */
    public static function insert(string $table, array $row): array
    {
        if (empty($row['id'])) {
            $row['id'] = make_id(substr($table, 0, 3));
        }
        $row['id'] = (string)$row['id'];
        if (self::mode() === 'mysql') {
            self::ensure_table($table);
            $stmt = self::$pdo->prepare(
                'INSERT INTO `' . self::table_name($table) . '` (`id`, `data`, `created_at`) VALUES (:id, :data, :created)
                 ON DUPLICATE KEY UPDATE `data` = VALUES(`data`)'
            );
            $stmt->execute([
                ':id'      => $row['id'],
                ':data'    => (string)json_encode($row, JSON_UNESCAPED_UNICODE),
                ':created' => (int)($row['created_at'] ?? time()),
            ]);
            return $row;
        }
        $rows = self::json_load($table);
        $replaced = false;
        foreach ($rows as $index => $item) {
            if ((string)($item['id'] ?? '') === $row['id']) {
                $rows[$index] = $row;
                $replaced = true;
                break;
            }
        }
        if (!$replaced) {
            $rows[] = $row;
        }
        self::json_save($table, $rows);
        return $row;
    }

    /** 按主键更新部分字段 */
    public static function update(string $table, string $id, array $fields): bool
    {
        $row = self::find($table, $id);
        if (!$row) {
            return false;
        }
        foreach ($fields as $key => $value) {
            $row[$key] = $value;
        }
        self::insert($table, $row);
        return true;
    }

    /** 按主键删除 */
    public static function delete(string $table, string $id): bool
    {
        if (self::mode() === 'mysql') {
            self::ensure_table($table);
            $stmt = self::$pdo->prepare('DELETE FROM `' . self::table_name($table) . '` WHERE `id` = :id');
            $stmt->execute([':id' => $id]);
            return $stmt->rowCount() > 0;
        }
        $rows = self::json_load($table);
        $kept = [];
        $removed = false;
        foreach ($rows as $row) {
            if ((string)($row['id'] ?? '') === $id) {
                $removed = true;
                continue;
            }
            $kept[] = $row;
        }
        if ($removed) {
            self::json_save($table, $kept);
        }
        return $removed;
    }

    /** 统计条数 */
    public static function count(string $table): int
    {
        return count(self::all($table));
    }

    /** 判断表是否为空 */
    public static function is_empty(string $table): bool
    {
        return self::count($table) === 0;
    }
}

/* ------------------------------------------------------------------ */
/* 种子数据                                                            */
/* ------------------------------------------------------------------ */

/**
 * 一键初始化数据（幂等：已存在的数据不会被重复写入）
 */
function seed_all(): array
{
    $report = [
        'mode'    => Store::mode(),
        'users'   => 0,
        'videos'  => 0,
        'comments' => 0,
        'messages' => 0,
        'skipped' => [],
    ];

    if (!Store::is_empty('users')) {
        $report['skipped'][] = 'users';
    } else {
        foreach (seed_users() as $user) {
            Store::insert('users', $user);
            $report['users']++;
        }
    }

    if (!Store::is_empty('videos')) {
        $report['skipped'][] = 'videos';
    } else {
        foreach (seed_videos() as $video) {
            Store::insert('videos', $video);
            $report['videos']++;
        }
    }

    if (!Store::is_empty('comments')) {
        $report['skipped'][] = 'comments';
    } else {
        foreach (seed_comments() as $comment) {
            Store::insert('comments', $comment);
            $report['comments']++;
        }
    }

    if (!Store::is_empty('messages')) {
        $report['skipped'][] = 'messages';
    } else {
        foreach (seed_messages() as $message) {
            Store::insert('messages', $message);
            $report['messages']++;
        }
    }

    return $report;
}

function seed_users(): array
{
    $now = time();
    $password = password_hash('123456', PASSWORD_DEFAULT);
    $rows = [
        ['u_1',  'bilibili',  '哔哩哔哩',      6, '官方账号，陪你度过每一个快乐时刻', $password, 3000000, 12000],
        ['u_2',  'music',     '音乐播放器',    5, '每天一首好听的旋律',               $password, 800000,  3200],
        ['u_3',  'gamer',     '游戏解说君',    5, '认真做游戏，也认真做内容',         $password, 1200000, 5600],
        ['u_4',  'tech',      '科技前线',      4, '用最简单的方式讲科技',             $password, 420000,  1800],
        ['u_5',  'anime',     '手绘动画社',    4, '一帧一帧画给你看',                 $password, 260000,  2400],
        ['u_6',  'life',      '生活日记本',    3, '记录平凡日子里的闪光',             $password, 88000,   960],
        ['u_7',  'knowledge', '知识胶囊',      4, '三分钟涨一个知识点',               $password, 350000,  1500],
        ['u_8',  'food',      '美食猎人',      3, '好吃的东西值得被记录',             $password, 150000,  1200],
        ['u_demo', 'demo',   '新同学',        2, '欢迎来到 BiliLite',                $password, 120,     30],
    ];
    $users = [];
    foreach ($rows as $index => $row) {
        $users[] = [
            'id'         => $row[0],
            'username'   => $row[1],
            'nickname'   => $row[2],
            'level'      => $row[3],
            'signature'  => $row[4],
            'password'   => $row[5],
            'views'      => $row[6],
            'following'  => 0,
            'followers'  => 120 - $index * 9,
            'likes'      => 3000 - $index * 210,
            'avatar'     => $row[0],
            'created_at' => $now - (30 - $index) * 86400,
        ];
    }
    // demo 用户预置一位粉丝与关注关系，便于展示统计数据
    $users[count($users) - 1]['followers'] = 36;
    $users[count($users) - 1]['following'] = 12;
    $users[count($users) - 1]['likes'] = 128;
    return $users;
}

function seed_videos(): array
{
    $now = time();
    // 字段：id, 标题, UP主, 分区, 时长(秒), 播放, 点赞, 投币, 收藏, 弹幕, 天数, 简介, 封面色A, 封面色B
    $rows = [
        ['v_1',  '【4K修复】三个镜头，讲透一部电影的开场', 'u_2',  '影视', 734, 1286400, 86200, 24100, 3180, 9200, 1, '我们请来了三位剪辑师，用三个镜头拆解开场调度，看完你再看任何电影都会多一层理解。', '#2b2d42', '#4a4e69'],
        ['v_2',  '十年之后重听《晴天》，你听出什么了吗', 'u_2',  '音乐', 486, 986000, 64300, 15800, 2260, 12400, 2, '有些歌只是陪伴，有些歌是青春本身。这一期我们聊重听的意义。', '#3a2c4a', '#6b5b95'],
        ['v_3',  '这波操作我给满分！名场面逐帧复盘', 'u_3',  '游戏', 613, 1520400, 92400, 27600, 4120, 15600, 1, '这一次我们把节奏、站位、决策全部拆开，看看高手是怎么思考的。', '#1f3a5f', '#2c5f8a'],
        ['v_4',  '手机摄影进阶：从构图到色彩，一次讲清', 'u_4',  '科技', 528, 452000, 31500, 8200, 1580, 4300, 2, '不需要昂贵的设备，构图与调色才是分水岭，附赠实用参数表。', '#264653', '#3d6b74'],
        ['v_5',  '手绘一只会飞的猫，全过程没有一笔擦掉', 'u_5',  '动画', 372, 386000, 45200, 9600, 2240, 6800, 3, '从铅笔稿到成稿一共 11 小时，完整记录一只猫诞生记。', '#4a3f6b', '#7b6ca8'],
        ['v_6',  '一个人的深夜食堂，简单又好吃的拌面', 'u_8',  '美食', 298, 274000, 23800, 5400, 1720, 2600, 3, '十分钟做一碗面，厨房新手也不会翻车。', '#4a3730', '#8a6a5a'],
        ['v_7',  '十分钟讲明白「复利」到底是个什么东西', 'u_7',  '知识', 604, 512000, 38900, 11200, 2180, 5100, 4, '不聊玄学，只用最朴素的方式算一遍给你看。', '#33415e', '#5b6b8c'],
        ['v_8',  '在城市最高点看日出，值了', 'u_6',  '生活', 421, 168000, 15400, 3200, 980, 1900, 5, '四点半起床，爬二十八层楼，值当。', '#485563', '#7b8794'],
        ['v_9',  '开箱！这台复古游戏机也太好玩了', 'u_3',  '游戏', 517, 736000, 51200, 13900, 2960, 8300, 2, '开机那一声「滴」，是很多人的青春开关。', '#1d3557', '#457b9d'],
        ['v_10', '用脚本爬取自己的听歌记录，折腾一整晚', 'u_4',  '科技', 892, 342000, 22700, 6800, 1340, 3700, 6, '从零到一的完整过程，附带可复用的思路。', '#2f3e46', '#52616b'],
        ['v_11', '钢琴改编版《起风了》，越听越上头', 'u_2',  '音乐', 447, 1210000, 89300, 26400, 5240, 18700, 3, '把一段旋律拆成三个层次，重新铺一遍。', '#3b2f45', '#6d597a'],
        ['v_12', '猫咪的一天，用镜头记录 30 分钟', 'u_5',  '动画', 1832, 486000, 37600, 8100, 2050, 4900, 4, '一只猫、三个纸箱、无限循环。', '#4c3b47', '#8a6274'],
        ['v_13', '徒步 20 公里，我在山里看了一场雾', 'u_6',  '生活', 962, 218000, 19300, 4100, 1120, 2300, 7, '走过的路不会白走，看过的雾也是。', '#2f4034', '#5d7461'],
        ['v_14', '老片修复：把 1080P 拉回胶片质感', 'u_4',  '影视', 826, 398000, 28400, 7600, 1620, 3500, 5, '一镜到底演示调色与颗粒的配合。', '#38312f', '#6d5f59'],
        ['v_15', '三分钟看懂一个游戏的关卡设计', 'u_3',  '游戏', 214, 596000, 42700, 10900, 2380, 6200, 2, '好的关卡不是难，是让人想继续。', '#26333f', '#4f6376'],
        ['v_16', '一碗牛肉面的十二种做法，总有一种适合你', 'u_8',  '美食', 742, 632000, 46500, 12300, 2740, 7100, 4, '从汤底到配菜，一次讲透。', '#41352c', '#7f6552'],
        ['v_17', '从零开始做一把木勺子', 'u_7',  '知识', 1043, 186000, 15800, 3600, 940, 1800, 8, '刀、砂纸、油，三件工具就够了。', '#3a4032', '#6b7357'],
        ['v_18', '深夜电台：写给还在加班的你', 'u_2',  '音乐', 1288, 742000, 58400, 14200, 3460, 10600, 5, '愿今晚的风，是 gentle 的。', '#2f2a3d', '#564f6d'],
        ['v_19', '手残党也能画好的简笔画火柴人', 'u_5',  '动画', 356, 214000, 17600, 3900, 1180, 2400, 6, '三笔一个角色，越画越上头。', '#3a3550', '#6d6390'],
        ['v_20', '我用一周时间戒掉了短视频', 'u_6',  '生活', 688, 892000, 73600, 18800, 5820, 13400, 3, '不是失败记录，是一份可复制的实验报告。', '#3d3a35', '#787164'],
    ];

    $videos = [];
    foreach ($rows as $index => $row) {
        $videos[] = [
            'id'           => $row[0],
            'title'        => $row[1],
            'uid'          => $row[2],
            'cat'          => $row[3],
            'duration'     => $row[4],
            'views'        => $row[5],
            'likes'        => $row[6],
            'coins'        => $row[7],
            'favorites'    => $row[8],
            'danmaku'      => $row[9],
            'comments'     => 0,
            'published_at' => $now - $row[10] * 3600 - $index * 137,
            'desc'         => $row[11],
            'cover_a'      => $row[12],
            'cover_b'      => $row[13],
            'tags'         => [$row[3], '精选', '推荐'],
        ];
    }
    return $videos;
}

function seed_comments(): array
{
    $now = time();
    $rows = [
        ['c_1',  'v_1',  'u_6',  '第三个镜头的调度太舒服了，看完立刻想重看一遍原片。', 1800],
        ['c_2',  'v_1',  'u_7',  '剪辑思路讲得很清楚，建议出一期完整的后期教程。', 5400],
        ['c_3',  'v_3',  'u_2',  '这波真的教科书级别，收藏了。', 1200],
        ['c_4',  'v_3',  'u_8',  '笑死，评论区比游戏本身还精彩。', 3600],
        ['c_5',  'v_5',  'u_4',  '手绘过程太治愈了，一帧一帧看完全不腻。', 900],
        ['c_6',  'v_7',  'u_3',  '终于有人把复利讲人话了。', 7200],
        ['c_7',  'v_7',  'u_6',  '算完突然想赶紧开始存钱了。', 4800],
        ['c_8',  'v_11', 'u_1',  '钢琴版比原唱更有味道了。', 2400],
        ['c_9',  'v_11', 'u_5',  '求一份钢琴谱！', 600],
        ['c_10', 'v_16', 'u_2',  '汤底才是灵魂，记下了。', 1500],
        ['c_11', 'v_20', 'u_7',  '这条视频说出了我的心声，第七天最难熬。', 300],
        ['c_12', 'v_13', 'u_3',  '山里的雾拍得太有氛围感了。', 4200],
    ];
    $comments = [];
    foreach ($rows as $row) {
        $comments[] = [
            'id'         => $row[0],
            'vid'        => $row[1],
            'uid'        => $row[2],
            'content'    => $row[3],
            'likes'      => random_int(3, 320),
            'created_at' => $now - $row[4],
        ];
    }
    return $comments;
}

function seed_messages(): array
{
    $now = time();
    $rows = [
        ['m_1', 'notice', 'u_2',  '音乐播放器 更新了投稿', '《十年之后重听《晴天》》已更新，欢迎来听。', 600],
        ['m_2', 'notice', 'u_3',  '游戏解说君 更新了投稿', '名场面逐帧复盘第二期上线了。', 3600],
        ['m_3', 'dm',     'u_6',  '生活日记本',        '你好，明天想约个时间一起爬山吗？', 7200],
        ['m_4', 'system', 'u_1',  '系统公告',          'BiliLite 移动端新版上线，欢迎反馈使用体验。', 86400],
        ['m_5', 'notice', 'u_7',  '知识胶囊 更新了投稿', '三分钟讲明白「复利」，已发布。', 172800],
        ['m_6', 'dm',     'u_5',  '手绘动画社',        '上一张线稿的授权已经发你邮箱了，注意查收。', 259200],
        ['m_7', 'system', 'u_1',  '账号安全提醒',      '你的账号最近在新设备上登录，如非本人操作请及时修改密码。', 345600],
        ['m_8', 'notice', 'u_8',  '美食猎人 更新了投稿', '牛肉面的十二种做法，附赠配方表。', 432000],
    ];
    $messages = [];
    foreach ($rows as $row) {
        $messages[] = [
            'id'         => $row[0],
            'uid'        => 'all',
            'type'       => $row[1],
            'from_uid'   => $row[2],
            'title'      => $row[3],
            'content'    => $row[4],
            'created_at' => $now - $row[5],
        ];
    }
    return $messages;
}

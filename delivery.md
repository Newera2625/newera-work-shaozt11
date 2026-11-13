```text
file=README.md
# BiliLite —— B 站风格手机端 H5 + PHP 后端

一套可直接部署到现有 PHP 网页服务器的视频社区移动端应用。包含首页推荐流、搜索、
播放页、消息中心、个人中心与登录注册六类页面，后端为 PHP + JSON API，数据层优先使用
MySQL，未配置时自动回退到本地 JSON 文件存储，开箱即用。

> 说明：本项目为教学演示作品，界面结构与交互习惯参考了 B 站移动端，
> 但未使用其商标图形、Logo 与任何原始素材，Logo、封面、头像均为自制 SVG。

---

## 一、目录结构

```
站点根目录/
├── index.html          首页（推荐 / 动态 / 排行榜 / 分区）
├── search.html         搜索页
├── video.html          播放页
├── message.html        消息页
├── mine.html           我的页面
├── login.html          登录 / 注册页
├── assets/
│   ├── css/app.css     全局样式与组件样式
│   └── js/
│       ├── core.js     公共脚本：接口封装、格式化、卡片渲染、角标
│       ├── home.js     首页：频道切换、分页加载、投稿
│       ├── search.js   搜索页：历史、热门、结果检索
│       ├── video.js    播放页：模拟播放器、互动、评论
│       ├── message.js  消息页：分段、列表、已读
│       ├── mine.js     我的页面：资料、收藏、历史、投稿
│       └── login.js    登录注册：校验、提交、跳转
├── api/
│   ├── config.php      站点与数据库配置
│   ├── bootstrap.php   会话、JSON 输出、参数解析、工具函数
│   ├── store.php       数据层（MySQL / JSON 双模式）与种子数据
│   ├── init.php        一键初始化（建表 + 导入种子数据）
│   ├── auth.php        注册 / 登录 / 退出 / 当前用户
│   ├── videos.php      频道列表与投稿
│   ├── search.php      搜索、热门词、历史
│   ├── video.php       详情、相关推荐、评论、播放上报
│   ├── interact.php    收藏 / 点赞 / 投币 / 关注 / 历史
│   ├── messages.php    消息列表、未读统计、已读
│   ├── user.php        个人中心数据
│   ├── cover.php       动态 SVG 封面
│   ├── avatar.php      动态 SVG 头像
│   └── data/           JSON 存储目录（自动创建，需可写权限）
└── README.md
```

---

## 二、部署步骤

1. **准备环境**
   - PHP 7.4 或更高版本，启用 `session`、`json`、`mbstring` 扩展；
   - `pdo_mysql` 可选，缺失时自动使用 JSON 文件存储；
   - Web 服务器（Nginx / Apache / PHP-FPM 均可）站点根目录可直接访问 PHP。

2. **上传文件**
   把整个项目目录上传到站点根目录，例如 `/var/www/html/` 或虚拟主机的 `public_html/`。
   确保 `api/` 目录中的 PHP 文件可被 Web 服务器解析执行。

3. **初始化数据**
   浏览器访问一次：

   ```
   http://你的域名/api/init.php
   ```

   返回 JSON 表示初始化成功，其中会包含当前存储模式、数据条数与跳过项。
   该接口**可重复执行**：已存在的表与数据不会重复写入。

   演示账号：`demo` / `123456`（其余 UP 主账号密码同为 `123456`）。

4. **验证**
   访问 `index.html`，确认首页正常渲染、底部导航齐全、控制台无报错、无破图。

---

## 三、MySQL 可选配置

默认使用 JSON 文件存储，无需任何数据库即可运行。如需使用 MySQL，
编辑 `api/config.php`：

```php
'db' => [
    'enabled'  => true,      // 设为 false 可强制使用 JSON 存储
    'host'     => '127.0.0.1',
    'port'     => 3306,
    'name'     => 'bililite',
    'user'     => 'root',
    'pass'     => '你的密码',
    'charset'  => 'utf8mb4',
    'prefix'   => 'bc_',     // 数据表前缀
],
```

配置完成后再次访问 `api/init.php` 即可在 MySQL 中建表并导入种子数据。

- 首次连接失败（账号密码错误、库不存在、扩展未启用）时，系统会自动回退到 JSON 存储，
  接口对前端完全透明，无需改代码；
- MySQL 模式下每张逻辑表对应一张 `bc_xxx` 表，字段为 `id / data / created_at`，
  其中 `data` 存储整行 JSON，规避不同数据库之间的 SQL 差异；
- 若从 JSON 模式切换到 MySQL 模式，需要重新访问 `api/init.php` 导入种子数据
  （已有用户数据不会自动迁移）。

---

## 四、接口约定

所有接口统一返回 JSON：

```json
{ "code": 0, "msg": "ok", "data": { } }
```

- `code = 0` 表示成功，`data` 为业务数据；
- 异常时 `code` 非 0，`msg` 为中文提示，例如
  `{ "code": 4002, "msg": "账号长度需为 2-16 位", "data": null }`；
- 服务端不会输出 HTML 报错页，所有 PHP 警告与致命错误都会被统一拦截为 JSON。

常用接口：

| 接口 | 用途 |
| --- | --- |
| `api/init.php` | 一键初始化数据 |
| `api/auth.php?action=me\|login\|register\|logout` | 账号体系 |
| `api/videos.php?action=channels\|list\|publish` | 频道列表与投稿 |
| `api/search.php?action=search\|hot\|history\|history_add\|history_clear` | 搜索相关 |
| `api/video.php?action=detail\|related\|comments\|comment\|report` | 视频详情与评论 |
| `api/interact.php?action=favorite\|like\|coin\|follow\|history\|watch_later` | 互动（POST） |
| `api/messages.php?action=list\|unread\|read\|read_all` | 消息中心 |
| `api/user.php?action=profile\|stats\|favorites\|history\|videos\|watch_later` | 个人中心 |
| `api/cover.php` / `api/avatar.php` | 动态 SVG 图片 |

---

## 五、页面与功能

| 页面 | 主要功能 |
| --- | --- |
| `index.html` | 顶部搜索入口 + 消息角标、频道 Tab（推荐 / 动态 / 排行榜 / 分区）、双列卡片流、触底加载与「换一批」、中间悬浮投稿按钮 |
| `search.html` | 返回按钮、搜索框、搜索历史（点击复用、一键清空）、热门搜索标签、结果列表（关键词高亮）、无结果空状态 |
| `video.html` | 模拟播放器（播放 / 暂停 / 进度 / 倍速 / 全屏）、标题与播放数据、UP 主卡片与关注、简介展开、相关推荐、评论输入与列表、底部点赞 / 收藏 / 投币 / 分享 |
| `message.html` | 通知 / 私信 / 系统分段切换、消息条目（头像、内容、时间、未读点）、单条已读、全部已读 |
| `mine.html` | 资料卡（头像、昵称、等级、关注 / 粉丝 / 获赞）、入口宫格（投稿 / 收藏 / 稍后再看 / 历史）、最近观看列表、退出登录、未登录引导 |
| `login.html` | 登录 / 注册双 Tab、字段校验、错误提示、注册后自动登录并跳转原页面 |

视觉规范：主色 `#FB7299`，辅助色 `#00AEEC` 仅用于链接强调，其余为中性黑白灰；
图标全部为内联 SVG；移动优先（基准 375px），桌面端按 480px 手机画布居中显示。

---

## 六、常见问题

**1. 页面能打开，但接口全部报错 / 提示「服务返回了非 JSON 数据」**
说明 `api/` 目录没有完整上传，或 PHP 文件没有被服务器解析。检查目录是否包含
`api/bootstrap.php`、`api/store.php` 等全部文件，并确认服务器支持 PHP。

**2. 访问 `api/init.php` 提示 404**
`init.php` 必须位于站点可访问路径下，且文件名未被子目录覆盖。正确地址形如
`https://your-domain.com/api/init.php`。

**3. 数据写入失败（JSON 模式）**
`api/data/` 目录需要服务器写权限。可手动创建该目录并赋予 755 或 775 权限：

```bash
mkdir -p api/data && chmod 775 api/data
```

**4. 想清空数据重新开始**
删除 `api/data/*.json`（JSON 模式）或清空 `bc_` 前缀的数据表（MySQL 模式），
再访问一次 `api/init.php` 即可重新导入种子数据。

**5. 登录后刷新又变成未登录**
登录态基于 PHP Session。请确认服务器没有开启会丢失 Cookie 的过滤，
并且站点访问协议一致（不要混用 http 与 https）。

**6. 想强制使用 JSON 存储，不连接数据库**
把 `api/config.php` 中 `db.enabled` 设为 `false`，系统将完全跳过 MySQL 连接。

**7. 封面 / 头像图片不显示**
图片由 `api/cover.php`、`api/avatar.php` 动态输出 SVG。若服务器开启了
「静态资源缓存」或 URL 重写规则，需确认 `.php` 请求未被拦截。

**8. 直接双击打开 HTML（file:// 协议）**
浏览器不允许 `file://` 页面发起 XHR 请求，此时页面会自动切换到内置的离线演示数据，
用于纯静态预览。所有写操作仅保存在浏览器本地，**正式使用请务必通过 HTTP 访问**。

---

## 七、技术选型

- 后端：PHP 7.4+，PDO + Session，JSON API；
- 前端：原生 HTML + CSS + 原生 JS（ES2017），多页面结构，共享 `assets/css/app.css`
  与 `assets/js/core.js`；
- 图片：`api/cover.php`、`api/avatar.php` 动态生成 SVG，零外部图片依赖；
- 播放器：演示环境使用可控的模拟播放引擎（进度推进、暂停续播、倍速、全屏），交互完整可验证。

```

```text
file=api/auth.php
<?php
/**
 * 账号体系：注册 / 登录 / 退出 / 当前用户
 */

declare(strict_types=1);
require_once __DIR__ . '/bootstrap.php';

$action = str_param('action', 'me');

switch ($action) {
    case 'register':
        $username = str_param('username');
        $password = (string)param('password', '');
        $confirm  = (string)param('confirm', $password);
        $nickname = str_param('nickname');

        if ($username === '') {
            fail('请输入账号', 4001);
        }
        if (mb_strlen($username) < 2 || mb_strlen($username) > 16) {
            fail('账号长度需为 2-16 位', 4002);
        }
        if (mb_strlen($password) < 6) {
            fail('密码长度不能少于 6 位', 4003);
        }
        if ($password !== $confirm) {
            fail('两次输入的密码不一致', 4004);
        }

        foreach (Store::all('users') as $row) {
            if ((string)($row['username'] ?? '') === $username) {
                fail('该账号已被注册，换一个试试', 4005);
            }
        }

        $uid = make_id('u');
        $user = [
            'id'         => $uid,
            'username'   => $username,
            'nickname'   => $nickname !== '' ? mb_substr($nickname, 0, 16) : $username,
            'password'   => password_hash($password, PASSWORD_DEFAULT),
            'level'      => 2,
            'signature'  => '这个人很懒，什么都没写',
            'avatar'     => $uid,
            'following'  => 0,
            'followers'  => 0,
            'likes'      => 0,
            'created_at' => now(),
        ];
        Store::insert('users', $user);
        $_SESSION['uid'] = $uid;
        ok(public_user($user), '注册成功，已自动登录');

    case 'login':
        $username = str_param('username');
        $password = (string)param('password', '');
        if ($username === '' || $password === '') {
            fail('请输入账号和密码', 4001);
        }
        $target = null;
        foreach (Store::all('users') as $row) {
            if ((string)($row['username'] ?? '') === $username) {
                $target = $row;
                break;
            }
        }
        if (!$target || !password_verify($password, (string)($target['password'] ?? ''))) {
            fail('账号或密码错误，请重新输入', 4002);
        }
        session_regenerate_id(true);
        $_SESSION['uid'] = (string)$target['id'];
        ok(public_user($target), '登录成功');

    case 'logout':
        $_SESSION = [];
        if (ini_get('session.use_cookies')) {
            $params = session_get_cookie_params();
            setcookie(session_name(), '', time() - 42000, $params['path'] ?? '/', $params['domain'] ?? '', (bool)($params['secure'] ?? false), (bool)($params['httponly'] ?? true));
        }
        @session_destroy();
        ok(null, '已退出登录');

    case 'me':
        $user = current_user();
        if (!$user) {
            ok(['logged_in' => false, 'user' => null]);
        }
        ok([
            'logged_in' => true,
            'user'      => public_user($user),
        ]);

    default:
        fail('不支持的操作：' . $action, 404);
}

```

```text
file=api/avatar.php
<?php
/**
 * 动态 SVG 头像服务
 *
 * 用法：api/avatar.php?id=u_1&name=哔哩哔哩
 */

declare(strict_types=1);
require_once __DIR__ . '/bootstrap.php';

$id   = str_param('id');
$name = str_param('name');

if ($id !== '') {
    $user = Store::find('users', $id);
    if ($user) {
        if ($name === '') {
            $name = (string)($user['nickname'] ?? '');
        }
    }
}

if ($name === '') {
    $name = 'B';
}
$name = mb_substr($name, 0, 1);

// 由 id 决定头像配色（克制的灰蓝色系）
$palette = [
    ['#FB7299', '#E5638B'],
    ['#00AEEC', '#3BB6D6'],
    ['#7C6BA8', '#A08FC4'],
    ['#5A8C7A', '#8BB09B'],
    ['#C28A5B', '#DCAE8A'],
];
$hash = crc32((string)$id . $name);
$colors = $palette[$hash % count($palette)];
$a = $colors[0];
$b = $colors[1];

$svg = <<<SVG
<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96" role="img" aria-label="{$name}">
  <defs>
    <linearGradient id="a" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="{$a}"/>
      <stop offset="100%" stop-color="{$b}"/>
    </linearGradient>
  </defs>
  <circle cx="48" cy="48" r="48" fill="url(#a)"/>
  <text x="48" y="48" dy="0.36em" text-anchor="middle" font-family="PingFang SC,Microsoft YaHei,system-ui,sans-serif" font-size="42" font-weight="600" fill="#ffffff">{$name}</text>
</svg>
SVG;

header('Content-Type: image/svg+xml; charset=utf-8');
header('Cache-Control: public, max-age=600');
header('X-Content-Type-Options: nosniff');
echo $svg;

```

```text
file=api/bootstrap.php
<?php
/**
 * 公共引导文件：会话、JSON 输出、参数解析、通用工具
 */

declare(strict_types=1);

error_reporting(E_ALL);
ini_set('display_errors', '0');
ini_set('log_errors', '1');
date_default_timezone_set('Asia/Shanghai');

/** 站点配置 */
$GLOBALS['bili_config'] = require __DIR__ . '/config.php';

/**
 * 读取配置，支持 cfg('db.host') 形式
 */
function cfg(string $key, $default = null)
{
    $config = $GLOBALS['bili_config'];
    foreach (explode('.', $key) as $part) {
        if (!is_array($config) || !array_key_exists($part, $config)) {
            return $default;
        }
        $config = $config[$part];
    }
    return $config;
}

require_once __DIR__ . '/store.php';

/* ------------------------------------------------------------------ */
/* 会话                                                                */
/* ------------------------------------------------------------------ */

if (session_status() === PHP_SESSION_NONE) {
    session_name((string)cfg('session_name', 'BILILITE_SID'));
    if (PHP_VERSION_ID >= 70300) {
        session_set_cookie_params([
            'httponly' => true,
            'samesite' => 'Lax',
            'path'     => '/',
        ]);
    } else {
        session_set_cookie_params(0, '/');
    }
    @session_start();
}

/* ------------------------------------------------------------------ */
/* 异常与致命错误：统一输出 JSON，绝不输出 HTML 报错页                  */
/* ------------------------------------------------------------------ */

set_exception_handler(function (Throwable $e) {
    json_out([
        'code' => 500,
        'msg'  => '服务器内部错误：' . $e->getMessage(),
        'data' => null,
    ]);
});

register_shutdown_function(function () {
    $err = error_get_last();
    if (!$err) {
        return;
    }
    if (!in_array($err['type'], [E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR], true)) {
        return;
    }
    if (headers_sent()) {
        return;
    }
    json_out([
        'code' => 500,
        'msg'  => '服务器错误：' . $err['message'],
        'data' => null,
    ]);
});

/* ------------------------------------------------------------------ */
/* JSON 输出                                                           */
/* ------------------------------------------------------------------ */

function json_out(array $payload, int $status = 200): void
{
    static $done = false;
    if ($done) {
        return;
    }
    $done = true;
    if (!headers_sent()) {
        http_response_code($status);
        header('Content-Type: application/json; charset=utf-8');
        header('Cache-Control: no-store, no-cache, must-revalidate');
        header('X-Content-Type-Options: nosniff');
    }
    $json = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    if ($json === false) {
        $json = '{"code":500,"msg":"数据编码失败","data":null}';
    }
    echo $json;
    exit;
}

/** 成功响应 */
function ok($data = null, string $msg = 'ok'): void
{
    json_out(['code' => 0, 'msg' => $msg, 'data' => $data]);
}

/** 失败响应（HTTP 状态码始终 200，业务错误通过 code 表达） */
function fail(string $msg = '请求失败', int $code = 400): void
{
    json_out(['code' => $code, 'msg' => $msg, 'data' => null]);
}

/* ------------------------------------------------------------------ */
/* 参数解析                                                            */
/* ------------------------------------------------------------------ */

function body_json(): array
{
    static $body = null;
    if ($body === null) {
        $body = [];
        $raw = file_get_contents('php://input');
        if (is_string($raw) && $raw !== '') {
            $decoded = json_decode($raw, true);
            if (is_array($decoded)) {
                $body = $decoded;
            } else {
                $form = [];
                parse_str($raw, $form);
                $body = $form;
            }
        }
    }
    return $body;
}

/** 统一取参：请求体优先，其次 GET / POST */
function param(string $key, $default = null)
{
    $body = body_json();
    if (array_key_exists($key, $body)) {
        return $body[$key];
    }
    if (isset($_GET[$key])) {
        return $_GET[$key];
    }
    if (isset($_POST[$key])) {
        return $_POST[$key];
    }
    return $default;
}

function str_param(string $key, string $default = ''): string
{
    $value = param($key, $default);
    if (is_array($value)) {
        return $default;
    }
    return trim((string)$value);
}

function int_param(string $key, int $default = 0): int
{
    $value = param($key, $default);
    if (is_array($value) || $value === null || $value === '') {
        return $default;
    }
    return (int)$value;
}

function bool_param(string $key, bool $default = false): bool
{
    $value = param($key, null);
    if ($value === null) {
        return $default;
    }
    if (is_bool($value)) {
        return $value;
    }
    $value = strtolower((string)$value);
    return in_array($value, ['1', 'true', 'yes', 'on'], true);
}

function is_post(): bool
{
    return strtoupper((string)($_SERVER['REQUEST_METHOD'] ?? 'GET')) === 'POST';
}

/* ------------------------------------------------------------------ */
/* 用户态                                                              */
/* ------------------------------------------------------------------ */

function current_uid(): ?string
{
    $uid = $_SESSION['uid'] ?? null;
    return is_string($uid) && $uid !== '' ? $uid : null;
}

/** 游客会话标识：用于游客的已读状态记录 */
function guest_uid(): string
{
    if (empty($_SESSION['guest_id'])) {
        $_SESSION['guest_id'] = 'g_' . bin2hex(random_bytes(6));
    }
    return (string)$_SESSION['guest_id'];
}

function current_user(): ?array
{
    $uid = current_uid();
    if ($uid === null) {
        return null;
    }
    $user = Store::find('users', $uid);
    if (!$user) {
        unset($_SESSION['uid']);
        return null;
    }
    return $user;
}

/** 需要登录，未登录直接输出错误并结束 */
function require_login(): string
{
    $uid = current_uid();
    if ($uid === null) {
        fail('请先登录后再试', 401);
    }
    return $uid;
}

/* ------------------------------------------------------------------ */
/* 工具函数                                                            */
/* ------------------------------------------------------------------ */

function now(): int
{
    return time();
}

function make_id(string $prefix = 'id'): string
{
    return $prefix . '_' . bin2hex(random_bytes(6));
}

/** HTML 转义 */
function h(?string $text): string
{
    return htmlspecialchars((string)$text, ENT_QUOTES, 'UTF-8');
}

/** 去除数组中的 null 键 */
function array_filter_null(array $data): array
{
    return array_filter($data, static function ($v) {
        return $v !== null;
    });
}

/** 用户公开字段（不含密码） */
function public_user(?array $user): ?array
{
    if (!$user) {
        return null;
    }
    return array_filter_null([
        'id'         => $user['id'] ?? '',
        'username'   => $user['username'] ?? '',
        'nickname'   => $user['nickname'] ?? ($user['username'] ?? ''),
        'level'      => (int)($user['level'] ?? 1),
        'signature'  => $user['signature'] ?? '',
        'avatar'     => $user['avatar'] ?? ($user['id'] ?? ''),
        'created_at' => (int)($user['created_at'] ?? 0),
        'following'  => (int)($user['following'] ?? 0),
        'followers'  => (int)($user['followers'] ?? 0),
        'likes'      => (int)($user['likes'] ?? 0),
    ]);
}

/** 视频列表项统一输出结构 */
function video_item(array $video, ?array $up = null): array
{
    if ($up === null) {
        $up = Store::find('users', (string)($video['uid'] ?? ''));
    }
    return array_filter_null([
        'id'          => (string)($video['id'] ?? ''),
        'title'       => (string)($video['title'] ?? ''),
        'desc'        => (string)($video['desc'] ?? ''),
        'cat'         => (string)($video['cat'] ?? ''),
        'tags'        => $video['tags'] ?? [],
        'duration'    => (int)($video['duration'] ?? 0),
        'views'       => (int)($video['views'] ?? 0),
        'likes'       => (int)($video['likes'] ?? 0),
        'coins'       => (int)($video['coins'] ?? 0),
        'favorites'   => (int)($video['favorites'] ?? 0),
        'danmaku'     => (int)($video['danmaku'] ?? 0),
        'comments'    => (int)($video['comments'] ?? 0),
        'cover_a'     => (string)($video['cover_a'] ?? '#2b2d42'),
        'cover_b'     => (string)($video['cover_b'] ?? '#4a4e69'),
        'published_at' => (int)($video['published_at'] ?? 0),
        'up_id'       => (string)($video['uid'] ?? ''),
        'up_name'     => (string)($up['nickname'] ?? '未知UP主'),
        'up_avatar'   => (string)($up['avatar'] ?? ($up['id'] ?? '')),
    ]);
}

```

```text
file=api/config.php
<?php
/**
 * BiliLite 站点配置
 *
 * 复制本文件后可直接修改：
 *  - db.enabled / db.host / db.name 等用于连接 MySQL；
 *  - 若 MySQL 不可用或未配置，系统会自动回退到 api/data 目录下的 JSON 文件存储。
 */

return [
    'site_name'    => 'BiliLite',
    'site_slogan'  => '干杯',
    'session_name' => 'BILILITE_SID',

    // JSON 回退存储目录（相对于本文件）
    'json_dir' => __DIR__ . '/data',

    // 分页默认条数
    'page_size'        => 10,
    'comment_page_size' => 20,

    // MySQL 可选配置：enabled 为 false 时强制使用 JSON 存储
    'db' => [
        'enabled'  => true,
        'host'     => '127.0.0.1',
        'port'     => 3306,
        'name'     => 'bililite',
        'user'     => 'root',
        'pass'     => '',
        'charset'  => 'utf8mb4',
        'prefix'   => 'bc_',
    ],
];

```

```text
file=api/cover.php
<?php
/**
 * 动态 SVG 封面服务
 *
 * 用法：api/cover.php?id=v_1&title=xxx&a=%233a3550&b=%236d6390
 * 输出 16:9 的 SVG 图片，避免依赖任何外部图片资源。
 */

declare(strict_types=1);
require_once __DIR__ . '/bootstrap.php';

$id    = str_param('id');
$title = str_param('title');
$a     = str_param('a', '#3a3550');
$b     = str_param('b', '#6d6390');

if ($id !== '') {
    $video = Store::find('videos', $id);
    if ($video) {
        if ($title === '') {
            $title = (string)($video['title'] ?? '');
        }
        $a = (string)($video['cover_a'] ?? $a);
        $b = (string)($video['cover_b'] ?? $b);
    }
}

if (!preg_match('/^#[0-9a-fA-F]{3,6}$/', $a)) {
    $a = '#3a3550';
}
if (!preg_match('/^#[0-9a-fA-F]{3,6}$/', $b)) {
    $b = '#6d6390';
}

$title = $title !== '' ? $title : 'BiliLite';
$title = mb_substr($title, 0, 26);

// 标题折行：按字符宽度粗略估算，每行最多 11 个字
$lines = [];
$current = '';
foreach (preg_split('//u', $title, -1, PREG_SPLIT_NO_EMPTY) as $char) {
    $current .= $char;
    if (mb_strlen($current) >= 11) {
        $lines[] = $current;
        $current = '';
        if (count($lines) >= 2) {
            break;
        }
    }
}
if ($current !== '' && count($lines) < 2) {
    $lines[] = $current;
}
$lines = array_slice($lines, 0, 2);

$width  = 640;
$height = 360;

// 生成装饰圆点（使用确定性伪随机，保证同一封面稳定）
$dots = '';
$seed = crc32($id . $title);
for ($i = 0; $i < 7; $i++) {
    $seed = ($seed * 1103515245 + 12345) & 0x7fffffff;
    $cx = 40 + ($seed % 560);
    $seed = ($seed * 1103515245 + 12345) & 0x7fffffff;
    $cy = 30 + ($seed % 300);
    $seed = ($seed * 1103515245 + 12345) & 0x7fffffff;
    $r = 14 + ($seed % 46);
    $dots .= '<circle cx="' . $cx . '" cy="' . $cy . '" r="' . $r . '" fill="#ffffff" fill-opacity="0.05"/>';
}

$text = '';
$baseY = $lines === [] ? 190 : 178;
foreach ($lines as $index => $line) {
    $y = $baseY + $index * 38;
    $text .= '<text x="40" y="' . $y . '" font-family="PingFang SC,Microsoft YaHei,system-ui,sans-serif" '
        . 'font-size="30" font-weight="600" fill="#ffffff" fill-opacity="0.94">' . h($line) . '</text>';
}

$svg = <<<SVG
<svg xmlns="http://www.w3.org/2000/svg" width="{$width}" height="{$height}" viewBox="0 0 {$width} {$height}" role="img" aria-label="{$title}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="{$a}"/>
      <stop offset="100%" stop-color="{$b}"/>
    </linearGradient>
  </defs>
  <rect width="{$width}" height="{$height}" fill="url(#g)"/>
  {$dots}
  <rect x="0" y="{$height}" width="{$width}" height="6" fill="#FB7299" fill-opacity="0.9"/>
  {$text}
</svg>
SVG;

header('Content-Type: image/svg+xml; charset=utf-8');
header('Cache-Control: public, max-age=600');
header('X-Content-Type-Options: nosniff');
echo $svg;

```

```text
file=api/init.php
<?php
/**
 * 一键初始化：建表 + 导入种子数据（可重复执行，不会产生重复数据）
 * 浏览器直接访问 api/init.php 即可。
 */

declare(strict_types=1);
require_once __DIR__ . '/bootstrap.php';

$report = seed_all();

ok([
    'initialized' => true,
    'mode'        => Store::mode(),
    'mode_desc'   => Store::mode() === 'mysql' ? 'MySQL 存储模式' : 'JSON 文件存储模式（api/data）',
    'counts'      => [
        'users'    => Store::count('users'),
        'videos'   => Store::count('videos'),
        'comments' => Store::count('comments'),
        'messages' => Store::count('messages'),
    ],
    'inserted'    => [
        'users'    => $report['users'],
        'videos'   => $report['videos'],
        'comments' => $report['comments'],
        'messages' => $report['messages'],
    ],
    'skipped'     => $report['skipped'],
    'tip'         => '演示账号：demo / 123456',
], '初始化完成');

```

```text
file=api/interact.php
<?php
/**
 * 互动：收藏 / 点赞 / 投币 / 关注 / 观看历史 / 稍后再看
 */

declare(strict_types=1);
require_once __DIR__ . '/bootstrap.php';

$action = str_param('action', '');

if (!is_post()) {
    fail('请使用 POST 提交', 405);
}

switch ($action) {
    case 'favorite':
        $uid = require_login();
        $vid = str_param('id');
        $video = Store::find('videos', $vid);
        if (!$video) {
            fail('视频不存在或已下架', 404);
        }
        $existing = null;
        foreach (Store::where('favorites', 'uid', $uid) as $row) {
            if ((string)($row['vid'] ?? '') === $vid) {
                $existing = $row;
                break;
            }
        }
        if ($existing) {
            Store::delete('favorites', (string)$existing['id']);
            $count = max(0, (int)($video['favorites'] ?? 0) - 1);
            Store::update('videos', $vid, ['favorites' => $count]);
            ok(['favorited' => false, 'count' => $count], '已取消收藏');
        }
        Store::insert('favorites', [
            'id'         => make_id('f'),
            'uid'        => $uid,
            'vid'        => $vid,
            'created_at' => now(),
        ]);
        $count = (int)($video['favorites'] ?? 0) + 1;
        Store::update('videos', $vid, ['favorites' => $count]);
        ok(['favorited' => true, 'count' => $count], '收藏成功');

    case 'like':
        $uid = require_login();
        $vid = str_param('id');
        $video = Store::find('videos', $vid);
        if (!$video) {
            fail('视频不存在或已下架', 404);
        }
        $existing = null;
        foreach (Store::where('likes', 'uid', $uid) as $row) {
            if ((string)($row['vid'] ?? '') === $vid) {
                $existing = $row;
                break;
            }
        }
        if ($existing) {
            Store::delete('likes', (string)$existing['id']);
            $count = max(0, (int)($video['likes'] ?? 0) - 1);
            Store::update('videos', $vid, ['likes' => $count]);
            ok(['liked' => false, 'count' => $count], '已取消点赞');
        }
        Store::insert('likes', [
            'id'         => make_id('l'),
            'uid'        => $uid,
            'vid'        => $vid,
            'created_at' => now(),
        ]);
        $count = (int)($video['likes'] ?? 0) + 1;
        Store::update('videos', $vid, ['likes' => $count]);
        ok(['liked' => true, 'count' => $count], '点赞成功');

    case 'coin':
        $uid = require_login();
        $vid = str_param('id');
        $video = Store::find('videos', $vid);
        if (!$video) {
            fail('视频不存在或已下架', 404);
        }
        $exists = false;
        foreach (Store::where('coins', 'uid', $uid) as $row) {
            if ((string)($row['vid'] ?? '') === $vid) {
                $exists = true;
                break;
            }
        }
        if ($exists) {
            fail('本视频已投过币啦', 4001);
        }
        Store::insert('coins', [
            'id'         => make_id('co'),
            'uid'        => $uid,
            'vid'        => $vid,
            'created_at' => now(),
        ]);
        $count = (int)($video['coins'] ?? 0) + 1;
        Store::update('videos', $vid, ['coins' => $count]);
        ok(['count' => $count], '投币成功');

    case 'follow':
        $uid = require_login();
        $target = str_param('target_id', str_param('uid'));
        if ($target === '') {
            fail('缺少目标用户 ID', 4001);
        }
        if ($target === $uid) {
            fail('不能关注自己', 4002);
        }
        $targetUser = Store::find('users', $target);
        if (!$targetUser) {
            fail('用户不存在', 404);
        }
        $existing = null;
        foreach (Store::where('follows', 'uid', $uid) as $row) {
            if ((string)($row['target_id'] ?? '') === $target) {
                $existing = $row;
                break;
            }
        }
        if ($existing) {
            Store::delete('follows', (string)$existing['id']);
            $following = max(0, (int)($targetUser['followers'] ?? 0) - 1);
            Store::update('users', $target, ['followers' => $following]);
            $me = Store::find('users', $uid);
            Store::update('users', $uid, ['following' => max(0, (int)($me['following'] ?? 0) - 1)]);
            ok(['followed' => false, 'followers' => $following], '已取消关注');
        }
        Store::insert('follows', [
            'id'         => make_id('fo'),
            'uid'        => $uid,
            'target_id'  => $target,
            'created_at' => now(),
        ]);
        $following = (int)($targetUser['followers'] ?? 0) + 1;
        Store::update('users', $target, ['followers' => $following]);
        $me = Store::find('users', $uid);
        Store::update('users', $uid, ['following' => (int)($me['following'] ?? 0) + 1]);
        ok(['followed' => true, 'followers' => $following], '关注成功');

    case 'history':
        $uid = require_login();
        $vid = str_param('id');
        $video = Store::find('videos', $vid);
        if (!$video) {
            fail('视频不存在或已下架', 404);
        }
        $existing = null;
        foreach (Store::where('history', 'uid', $uid) as $row) {
            if ((string)($row['vid'] ?? '') === $vid) {
                $existing = $row;
                break;
            }
        }
        if ($existing) {
            Store::update('history', (string)$existing['id'], ['updated_at' => now()]);
        } else {
            Store::insert('history', [
                'id'         => make_id('h'),
                'uid'        => $uid,
                'vid'        => $vid,
                'progress'   => int_param('progress', 0),
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
        ok(['recorded' => true], '已记录观看历史');

    case 'watch_later':
        $uid = require_login();
        $vid = str_param('id');
        $video = Store::find('videos', $vid);
        if (!$video) {
            fail('视频不存在或已下架', 404);
        }
        $existing = null;
        foreach (Store::where('watch_later', 'uid', $uid) as $row) {
            if ((string)($row['vid'] ?? '') === $vid) {
                $existing = $row;
                break;
            }
        }
        if ($existing) {
            Store::delete('watch_later', (string)$existing['id']);
            ok(['saved' => false], '已移出稍后再看');
        }
        Store::insert('watch_later', [
            'id'         => make_id('w'),
            'uid'        => $uid,
            'vid'        => $vid,
            'created_at' => now(),
        ]);
        ok(['saved' => true], '已加入稍后再看');

    default:
        fail('不支持的操作：' . $action, 404);
}

```

```text
file=api/messages.php
<?php
/**
 * 消息：通知 / 私信 / 系统，未读统计与标记已读
 *
 * 每条消息的归属字段 uid：
 *   - 'all'   ：全员消息（通知 / 系统公告）
 *   - 具体 uid：定向消息（私信）
 * 已读状态存放在 message_reads 表中，按 uid + mid 记录，支持多用户独立已读。
 */

declare(strict_types=1);
require_once __DIR__ . '/bootstrap.php';

const MESSAGE_TYPES = ['notice', 'dm', 'system'];

/** 当前用户可见的消息 */
function visible_messages(?string $uid): array
{
    $rows = [];
    foreach (Store::all('messages') as $row) {
        $owner = (string)($row['uid'] ?? 'all');
        if ($uid === null) {
            if ($owner !== 'all') {
                continue;
            }
        } elseif ($owner !== 'all' && $owner !== $uid) {
            continue;
        }
        $rows[] = $row;
    }
    usort($rows, static function ($a, $b) {
        return (int)$b['created_at'] <=> (int)$a['created_at'];
    });
    return $rows;
}

/** 已读记录 id */
function read_key(string $uid, string $mid): string
{
    return $uid . '_' . $mid;
}

/** 获取已读的消息 id 集合 */
function read_ids(string $uid): array
{
    $ids = [];
    foreach (Store::where('message_reads', 'uid', $uid) as $row) {
        $ids[(string)($row['mid'] ?? '')] = true;
    }
    return $ids;
}

$action = str_param('action', 'list');

switch ($action) {
    case 'list':
        $type = str_param('type', 'all');
        if ($type !== 'all' && !in_array($type, MESSAGE_TYPES, true)) {
            fail('不支持的消息类型：' . $type, 4001);
        }
        $uid = current_uid();
        $page = max(1, int_param('page', 1));
        $limit = min(50, max(1, int_param('page_size', 20)));

        $all = visible_messages($uid);
        $rows = [];
        foreach ($all as $row) {
            if ($type !== 'all' && (string)($row['type'] ?? '') !== $type) {
                continue;
            }
            $rows[] = $row;
        }

        $readMap = $uid !== null ? read_ids($uid) : [];
        $items = [];
        foreach (array_slice($rows, ($page - 1) * $limit, $limit) as $row) {
            $from = Store::find('users', (string)($row['from_uid'] ?? ''));
            $mid = (string)$row['id'];
            $items[] = [
                'id'         => $mid,
                'type'       => (string)($row['type'] ?? 'notice'),
                'title'      => (string)($row['title'] ?? ''),
                'content'    => (string)($row['content'] ?? ''),
                'created_at' => (int)($row['created_at'] ?? 0),
                'unread'     => !isset($readMap[$mid]),
                'from_name'  => (string)($from['nickname'] ?? '系统'),
                'from_avatar' => (string)($from['avatar'] ?? ($row['from_uid'] ?? '')),
            ];
        }
        $total = count($rows);
        ok([
            'items'    => $items,
            'total'    => $total,
            'page'     => $page,
            'has_more' => ($page * $limit) < $total,
        ]);

    case 'unread':
        $uid = current_uid();
        if ($uid === null) {
            ok(['total' => 0, 'notice' => 0, 'dm' => 0, 'system' => 0]);
        }
        $readMap = read_ids($uid);
        $counts = ['total' => 0, 'notice' => 0, 'dm' => 0, 'system' => 0];
        foreach (visible_messages($uid) as $row) {
            $mid = (string)$row['id'];
            if (isset($readMap[$mid])) {
                continue;
            }
            $counts['total']++;
            $type = (string)($row['type'] ?? 'notice');
            if (isset($counts[$type])) {
                $counts[$type]++;
            }
        }
        ok($counts);

    case 'read':
        $uid = require_login();
        $mid = str_param('id');
        if ($mid === '') {
            fail('缺少消息 ID', 4001);
        }
        if (!Store::find('messages', $mid)) {
            fail('消息不存在', 404);
        }
        $key = read_key($uid, $mid);
        if (!Store::find('message_reads', $key)) {
            Store::insert('message_reads', [
                'id'         => $key,
                'uid'        => $uid,
                'mid'        => $mid,
                'created_at' => now(),
            ]);
        }
        ok(['id' => $mid], '已读');

    case 'read_all':
        $uid = require_login();
        foreach (visible_messages($uid) as $row) {
            $mid = (string)$row['id'];
            $key = read_key($uid, $mid);
            if (!Store::find('message_reads', $key)) {
                Store::insert('message_reads', [
                    'id'         => $key,
                    'uid'        => $uid,
                    'mid'        => $mid,
                    'created_at' => now(),
                ]);
            }
        }
        ok(['cleared' => true], '全部消息已读');

    default:
        fail('不支持的操作：' . $action, 404);
}

```

```text
file=api/search.php
<?php
/**
 * 搜索：关键词搜索、热门搜索词、最近搜索历史
 */

declare(strict_types=1);
require_once __DIR__ . '/bootstrap.php';

const HOT_WORDS = ['推荐', '钢琴', '复利', '开箱', '游戏实况', '深夜电台', '手绘', '摄影', '徒步', '牛肉面'];

$action = str_param('action', 'search');

switch ($action) {
    case 'search':
        $keyword = str_param('q', str_param('keyword', ''));
        if ($keyword === '') {
            fail('请输入搜索关键词', 4001);
        }
        if (mb_strlen($keyword) > 40) {
            fail('搜索关键词过长', 4002);
        }
        $needle = mb_strtolower($keyword);
        $items = [];
        foreach (Store::all('videos') as $video) {
            $title = mb_strtolower((string)($video['title'] ?? ''));
            $desc  = mb_strtolower((string)($video['desc'] ?? ''));
            $tags  = array_map('mb_strtolower', (array)($video['tags'] ?? []));
            $up    = Store::find('users', (string)($video['uid'] ?? ''));
            $upName = mb_strtolower((string)($up['nickname'] ?? ''));

            $score = 0;
            if (mb_strpos($title, $needle) !== false) {
                $score += 10;
            }
            if (mb_strpos($desc, $needle) !== false) {
                $score += 4;
            }
            if (in_array($needle, $tags, true)) {
                $score += 6;
            }
            if ($upName !== '' && mb_strpos($upName, $needle) !== false) {
                $score += 3;
            }
            if ($score > 0) {
                $item = video_item($video, $up);
                $item['score'] = $score;
                $items[] = $item;
            }
        }
        usort($items, static function ($a, $b) {
            return ($b['score'] <=> $a['score']) || ((int)$b['views'] <=> (int)$a['views']);
        });
        $total = count($items);
        $limit = min(40, max(1, int_param('page_size', 20)));
        $page  = max(1, int_param('page', 1));
        $slice = array_slice($items, ($page - 1) * $limit, $limit);

        ok([
            'keyword'  => $keyword,
            'items'    => $slice,
            'total'    => $total,
            'page'     => $page,
            'has_more' => ($page * $limit) < $total,
        ]);

    case 'hot':
        $counter = [];
        foreach (Store::all('searches') as $row) {
            $word = (string)($row['word'] ?? '');
            if ($word === '') {
                continue;
            }
            $counter[$word] = ($counter[$word] ?? 0) + 1;
        }
        $list = [];
        foreach (HOT_WORDS as $word) {
            $list[] = ['word' => $word, 'count' => (int)($counter[$word] ?? 0) + 1];
        }
        foreach ($counter as $word => $count) {
            $exists = false;
            foreach ($list as $item) {
                if ($item['word'] === $word) {
                    $exists = true;
                    break;
                }
            }
            if (!$exists) {
                $list[] = ['word' => $word, 'count' => $count];
            }
        }
        usort($list, static function ($a, $b) {
            return $b['count'] <=> $a['count'];
        });
        $list = array_slice($list, 0, 12);
        ok(['items' => $list]);

    case 'history':
        $uid = current_uid();
        if ($uid === null) {
            ok(['items' => []]);
        }
        $rows = Store::where('searches', 'uid', $uid);
        usort($rows, static function ($a, $b) {
            return (int)$b['created_at'] <=> (int)$a['created_at'];
        });
        $items = [];
        foreach (array_slice($rows, 0, 20) as $row) {
            $items[] = [
                'word'       => (string)($row['word'] ?? ''),
                'created_at' => (int)($row['created_at'] ?? 0),
            ];
        }
        ok(['items' => $items]);

    case 'history_add':
        if (!is_post()) {
            fail('请使用 POST 提交', 405);
        }
        $uid = current_uid();
        if ($uid === null) {
            ok(['saved' => false], '未登录时搜索历史保存在本地');
        }
        $word = str_param('word', str_param('q', ''));
        if ($word === '') {
            fail('搜索词不能为空', 4001);
        }
        $existing = Store::where('searches', 'uid', $uid);
        foreach ($existing as $row) {
            if ((string)($row['word'] ?? '') === $word) {
                Store::update('searches', (string)$row['id'], ['created_at' => now()]);
                ok(['saved' => true], '已记录搜索历史');
            }
        }
        Store::insert('searches', [
            'id'         => make_id('s'),
            'uid'        => $uid,
            'word'       => mb_substr($word, 0, 40),
            'created_at' => now(),
        ]);
        // 仅保留最近 20 条
        $rows = Store::where('searches', 'uid', $uid);
        usort($rows, static function ($a, $b) {
            return (int)$b['created_at'] <=> (int)$a['created_at'];
        });
        foreach (array_slice($rows, 20) as $row) {
            Store::delete('searches', (string)$row['id']);
        }
        ok(['saved' => true], '已记录搜索历史');

    case 'history_clear':
        $uid = current_uid();
        if ($uid === null) {
            ok(['cleared' => false]);
        }
        foreach (Store::where('searches', 'uid', $uid) as $row) {
            Store::delete('searches', (string)$row['id']);
        }
        ok(['cleared' => true], '搜索历史已清空');

    default:
        fail('不支持的操作：' . $action, 404);
}

```

```text
file=api/store.php
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

```

```text
file=api/user.php
<?php
/**
 * 个人中心：资料、统计数据、收藏、历史、投稿
 */

declare(strict_types=1);
require_once __DIR__ . '/bootstrap.php';

$action = str_param('action', 'profile');

/** 统计关注 / 粉丝 / 获赞 */
function user_stats(string $uid): array
{
    $following = count(Store::where('follows', 'uid', $uid));
    $followers = 0;
    foreach (Store::where('follows', 'target_id', $uid) as $row) {
        $followers++;
    }
    $likes = 0;
    foreach (Store::where('videos', 'uid', $uid) as $video) {
        $likes += (int)($video['likes'] ?? 0);
    }
    $coins = 0;
    foreach (Store::where('coins', 'uid', $uid) as $row) {
        $coins++;
    }
    $videos = count(Store::where('videos', 'uid', $uid));
    return [
        'following' => $following,
        'followers' => $followers,
        'likes'     => $likes,
        'coins'     => $coins,
        'videos'    => $videos,
    ];
}

/** 按 id 集合批量取视频 */
function videos_by_ids(array $ids): array
{
    $items = [];
    foreach ($ids as $vid) {
        $video = Store::find('videos', (string)$vid);
        if ($video) {
            $items[] = video_item($video);
        }
    }
    return $items;
}

switch ($action) {
    case 'profile':
        $uid = require_login();
        $user = Store::find('users', $uid);
        if (!$user) {
            fail('用户不存在', 404);
        }
        $profile = public_user($user);
        $profile['stats'] = user_stats($uid);
        ok(['user' => $profile, 'stats' => $profile['stats']]);

    case 'stats':
        $uid = require_login();
        ok(user_stats($uid));

    case 'favorites':
        $uid = require_login();
        $rows = Store::where('favorites', 'uid', $uid);
        usort($rows, static function ($a, $b) {
            return (int)$b['created_at'] <=> (int)$a['created_at'];
        });
        $ids = array_map(static function ($row) {
            return (string)($row['vid'] ?? '');
        }, $rows);
        ok(['items' => videos_by_ids($ids), 'total' => count($ids)]);

    case 'history':
        $uid = require_login();
        $rows = Store::where('history', 'uid', $uid);
        usort($rows, static function ($a, $b) {
            return (int)$b['updated_at'] <=> (int)$a['updated_at'];
        });
        $ids = array_map(static function ($row) {
            return (string)($row['vid'] ?? '');
        }, $rows);
        $items = videos_by_ids($ids);
        foreach ($items as $index => $item) {
            $item['watched_at'] = (int)($rows[$index]['updated_at'] ?? 0);
        }
        ok(['items' => $items, 'total' => count($ids)]);

    case 'videos':
        $uid = require_login();
        $rows = Store::where('videos', 'uid', $uid);
        usort($rows, static function ($a, $b) {
            return (int)$b['published_at'] <=> (int)$a['published_at'];
        });
        $items = [];
        foreach ($rows as $row) {
            $items[] = video_item($row);
        }
        ok(['items' => $items, 'total' => count($items)]);

    case 'watch_later':
        $uid = require_login();
        $rows = Store::where('watch_later', 'uid', $uid);
        usort($rows, static function ($a, $b) {
            return (int)$b['created_at'] <=> (int)$a['created_at'];
        });
        $ids = array_map(static function ($row) {
            return (string)($row['vid'] ?? '');
        }, $rows);
        ok(['items' => videos_by_ids($ids), 'total' => count($ids)]);

    case 'following':
        $uid = require_login();
        $rows = Store::where('follows', 'uid', $uid);
        $items = [];
        foreach ($rows as $row) {
            $target = Store::find('users', (string)($row['target_id'] ?? ''));
            if ($target) {
                $items[] = public_user($target);
            }
        }
        ok(['items' => $items, 'total' => count($items)]);

    default:
        fail('不支持的操作：' . $action, 404);
}

```

```text
file=api/video.php
<?php
/**
 * 视频详情、相关推荐、评论、播放上报
 */

declare(strict_types=1);
require_once __DIR__ . '/bootstrap.php';

$action = str_param('action', 'detail');

/** 读取用户对某视频的互动状态 */
function user_video_state(?string $uid, string $vid): array
{
    $state = ['favorited' => false, 'liked' => false, 'watched' => false];
    if ($uid === null) {
        return $state;
    }
    foreach (Store::where('favorites', 'uid', $uid) as $row) {
        if ((string)($row['vid'] ?? '') === $vid) {
            $state['favorited'] = true;
        }
    }
    foreach (Store::where('likes', 'uid', $uid) as $row) {
        if ((string)($row['vid'] ?? '') === $vid) {
            $state['liked'] = true;
        }
    }
    foreach (Store::where('history', 'uid', $uid) as $row) {
        if ((string)($row['vid'] ?? '') === $vid) {
            $state['watched'] = true;
        }
    }
    return $state;
}

switch ($action) {
    case 'detail':
        $vid = str_param('id');
        if ($vid === '') {
            fail('缺少视频 ID', 4001);
        }
        $video = Store::find('videos', $vid);
        if (!$video) {
            fail('视频不存在或已下架', 404);
        }
        $up = Store::find('users', (string)($video['uid'] ?? ''));
        $item = video_item($video, $up);

        $uid = current_uid();
        $state = user_video_state($uid, $vid);
        $followed = false;
        if ($uid !== null && (string)($up['id'] ?? '') !== $uid) {
            foreach (Store::where('follows', 'uid', $uid) as $row) {
                if ((string)($row['target_id'] ?? '') === (string)($up['id'] ?? '')) {
                    $followed = true;
                }
            }
        }

        ok([
            'video'   => $item,
            'up'      => public_user($up),
            'state'   => $state,
            'followed' => $followed,
            'comments_count' => (int)($video['comments'] ?? 0),
        ]);

    case 'related':
        $vid = str_param('id');
        $video = Store::find('videos', $vid);
        if (!$video) {
            fail('视频不存在或已下架', 404);
        }
        $cat = (string)($video['cat'] ?? '');
        $same = [];
        $others = [];
        foreach (Store::all('videos') as $row) {
            if ((string)($row['id'] ?? '') === $vid) {
                continue;
            }
            if ((string)($row['cat'] ?? '') === $cat) {
                $same[] = $row;
            } else {
                $others[] = $row;
            }
        }
        $merged = array_merge($same, $others);
        usort($merged, static function ($a, $b) {
            return (int)$b['likes'] <=> (int)$a['likes'];
        });
        $items = [];
        foreach (array_slice($merged, 0, 6) as $row) {
            $items[] = video_item($row);
        }
        ok(['items' => $items]);

    case 'comments':
        $vid = str_param('id');
        $page = max(1, int_param('page', 1));
        $limit = min(50, max(1, int_param('page_size', (int)cfg('comment_page_size', 20))));
        $rows = [];
        foreach (Store::where('comments', 'vid', $vid) as $row) {
            $rows[] = $row;
        }
        usort($rows, static function ($a, $b) {
            return (int)$b['created_at'] <=> (int)$a['created_at'];
        });
        $total = count($rows);
        $items = [];
        foreach (array_slice($rows, ($page - 1) * $limit, $limit) as $row) {
            $up = Store::find('users', (string)($row['uid'] ?? ''));
            $items[] = [
                'id'         => (string)$row['id'],
                'content'    => (string)($row['content'] ?? ''),
                'likes'      => (int)($row['likes'] ?? 0),
                'created_at' => (int)($row['created_at'] ?? 0),
                'up'         => public_user($up),
                'up_name'    => (string)($up['nickname'] ?? '游客用户'),
                'up_avatar'  => (string)($up['avatar'] ?? ($row['uid'] ?? '')),
            ];
        }
        ok(['items' => $items, 'total' => $total, 'page' => $page, 'has_more' => ($page * $limit) < $total]);

    case 'comment':
        if (!is_post()) {
            fail('请使用 POST 提交', 405);
        }
        $vid = str_param('vid', str_param('id'));
        $content = str_param('content');
        if ($vid === '') {
            fail('缺少视频 ID', 4001);
        }
        $video = Store::find('videos', $vid);
        if (!$video) {
            fail('视频不存在或已下架', 404);
        }
        $content = trim($content);
        if (mb_strlen($content) < 1) {
            fail('评论内容不能为空', 4002);
        }
        if (mb_strlen($content) > 200) {
            fail('评论内容不能超过 200 字', 4003);
        }
        $uid = current_uid() ?? 'guest';
        $comment = [
            'id'         => make_id('c'),
            'vid'        => $vid,
            'uid'        => $uid,
            'content'    => $content,
            'likes'      => 0,
            'created_at' => now(),
        ];
        Store::insert('comments', $comment);
        Store::update('videos', $vid, ['comments' => (int)($video['comments'] ?? 0) + 1]);
        ok([
            'id'         => $comment['id'],
            'content'    => $content,
            'likes'      => 0,
            'created_at' => $comment['created_at'],
            'up_name'    => '游客用户',
            'up_avatar'  => 'guest',
        ], '评论成功');

    case 'report':
        if (!is_post()) {
            fail('请使用 POST 提交', 405);
        }
        $vid = str_param('id');
        $duration = int_param('duration', 0);
        $video = Store::find('videos', $vid);
        if (!$video) {
            fail('视频不存在或已下架', 404);
        }
        $uid = current_uid();
        if ($uid !== null) {
            $existing = null;
            foreach (Store::where('history', 'uid', $uid) as $row) {
                if ((string)($row['vid'] ?? '') === $vid) {
                    $existing = $row;
                    break;
                }
            }
            if ($existing) {
                Store::update('history', (string)$existing['id'], [
                    'progress'   => $duration,
                    'updated_at' => now(),
                ]);
            } else {
                Store::insert('history', [
                    'id'         => make_id('h'),
                    'uid'        => $uid,
                    'vid'        => $vid,
                    'progress'   => $duration,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }
        Store::update('videos', $vid, ['views' => (int)($video['views'] ?? 0) + 1]);
        ok(['views' => (int)($video['views'] ?? 0) + 1, 'recorded' => $uid !== null]);

    default:
        fail('不支持的操作：' . $action, 404);
}

```

```text
file=api/videos.php
<?php
/**
 * 视频列表：频道（推荐 / 动态 / 排行榜 / 分区）与投稿
 */

declare(strict_types=1);
require_once __DIR__ . '/bootstrap.php';

const CHANNELS = ['recommend', 'latest', 'rank'];
const CATEGORIES = ['动画', '音乐', '游戏', '科技', '生活', '知识', '影视', '美食'];

/** 热度分值：兼顾播放、互动与新鲜度 */
function hot_score(array $video): float
{
    $views   = (int)($video['views'] ?? 0);
    $likes   = (int)($video['likes'] ?? 0);
    $coins   = (int)($video['coins'] ?? 0);
    $fav     = (int)($video['favorites'] ?? 0);
    $ageDays = max(0, (time() - (int)($video['published_at'] ?? time()))) / 86400;
    return $views * 0.25 + $likes * 3.5 + $coins * 9 + $fav * 6 + (30 - min($ageDays, 30)) * 40;
}

$action = str_param('action', 'list');

switch ($action) {
    case 'channels':
        ok([
            'channels'   => [
                ['key' => 'recommend', 'name' => '推荐'],
                ['key' => 'latest',    'name' => '动态'],
                ['key' => 'rank',      'name' => '排行榜'],
            ],
            'categories' => CATEGORIES,
        ]);

    case 'list':
        $channel = str_param('channel', 'recommend');
        $cat     = str_param('cat', '');
        $page    = max(1, int_param('page', 1));
        $limit   = min(30, max(1, int_param('page_size', (int)cfg('page_size', 10))));

        if (!in_array($channel, CHANNELS, true) && $channel !== 'cat') {
            fail('不支持的频道：' . $channel, 4001);
        }
        if ($channel === 'cat' && $cat === '') {
            fail('请选择分区', 4002);
        }

        $videos = Store::all('videos');
        if ($channel === 'cat') {
            $videos = array_values(array_filter($videos, static function ($v) use ($cat) {
                return (string)($v['cat'] ?? '') === $cat;
            }));
        }

        if ($channel === 'latest') {
            usort($videos, static function ($a, $b) {
                return (int)$b['published_at'] <=> (int)$a['published_at'];
            });
        } else {
            usort($videos, static function ($a, $b) {
                return hot_score($b) <=> hot_score($a);
            });
        }

        $total = count($videos);
        $slice = array_slice($videos, ($page - 1) * $limit, $limit);
        $items = [];
        $rank  = ($page - 1) * $limit;
        foreach ($slice as $video) {
            $item = video_item($video);
            if ($channel === 'rank') {
                $item['rank'] = ++$rank;
            }
            $items[] = $item;
        }

        ok([
            'items'    => $items,
            'page'     => $page,
            'page_size' => $limit,
            'total'    => $total,
            'has_more' => ($page * $limit) < $total,
            'channel'  => $channel,
            'cat'      => $cat,
        ]);

    case 'publish':
        if (!is_post()) {
            fail('请使用 POST 提交', 405);
        }
        $uid = require_login();
        $title = str_param('title');
        $desc  = str_param('desc');
        $cat   = str_param('cat', '生活');
        $coverA = str_param('cover_a', '#3a3550');
        $coverB = str_param('cover_b', '#6d6390');

        if (mb_strlen($title) < 2 || mb_strlen($title) > 60) {
            fail('标题长度需为 2-60 个字', 4001);
        }
        if (mb_strlen($desc) > 500) {
            fail('简介不能超过 500 个字', 4002);
        }
        if (!in_array($cat, CATEGORIES, true)) {
            $cat = '生活';
        }
        if (!preg_match('/^#[0-9a-fA-F]{6}$/', $coverA) || !preg_match('/^#[0-9a-fA-F]{6}$/', $coverB)) {
            $coverA = '#3a3550';
            $coverB = '#6d6390';
        }

        $video = [
            'id'           => make_id('v'),
            'title'        => $title,
            'desc'         => $desc,
            'cat'          => $cat,
            'tags'         => [$cat, '自制'],
            'uid'          => $uid,
            'duration'     => 60,
            'views'        => 0,
            'likes'        => 0,
            'coins'        => 0,
            'favorites'    => 0,
            'danmaku'      => 0,
            'comments'     => 0,
            'cover_a'      => $coverA,
            'cover_b'      => $coverB,
            'published_at' => now(),
        ];
        Store::insert('videos', $video);
        ok(['id' => $video['id'], 'video' => video_item($video)], '投稿成功');

    default:
        fail('不支持的操作：' . $action, 404);
}

```

```text
file=assets/css/app.css
/* ==========================================================================
   BiliLite 全局样式
   移动优先，基准宽度 375px，桌面居中显示为最大 480px 手机画布
   ========================================================================== */

:root {
  /* 主色与辅助色 */
  --c-primary: #FB7299;
  --c-primary-dark: #E5608A;
  --c-primary-soft: #FFF1F5;
  --c-accent: #00AEEC;

  /* 中性色 */
  --c-text: #18191C;
  --c-text-2: #61666D;
  --c-text-3: #9499A0;
  --c-bg: #F6F7F8;
  --c-card: #FFFFFF;
  --c-line: #F1F2F3;
  --c-border: #E3E5E7;
  --c-mask: rgba(0, 0, 0, 0.55);

  /* 间距 */
  --sp-1: 4px;
  --sp-2: 8px;
  --sp-3: 12px;
  --sp-4: 16px;
  --sp-5: 20px;
  --sp-6: 24px;

  /* 圆角 */
  --r-sm: 6px;
  --r-md: 10px;
  --r-lg: 14px;
  --r-pill: 999px;

  /* 阴影 */
  --sh-card: 0 1px 3px rgba(24, 25, 28, 0.06);
  --sh-float: 0 6px 18px rgba(24, 25, 28, 0.14);
  --sh-nav: 0 -1px 8px rgba(24, 25, 28, 0.06);

  /* 字号 */
  --fs-xs: 10px;
  --fs-sm: 12px;
  --fs-md: 14px;
  --fs-lg: 16px;
  --fs-xl: 18px;
  --fs-title: 20px;
  --fs-big: 24px;

  /* 字重 */
  --fw-normal: 400;
  --fw-medium: 500;
  --fw-bold: 600;

  /* 布局 */
  --nav-h: 52px;
  --app-w: 480px;
  --font: "PingFang SC", "HarmonyOS Sans SC", "Microsoft YaHei", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
}

* {
  box-sizing: border-box;
  -webkit-tap-highlight-color: transparent;
}

html,
body {
  margin: 0;
  padding: 0;
}

body {
  font-family: var(--font);
  font-size: var(--fs-md);
  color: var(--c-text);
  background: #E8EAED;
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
  overflow-x: hidden;
}

img {
  display: block;
  max-width: 100%;
  border: 0;
}

a {
  color: inherit;
  text-decoration: none;
}

button,
input,
textarea,
select {
  font-family: inherit;
  font-size: inherit;
  color: inherit;
}

button {
  border: 0;
  background: none;
  cursor: pointer;
  padding: 0;
}

ul,
ol {
  margin: 0;
  padding: 0;
  list-style: none;
}

h1, h2, h3, h4, p {
  margin: 0;
}

/* ---------- 手机画布 ---------- */

.app {
  position: relative;
  width: 100%;
  max-width: var(--app-w);
  margin: 0 auto;
  min-height: 100vh;
  background: var(--c-bg);
  overflow-x: hidden;
  box-shadow: 0 0 24px rgba(0, 0, 0, 0.08);
}

@media (max-width: 520px) {
  .app {
    box-shadow: none;
  }
  body {
    background: var(--c-bg);
  }
}

.page {
  padding-bottom: calc(var(--nav-h) + env(safe-area-inset-bottom, 0px) + 12px);
}

.page--plain {
  padding-bottom: calc(var(--nav-h) + 24px);
}

/* ---------- 状态栏 ---------- */

.statusbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 28px;
  padding: 0 var(--sp-4);
  font-size: var(--fs-xs);
  font-weight: var(--fw-bold);
  color: var(--c-text);
  background: var(--c-card);
}

.statusbar__right {
  display: flex;
  align-items: center;
  gap: 5px;
}

.statusbar__right svg {
  display: block;
}

/* ---------- 顶部导航 ---------- */

.appbar {
  position: sticky;
  top: 0;
  z-index: 20;
  display: flex;
  align-items: center;
  gap: var(--sp-2);
  height: 46px;
  padding: 0 var(--sp-3);
  background: var(--c-card);
  border-bottom: 1px solid var(--c-line);
}

.appbar__title {
  flex: 1;
  font-size: var(--fs-lg);
  font-weight: var(--fw-medium);
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.appbar--center .appbar__title {
  text-align: center;
}

.iconbtn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: var(--r-pill);
  color: var(--c-text);
  transition: background-color 0.18s ease, color 0.18s ease, transform 0.18s ease;
}

.iconbtn:hover {
  background: var(--c-line);
}

.iconbtn:active {
  transform: scale(0.92);
  background: var(--c-line);
}

.iconbtn:focus-visible {
  outline: 2px solid var(--c-primary);
  outline-offset: 2px;
}

.iconbtn--muted {
  color: var(--c-text-2);
}

.iconbtn--primary {
  color: var(--c-primary);
}

/* ---------- 搜索栏 ---------- */

.searchbar {
  display: flex;
  align-items: center;
  gap: var(--sp-2);
  padding: var(--sp-2) var(--sp-3);
  background: var(--c-card);
}

.searchbar__field {
  flex: 1;
  display: flex;
  align-items: center;
  gap: var(--sp-2);
  height: 32px;
  padding: 0 var(--sp-3);
  border-radius: var(--r-pill);
  background: var(--c-bg);
  color: var(--c-text-3);
  font-size: var(--fs-sm);
  transition: box-shadow 0.18s ease, background-color 0.18s ease;
}

.searchbar__field:hover {
  background: #EFF0F2;
}

.searchbar__field:focus-within {
  background: var(--c-card);
  box-shadow: inset 0 0 0 1px var(--c-primary);
}

.searchbar__field input {
  flex: 1;
  min-width: 0;
  border: 0;
  outline: 0;
  background: transparent;
  font-size: var(--fs-sm);
  color: var(--c-text);
}

.searchbar__field input::placeholder {
  color: var(--c-text-3);
}

.searchbar__field input::-webkit-search-cancel-button {
  display: none;
}

.searchbar__submit {
  height: 32px;
  padding: 0 var(--sp-4);
  border-radius: var(--r-pill);
  background: var(--c-primary);
  color: #fff;
  font-size: var(--fs-sm);
  font-weight: var(--fw-medium);
  transition: background-color 0.18s ease, transform 0.18s ease;
}

.searchbar__submit:hover {
  background: var(--c-primary-dark);
}

.searchbar__submit:active {
  transform: scale(0.96);
}

.searchbar__submit:disabled {
  background: var(--c-border);
  color: var(--c-text-3);
  cursor: not-allowed;
}

/* ---------- 频道 Tab ---------- */

.tabs {
  position: sticky;
  top: 46px;
  z-index: 18;
  display: flex;
  gap: var(--sp-1);
  padding: var(--sp-2) var(--sp-3);
  overflow-x: auto;
  scrollbar-width: none;
  background: var(--c-card);
  border-bottom: 1px solid var(--c-line);
}

.tabs::-webkit-scrollbar {
  display: none;
}

.tab {
  flex: 0 0 auto;
  height: 28px;
  padding: 0 var(--sp-3);
  border-radius: var(--r-pill);
  font-size: var(--fs-sm);
  color: var(--c-text-2);
  background: transparent;
  transition: background-color 0.18s ease, color 0.18s ease;
}

.tab:hover {
  background: var(--c-line);
  color: var(--c-text);
}

.tab:focus-visible {
  outline: 2px solid var(--c-primary);
  outline-offset: 2px;
}

.tab.is-active {
  background: var(--c-primary-soft);
  color: var(--c-primary);
  font-weight: var(--fw-medium);
}

/* ---------- 视频卡片 ---------- */

.grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--sp-3);
  padding: var(--sp-3);
}

.card {
  display: block;
  overflow: hidden;
}

.card__thumb {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  border-radius: var(--r-md);
  overflow: hidden;
  background: #D9DBDE;
}

.card__thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.35s ease;
}

.card:active .card__thumb img {
  transform: scale(1.03);
}

.card__duration {
  position: absolute;
  right: 6px;
  bottom: 6px;
  padding: 1px 5px;
  border-radius: var(--r-sm);
  background: rgba(0, 0, 0, 0.62);
  color: #fff;
  font-size: var(--fs-xs);
  line-height: 1.6;
}

.card__rank {
  position: absolute;
  left: 6px;
  top: 6px;
  min-width: 20px;
  height: 20px;
  padding: 0 5px;
  border-radius: var(--r-sm);
  background: var(--c-primary);
  color: #fff;
  font-size: var(--fs-xs);
  font-weight: var(--fw-bold);
  line-height: 20px;
  text-align: center;
}

.card__title {
  margin-top: var(--sp-2);
  font-size: var(--fs-md);
  line-height: 1.42;
  color: var(--c-text);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card__meta {
  display: flex;
  align-items: center;
  gap: var(--sp-1);
  margin-top: 6px;
  font-size: var(--fs-xs);
  color: var(--c-text-3);
}

.card__meta .avatar {
  width: 18px;
  height: 18px;
  font-size: 9px;
}

.card__up {
  max-width: 88px;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.card__views {
  margin-left: auto;
  flex: 0 0 auto;
}

/* ---------- 头像 ---------- */

.avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: var(--r-pill);
  overflow: hidden;
  background: var(--c-primary-soft);
  color: var(--c-primary);
  font-size: var(--fs-sm);
  font-weight: var(--fw-medium);
  flex: 0 0 auto;
}

.avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar--lg {
  width: 56px;
  height: 56px;
  font-size: var(--fs-lg);
}

.avatar--sm {
  width: 28px;
  height: 28px;
  font-size: var(--fs-xs);
}

/* ---------- 区块 ---------- */

.section {
  margin-top: var(--sp-2);
  background: var(--c-card);
}

.section__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--sp-3) var(--sp-4) var(--sp-2);
}

.section__title {
  font-size: var(--fs-lg);
  font-weight: var(--fw-medium);
}

.section__more {
  font-size: var(--fs-sm);
  color: var(--c-text-3);
  display: inline-flex;
  align-items: center;
  gap: 2px;
}

.section__more:hover {
  color: var(--c-primary);
}

/* ---------- 通用按钮 ---------- */

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--sp-1);
  height: 36px;
  padding: 0 var(--sp-4);
  border-radius: var(--r-pill);
  background: var(--c-line);
  color: var(--c-text);
  font-size: var(--fs-sm);
  font-weight: var(--fw-medium);
  transition: background-color 0.18s ease, color 0.18s ease, transform 0.18s ease, opacity 0.18s ease;
}

.btn:hover {
  background: #E6E8EA;
}

.btn:active {
  transform: scale(0.97);
}

.btn:focus-visible {
  outline: 2px solid var(--c-primary);
  outline-offset: 2px;
}

.btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
  transform: none;
}

.btn--primary {
  background: var(--c-primary);
  color: #fff;
}

.btn--primary:hover {
  background: var(--c-primary-dark);
}

.btn--ghost {
  background: transparent;
  border: 1px solid var(--c-border);
  color: var(--c-text-2);
}

.btn--ghost:hover {
  border-color: var(--c-primary);
  color: var(--c-primary);
}

.btn--accent {
  background: var(--c-accent);
  color: #fff;
}

.btn--accent:hover {
  background: #0092C6;
}

.btn--block {
  width: 100%;
  height: 44px;
  font-size: var(--fs-lg);
}

.btn--sm {
  height: 28px;
  padding: 0 var(--sp-3);
  font-size: var(--fs-xs);
}

/* ---------- 底部导航 ---------- */

.tabbar {
  position: fixed;
  left: 50%;
  bottom: 0;
  transform: translateX(-50%);
  z-index: 40;
  display: flex;
  align-items: center;
  width: 100%;
  max-width: var(--app-w);
  height: calc(var(--nav-h) + env(safe-area-inset-bottom, 0px));
  padding-bottom: env(safe-area-inset-bottom, 0px);
  background: var(--c-card);
  border-top: 1px solid var(--c-line);
  box-shadow: var(--sh-nav);
}

.tabbar__item {
  position: relative;
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  height: var(--nav-h);
  color: var(--c-text-3);
  font-size: var(--fs-xs);
  transition: color 0.18s ease;
}

.tabbar__item:hover {
  color: var(--c-text-2);
}

.tabbar__item.is-active {
  color: var(--c-primary);
}

.tabbar__item:focus-visible {
  outline: 2px solid var(--c-primary);
  outline-offset: -3px;
  border-radius: var(--r-sm);
}

.tabbar__item svg {
  width: 22px;
  height: 22px;
}

.tabbar__publish {
  flex: 0 0 62px;
}

.tabbar__publish-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 32px;
  border-radius: var(--r-md);
  background: var(--c-primary);
  color: #fff;
  transition: background-color 0.18s ease, transform 0.18s ease;
}

.tabbar__publish-btn:hover {
  background: var(--c-primary-dark);
}

.tabbar__publish-btn:active {
  transform: scale(0.92);
}

.badge {
  position: absolute;
  top: 3px;
  left: 50%;
  margin-left: 4px;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  border-radius: var(--r-pill);
  background: var(--c-primary);
  color: #fff;
  font-size: 10px;
  line-height: 16px;
  text-align: center;
  border: 1.5px solid var(--c-card);
}

.badge[hidden] {
  display: none;
}

/* ---------- 分段控件 ---------- */

.segment {
  display: flex;
  gap: var(--sp-2);
  padding: var(--sp-2) var(--sp-3);
  background: var(--c-card);
  border-bottom: 1px solid var(--c-line);
}

.segment__item {
  flex: 1;
  height: 32px;
  border-radius: var(--r-md);
  background: var(--c-bg);
  color: var(--c-text-2);
  font-size: var(--fs-sm);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  transition: background-color 0.18s ease, color 0.18s ease;
}

.segment__item:hover {
  background: #EFF0F2;
}

.segment__item.is-active {
  background: var(--c-primary-soft);
  color: var(--c-primary);
  font-weight: var(--fw-medium);
}

.segment__item:focus-visible {
  outline: 2px solid var(--c-primary);
  outline-offset: 1px;
}

/* ---------- 标签 ---------- */

.chip {
  display: inline-flex;
  align-items: center;
  height: 28px;
  padding: 0 var(--sp-3);
  border-radius: var(--r-pill);
  background: var(--c-bg);
  color: var(--c-text-2);
  font-size: var(--fs-sm);
  transition: background-color 0.18s ease, color 0.18s ease;
}

.chip:hover {
  background: var(--c-primary-soft);
  color: var(--c-primary);
}

.chip.is-active {
  background: var(--c-primary-soft);
  color: var(--c-primary);
}

.chip-row {
  display: flex;
  flex-wrap: wrap;
  gap: var(--sp-2);
  padding: var(--sp-3) var(--sp-4);
}

.chip-row--scroll {
  flex-wrap: nowrap;
  overflow-x: auto;
  scrollbar-width: none;
}

.chip-row--scroll::-webkit-scrollbar {
  display: none;
}

/* ---------- 列表条目 ---------- */

.list {
  background: var(--c-card);
}

.list__item {
  display: flex;
  align-items: flex-start;
  gap: var(--sp-3);
  padding: var(--sp-3) var(--sp-4);
  border-bottom: 1px solid var(--c-line);
  transition: background-color 0.18s ease;
}

.list__item:hover {
  background: #FAFAFB;
}

.list__item:active {
  background: var(--c-line);
}

.list__body {
  flex: 1;
  min-width: 0;
}

.list__title {
  font-size: var(--fs-md);
  color: var(--c-text);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.list__desc {
  margin-top: 4px;
  font-size: var(--fs-sm);
  color: var(--c-text-2);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.list__meta {
  margin-top: 6px;
  font-size: var(--fs-xs);
  color: var(--c-text-3);
  display: flex;
  align-items: center;
  gap: var(--sp-2);
}

.list__thumb {
  width: 132px;
  aspect-ratio: 16 / 9;
  flex: 0 0 auto;
  border-radius: var(--r-sm);
  overflow: hidden;
  background: #D9DBDE;
}

.list__thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.list__side {
  flex: 0 0 132px;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: var(--sp-1);
}

.list__side .list__thumb {
  width: 100%;
}

/* ---------- 表单 ---------- */

.field {
  margin-bottom: var(--sp-3);
}

.field__label {
  display: block;
  margin-bottom: var(--sp-2);
  font-size: var(--fs-sm);
  color: var(--c-text-2);
}

.input,
.textarea,
.select {
  width: 100%;
  border: 1px solid var(--c-border);
  border-radius: var(--r-md);
  background: var(--c-card);
  padding: 10px var(--sp-3);
  font-size: var(--fs-md);
  outline: 0;
  transition: border-color 0.18s ease, box-shadow 0.18s ease;
}

.input:hover,
.textarea:hover,
.select:hover {
  border-color: #C9CCD0;
}

.input:focus,
.textarea:focus,
.select:focus {
  border-color: var(--c-primary);
  box-shadow: 0 0 0 3px rgba(251, 114, 153, 0.14);
}

.input:disabled,
.textarea:disabled,
.select:disabled {
  background: var(--c-bg);
  color: var(--c-text-3);
  cursor: not-allowed;
}

.textarea {
  min-height: 92px;
  resize: vertical;
  line-height: 1.6;
}

.select {
  appearance: none;
  background-image: url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' fill='none' stroke='%239499A0' stroke-width='1.6' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
  padding-right: 32px;
}

.form-error {
  margin-top: var(--sp-2);
  font-size: var(--fs-sm);
  color: #E64455;
  min-height: 18px;
}

.form-hint {
  margin-top: var(--sp-2);
  font-size: var(--fs-xs);
  color: var(--c-text-3);
}

/* ---------- 搜索页 ---------- */

.search-page__field {
  display: flex;
  align-items: center;
  gap: var(--sp-2);
  flex: 1;
  height: 34px;
  padding: 0 var(--sp-3);
  border: 1px solid transparent;
  border-radius: var(--r-pill);
  background: var(--c-bg);
  transition: border-color 0.18s ease, background-color 0.18s ease;
}

.search-page__field:focus-within {
  background: var(--c-card);
  border-color: var(--c-primary);
}

.search-page__field input {
  flex: 1;
  min-width: 0;
  border: 0;
  outline: 0;
  background: transparent;
  font-size: var(--fs-sm);
}

.block-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--sp-4) var(--sp-4) 0;
  font-size: var(--fs-md);
  font-weight: var(--fw-medium);
}

.block-head__action {
  font-size: var(--fs-sm);
  font-weight: var(--fw-normal);
  color: var(--c-text-3);
}

.block-head__action:hover {
  color: var(--c-primary);
}

mark {
  background: transparent;
  color: var(--c-primary);
  font-weight: var(--fw-medium);
}

/* ---------- 播放页 ---------- */

.player {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  background: #101114;
  overflow: hidden;
}

.player.is-fullscreen {
  position: fixed;
  inset: 0;
    z-index: 90;
  width: 100vw;
  height: 100vh;
  aspect-ratio: auto;
}

.player__stage {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background:
    radial-gradient(120% 90% at 20% 15%, rgba(251, 114, 153, 0.32), transparent 60%),
    radial-gradient(90% 80% at 85% 80%, rgba(0, 174, 236, 0.24), transparent 62%),
    linear-gradient(140deg, #22242b, #101114);
}

.player__stage::before {
  content: "";
  position: absolute;
  width: 46%;
  aspect-ratio: 1;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.05);
  filter: blur(6px);
}

.player.is-playing .player__stage::before {
  animation: playerFloat 3.6s ease-in-out infinite;
}

.player.is-paused .player__stage::before {
  animation-play-state: paused;
}

@keyframes playerFloat {
  0%, 100% { transform: translate3d(-14%, -6%, 0) scale(1); }
  50% { transform: translate3d(12%, 8%, 0) scale(1.16); }
}

.player__hint {
  position: relative;
  color: rgba(255, 255, 255, 0.72);
  font-size: var(--fs-sm);
  letter-spacing: 2px;
}

.player__center {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.18);
  transition: opacity 0.2s ease;
}

.player.is-playing .player__center {
  opacity: 0;
  pointer-events: none;
}

.player__playbtn {
  width: 58px;
  height: 58px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.45);
  border: 1.5px solid rgba(255, 255, 255, 0.75);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.18s ease, background-color 0.18s ease;
}

.player__playbtn:hover {
  background: rgba(251, 114, 153, 0.55);
  border-color: var(--c-primary);
}

.player__playbtn:active {
  transform: scale(0.93);
}

.player__bar {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  padding: var(--sp-2) var(--sp-3);
  background: linear-gradient(to top, rgba(0, 0, 0, 0.6), transparent);
  display: flex;
  align-items: center;
  gap: var(--sp-2);
}

.player__progress {
  position: relative;
  flex: 1;
  height: 16px;
  display: flex;
  align-items: center;
  cursor: pointer;
}

.player__track {
  position: relative;
  width: 100%;
  height: 3px;
  border-radius: var(--r-pill);
  background: rgba(255, 255, 255, 0.28);
  overflow: hidden;
}

.player__bar-fill {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 0;
  background: var(--c-primary);
  border-radius: var(--r-pill);
}

.player__time {
  font-size: var(--fs-xs);
  color: rgba(255, 255, 255, 0.85);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.player__ctrl {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  height: 24px;
  padding: 0 6px;
  border-radius: var(--r-sm);
  color: #fff;
  font-size: var(--fs-xs);
  background: rgba(255, 255, 255, 0.14);
  transition: background-color 0.18s ease;
}

.player__ctrl:hover {
  background: rgba(255, 255, 255, 0.26);
}

.player__ctrl:active {
  transform: scale(0.94);
}

/* 播放页没有底部导航，操作栏贴底 */
body[data-page="video"] .actionbar {
  bottom: 0;
}

body[data-page="video"] .page {
  padding-bottom: 72px;
}

/* ---------- 视频详情 ---------- */

.detail__title {
  font-size: var(--fs-title);
  font-weight: var(--fw-medium);
  line-height: 1.4;
}

.detail__stats {
  display: flex;
  align-items: center;
  gap: var(--sp-3);
  margin-top: var(--sp-2);
  font-size: var(--fs-sm);
  color: var(--c-text-2);
}

.detail__stats b {
  color: var(--c-text);
  font-weight: var(--fw-medium);
}

.upcard {
  display: flex;
  align-items: center;
  gap: var(--sp-3);
  padding: var(--sp-3) var(--sp-4);
  background: var(--c-card);
  border-top: 1px solid var(--c-line);
  border-bottom: 1px solid var(--c-line);
  margin-top: var(--sp-2);
}

.upcard__body {
  flex: 1;
  min-width: 0;
}

.upcard__name {
  font-size: var(--fs-md);
  font-weight: var(--fw-medium);
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.upcard__meta {
  margin-top: 2px;
  font-size: var(--fs-xs);
  color: var(--c-text-3);
}

.upcard__actions {
  display: flex;
  gap: var(--sp-2);
  flex: 0 0 auto;
}

.desc {
  padding: var(--sp-3) var(--sp-4);
  background: var(--c-card);
  font-size: var(--fs-sm);
  color: var(--c-text-2);
  line-height: 1.6;
}

.desc__text {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  white-space: pre-wrap;
}

.desc.is-open .desc__text {
  -webkit-line-clamp: unset;
}

.desc__toggle {
  margin-top: var(--sp-1);
  color: var(--c-accent);
  font-size: var(--fs-sm);
}

/* ---------- 评论区 ---------- */

.comment-form {
  display: flex;
  gap: var(--sp-2);
  padding: var(--sp-3) var(--sp-4);
  background: var(--c-card);
  border-bottom: 1px solid var(--c-line);
}

.comment-form__input {
  flex: 1;
  min-width: 0;
  height: 34px;
  padding: 0 var(--sp-3);
  border: 1px solid var(--c-border);
  border-radius: var(--r-pill);
  background: var(--c-bg);
  outline: 0;
  font-size: var(--fs-sm);
  transition: border-color 0.18s ease, background-color 0.18s ease;
}

.comment-form__input:focus {
  background: var(--c-card);
  border-color: var(--c-primary);
}

.comment {
  display: flex;
  gap: var(--sp-2);
  padding: var(--sp-3) var(--sp-4);
  border-bottom: 1px solid var(--c-line);
  background: var(--c-card);
}

.comment__body {
  flex: 1;
  min-width: 0;
}

.comment__name {
  font-size: var(--fs-sm);
  color: var(--c-text-2);
}

.comment__content {
  margin-top: 3px;
  font-size: var(--fs-md);
  line-height: 1.55;
  word-break: break-word;
}

.comment__meta {
  margin-top: 4px;
  font-size: var(--fs-xs);
  color: var(--c-text-3);
}

/* ---------- 底部操作栏 ---------- */

.actionbar {
  position: fixed;
  left: 50%;
  bottom: calc(var(--nav-h) + env(safe-area-inset-bottom, 0px));
  transform: translateX(-50%);
  z-index: 35;
  display: flex;
  align-items: center;
  width: 100%;
  max-width: var(--app-w);
  height: 48px;
  padding: 0 var(--sp-2);
  background: var(--c-card);
  border-top: 1px solid var(--c-line);
}

.actionbar__item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1px;
  height: 40px;
  border-radius: var(--r-md);
  color: var(--c-text-2);
  font-size: 10px;
  transition: color 0.18s ease, background-color 0.18s ease;
}

.actionbar__item:hover {
  background: var(--c-bg);
  color: var(--c-text);
}

.actionbar__item:active {
  transform: scale(0.95);
}

.actionbar__item.is-active {
  color: var(--c-primary);
}

.actionbar__item svg {
  width: 20px;
  height: 20px;
}

/* ---------- 我的页面 ---------- */

.profile {
  padding: var(--sp-4);
  background: var(--c-card);
}

.profile__top {
  display: flex;
  align-items: center;
  gap: var(--sp-3);
}

.profile__info {
  flex: 1;
  min-width: 0;
}

.profile__name {
  display: flex;
  align-items: center;
  gap: var(--sp-2);
  font-size: var(--fs-xl);
  font-weight: var(--fw-medium);
}

.level {
  display: inline-flex;
  align-items: center;
  height: 18px;
  padding: 0 6px;
  border-radius: var(--r-sm);
  background: var(--c-primary-soft);
  color: var(--c-primary);
  font-size: var(--fs-xs);
  font-weight: var(--fw-medium);
}

.profile__sig {
  margin-top: 4px;
  font-size: var(--fs-sm);
  color: var(--c-text-3);
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.profile__stats {
  display: flex;
  margin-top: var(--sp-4);
}

.profile__stat {
  flex: 1;
  text-align: center;
}

.profile__stat b {
  display: block;
  font-size: var(--fs-xl);
  font-weight: var(--fw-medium);
}

.profile__stat span {
  font-size: var(--fs-xs);
  color: var(--c-text-3);
}

.entries {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--sp-2);
  padding: var(--sp-4) var(--sp-2);
  background: var(--c-card);
  border-top: 1px solid var(--c-line);
}

.entry {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: var(--sp-2) 0;
  border-radius: var(--r-md);
  font-size: var(--fs-sm);
  color: var(--c-text-2);
  transition: background-color 0.18s ease, color 0.18s ease;
}

.entry:hover {
  background: var(--c-bg);
  color: var(--c-text);
}

.entry:active {
  transform: scale(0.96);
}

.entry__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: var(--r-md);
  background: var(--c-primary-soft);
  color: var(--c-primary);
}

.entry__count {
  font-size: var(--fs-xs);
  color: var(--c-text-3);
}

/* ---------- 消息页 ---------- */

.msg {
  display: flex;
  align-items: flex-start;
  gap: var(--sp-3);
  padding: var(--sp-3) var(--sp-4);
  background: var(--c-card);
  border-bottom: 1px solid var(--c-line);
}

.msg__body {
  flex: 1;
  min-width: 0;
}

.msg__title {
  font-size: var(--fs-md);
  font-weight: var(--fw-medium);
}

.msg__content {
  margin-top: 3px;
  font-size: var(--fs-sm);
  color: var(--c-text-2);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.msg__meta {
  margin-top: 5px;
  font-size: var(--fs-xs);
  color: var(--c-text-3);
  display: flex;
  align-items: center;
  gap: var(--sp-2);
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--c-primary);
  flex: 0 0 auto;
}

/* ---------- 空状态 / 加载 ---------- */

.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--sp-2);
  padding: 48px var(--sp-6);
  color: var(--c-text-3);
  text-align: center;
}

.empty__icon {
  color: var(--c-border);
}

.empty__title {
  font-size: var(--fs-md);
  color: var(--c-text-2);
}

.empty__desc {
  font-size: var(--fs-sm);
}

.loader {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--sp-2);
  padding: var(--sp-4);
  font-size: var(--fs-sm);
  color: var(--c-text-3);
}

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid var(--c-border);
  border-top-color: var(--c-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loadmore {
  display: block;
  width: calc(100% - var(--sp-6));
  margin: var(--sp-3) auto;
  height: 36px;
  border-radius: var(--r-pill);
  background: var(--c-card);
  color: var(--c-text-3);
  font-size: var(--fs-sm);
  border: 1px solid var(--c-border);
  transition: color 0.18s ease, border-color 0.18s ease;
}

.loadmore:hover {
  color: var(--c-primary);
  border-color: var(--c-primary);
}

.loadmore:disabled {
  opacity: 0.6;
  cursor: default;
}

/* ---------- 弹层 ---------- */

.sheet {
  position: fixed;
  inset: 0;
  z-index: 80;
  display: none;
}

.sheet.is-open {
  display: block;
}

.sheet__mask {
  position: absolute;
  inset: 0;
  background: var(--c-mask);
  animation: fadeIn 0.2s ease;
}

.sheet__panel {
  position: absolute;
  left: 50%;
  bottom: 0;
  transform: translateX(-50%);
  width: 100%;
  max-width: var(--app-w);
  max-height: 86vh;
  overflow-y: auto;
  padding: var(--sp-4);
  background: var(--c-card);
  border-radius: var(--r-lg) var(--r-lg) 0 0;
  animation: slideUp 0.24s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from { transform: translate(-50%, 24px); }
  to { transform: translate(-50%, 0); }
}

.sheet__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--sp-3);
}

.sheet__title {
  font-size: var(--fs-lg);
  font-weight: var(--fw-medium);
}

.sheet__close {
  width: 30px;
  height: 30px;
  border-radius: var(--r-pill);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--c-text-3);
}

.sheet__close:hover {
  background: var(--c-line);
}

.color-row {
  display: flex;
  gap: var(--sp-2);
}

.color-row input[type="color"] {
  width: 40px;
  height: 36px;
  padding: 2px;
  border: 1px solid var(--c-border);
  border-radius: var(--r-md);
  background: var(--c-card);
  cursor: pointer;
}

/* ---------- 提示条 ---------- */

.toast {
  position: fixed;
  left: 50%;
  bottom: calc(var(--nav-h) + 68px);
  transform: translate(-50%, 12px);
  z-index: 95;
  max-width: 76%;
  padding: 8px 14px;
  border-radius: var(--r-md);
  background: rgba(24, 25, 28, 0.86);
  color: #fff;
  font-size: var(--fs-sm);
  text-align: center;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.22s ease, transform 0.22s ease;
}

.toast.is-show {
  opacity: 1;
  transform: translate(-50%, 0);
}

/* ---------- 登录页 ---------- */

.login {
  min-height: 100vh;
  padding: 56px var(--sp-6) var(--sp-6);
  background: var(--c-card);
}

.login__logo {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--sp-3);
  margin-bottom: var(--sp-6);
}

.login__logo svg {
  filter: drop-shadow(0 6px 16px rgba(251, 114, 153, 0.32));
}

.login__slogan {
  font-size: var(--fs-md);
  color: var(--c-text-3);
}

.login__tabs {
  display: flex;
  gap: var(--sp-2);
  margin-bottom: var(--sp-5);
}

.login__tab {
  flex: 1;
  height: 40px;
  border-radius: var(--r-md);
  background: var(--c-bg);
  color: var(--c-text-2);
  font-size: var(--fs-lg);
  transition: background-color 0.18s ease, color 0.18s ease;
}

.login__tab:hover {
  background: #EFF0F2;
}

.login__tab.is-active {
  background: var(--c-primary-soft);
  color: var(--c-primary);
  font-weight: var(--fw-medium);
}

.login__foot {
  margin-top: var(--sp-5);
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: var(--fs-sm);
  color: var(--c-text-3);
}

.login__foot a:hover {
  color: var(--c-primary);
}

.divider {
  display: flex;
  align-items: center;
  gap: var(--sp-3);
  margin: var(--sp-5) 0;
  color: var(--c-text-3);
  font-size: var(--fs-xs);
}

.divider::before,
.divider::after {
  content: "";
  flex: 1;
  height: 1px;
  background: var(--c-line);
}

.guest-tip {
  margin-top: var(--sp-4);
  padding: var(--sp-3);
  border-radius: var(--r-md);
  background: var(--c-primary-soft);
  color: var(--c-primary-dark);
  font-size: var(--fs-sm);
  text-align: center;
}

/* ---------- 工具类 ---------- */

.hidden {
  display: none !important;
}

.text-2 {
  color: var(--c-text-2);
}

.text-3 {
  color: var(--c-text-3);
}

.fs-sm {
  font-size: var(--fs-sm);
}

.fs-xs {
  font-size: var(--fs-xs);
}

.mt-2 { margin-top: var(--sp-2); }
.mt-3 { margin-top: var(--sp-3); }
.mt-4 { margin-top: var(--sp-4); }

.divider-line {
  height: 8px;
  background: var(--c-bg);
}

```

```text
file=assets/js/core.js
/* ==========================================================================
   BiliLite 公共脚本
   - 接口请求封装
   - 格式化工具
   - 卡片渲染
   - 通用交互（提示条、消息角标、登录态）
   ========================================================================== */

(function (global) {
  'use strict';

  var API_BASE = 'api/';
  var USER_KEY = 'bili_user';
  var TOKEN_KEY = 'bili_token';

  /* ------------------------------------------------------------------ */
  /* 基础工具                                                            */
  /* ------------------------------------------------------------------ */

  function qs(sel, root) {
    return (root || document).querySelector(sel);
  }

  function qsa(sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  }

  function escapeHtml(str) {
    return String(str === null || str === undefined ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function highlight(text, keyword) {
    var safe = escapeHtml(text);
    if (!keyword) {
      return safe;
    }
    var kw = escapeHtml(keyword).trim();
    if (!kw) {
      return safe;
    }
    try {
      var reg = new RegExp('(' + kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'gi');
      return safe.replace(reg, '<mark>$1</mark>');
    } catch (e) {
      return safe;
    }
  }

  /** 播放量 / 数字格式化：12345 -> 1.2万 */
  function fmtCount(num) {
    var n = Number(num) || 0;
    if (n >= 100000000) {
      return (n / 100000000).toFixed(1).replace(/\.0$/, '') + '亿';
    }
    if (n >= 10000) {
      return (n / 10000).toFixed(1).replace(/\.0$/, '') + '万';
    }
    return String(n);
  }

  /** 秒 -> mm:ss */
  function fmtDuration(sec) {
    var s = Math.max(0, Math.floor(Number(sec) || 0));
    var m = Math.floor(s / 60);
    var r = s % 60;
    return (m < 10 ? '0' : '') + m + ':' + (r < 10 ? '0' : '') + r;
  }

  /** 时间戳 -> 相对时间 */
  function fmtTime(ts) {
    var t = Number(ts) || 0;
    if (!t) {
      return '';
    }
    var diff = Math.floor(Date.now() / 1000) - t;
    if (diff < 60) {
      return '刚刚';
    }
    if (diff < 3600) {
      return Math.floor(diff / 60) + '分钟前';
    }
    if (diff < 86400) {
      return Math.floor(diff / 3600) + '小时前';
    }
    if (diff < 86400 * 30) {
      return Math.floor(diff / 86400) + '天前';
    }
    var d = new Date(t * 1000);
    return (d.getMonth() + 1) + '月' + d.getDate() + '日';
  }

  /** 时钟文本 */
  function fmtClock(ts) {
    var d = new Date((Number(ts) || Date.now() / 1000) * 1000);
    var h = d.getHours();
    var m = d.getMinutes();
    return (h < 10 ? '0' : '') + h + ':' + (m < 10 ? '0' : '') + m;
  }

  /** 查询参数 */
  function query(key, fallback) {
    var params = new URLSearchParams(global.location.search);
    var v = params.get(key);
    return v === null ? (fallback === undefined ? '' : fallback) : v;
  }

  /* ------------------------------------------------------------------ */
  /* 接口封装                                                            */
  /* ------------------------------------------------------------------ */

  /* ------------------------------------------------------------------ */
  /* 离线演示数据                                                        */
  /* 仅当页面以 file:// 协议直接打开（本地静态预览）时启用，              */
  /* 部署到 PHP 服务器后请求会走真实接口，不会进入这个分支。             */
  /* ------------------------------------------------------------------ */

  var MOCK_USERS = [
    { id: 'u_1', username: 'bilibili', nickname: '哔哩哔哩', level: 6, signature: '官方账号，陪你度过每一个快乐时刻', followers: 3000, following: 12, likes: 3000, avatar: 'u_1', password: '123456' },
    { id: 'u_2', username: 'music', nickname: '音乐播放器', level: 5, signature: '每天一首好听的旋律', followers: 860, following: 20, likes: 1200, avatar: 'u_2', password: '123456' },
    { id: 'u_3', username: 'gamer', nickname: '游戏解说君', level: 5, signature: '认真做游戏，也认真做内容', followers: 1200, following: 18, likes: 2400, avatar: 'u_3', password: '123456' },
    { id: 'u_4', username: 'tech', nickname: '科技前线', level: 4, signature: '用最简单的方式讲科技', followers: 420, following: 15, likes: 900, avatar: 'u_4', password: '123456' },
    { id: 'u_5', username: 'anime', nickname: '手绘动画社', level: 4, signature: '一帧一帧画给你看', followers: 260, following: 9, likes: 800, avatar: 'u_5', password: '123456' },
    { id: 'u_6', username: 'life', nickname: '生活日记本', level: 3, signature: '记录平凡日子里的闪光', followers: 188, following: 6, likes: 460, avatar: 'u_6', password: '123456' },
    { id: 'u_7', username: 'knowledge', nickname: '知识胶囊', level: 4, signature: '三分钟涨一个知识点', followers: 350, following: 11, likes: 700, avatar: 'u_7', password: '123456' },
    { id: 'u_8', username: 'food', nickname: '美食猎人', level: 3, signature: '好吃的东西值得被记录', followers: 150, following: 5, likes: 520, avatar: 'u_8', password: '123456' },
    { id: 'u_demo', username: 'demo', nickname: '新同学', level: 2, signature: '欢迎来到 BiliLite', followers: 36, following: 12, likes: 128, avatar: 'u_demo', password: '123456' }
  ];

  var MOCK_VIDEO_ROWS = [
    ['v_1', '【4K修复】三个镜头，讲透一部电影的开场', 'u_2', '影视', 734, 1286400, 86200, 24100, 3180, 9200, 26, '我们请来了三位剪辑师，用三个镜头拆解开场调度，看完你再看任何电影都会多一层理解。', '#2b2d42', '#4a4e69'],
    ['v_2', '十年之后重听《晴天》，你听出什么了吗', 'u_2', '音乐', 486, 986000, 64300, 15800, 2260, 12400, 48, '有些歌只是陪伴，有些歌是青春本身。这一期我们聊重听的意义。', '#3a2c4a', '#6b5b95'],
    ['v_3', '这波操作我给满分！名场面逐帧复盘', 'u_3', '游戏', 613, 1520400, 92400, 27600, 4120, 15600, 30, '这一次我们把节奏、站位、决策全部拆开，看看高手是怎么思考的。', '#1f3a5f', '#2c5f8a'],
    ['v_4', '手机摄影进阶：从构图到色彩，一次讲清', 'u_4', '科技', 528, 452000, 31500, 8200, 1580, 4300, 52, '不需要昂贵的设备，构图与调色才是分水岭，附赠实用参数表。', '#264653', '#3d6b74'],
    ['v_5', '手绘一只会飞的猫，全过程没有一笔擦掉', 'u_5', '动画', 372, 386000, 45200, 9600, 2240, 6800, 72, '从铅笔稿到成稿一共 11 小时，完整记录一只猫诞生记。', '#4a3f6b', '#7b6ca8'],
    ['v_6', '一个人的深夜食堂，简单又好吃的拌面', 'u_8', '美食', 298, 274000, 23800, 5400, 1720, 2600, 74, '十分钟做一碗面，厨房新手也不会翻车。', '#4a3730', '#8a6a5a'],
    ['v_7', '十分钟讲明白「复利」到底是个什么东西', 'u_7', '知识', 604, 512000, 38900, 11200, 2180, 5100, 96, '不聊玄学，只用最朴素的方式算一遍给你看。', '#33415e', '#5b6b8c'],
    ['v_8', '在城市最高点看日出，值了', 'u_6', '生活', 421, 168000, 15400, 3200, 980, 1900, 120, '四点半起床，爬二十八层楼，值当。', '#485563', '#7b8794'],
    ['v_9', '开箱！这台复古游戏机也太好玩了', 'u_3', '游戏', 517, 736000, 51200, 13900, 2960, 8300, 50, '开机那一声「滴」，是很多人的青春开关。', '#1d3557', '#457b9d'],
    ['v_10', '用脚本爬取自己的听歌记录，折腾一整晚', 'u_4', '科技', 892, 342000, 22700, 6800, 1340, 3700, 140, '从零到一的完整过程，附带可复用的思路。', '#2f3e46', '#52616b'],
    ['v_11', '钢琴改编版《起风了》，越听越上头', 'u_2', '音乐', 447, 1210000, 89300, 26400, 5240, 18700, 70, '把一段旋律拆成三个层次，重新铺一遍。', '#3b2f45', '#6d597a'],
    ['v_12', '猫咪的一天，用镜头记录 30 分钟', 'u_5', '动画', 1832, 486000, 37600, 8100, 2050, 4900, 98, '一只猫、三个纸箱、无限循环。', '#4c3b47', '#8a6274'],
    ['v_13', '徒步 20 公里，我在山里看了一场雾', 'u_6', '生活', 962, 218000, 19300, 4100, 1120, 2300, 160, '走过的路不会白走，看过的雾也是。', '#2f4034', '#5d7461'],
    ['v_16', '一碗牛肉面的十二种做法，总有一种适合你', 'u_8', '美食', 742, 632000, 46500, 12300, 2740, 7100, 92, '从汤底到配菜，一次讲透。', '#41352c', '#7f6552'],
    ['v_20', '我用一周时间戒掉了短视频', 'u_6', '生活', 688, 892000, 73600, 18800, 5820, 13400, 66, '不是失败记录，是一份可复制的实验报告。', '#3d3a35', '#787164']
  ];

  var MOCK_COMMENT_ROWS = [
    ['c_1', 'v_1', 'u_6', '第三个镜头的调度太舒服了，看完立刻想重看一遍原片。', 32, 1800],
    ['c_2', 'v_1', 'u_7', '剪辑思路讲得很清楚，建议出一期完整的后期教程。', 18, 5400],
    ['c_3', 'v_3', 'u_2', '这波真的教科书级别，收藏了。', 26, 1200],
    ['c_4', 'v_3', 'u_8', '评论区比游戏本身还精彩。', 11, 3600],
    ['c_5', 'v_5', 'u_4', '手绘过程太治愈了，一帧一帧看完全不腻。', 24, 900],
    ['c_6', 'v_7', 'u_3', '终于有人把复利讲人话了。', 40, 7200],
    ['c_7', 'v_7', 'u_6', '算完突然想赶紧开始存钱了。', 15, 4800],
    ['c_8', 'v_11', 'u_1', '钢琴版比原唱更有味道了。', 21, 2400],
    ['c_9', 'v_11', 'u_5', '求一份钢琴谱！', 8, 600],
    ['c_10', 'v_16', 'u_2', '汤底才是灵魂，记下了。', 13, 1500],
    ['c_11', 'v_20', 'u_7', '这条视频说出了我的心声，第七天最难熬。', 29, 300],
    ['c_12', 'v_13', 'u_3', '山里的雾拍得太有氛围感了。', 17, 4200]
  ];

  var MOCK_MESSAGE_ROWS = [
    ['m_1', 'notice', 'u_2', '音乐播放器 更新了投稿', '《十年之后重听晴天》已更新，欢迎来听。', 600],
    ['m_2', 'notice', 'u_3', '游戏解说君 更新了投稿', '名场面逐帧复盘第二期上线了。', 3600],
    ['m_3', 'dm', 'u_6', '生活日记本', '你好，明天想约个时间一起爬山吗？', 7200],
    ['m_4', 'system', 'u_1', '系统公告', 'BiliLite 移动端新版上线，欢迎反馈使用体验。', 86400],
    ['m_5', 'notice', 'u_7', '知识胶囊 更新了投稿', '三分钟讲明白复利，已发布。', 172800],
    ['m_6', 'dm', 'u_5', '手绘动画社', '上一张线稿的授权已经发你邮箱了，注意查收。', 259200],
    ['m_7', 'system', 'u_1', '账号安全提醒', '你的账号最近在新设备上登录，如非本人操作请及时修改密码。', 345600],
    ['m_8', 'notice', 'u_8', '美食猎人 更新了投稿', '牛肉面的十二种做法，附赠配方表。', 432000]
  ];

  function mockCopy(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  function mockNow() {
    return Math.floor(Date.now() / 1000);
  }

  function mockUserByName(state, username) {
    var found = null;
    (state.users || []).forEach(function (row) {
      if (row.username === username) {
        found = row;
      }
    });
    return found;
  }

  function mockUserById(state, id) {
    var found = null;
    (state.users || []).forEach(function (row) {
      if (row.id === id) {
        found = row;
      }
    });
    return found;
  }

  function mockCurrentUser(state) {
    if (!state.session) {
      return null;
    }
    return mockUserById(state, state.session.uid);
  }

  function mockPublicUser(user) {
    if (!user) {
      return null;
    }
    return {
      id: user.id,
      username: user.username,
      nickname: user.nickname,
      level: user.level,
      signature: user.signature || '',
      avatar: user.avatar || user.id,
      created_at: user.created_at || 0,
      following: user.following || 0,
      followers: user.followers || 0,
      likes: user.likes || 0
    };
  }

  function mockState() {
    var state = null;
    try {
      state = JSON.parse(global.localStorage.getItem('bili_mock_state') || 'null');
    } catch (e) {
      state = null;
    }
    if (!state || typeof state !== 'object') {
      state = {
        users: mockCopy(MOCK_USERS),
        videos: [],
        comments: [],
        messages: [],
        session: null,
        favorites: [],
        history: [],
        likes: [],
        coins: [],
        follows: [],
        watch_later: [],
        read: [],
        searches: []
      };
      var base = mockNow();
      state.videos = MOCK_VIDEO_ROWS.map(function (row) {
        var up = mockUserById(state, row[2]) || MOCK_USERS[0];
        return {
          id: row[0],
          title: row[1],
          uid: row[2],
          cat: row[3],
          duration: row[4],
          views: row[5],
          likes: row[6],
          coins: row[7],
          favorites: row[8],
          danmaku: row[9],
          desc: row[11],
          cover_a: row[12],
          cover_b: row[13],
          tags: [row[3], '精选', '推荐'],
          comments: 0,
          published_at: base - row[10] * 3600,
          up_name: up.nickname,
          up_avatar: up.avatar
        };
      });
      state.comments = MOCK_COMMENT_ROWS.map(function (row) {
        return {
          id: row[0],
          vid: row[1],
          uid: row[2],
          content: row[3],
          likes: row[4],
          created_at: base - row[5]
        };
      });
      state.messages = MOCK_MESSAGE_ROWS.map(function (row) {
        return {
          id: row[0],
          uid: 'all',
          type: row[1],
          from_uid: row[2],
          title: row[3],
          content: row[4],
          created_at: base - row[5]
        };
      });
      mockSave(state);
    }
    return state;
  }

  function mockSave(state) {
    try {
      global.localStorage.setItem('bili_mock_state', JSON.stringify(state));
    } catch (e) {
      /* 忽略存储异常 */
    }
  }

  function mockVideos(state) {
    if (!state.videos || !state.videos.length) {
      var base = mockNow();
      state.videos = MOCK_VIDEO_ROWS.map(function (row) {
        var up = mockUserById(state, row[2]) || MOCK_USERS[0];
        return {
          id: row[0],
          title: row[1],
          uid: row[2],
          cat: row[3],
          duration: row[4],
          views: row[5],
          likes: row[6],
          coins: row[7],
          favorites: row[8],
          danmaku: row[9],
          desc: row[11],
          cover_a: row[12],
          cover_b: row[13],
          tags: [row[3], '精选', '推荐'],
          comments: 0,
          published_at: base - row[10] * 3600,
          up_name: up.nickname,
          up_avatar: up.avatar
        };
      });
    }
    return state.videos;
  }

  function mockVideoItem(video) {
    return {
      id: video.id,
      title: video.title,
      desc: video.desc || '',
      cat: video.cat || '',
      tags: video.tags || [],
      duration: video.duration || 0,
      views: video.views || 0,
      likes: video.likes || 0,
      coins: video.coins || 0,
      favorites: video.favorites || 0,
      danmaku: video.danmaku || 0,
      comments: video.comments || 0,
      cover_a: video.cover_a || '#3a3550',
      cover_b: video.cover_b || '#6d6390',
      published_at: video.published_at || 0,
      up_id: video.uid || '',
      up_name: video.up_name || '未知UP主',
      up_avatar: video.up_avatar || video.uid || ''
    };
  }

  function mockFindVideo(state, id) {
    var found = null;
    mockVideos(state).forEach(function (video) {
      if (video.id === id) {
        found = video;
      }
    });
    return found;
  }

  function mockPickVideos(state, ids) {
    var items = [];
    ids.forEach(function (id) {
      var video = mockFindVideo(state, id);
      if (video) {
        items.push(mockVideoItem(video));
      }
    });
    return items;
  }

  function mockError(msg, code) {
    var err = new Error(msg);
    err.code = code || 400;
    return err;
  }

  function mockHotScore(video) {
    var ageDays = Math.max(0, (mockNow() - (video.published_at || mockNow())) / 86400);
    return (video.views || 0) * 0.25 + (video.likes || 0) * 3.5 + (video.coins || 0) * 9 +
      (video.favorites || 0) * 6 + (30 - Math.min(ageDays, 30)) * 40;
  }

  function mockRequest(file, action, params, method) {
    var state = mockState();
    var p = params || {};

    if (file === 'auth') {
      if (action === 'me') {
        var me = mockCurrentUser(state);
        return { logged_in: !!me, user: me ? mockPublicUser(me) : null };
      }
      if (action === 'register') {
        var username = String(p.username || '').trim();
        var password = String(p.password || '');
        var confirm = p.confirm === undefined ? password : String(p.confirm);
        var nickname = String(p.nickname || '').trim();
        if (!username) {
          throw mockError('请输入账号', 4001);
        }
        if (username.length < 2 || username.length > 16) {
          throw mockError('账号长度需为 2-16 位', 4002);
        }
        if (password.length < 6) {
          throw mockError('密码长度不能少于 6 位', 4003);
        }
        if (password !== confirm) {
          throw mockError('两次输入的密码不一致', 4004);
        }
        if (mockUserByName(state, username)) {
          throw mockError('该账号已被注册，换一个试试', 4005);
        }
        var uid = 'u_' + Math.random().toString(36).slice(2, 10);
        var user = {
          id: uid,
          username: username,
          nickname: nickname || username,
          password: password,
          level: 2,
          signature: '这个人很懒，什么都没写',
          avatar: uid,
          following: 0,
          followers: 0,
          likes: 0,
          created_at: mockNow()
        };
        state.users.push(user);
        state.session = { uid: uid };
        mockSave(state);
        return mockPublicUser(user);
      }
      if (action === 'login') {
        var name = String(p.username || '').trim();
        var pass = String(p.password || '');
        if (!name || !pass) {
          throw mockError('请输入账号和密码', 4001);
        }
        var target = mockUserByName(state, name);
        if (!target || target.password !== pass) {
          throw mockError('账号或密码错误，请重新输入', 4002);
        }
        state.session = { uid: target.id };
        mockSave(state);
        return mockPublicUser(target);
      }
      if (action === 'logout') {
        state.session = null;
        mockSave(state);
        return null;
      }
    }

    if (file === 'videos') {
      if (action === 'channels') {
        return {
          channels: [
            { key: 'recommend', name: '推荐' },
            { key: 'latest', name: '动态' },
            { key: 'rank', name: '排行榜' }
          ],
          categories: ['动画', '音乐', '游戏', '科技', '生活', '知识', '影视', '美食']
        };
      }
      if (action === 'list') {
        var channel = p.channel || 'recommend';
        var cat = p.cat || '';
        var page = Math.max(1, parseInt(p.page || 1, 10));
        var limit = Math.max(1, parseInt(p.page_size || 10, 10));
        var list = mockVideos(state).slice();
        if (channel === 'cat') {
          list = list.filter(function (video) {
            return video.cat === cat;
          });
        }
        if (channel === 'latest') {
          list.sort(function (a, b) {
            return b.published_at - a.published_at;
          });
        } else {
          list.sort(function (a, b) {
            return mockHotScore(b) - mockHotScore(a);
          });
        }
        var slice = list.slice((page - 1) * limit, page * limit);
        var items = slice.map(function (video, index) {
          var item = mockVideoItem(video);
          if (channel === 'rank') {
            item.rank = (page - 1) * limit + index + 1;
          }
          return item;
        });
        return {
          items: items,
          page: page,
          page_size: limit,
          total: list.length,
          has_more: page * limit < list.length,
          channel: channel,
          cat: cat
        };
      }
      if (action === 'publish') {
        var author = mockCurrentUser(state);
        if (!author) {
          throw mockError('请先登录后再试', 401);
        }
        var title = String(p.title || '').trim();
        if (title.length < 2 || title.length > 60) {
          throw mockError('标题长度需为 2-60 个字', 4001);
        }
        var vid = 'v_' + Math.random().toString(36).slice(2, 10);
        var video = {
          id: vid,
          title: title,
          uid: author.id,
          cat: p.cat || '生活',
          tags: [p.cat || '生活', '自制'],
          duration: 60,
          views: 0,
          likes: 0,
          coins: 0,
          favorites: 0,
          danmaku: 0,
          comments: 0,
          desc: String(p.desc || ''),
          cover_a: p.cover_a || '#3a3550',
          cover_b: p.cover_b || '#6d6390',
          published_at: mockNow(),
          up_name: author.nickname,
          up_avatar: author.avatar
        };
        mockVideos(state).push(video);
        mockSave(state);
        return { id: vid, video: mockVideoItem(video) };
      }
    }

    if (file === 'search') {
      if (action === 'search') {
        var keyword = String(p.q || p.keyword || '').trim();
        if (!keyword) {
          throw mockError('请输入搜索关键词', 4001);
        }
        var needle = keyword.toLowerCase();
        var results = [];
        mockVideos(state).forEach(function (video) {
          var score = 0;
          if (String(video.title || '').toLowerCase().indexOf(needle) >= 0) {
            score += 10;
          }
          if (String(video.desc || '').toLowerCase().indexOf(needle) >= 0) {
            score += 4;
          }
          if ((video.tags || []).join(',').toLowerCase().indexOf(needle) >= 0) {
            score += 6;
          }
          if (String(video.up_name || '').toLowerCase().indexOf(needle) >= 0) {
            score += 3;
          }
          if (score > 0) {
            var item = mockVideoItem(video);
            item.score = score;
            results.push(item);
          }
        });
        results.sort(function (a, b) {
          return (b.score - a.score) || (b.views - a.views);
        });
        return { keyword: keyword, items: results, total: results.length, page: 1, has_more: false };
      }
      if (action === 'hot') {
        return {
          items: ['推荐', '钢琴', '复利', '开箱', '游戏实况', '深夜电台', '手绘', '摄影', '徒步', '牛肉面']
            .map(function (word) {
              return { word: word, count: 1 };
            })
        };
      }
      if (action === 'history') {
        var rows = (state.searches || []).slice().sort(function (a, b) {
          return b.created_at - a.created_at;
        });
        return { items: rows.slice(0, 20) };
      }
      if (action === 'history_add') {
        var word = String(p.word || p.q || '').trim();
        if (!word) {
          throw mockError('搜索词不能为空', 4001);
        }
        state.searches = (state.searches || []).filter(function (row) {
          return row.word !== word;
        });
        state.searches.unshift({ word: word, created_at: mockNow() });
        state.searches = state.searches.slice(0, 20);
        mockSave(state);
        return { saved: true };
      }
      if (action === 'history_clear') {
        state.searches = [];
        mockSave(state);
        return { cleared: true };
      }
    }

    if (file === 'messages') {
      var reader = mockCurrentUser(state);
      var readerId = reader ? reader.id : 'guest';
      var readMap = {};
      (state.read || []).forEach(function (key) {
        readMap[key] = true;
      });
      if (action === 'list') {
        var type = p.type || 'all';
        var msgRows = (state.messages || []).filter(function (row) {
          return type === 'all' || row.type === type;
        });
        msgRows.sort(function (a, b) {
          return b.created_at - a.created_at;
        });
        var msgPage = Math.max(1, parseInt(p.page || 1, 10));
        var msgLimit = Math.max(1, parseInt(p.page_size || 15, 10));
        var msgSlice = msgRows.slice((msgPage - 1) * msgLimit, msgPage * msgLimit);
        return {
          items: msgSlice.map(function (row) {
            var from = mockUserById(state, row.from_uid) || {};
            return {
              id: row.id,
              type: row.type,
              title: row.title,
              content: row.content,
              created_at: row.created_at,
              unread: !readMap[readerId + '_' + row.id],
              from_name: from.nickname || '系统',
              from_avatar: from.avatar || row.from_uid
            };
          }),
          total: msgRows.length,
          page: msgPage,
          has_more: msgPage * msgLimit < msgRows.length
        };
      }
      if (action === 'unread') {
        var counts = { total: 0, notice: 0, dm: 0, system: 0 };
        (state.messages || []).forEach(function (row) {
          if (readMap[readerId + '_' + row.id]) {
            return;
          }
          counts.total += 1;
          if (counts[row.type] !== undefined) {
            counts[row.type] += 1;
          }
        });
        return counts;
      }
      if (action === 'read') {
        var mid = String(p.id || '');
        if (!mid) {
          throw mockError('缺少消息 ID', 4001);
        }
        var readKey = readerId + '_' + mid;
        if (state.read.indexOf(readKey) < 0) {
          state.read.push(readKey);
          mockSave(state);
        }
        return { id: mid };
      }
      if (action === 'read_all') {
        (state.messages || []).forEach(function (row) {
          var key = readerId + '_' + row.id;
          if (state.read.indexOf(key) < 0) {
            state.read.push(key);
          }
        });
        mockSave(state);
        return { cleared: true };
      }
    }

    if (file === 'user') {
      var current = mockCurrentUser(state);
      if (!current) {
        throw mockError('请先登录后再试', 401);
      }
      var myVideos = mockVideos(state).filter(function (video) {
        return video.uid === current.id;
      });
      var stats = {
        following: (state.follows || []).filter(function (row) { return row.uid === current.id; }).length,
        followers: (state.follows || []).filter(function (row) { return row.target_id === current.id; }).length,
        likes: myVideos.reduce(function (sum, video) { return sum + (video.likes || 0); }, 0),
        coins: (state.coins || []).filter(function (row) { return row.uid === current.id; }).length,
        videos: myVideos.length
      };
      if (action === 'profile') {
        var profile = mockPublicUser(current);
        profile.stats = stats;
        return { user: profile, stats: stats };
      }
      if (action === 'stats') {
        return stats;
      }
      if (action === 'favorites') {
        var favIds = (state.favorites || []).filter(function (row) {
          return row.uid === current.id;
        }).map(function (row) { return row.vid; });
        return { items: mockPickVideos(state, favIds), total: favIds.length };
      }
      if (action === 'history') {
        var historyRows = (state.history || []).filter(function (row) {
          return row.uid === current.id;
        }).sort(function (a, b) {
          return b.updated_at - a.updated_at;
        });
        var historyIds = historyRows.map(function (row) { return row.vid; });
        return { items: mockPickVideos(state, historyIds), total: historyIds.length };
      }
      if (action === 'videos') {
        var mine = myVideos.slice().sort(function (a, b) {
          return b.published_at - a.published_at;
        });
        return { items: mine.map(mockVideoItem), total: mine.length };
      }
      if (action === 'watch_later') {
        var laterIds = (state.watch_later || []).filter(function (row) {
          return row.uid === current.id;
        }).map(function (row) { return row.vid; });
        return { items: mockPickVideos(state, laterIds), total: laterIds.length };
      }
      if (action === 'following') {
        var followIds = (state.follows || []).filter(function (row) {
          return row.uid === current.id;
        }).map(function (row) { return mockPublicUser(mockUserById(state, row.target_id)); });
        return { items: followIds.filter(Boolean), total: followIds.length };
      }
    }

    if (file === 'video') {
      var targetId = String(p.id || p.vid || '');
      var video = mockFindVideo(state, targetId);
      if (action === 'detail') {
        if (!video) {
          throw mockError('视频不存在或已下架', 404);
        }
        var owner = mockCurrentUser(state);
        var stateFlags = {
          favorited: !!(owner && (state.favorites || []).some(function (row) {
            return row.uid === owner.id && row.vid === video.id;
          })),
          liked: !!(owner && (state.likes || []).some(function (row) {
            return row.uid === owner.id && row.vid === video.id;
          })),
          watched: !!(owner && (state.history || []).some(function (row) {
            return row.uid === owner.id && row.vid === video.id;
          }))
        };
        var followed = !!(owner && (state.follows || []).some(function (row) {
          return row.uid === owner.id && row.target_id === video.uid;
        }));
        return {
          video: mockVideoItem(video),
          up: mockPublicUser(mockUserById(state, video.uid)),
          state: stateFlags,
          followed: followed,
          comments_count: video.comments || 0
        };
      }
      if (action === 'related') {
        if (!video) {
          throw mockError('视频不存在或已下架', 404);
        }
        var others = mockVideos(state).filter(function (item) {
          return item.id !== video.id;
        });
        others.sort(function (a, b) {
          return (b.likes || 0) - (a.likes || 0);
        });
        return { items: others.slice(0, 6).map(mockVideoItem) };
      }
      if (action === 'comments') {
        var commentRows = (state.comments || []).filter(function (row) {
          return row.vid === targetId;
        }).sort(function (a, b) {
          return b.created_at - a.created_at;
        });
        return {
          items: commentRows.map(function (row) {
            var author = mockUserById(state, row.uid) || {};
            return {
              id: row.id,
              content: row.content,
              likes: row.likes || 0,
              created_at: row.created_at,
              up_name: author.nickname || '游客用户',
              up_avatar: author.avatar || row.uid
            };
          }),
          total: commentRows.length,
          page: 1,
          has_more: false
        };
      }
      if (action === 'comment') {
        var content = String(p.content || '').trim();
        if (!video) {
          throw mockError('视频不存在或已下架', 404);
        }
        if (!content) {
          throw mockError('评论内容不能为空', 4002);
        }
        if (content.length > 200) {
          throw mockError('评论内容不能超过 200 字', 4003);
        }
        var cid = 'c_' + Math.random().toString(36).slice(2, 10);
        var author2 = mockCurrentUser(state);
        state.comments.push({
          id: cid,
          vid: targetId,
          uid: author2 ? author2.id : 'guest',
          content: content,
          likes: 0,
          created_at: mockNow()
        });
        video.comments = (video.comments || 0) + 1;
        mockSave(state);
        return {
          id: cid,
          content: content,
          likes: 0,
          created_at: mockNow(),
          up_name: author2 ? author2.nickname : '游客用户',
          up_avatar: author2 ? author2.avatar : 'guest'
        };
      }
      if (action === 'report') {
        if (video) {
          video.views = (video.views || 0) + 1;
        }
        var watcher = mockCurrentUser(state);
        if (watcher && video) {
          var existing = null;
          (state.history || []).forEach(function (row) {
            if (row.uid === watcher.id && row.vid === video.id) {
              existing = row;
            }
          });
          if (existing) {
            existing.progress = p.duration || 0;
            existing.updated_at = mockNow();
          } else {
            state.history.push({
              id: 'h_' + Math.random().toString(36).slice(2, 10),
              uid: watcher.id,
              vid: video.id,
              progress: p.duration || 0,
              created_at: mockNow(),
              updated_at: mockNow()
            });
          }
        }
        mockSave(state);
        return { views: video ? video.views : 0, recorded: !!watcher };
      }
    }

    if (file === 'interact') {
      var actor = mockCurrentUser(state);
      if (!actor) {
        throw mockError('请先登录后再试', 401);
      }
      var vid = String(p.id || '');
      var targetVideo = mockFindVideo(state, vid);
      if (!targetVideo) {
        throw mockError('视频不存在或已下架', 404);
      }
      if (action === 'favorite') {
        var index = -1;
        (state.favorites || []).forEach(function (row, i) {
          if (row.uid === actor.id && row.vid === vid) {
            index = i;
          }
        });
        if (index >= 0) {
          state.favorites.splice(index, 1);
          targetVideo.favorites = Math.max(0, (targetVideo.favorites || 0) - 1);
          mockSave(state);
          return { favorited: false, count: targetVideo.favorites };
        }
        state.favorites.push({
          id: 'f_' + Math.random().toString(36).slice(2, 10),
          uid: actor.id,
          vid: vid,
          created_at: mockNow()
        });
        targetVideo.favorites = (targetVideo.favorites || 0) + 1;
        mockSave(state);
        return { favorited: true, count: targetVideo.favorites };
      }
      if (action === 'like') {
        var likeIndex = -1;
        (state.likes || []).forEach(function (row, i) {
          if (row.uid === actor.id && row.vid === vid) {
            likeIndex = i;
          }
        });
        if (likeIndex >= 0) {
          state.likes.splice(likeIndex, 1);
          targetVideo.likes = Math.max(0, (targetVideo.likes || 0) - 1);
          mockSave(state);
          return { liked: false, count: targetVideo.likes };
        }
        state.likes.push({
          id: 'l_' + Math.random().toString(36).slice(2, 10),
          uid: actor.id,
          vid: vid,
          created_at: mockNow()
        });
        targetVideo.likes = (targetVideo.likes || 0) + 1;
        mockSave(state);
        return { liked: true, count: targetVideo.likes };
      }
      if (action === 'coin') {
        var hasCoin = (state.coins || []).some(function (row) {
          return row.uid === actor.id && row.vid === vid;
        });
        if (hasCoin) {
          throw mockError('本视频已投过币啦', 4001);
        }
        state.coins.push({
          id: 'co_' + Math.random().toString(36).slice(2, 10),
          uid: actor.id,
          vid: vid,
          created_at: mockNow()
        });
        targetVideo.coins = (targetVideo.coins || 0) + 1;
        mockSave(state);
        return { count: targetVideo.coins };
      }
      if (action === 'follow') {
        var targetId2 = String(p.target_id || p.uid || '');
        if (!targetId2) {
          throw mockError('缺少目标用户 ID', 4001);
        }
        if (targetId2 === actor.id) {
          throw mockError('不能关注自己', 4002);
        }
        var followIndex = -1;
        (state.follows || []).forEach(function (row, i) {
          if (row.uid === actor.id && row.target_id === targetId2) {
            followIndex = i;
          }
        });
        if (followIndex >= 0) {
          state.follows.splice(followIndex, 1);
          mockSave(state);
          return { followed: false, followers: Math.max(0, (mockUserById(state, targetId2) || {}).followers - 1) };
        }
        state.follows.push({
          id: 'fo_' + Math.random().toString(36).slice(2, 10),
          uid: actor.id,
          target_id: targetId2,
          created_at: mockNow()
        });
        mockSave(state);
        return { followed: true, followers: (mockUserById(state, targetId2) || {}).followers + 1 };
      }
      if (action === 'history') {
        var historyExisting = null;
        (state.history || []).forEach(function (row) {
          if (row.uid === actor.id && row.vid === vid) {
            historyExisting = row;
          }
        });
        if (historyExisting) {
          historyExisting.updated_at = mockNow();
        } else {
          state.history.push({
            id: 'h_' + Math.random().toString(36).slice(2, 10),
            uid: actor.id,
            vid: vid,
            progress: p.progress || 0,
            created_at: mockNow(),
            updated_at: mockNow()
          });
        }
        mockSave(state);
        return { recorded: true };
      }
      if (action === 'watch_later') {
        var laterIndex = -1;
        (state.watch_later || []).forEach(function (row, i) {
          if (row.uid === actor.id && row.vid === vid) {
            laterIndex = i;
          }
        });
        if (laterIndex >= 0) {
          state.watch_later.splice(laterIndex, 1);
          mockSave(state);
          return { saved: false };
        }
        state.watch_later.push({
          id: 'w_' + Math.random().toString(36).slice(2, 10),
          uid: actor.id,
          vid: vid,
          created_at: mockNow()
        });
        mockSave(state);
        return { saved: true };
      }
    }

    throw mockError('不支持的操作：' + action, 404);
  }

  /**
   * 调用后端 JSON 接口
   * @param {string} file  api 下的文件名，不含 .php
   * @param {string} action 动作名
   * @param {object} params 参数
   * @param {string} method GET / POST
   */
  function request(file, action, params, method) {
    if (global.location && global.location.protocol === 'file:') {
      return new Promise(function (resolve, reject) {
        try {
          resolve(mockRequest(file, action, params || {}, method || 'GET'));
        } catch (err) {
          reject(err);
        }
      });
    }
    var url = API_BASE + file + '.php?action=' + encodeURIComponent(action);
    var body = params || {};
    var opt = { method: method || 'GET', credentials: 'same-origin', headers: {} };

    if (opt.method === 'POST') {
      opt.headers['Content-Type'] = 'application/json';
      opt.body = JSON.stringify(body);
    } else {
      var qsStr = Object.keys(body)
        .filter(function (k) {
          return body[k] !== undefined && body[k] !== null && body[k] !== '';
        })
        .map(function (k) {
          return encodeURIComponent(k) + '=' + encodeURIComponent(body[k]);
        })
        .join('&');
      if (qsStr) {
        url += '&' + qsStr;
      }
    }

    return fetch(url, opt)
      .then(function (res) {
        return res.text();
      })
      .then(function (text) {
        var json;
        try {
          json = JSON.parse(text);
        } catch (e) {
          throw new Error('服务返回了非 JSON 数据，请确认 api 目录已完整上传');
        }
        if (!json || typeof json.code === 'undefined') {
          throw new Error('服务返回格式异常');
        }
        if (json.code !== 0) {
          var err = new Error(json.msg || '请求失败');
          err.code = json.code;
          throw err;
        }
        return json.data;
      });
  }

  /* ------------------------------------------------------------------ */
  /* 登录态                                                              */
  /* ------------------------------------------------------------------ */

  function getUser() {
    try {
      var raw = global.localStorage.getItem(USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function setUser(user) {
    try {
      if (user) {
        global.localStorage.setItem(USER_KEY, JSON.stringify(user));
      } else {
        global.localStorage.removeItem(USER_KEY);
      }
    } catch (e) {
      /* 忽略存储异常 */
    }
  }

  function isLoggedIn() {
    return !!getUser();
  }

  function requireLogin(message) {
    if (isLoggedIn()) {
      return true;
    }
    toast(message || '请先登录');
    setTimeout(function () {
      global.location.href = 'login.html?redirect=' + encodeURIComponent(global.location.pathname + global.location.search);
    }, 900);
    return false;
  }

  /* ------------------------------------------------------------------ */
  /* 资源地址                                                            */
  /* ------------------------------------------------------------------ */

  function isFileProtocol() {
    return !!(global.location && global.location.protocol === 'file:');
  }

  /** 本地离线预览时用内联 SVG 生成封面，避免 file:// 下无法加载 PHP 图片 */
  function inlineCover(video) {
    var title = String((video && video.title) || 'BiliLite');
    var a = ((video && video.cover_a) || '#3a3550');
    var b = ((video && video.cover_b) || '#6d6390');
    var short = title.length > 12 ? title.slice(0, 12) : title;
    var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360" viewBox="0 0 640 360">' +
      '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">' +
      '<stop offset="0%" stop-color="' + a + '"/><stop offset="100%" stop-color="' + b + '"/>' +
      '</linearGradient></defs>' +
      '<rect width="640" height="360" fill="url(#g)"/>' +
      '<text x="40" y="196" font-family="PingFang SC,Microsoft YaHei,system-ui,sans-serif" font-size="34" font-weight="600" fill="#ffffff">' +
      escapeHtml(short) + '</text>' +
      '<rect y="354" width="640" height="6" fill="#FB7299"/></svg>';
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  }

  /** 本地离线预览时用内联 SVG 生成头像 */
  function inlineAvatar(user) {
    var name = String((user && (user.nickname || user.name)) || 'B').slice(0, 1);
    var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96">' +
      '<rect width="96" height="96" rx="48" fill="#FB7299"/>' +
      '<text x="48" y="48" dy="0.36em" text-anchor="middle" font-family="PingFang SC,Microsoft YaHei,system-ui,sans-serif" ' +
      'font-size="42" font-weight="600" fill="#ffffff">' + escapeHtml(name) + '</text></svg>';
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  }

  function coverUrl(video) {
    if (isFileProtocol()) {
      return inlineCover(video);
    }
    var id = encodeURIComponent((video && video.id) || '');
    var a = encodeURIComponent(((video && video.cover_a) || '#3a3550').replace('#', '%23'));
    var b = encodeURIComponent(((video && video.cover_b) || '#6d6390').replace('#', '%23'));
    return API_BASE + 'cover.php?id=' + id + '&a=' + a + '&b=' + b;
  }

  function avatarUrl(user) {
    if (isFileProtocol()) {
      return inlineAvatar(user);
    }
    var id = encodeURIComponent((user && (user.avatar || user.id)) || '');
    var name = encodeURIComponent((user && user.nickname) || '');
    return API_BASE + 'avatar.php?id=' + id + '&name=' + name;
  }

  /* ------------------------------------------------------------------ */
  /* 提示条                                                              */
  /* ------------------------------------------------------------------ */

  var toastTimer = null;

  function toast(msg) {
    var el = qs('.toast');
    if (!el) {
      el = document.createElement('div');
      el.className = 'toast';
      el.setAttribute('role', 'status');
      document.body.appendChild(el);
    }
    el.textContent = msg;
    // 强制重排以便连续触发时过渡生效
    void el.offsetWidth;
    el.classList.add('is-show');
    if (toastTimer) {
      global.clearTimeout(toastTimer);
    }
    toastTimer = global.setTimeout(function () {
      el.classList.remove('is-show');
    }, 2000);
  }

  /* ------------------------------------------------------------------ */
  /* 消息角标                                                            */
  /* ------------------------------------------------------------------ */

  function refreshUnread() {
    return request('messages', 'unread')
      .then(function (data) {
        var total = (data && data.total) || 0;
        qsa('[data-unread-badge]').forEach(function (badge) {
          if (total > 0) {
            badge.textContent = total > 99 ? '99+' : String(total);
            badge.removeAttribute('hidden');
          } else {
            badge.setAttribute('hidden', 'hidden');
            badge.textContent = '';
          }
        });
        return total;
      })
      .catch(function () {
        return 0;
      });
  }

  /* ------------------------------------------------------------------ */
  /* 卡片渲染                                                            */
  /* ------------------------------------------------------------------ */

  /** 视频卡片（首页双列流） */
  function videoCard(video, options) {
    var opt = options || {};
    var rank = opt.rank ? '<span class="card__rank">' + escapeHtml(video.rank) + '</span>' : '';
    return (
      '<a class="card" href="video.html?id=' + encodeURIComponent(video.id) + '">' +
        '<span class="card__thumb">' +
          '<img src="' + coverUrl(video) + '" alt="' + escapeHtml(video.title) + '" loading="lazy" />' +
          rank +
          '<span class="card__duration">' + fmtDuration(video.duration) + '</span>' +
        '</span>' +
        '<span class="card__title">' + (opt.keyword ? highlight(video.title, opt.keyword) : escapeHtml(video.title)) + '</span>' +
        '<span class="card__meta">' +
          '<span class="avatar"><img src="' + avatarUrl({ id: video.up_id, avatar: video.up_avatar, nickname: video.up_name }) + '" alt="" /></span>' +
          '<span class="card__up">' + escapeHtml(video.up_name) + '</span>' +
          '<span class="card__views">' + fmtCount(video.views) + '播放</span>' +
        '</span>' +
      '</a>'
    );
  }

  /** 横向列表条目（搜索结果 / 我的历史 / 相关推荐） */
  function videoRow(video, options) {
    var opt = options || {};
    var meta = [
      '<span>' + escapeHtml(video.up_name || '') + '</span>',
      '<span>' + fmtCount(video.views) + '播放</span>'
    ];
    if (opt.time) {
      meta.push('<span>' + escapeHtml(opt.time) + '</span>');
    }
    return (
      '<a class="list__item" href="video.html?id=' + encodeURIComponent(video.id) + '">' +
        '<span class="list__body">' +
          '<span class="list__title">' + (opt.keyword ? highlight(video.title, opt.keyword) : escapeHtml(video.title)) + '</span>' +
          (opt.desc ? '<span class="list__desc">' + escapeHtml(video.desc) + '</span>' : '') +
          '<span class="list__meta">' + meta.join('') + '</span>' +
        '</span>' +
        '<span class="list__side">' +
          '<span class="list__thumb"><img src="' + coverUrl(video) + '" alt="' + escapeHtml(video.title) + '" loading="lazy" /></span>' +
        '</span>' +
      '</a>'
    );
  }

  /* ------------------------------------------------------------------ */
  /* 状态栏时钟                                                          */
  /* ------------------------------------------------------------------ */

  function startClock() {
    var el = qs('[data-clock]');
    if (!el) {
      return;
    }
    function tick() {
      el.textContent = fmtClock(Date.now() / 1000);
    }
    tick();
    global.setInterval(tick, 20000);
  }

  /* ------------------------------------------------------------------ */
  /* 底部导航高亮                                                        */
  /* ------------------------------------------------------------------ */

  function markActiveNav() {
    var page = document.body.getAttribute('data-page');
    qsa('.tabbar__item[data-nav]').forEach(function (item) {
      if (item.getAttribute('data-nav') === page) {
        item.classList.add('is-active');
        item.setAttribute('aria-current', 'page');
      }
    });
  }

  /* ------------------------------------------------------------------ */
  /* 导出                                                                */
  /* ------------------------------------------------------------------ */

  global.Bili = {
    API_BASE: API_BASE,
    qs: qs,
    qsa: qsa,
    escapeHtml: escapeHtml,
    highlight: highlight,
    fmtCount: fmtCount,
    fmtDuration: fmtDuration,
    fmtTime: fmtTime,
    fmtClock: fmtClock,
    query: query,
    request: request,
    getUser: getUser,
    setUser: setUser,
    isLoggedIn: isLoggedIn,
    requireLogin: requireLogin,
    coverUrl: coverUrl,
    avatarUrl: avatarUrl,
    toast: toast,
    refreshUnread: refreshUnread,
    videoCard: videoCard,
    videoRow: videoRow,
    startClock: startClock,
    markActiveNav: markActiveNav
  };

  document.addEventListener('DOMContentLoaded', function () {
    startClock();
    markActiveNav();
    refreshUnread();
    syncLoginState();
  });

  /**
   * 与后端会话同步登录态：浏览器本地缓存缺失时也能识别到已登录用户
   */
  function syncLoginState() {
    return request('auth', 'me')
      .then(function (data) {
        if (data && data.logged_in && data.user) {
          setUser(data.user);
        } else if (!data || !data.logged_in) {
          setUser(null);
        }
        return data;
      })
      .catch(function () {
        return null;
      });
  }
})(window);

```

```text
file=assets/js/home.js
/* ==========================================================================
   首页脚本：频道切换、列表加载、触底加载更多、投稿
   ========================================================================== */

(function () {
  'use strict';

  var B = window.Bili;

  var state = {
    channel: 'recommend',
    cat: '',
    page: 1,
    hasMore: true,
    loading: false
  };

  var tabsEl = document.getElementById('channelTabs');
  var gridEl = document.getElementById('videoGrid');
  var loadingEl = document.getElementById('loading');
  var loadMoreEl = document.getElementById('loadMore');
  var emptyEl = document.getElementById('emptyState');
  var sheetEl = document.getElementById('publishSheet');
  var formEl = document.getElementById('publishForm');
  var errorEl = document.getElementById('pubError');
  var submitEl = document.getElementById('pubSubmit');
  var publishBtn = document.getElementById('publishBtn');

  /* ------------------------------------------------------------------ */
  /* 频道导航                                                            */
  /* ------------------------------------------------------------------ */

  function buildTabs(channels, categories) {
    tabsEl.innerHTML = '';
    channels.forEach(function (ch) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'tab' + (ch.key === state.channel ? ' is-active' : '');
      btn.textContent = ch.name;
      btn.setAttribute('data-channel', ch.key);
      btn.addEventListener('click', function () {
        if (state.channel === ch.key) {
          return;
        }
        state.channel = ch.key;
        state.cat = '';
        syncTabs();
        reload();
      });
      tabsEl.appendChild(btn);
    });

    categories.forEach(function (cat) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'tab' + (state.cat === cat ? ' is-active' : '');
      btn.textContent = cat;
      btn.setAttribute('data-cat', cat);
      btn.addEventListener('click', function () {
        if (state.cat === cat) {
          return;
        }
        state.cat = cat;
        state.channel = 'cat';
        syncTabs();
        reload();
      });
      tabsEl.appendChild(btn);
    });
  }

  function syncTabs() {
    B.qsa('.tab', tabsEl).forEach(function (tab) {
      var key = tab.getAttribute('data-channel');
      var cat = tab.getAttribute('data-cat');
      var active = cat ? state.cat === cat : state.channel === key && !state.cat;
      tab.classList.toggle('is-active', active);
    });
  }

  /* ------------------------------------------------------------------ */
  /* 列表渲染                                                            */
  /* ------------------------------------------------------------------ */

  function renderItems(items, append) {
    if (!append) {
      gridEl.innerHTML = '';
    }
    var html = '';
    items.forEach(function (v) {
      html += B.videoCard(v, { rank: v.rank });
    });
    gridEl.insertAdjacentHTML('beforeend', html);
    emptyEl.hidden = items.length > 0 || gridEl.children.length > 0;
  }

  function setLoading(on) {
    state.loading = on;
    loadingEl.hidden = !on;
    loadMoreEl.disabled = on;
    loadMoreEl.textContent = on ? '加载中' : (state.hasMore ? '换一批' : '没有更多了');
  }

  function load() {
    if (state.loading || !state.hasMore) {
      return;
    }
    setLoading(true);
    B.request('videos', 'list', {
      channel: state.channel,
      cat: state.cat,
      page: state.page,
      page_size: 10
    })
      .then(function (data) {
        var items = (data && data.items) || [];
        state.hasMore = !!(data && data.has_more);
        renderItems(items, state.page > 1);
        if (state.page === 1 && items.length === 0) {
          emptyEl.hidden = false;
        }
        if (!state.hasMore) {
          loadMoreEl.textContent = '没有更多了';
        }
      })
      .catch(function (err) {
        B.toast(err.message || '加载失败');
        emptyEl.hidden = false;
      })
      .then(function () {
        setLoading(false);
        loadMoreEl.textContent = state.hasMore ? '换一批' : '没有更多了';
      });
  }

  function reload() {
    state.page = 1;
    state.hasMore = true;
    gridEl.innerHTML = '';
    emptyEl.hidden = true;
    load();
  }

  /* ------------------------------------------------------------------ */
  /* 触底加载                                                            */
  /* ------------------------------------------------------------------ */

  loadMoreEl.addEventListener('click', function () {
    if (state.loading || !state.hasMore) {
      return;
    }
    state.page += 1;
    load();
  });

  function onScroll() {
    if (state.loading || !state.hasMore) {
      return;
    }
    var nearBottom = window.innerHeight + window.scrollY >= document.body.offsetHeight - 320;
    if (nearBottom) {
      state.page += 1;
      load();
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });

  /* ------------------------------------------------------------------ */
  /* 投稿                                                                */
  /* ------------------------------------------------------------------ */

  function openSheet() {
    if (!B.isLoggedIn()) {
      B.requireLogin('登录后即可投稿');
      return;
    }
    sheetEl.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    var titleInput = document.getElementById('pubTitle');
    if (titleInput) {
      titleInput.focus();
    }
  }

  function closeSheet() {
    sheetEl.classList.remove('is-open');
    document.body.style.overflow = '';
  }

  publishBtn.addEventListener('click', openSheet);
  B.qsa('[data-close-sheet]', sheetEl).forEach(function (el) {
    el.addEventListener('click', closeSheet);
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && sheetEl.classList.contains('is-open')) {
      closeSheet();
    }
  });

  formEl.addEventListener('submit', function (e) {
    e.preventDefault();
    errorEl.textContent = '';
    var title = document.getElementById('pubTitle').value.trim();
    var desc = document.getElementById('pubDesc').value.trim();
    var cat = document.getElementById('pubCat').value;
    var colorA = document.getElementById('pubColorA').value;
    var colorB = document.getElementById('pubColorB').value;

    if (title.length < 2) {
      errorEl.textContent = '标题至少需要 2 个字';
      return;
    }
    if (title.length > 60) {
      errorEl.textContent = '标题不能超过 60 个字';
      return;
    }

    submitEl.disabled = true;
    submitEl.textContent = '发布中';

    B.request('videos', 'publish', {
      title: title,
      desc: desc,
      cat: cat,
      cover_a: colorA,
      cover_b: colorB
    }, 'POST')
      .then(function () {
        B.toast('投稿成功，已出现在动态频道');
        formEl.reset();
        closeSheet();
        state.channel = 'latest';
        state.cat = '';
        syncTabs();
        reload();
      })
      .catch(function (err) {
        errorEl.textContent = err.message || '投稿失败，请稍后再试';
      })
      .then(function () {
        submitEl.disabled = false;
        submitEl.textContent = '发布投稿';
      });
  });

  /* ------------------------------------------------------------------ */
  /* 初始化                                                              */
  /* ------------------------------------------------------------------ */

  B.request('videos', 'channels')
    .then(function (data) {
      buildTabs((data && data.channels) || [], (data && data.categories) || []);
      syncTabs();
      load();
    })
    .catch(function (err) {
      B.toast(err.message || '频道加载失败');
      emptyEl.hidden = false;
    });

  // 其他页面通过 index.html#publish 跳回来时，直接打开投稿弹层
  if (window.location.hash === '#publish') {
    window.setTimeout(function () {
      openSheet();
    }, 300);
  }
})();

```

```text
file=assets/js/login.js
/* ==========================================================================
   登录 / 注册页脚本
   ========================================================================== */

(function () {
  'use strict';

  var B = window.Bili;

  var mode = 'login';

  var loginTab = document.getElementById('loginTab');
  var registerTab = document.getElementById('registerTab');
  var form = document.getElementById('authForm');
  var usernameEl = document.getElementById('username');
  var nicknameEl = document.getElementById('nickname');
  var passwordEl = document.getElementById('password');
  var confirmEl = document.getElementById('confirm');
  var nicknameField = document.getElementById('nicknameField');
  var confirmField = document.getElementById('confirmField');
  var errorEl = document.getElementById('formError');
  var submitBtn = document.getElementById('submitBtn');
  var guestLink = document.getElementById('guestLink');
  var forgotLink = document.getElementById('forgotLink');
  var backBtn = document.getElementById('backBtn');

  var redirect = B.query('redirect', '');

  function safeRedirect() {
    if (!redirect) {
      return 'index.html';
    }
    // 仅允许站内相对路径，避免开放重定向
    if (redirect.charAt(0) === '/' || redirect.indexOf('://') !== -1) {
      return 'index.html';
    }
    return redirect;
  }

  function setMode(next) {
    mode = next;
    var isLogin = mode === 'login';
    loginTab.classList.toggle('is-active', isLogin);
    registerTab.classList.toggle('is-active', !isLogin);
    loginTab.setAttribute('aria-selected', isLogin ? 'true' : 'false');
    registerTab.setAttribute('aria-selected', isLogin ? 'false' : 'true');
    nicknameField.hidden = isLogin;
    confirmField.hidden = isLogin;
    submitBtn.textContent = isLogin ? '登 录' : '注 册';
    passwordEl.setAttribute('autocomplete', isLogin ? 'current-password' : 'new-password');
    errorEl.textContent = '';
  }

  loginTab.addEventListener('click', function () {
    setMode('login');
  });

  registerTab.addEventListener('click', function () {
    setMode('register');
  });

  forgotLink.addEventListener('click', function (e) {
    e.preventDefault();
    B.toast('演示环境未提供找回密码功能');
  });

  guestLink.setAttribute('href', safeRedirect());
  backBtn.setAttribute('href', safeRedirect());

  function validate() {
    var username = usernameEl.value.trim();
    var password = passwordEl.value;
    var confirm = confirmEl.value;

    if (!username) {
      return { ok: false, msg: '请输入账号' };
    }
    if (mode === 'register') {
      if (username.length < 2 || username.length > 16) {
        return { ok: false, msg: '账号长度需为 2-16 位' };
      }
      if (!password) {
        return { ok: false, msg: '请输入密码' };
      }
      if (password.length < 6) {
        return { ok: false, msg: '密码长度不能少于 6 位' };
      }
      if (password !== confirm) {
        return { ok: false, msg: '两次输入的密码不一致' };
      }
      return { ok: true, username: username, password: password, confirm: confirm };
    }

    if (!password) {
      return { ok: false, msg: '请输入密码' };
    }
    return { ok: true, username: username, password: password, confirm: confirm };
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    errorEl.textContent = '';

    var result = validate();
    if (!result.ok) {
      errorEl.textContent = result.msg;
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = mode === 'login' ? '登录中' : '注册中';

    var action = mode === 'login' ? 'login' : 'register';
    var payload = {
      username: result.username,
      password: result.password,
      confirm: result.confirm
    };
    if (mode === 'register') {
      payload.nickname = nicknameEl.value.trim();
    }

    B.request('auth', action, payload, 'POST')
      .then(function (user) {
        if (user) {
          B.setUser(user);
        }
        B.toast(mode === 'login' ? '登录成功' : '注册成功，已自动登录');
        window.setTimeout(function () {
          window.location.href = safeRedirect();
        }, 700);
      })
      .catch(function (err) {
        errorEl.textContent = err.message || '操作失败，请稍后再试';
        submitBtn.disabled = false;
        submitBtn.textContent = mode === 'login' ? '登 录' : '注 册';
      });
  });

  setMode('login');
})();

```

```text
file=assets/js/message.js
/* ==========================================================================
   消息页脚本：分段切换、列表加载、未读标记、全部已读
   ========================================================================== */

(function () {
  'use strict';

  var B = window.Bili;

  var state = {
    type: 'notice',
    page: 1,
    hasMore: true,
    loading: false
  };

  var listEl = document.getElementById('messageList');
  var loadingEl = document.getElementById('msgLoading');
  var loadMoreEl = document.getElementById('loadMore');
  var emptyEl = document.getElementById('emptyState');
  var readAllBtn = document.getElementById('readAllBtn');
  var segmentEl = document.getElementById('typeSegment');

  var TYPE_NAMES = {
    notice: '通知',
    dm: '私信',
    system: '系统'
  };

  /* ------------------------------------------------------------------ */
  /* 渲染                                                                */
  /* ------------------------------------------------------------------ */

  function messageRow(item) {
    var unread = item.unread ? '<span class="dot" aria-label="未读"></span>' : '';
    var time = B.fmtTime(item.created_at);
    return (
      '<div class="msg" data-mid="' + B.escapeHtml(item.id) + '" role="button" tabindex="0">' +
        '<span class="avatar">' +
          '<img src="' + B.avatarUrl({ id: item.from_avatar, avatar: item.from_avatar, nickname: item.from_name }) + '" alt="' + B.escapeHtml(item.from_name || '') + '" />' +
        '</span>' +
        '<div class="msg__body">' +
          '<p class="msg__title">' + B.escapeHtml(item.title || TYPE_NAMES[item.type] || '消息') + '</p>' +
          '<p class="msg__content">' + B.escapeHtml(item.content || '') + '</p>' +
          '<div class="msg__meta"><span>' + B.escapeHtml(time) + '</span></div>' +
        '</div>' +
        '<span class="msg__side">' + unread + '</span>' +
      '</div>'
    );
  }

  function render(items, append) {
    if (!append) {
      listEl.innerHTML = '';
    }
    if (!items.length) {
      if (!append) {
        emptyEl.hidden = false;
        listEl.innerHTML = '';
      }
      return;
    }
    var html = '';
    items.forEach(function (item) {
      html += messageRow(item);
    });
    listEl.insertAdjacentHTML('beforeend', html);
    emptyEl.hidden = true;
  }

  /* ------------------------------------------------------------------ */
  /* 加载                                                                */
  /* ------------------------------------------------------------------ */

  function setLoading(on) {
    state.loading = on;
    loadingEl.hidden = !on;
    loadMoreEl.disabled = on;
  }

  function load(append) {
    if (state.loading) {
      return;
    }
    if (!append && !state.hasMore) {
      return;
    }
    setLoading(true);
    B.request('messages', 'list', {
      type: state.type,
      page: state.page,
      page_size: 15
    })
      .then(function (data) {
        var items = (data && data.items) || [];
        state.hasMore = !!(data && data.has_more);
        render(items, !!append);
        loadMoreEl.hidden = !state.hasMore;
        loadMoreEl.textContent = state.hasMore ? '加载更多' : '没有更多了';
      })
      .catch(function (err) {
        B.toast(err.message || '消息加载失败');
        if (!append) {
          emptyEl.hidden = false;
        }
      })
      .then(function () {
        setLoading(false);
      });
  }

  function reload() {
    state.page = 1;
    state.hasMore = true;
    listEl.innerHTML = '';
    emptyEl.hidden = true;
    load(false);
  }

  /* ------------------------------------------------------------------ */
  /* 交互                                                                */
  /* ------------------------------------------------------------------ */

  B.qsa('.segment__item', segmentEl).forEach(function (btn) {
    btn.addEventListener('click', function () {
      var type = btn.getAttribute('data-type');
      if (type === state.type) {
        return;
      }
      state.type = type;
      B.qsa('.segment__item', segmentEl).forEach(function (other) {
        var active = other === btn;
        other.classList.toggle('is-active', active);
        other.setAttribute('aria-pressed', active ? 'true' : 'false');
      });
      reload();
    });
  });

  loadMoreEl.addEventListener('click', function () {
    if (state.loading || !state.hasMore) {
      return;
    }
    state.page += 1;
    load(true);
  });

  window.addEventListener('scroll', function () {
    if (state.loading || !state.hasMore) {
      return;
    }
    if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 260) {
      state.page += 1;
      load(true);
    }
  }, { passive: true });

  /* 单条消息点击后标记为已读 */
  function markRead(row) {
    var mid = row.getAttribute('data-mid');
    if (!mid || row.getAttribute('data-read') === '1') {
      return;
    }
    row.setAttribute('data-read', '1');
    var dot = row.querySelector('.dot');
    if (dot && dot.parentNode) {
      dot.parentNode.removeChild(dot);
    }
    if (!B.isLoggedIn()) {
      return;
    }
    B.request('messages', 'read', { id: mid }, 'POST')
      .then(function () {
        B.refreshUnread();
      })
      .catch(function () { /* 静默处理 */ });
  }

  listEl.addEventListener('click', function (e) {
    var row = e.target.closest ? e.target.closest('.msg') : null;
    if (row) {
      markRead(row);
    }
  });

  listEl.addEventListener('keydown', function (e) {
    if (e.key !== 'Enter' && e.key !== ' ') {
      return;
    }
    var row = e.target.closest ? e.target.closest('.msg') : null;
    if (row) {
      e.preventDefault();
      markRead(row);
    }
  });

  readAllBtn.addEventListener('click', function () {
    if (!B.isLoggedIn()) {
      B.requireLogin('登录后可以查看和标记私信');
      return;
    }
    readAllBtn.disabled = true;
    readAllBtn.textContent = '处理中';
    B.request('messages', 'read_all', {}, 'POST')
      .then(function () {
        B.toast('全部消息已读');
        reload();
        return B.refreshUnread();
      })
      .catch(function (err) {
        B.toast(err.message || '操作失败，请稍后再试');
      })
      .then(function () {
        readAllBtn.disabled = false;
        readAllBtn.textContent = '全部已读';
      });
  });

  /* ------------------------------------------------------------------ */
  /* 初始化                                                              */
  /* ------------------------------------------------------------------ */

  reload();
})();

```

```text
file=assets/js/mine.js
/* ==========================================================================
   我的页面脚本：资料卡、入口宫格、收藏 / 稍后再看 / 历史 / 投稿列表
   ========================================================================== */

(function () {
  'use strict';

  var B = window.Bili;

  var profileCard = document.getElementById('profileCard');
  var loginHint = document.getElementById('loginHint');
  var entriesEl = document.getElementById('entries');
  var listSection = document.getElementById('listSection');
  var listTitle = document.getElementById('listTitle');
  var listCount = document.getElementById('listCount');
  var listEl = document.getElementById('myList');
  var listLoading = document.getElementById('listLoading');
  var listEmpty = document.getElementById('listEmpty');
  var listEmptyTitle = document.getElementById('listEmptyTitle');
  var listEmptyDesc = document.getElementById('listEmptyDesc');
  var actionSection = document.getElementById('actionSection');
  var logoutBtn = document.getElementById('logoutBtn');

  var ENTRY_META = {
    videos: { title: '我的投稿', empty: '还没有投稿', desc: '点击底部加号发布你的第一条作品' },
    favorites: { title: '我的收藏', empty: '还没有收藏', desc: '在播放页点击收藏即可加入这里' },
    watch_later: { title: '稍后再看', empty: '暂存列表是空的', desc: '把想看的视频存起来慢慢看' },
    history: { title: '最近观看', empty: '还没有观看记录', desc: '看过的视频会自动出现在这里' }
  };

  var currentEntry = 'history';

  /* ------------------------------------------------------------------ */
  /* 资料                                                                */
  /* ------------------------------------------------------------------ */

  function renderProfile(user, stats) {
    profileCard.hidden = false;
    loginHint.hidden = true;
    entriesEl.hidden = false;
    actionSection.hidden = false;

    document.getElementById('profileAvatar').innerHTML =
      '<img src="' + B.avatarUrl(user) + '" alt="' + B.escapeHtml(user.nickname || '') + '" />';
    document.getElementById('profileName').textContent = user.nickname || user.username || '用户';
    document.getElementById('profileLevel').textContent = 'LV' + (user.level || 1);
    document.getElementById('profileSig').textContent = user.signature || '这个人很懒，什么都没写';
    document.getElementById('statFollowing').textContent = B.fmtCount(stats.following || 0);
    document.getElementById('statFollowers').textContent = B.fmtCount(stats.followers || 0);
    document.getElementById('statLikes').textContent = B.fmtCount(stats.likes || 0);
  }

  function showGuest() {
    profileCard.hidden = true;
    loginHint.hidden = false;
    entriesEl.hidden = true;
    listSection.hidden = true;
    actionSection.hidden = true;
  }

  function loadProfile() {
    return B.request('user', 'profile')
      .then(function (data) {
        var user = (data && data.user) || null;
        var stats = (data && data.stats) || {};
        if (!user) {
          showGuest();
          return;
        }
        renderProfile(user, stats);
      })
      .catch(function (err) {
        showGuest();
        B.toast(err.message || '加载个人资料失败');
      });
  }

  /* ------------------------------------------------------------------ */
  /* 列表                                                                */
  /* ------------------------------------------------------------------ */

  function renderList(items) {
    listEl.innerHTML = '';
    if (!items.length) {
      listEmpty.hidden = false;
      return;
    }
    listEmpty.hidden = true;
    var html = '';
    items.forEach(function (video) {
      html += B.videoRow(video, { time: video.watched_at ? B.fmtTime(video.watched_at) : '' });
    });
    listEl.innerHTML = html;
  }

  function loadList(entry) {
    var meta = ENTRY_META[entry] || ENTRY_META.history;
    currentEntry = entry;
    listTitle.textContent = meta.title;
    listEmptyTitle.textContent = meta.empty;
    listEmptyDesc.textContent = meta.desc;
    listSection.hidden = false;
    listLoading.hidden = false;
    listEl.innerHTML = '';
    listCount.textContent = '';

    B.request('user', entry)
      .then(function (data) {
        var items = (data && data.items) || [];
        renderList(items);
        listCount.textContent = items.length ? '共 ' + items.length + ' 个' : '';
        var counter = document.querySelector('[data-count="' + entry + '"]');
        if (counter) {
          counter.textContent = String(items.length);
        }
      })
      .catch(function (err) {
        renderList([]);
        B.toast(err.message || '加载失败，请稍后再试');
      })
      .then(function () {
        listLoading.hidden = true;
      });
  }

  B.qsa('.entry', entriesEl).forEach(function (btn) {
    btn.addEventListener('click', function () {
      var entry = btn.getAttribute('data-entry');
      if (entry === currentEntry) {
        loadList(entry);
        return;
      }
      loadList(entry);
    });
  });

  /* ------------------------------------------------------------------ */
  /* 其他                                                                */
  /* ------------------------------------------------------------------ */

  function onSetting() {
    B.toast('演示环境暂不支持资料编辑');
  }

  var settingBtn = document.getElementById('settingBtn');
  var settingBtn2 = document.getElementById('settingBtn2');
  if (settingBtn) {
    settingBtn.addEventListener('click', onSetting);
  }
  if (settingBtn2) {
    settingBtn2.addEventListener('click', onSetting);
  }

  logoutBtn.addEventListener('click', function () {
    logoutBtn.disabled = true;
    B.request('auth', 'logout', {}, 'POST')
      .then(function () {
        B.setUser(null);
        B.toast('已退出登录');
        window.location.reload();
      })
      .catch(function (err) {
        B.toast(err.message || '退出失败，请稍后再试');
        logoutBtn.disabled = false;
      });
  });

  /* ------------------------------------------------------------------ */
  /* 初始化                                                              */
  /* ------------------------------------------------------------------ */

  loadProfile().then(function () {
    if (!loginHint.hidden) {
      return;
    }
    loadList('history');
    // 统计收藏 / 稍后再看 / 投稿数量
    ['videos', 'favorites', 'watch_later'].forEach(function (entry) {
      B.request('user', entry)
        .then(function (data) {
          var counter = document.querySelector('[data-count="' + entry + '"]');
          if (counter) {
            counter.textContent = String((data && data.total) || 0);
          }
        })
        .catch(function () { /* 静默处理 */ });
    });
  });
})();

```

```text
file=assets/js/search.js
/* ==========================================================================
   搜索页脚本：历史、热门、结果检索
   ========================================================================== */

(function () {
  'use strict';

  var B = window.Bili;

  var inputEl = document.getElementById('searchInput');
  var btnEl = document.getElementById('searchBtn');
  var historyEl = document.getElementById('historyChips');
  var hotEl = document.getElementById('hotChips');
  var resultBlock = document.getElementById('resultBlock');
  var resultList = document.getElementById('resultList');
  var resultTitle = document.getElementById('resultTitle');
  var resultCount = document.getElementById('resultCount');
  var resultLoading = document.getElementById('resultLoading');
  var emptyEl = document.getElementById('emptyState');
  var clearBtn = document.getElementById('clearHistory');
  var historyBlock = document.getElementById('historyBlock');
  var hotBlock = document.getElementById('hotBlock');

  /* ------------------------------------------------------------------ */
  /* 最近搜索（本地缓存 + 服务端同步）                                    */
  /* ------------------------------------------------------------------ */

  var LOCAL_KEY = 'bili_search_history';

  function localHistory() {
    try {
      var raw = window.localStorage.getItem(LOCAL_KEY);
      var arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr : [];
    } catch (e) {
      return [];
    }
  }

  function saveLocalHistory(list) {
    try {
      window.localStorage.setItem(LOCAL_KEY, JSON.stringify(list.slice(0, 20)));
    } catch (e) {
      /* 忽略存储异常 */
    }
  }

  function renderHistory(words) {
    historyEl.innerHTML = '';
    if (!words.length) {
      var span = document.createElement('span');
      span.className = 'fs-sm text-3';
      span.textContent = '暂无搜索记录';
      historyEl.appendChild(span);
      return;
    }
    words.forEach(function (word) {
      var chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'chip';
      chip.textContent = word;
      chip.addEventListener('click', function () {
        inputEl.value = word;
        doSearch(word);
      });
      historyEl.appendChild(chip);
    });
  }

  function loadHistory() {
    var local = localHistory();
    renderHistory(local);
    if (!B.isLoggedIn()) {
      return;
    }
    B.request('search', 'history')
      .then(function (data) {
        var items = (data && data.items) || [];
        var words = items.map(function (i) { return i.word; });
        var merged = words.slice();
        local.forEach(function (w) {
          if (merged.indexOf(w) === -1) {
            merged.push(w);
          }
        });
        renderHistory(merged);
      })
      .catch(function () { /* 静默处理 */ });
  }

  clearBtn.addEventListener('click', function () {
    var local = localHistory();
    saveLocalHistory([]);
    renderHistory([]);
    if (B.isLoggedIn()) {
      B.request('search', 'history_clear', {}, 'POST')
        .then(function () { B.toast('搜索历史已清空'); })
        .catch(function () { B.toast('清空失败，请稍后再试'); });
    } else {
      B.toast('搜索历史已清空');
    }
  });

  /* ------------------------------------------------------------------ */
  /* 热门搜索                                                            */
  /* ------------------------------------------------------------------ */

  function loadHot() {
    B.request('search', 'hot')
      .then(function (data) {
        var items = (data && data.items) || [];
        hotEl.innerHTML = '';
        items.forEach(function (item) {
          var chip = document.createElement('button');
          chip.type = 'button';
          chip.className = 'chip';
          chip.textContent = item.word;
          chip.addEventListener('click', function () {
            inputEl.value = item.word;
            doSearch(item.word);
          });
          hotEl.appendChild(chip);
        });
      })
      .catch(function () {
        hotEl.innerHTML = '<span class="fs-sm text-3">热门搜索暂时不可用</span>';
      });
  }

  /* ------------------------------------------------------------------ */
  /* 搜索                                                                */
  /* ------------------------------------------------------------------ */

  function doSearch(keyword) {
    var word = (keyword || inputEl.value || '').trim();
    if (!word) {
      B.toast('请输入搜索关键词');
      inputEl.focus();
      return;
    }
    inputEl.value = word;

    // 记录本地历史（按时间倒序，去重）
    var local = localHistory().filter(function (w) { return w !== word; });
    local.unshift(word);
    saveLocalHistory(local);
    renderHistory(local);

    if (B.isLoggedIn()) {
      B.request('search', 'history_add', { word: word }, 'POST')
        .then(function () { loadHistory(); })
        .catch(function () { /* 静默处理 */ });
    }

    resultBlock.hidden = false;
    emptyEl.hidden = true;
    resultLoading.hidden = false;
    resultList.innerHTML = '';
    resultTitle.textContent = '搜索「' + word + '」';
    resultCount.textContent = '搜索中';

    B.request('search', 'search', { q: word })
      .then(function (data) {
        var items = (data && data.items) || [];
        resultCount.textContent = '共 ' + ((data && data.total) || 0) + ' 个结果';
        if (!items.length) {
          resultList.innerHTML = '';
          emptyEl.hidden = false;
          hotBlock.scrollIntoView({ behavior: 'smooth', block: 'start' });
          return;
        }
        var html = '';
        items.forEach(function (v) {
          html += B.videoRow(v, { keyword: word });
        });
        resultList.innerHTML = html;
      })
      .catch(function (err) {
        B.toast(err.message || '搜索失败');
        resultCount.textContent = '';
        emptyEl.hidden = false;
      })
      .then(function () {
        resultLoading.hidden = true;
      });
  }

  btnEl.addEventListener('click', function () {
    doSearch();
  });

  inputEl.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      doSearch();
    }
  });

  /* ------------------------------------------------------------------ */
  /* 分享 / 投稿入口                                                     */
  /* ------------------------------------------------------------------ */

  var publishBtn = document.getElementById('publishBtn');
  var sheetEl = document.getElementById('publishSheet');
  var formEl = document.getElementById('publishForm');
  var errorEl = document.getElementById('pubError');
  var submitEl = document.getElementById('pubSubmit');

  function closeSheet() {
    sheetEl.classList.remove('is-open');
    document.body.style.overflow = '';
  }

  publishBtn.addEventListener('click', function () {
    if (!B.isLoggedIn()) {
      B.requireLogin('登录后即可投稿');
      return;
    }
    sheetEl.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  });

  B.qsa('[data-close-sheet]', sheetEl).forEach(function (el) {
    el.addEventListener('click', closeSheet);
  });

  formEl.addEventListener('submit', function (e) {
    e.preventDefault();
    errorEl.textContent = '';
    var title = document.getElementById('pubTitle').value.trim();
    var desc = document.getElementById('pubDesc').value.trim();
    var cat = document.getElementById('pubCat').value;
    var colorA = document.getElementById('pubColorA').value;
    var colorB = document.getElementById('pubColorB').value;
    if (title.length < 2) {
      errorEl.textContent = '标题至少需要 2 个字';
      return;
    }
    submitEl.disabled = true;
    submitEl.textContent = '发布中';
    B.request('videos', 'publish', {
      title: title, desc: desc, cat: cat, cover_a: colorA, cover_b: colorB
    }, 'POST')
      .then(function () {
        B.toast('投稿成功');
        formEl.reset();
        closeSheet();
      })
      .catch(function (err) {
        errorEl.textContent = err.message || '投稿失败';
      })
      .then(function () {
        submitEl.disabled = false;
        submitEl.textContent = '发布投稿';
      });
  });

  /* ------------------------------------------------------------------ */
  /* 初始化                                                              */
  /* ------------------------------------------------------------------ */

  loadHistory();
  loadHot();

  var preset = B.query('q', '');
  if (preset) {
    inputEl.value = preset;
    doSearch(preset);
  } else {
    inputEl.focus();
  }
})();

```

```text
file=assets/js/video.js
/* ==========================================================================
   播放页脚本：模拟播放器、详情渲染、互动、评论
   ========================================================================== */

(function () {
  'use strict';

  var B = window.Bili;

  var videoId = B.query('id', '');

  var playerEl = document.getElementById('player');
  var playBtn = document.getElementById('playBtn');
  var playToggle = document.getElementById('playToggle');
  var speedBtn = document.getElementById('speedBtn');
  var fullBtn = document.getElementById('fullBtn');
  var progressEl = document.getElementById('progress');
  var barFill = document.getElementById('barFill');
  var curTimeEl = document.getElementById('curTime');
  var totalTimeEl = document.getElementById('totalTime');
  var stageHint = document.getElementById('stageHint');

  var titleEl = document.getElementById('videoTitle');
  var navTitle = document.getElementById('navTitle');
  var statsEl = document.getElementById('videoStats');
  var descText = document.getElementById('descText');
  var descToggle = document.getElementById('descToggle');
  var descBox = document.getElementById('descBox');
  var relatedGrid = document.getElementById('relatedGrid');
  var commentList = document.getElementById('commentList');
  var commentCount = document.getElementById('commentCount');
  var commentLoading = document.getElementById('commentLoading');
  var commentForm = document.getElementById('commentForm');
  var commentInput = document.getElementById('commentInput');
  var commentSubmit = document.getElementById('commentSubmit');

  var upAvatar = document.getElementById('upAvatar');
  var upName = document.getElementById('upName');
  var upMeta = document.getElementById('upMeta');
  var followBtn = document.getElementById('followBtn');
  var dmBtn = document.getElementById('dmBtn');

  var likeBtn = document.getElementById('likeBtn');
  var likeText = document.getElementById('likeText');
  var favBtn = document.getElementById('favBtn');
  var favText = document.getElementById('favText');
  var coinBtn = document.getElementById('coinBtn');
  var coinText = document.getElementById('coinText');
  var shareBtn = document.getElementById('shareBtn');
  var shareAction = document.getElementById('shareAction');

  /* ------------------------------------------------------------------ */
  /* 播放器状态                                                          */
  /* ------------------------------------------------------------------ */

  var player = {
    playing: false,
    current: 0,
    duration: 0,
    speed: 1,
    speeds: [1, 1.5, 2],
    timer: null,
    fullscreen: false
  };

  function renderProgress() {
    var ratio = player.duration ? (player.current / player.duration) : 0;
    var pct = Math.max(0, Math.min(100, ratio * 100));
    barFill.style.width = pct + '%';
    curTimeEl.textContent = B.fmtDuration(player.current);
    totalTimeEl.textContent = B.fmtDuration(player.duration);
    progressEl.setAttribute('aria-valuenow', String(Math.round(pct)));
    progressEl.setAttribute('aria-valuetext', B.fmtDuration(player.current) + ' / ' + B.fmtDuration(player.duration));
  }

  function setPlaying(playing) {
    player.playing = playing;
    playerEl.classList.toggle('is-playing', playing);
    playerEl.classList.toggle('is-paused', !playing);
    playToggle.textContent = playing ? '暂停' : '播放';
    playBtn.setAttribute('aria-label', playing ? '暂停' : '播放');
    stageHint.textContent = playing ? '正在播放 · ' + player.speed + 'x' : '演示播放画面';
    if (playing) {
      startTimer();
    } else {
      stopTimer();
    }
  }

  function startTimer() {
    stopTimer();
    player.timer = window.setInterval(function () {
      player.current += player.speed;
      if (player.current >= player.duration) {
        player.current = player.duration;
        renderProgress();
        setPlaying(false);
        reportHistory();
        return;
      }
      renderProgress();
    }, 1000);
  }

  function stopTimer() {
    if (player.timer) {
      window.clearInterval(player.timer);
      player.timer = null;
    }
  }

  playBtn.addEventListener('click', function () {
    setPlaying(!player.playing);
  });

  playToggle.addEventListener('click', function () {
    setPlaying(!player.playing);
  });

  speedBtn.addEventListener('click', function () {
    var idx = player.speeds.indexOf(player.speed);
    player.speed = player.speeds[(idx + 1) % player.speeds.length];
    speedBtn.textContent = player.speed + 'x';
    stageHint.textContent = player.playing ? '正在播放 · ' + player.speed + 'x' : '演示播放画面';
    B.toast('播放速度 ' + player.speed + 'x');
  });

  fullBtn.addEventListener('click', function () {
    player.fullscreen = !player.fullscreen;
    playerEl.classList.toggle('is-fullscreen', player.fullscreen);
    if (player.fullscreen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    B.toast(player.fullscreen ? '已全屏播放' : '已退出全屏');
  });

  progressEl.addEventListener('click', function (e) {
    var rect = progressEl.getBoundingClientRect();
    var ratio = (e.clientX - rect.left) / rect.width;
    ratio = Math.max(0, Math.min(1, ratio));
    player.current = Math.round(ratio * player.duration);
    renderProgress();
  });

  progressEl.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowRight') {
      player.current = Math.min(player.duration, player.current + 5);
      renderProgress();
    } else if (e.key === 'ArrowLeft') {
      player.current = Math.max(0, player.current - 5);
      renderProgress();
    }
  });

  /* ------------------------------------------------------------------ */
  /* 详情数据                                                            */
  /* ------------------------------------------------------------------ */

  var detail = null;

  function renderDetail(data) {
    detail = data;
    var video = data.video;
    var up = data.up || {};
    var state = data.state || {};

    titleEl.textContent = video.title;
    navTitle.textContent = video.title;
    document.title = video.title + ' - BiliLite';

    statsEl.innerHTML =
      '<span><b>' + B.fmtCount(video.views) + '</b> 播放</span>' +
      '<span><b>' + B.fmtCount(video.danmaku) + '</b> 弹幕</span>' +
      '<span><b>' + B.fmtCount(video.likes) + '</b> 点赞</span>' +
      '<span><b>' + B.fmtCount(video.coins) + '</b> 投币</span>' +
      '<span><b>' + B.fmtCount(video.favorites) + '</b> 收藏</span>';

    upAvatar.innerHTML = '<img src="' + B.avatarUrl({ id: up.id, avatar: up.avatar, nickname: up.nickname }) + '" alt="' + B.escapeHtml(up.nickname || '') + '" />';
    upName.textContent = up.nickname || '未知UP主';
    upMeta.textContent = B.fmtCount(up.followers || 0) + '粉丝 · ' + (up.signature || '');

    followBtn.textContent = data.followed ? '已关注' : '关注';
    followBtn.classList.toggle('btn--primary', !data.followed);
    followBtn.classList.toggle('btn--ghost', !!data.followed);

    descText.textContent = video.desc || '暂无简介';
    updateDescToggle();

    likeBtn.classList.toggle('is-active', !!state.liked);
    likeText.textContent = B.fmtCount(video.likes);
    favBtn.classList.toggle('is-active', !!state.favorited);
    favText.textContent = state.favorited ? '已收藏' : '收藏';
    coinText.textContent = B.fmtCount(video.coins);

    player.duration = video.duration || 0;
    player.current = 0;
    renderProgress();
  }

  function updateDescToggle() {
    var text = descText.textContent || '';
    var long = text.length > 40;
    descToggle.hidden = !long;
    descToggle.textContent = descBox.classList.contains('is-open') ? '收起' : '展开';
  }

  descToggle.addEventListener('click', function () {
    descBox.classList.toggle('is-open');
    updateDescToggle();
  });

  /* ------------------------------------------------------------------ */
  /* 互动                                                                */
  /* ------------------------------------------------------------------ */

  function interact(action, payload, onDone) {
    if (!B.isLoggedIn()) {
      B.requireLogin('登录后才能使用该功能');
      return;
    }
    B.request('interact', action, payload, 'POST')
      .then(function (data) {
        onDone(data);
      })
      .catch(function (err) {
        B.toast(err.message || '操作失败');
      });
  }

  likeBtn.addEventListener('click', function () {
    if (!detail) {
      return;
    }
    interact('like', { id: videoId }, function (data) {
      detail.video.likes = data.count;
      likeBtn.classList.toggle('is-active', !!data.liked);
      likeText.textContent = B.fmtCount(data.count);
      statsEl.querySelectorAll('span')[2].innerHTML = '<b>' + B.fmtCount(data.count) + '</b> 点赞';
      B.toast(data.liked ? '点赞成功' : '已取消点赞');
    });
  });

  favBtn.addEventListener('click', function () {
    if (!detail) {
      return;
    }
    interact('favorite', { id: videoId }, function (data) {
      detail.video.favorites = data.count;
      detail.state.favorited = data.favorited;
      favBtn.classList.toggle('is-active', !!data.favorited);
      favText.textContent = data.favorited ? '已收藏' : '收藏';
      statsEl.querySelectorAll('span')[4].innerHTML = '<b>' + B.fmtCount(data.count) + '</b> 收藏';
      B.toast(data.favorited ? '收藏成功，可在「我的-收藏」查看' : '已取消收藏');
    });
  });

  coinBtn.addEventListener('click', function () {
    if (!detail) {
      return;
    }
    interact('coin', { id: videoId }, function (data) {
      detail.video.coins = data.count;
      coinText.textContent = B.fmtCount(data.count);
      statsEl.querySelectorAll('span')[3].innerHTML = '<b>' + B.fmtCount(data.count) + '</b> 投币';
      B.toast('投币成功，感谢支持');
    });
  });

  followBtn.addEventListener('click', function () {
    if (!detail || !detail.up) {
      return;
    }
    interact('follow', { target_id: detail.up.id }, function (data) {
      detail.followed = data.followed;
      followBtn.textContent = data.followed ? '已关注' : '关注';
      followBtn.classList.toggle('btn--primary', !data.followed);
      followBtn.classList.toggle('btn--ghost', !!data.followed);
      B.toast(data.followed ? '关注成功' : '已取消关注');
    });
  });

  dmBtn.addEventListener('click', function () {
    if (!B.isLoggedIn()) {
      B.requireLogin('登录后才能发送私信');
      return;
    }
    B.toast('私信功能演示：已生成给「' + (detail && detail.up ? detail.up.nickname : 'UP主') + '」的会话');
  });

  function share() {
    var url = window.location.href;
    if (navigator.share) {
      navigator.share({ title: detail ? detail.video.title : 'BiliLite', url: url }).catch(function () { /* 取消分享 */ });
      return;
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(function () {
        B.toast('链接已复制到剪贴板');
      }).catch(function () {
        B.toast('复制失败，请手动复制地址栏链接');
      });
      return;
    }
    B.toast('分享链接：' + url);
  }

  shareBtn.addEventListener('click', share);
  shareAction.addEventListener('click', share);

  /* ------------------------------------------------------------------ */
  /* 相关推荐                                                            */
  /* ------------------------------------------------------------------ */

  function loadRelated() {
    B.request('video', 'related', { id: videoId })
      .then(function (data) {
        var items = (data && data.items) || [];
        relatedGrid.innerHTML = '';
        if (!items.length) {
          relatedGrid.innerHTML = '<p class="fs-sm text-3" style="grid-column:1/-1;padding:8px 0;">暂无相关推荐</p>';
          return;
        }
        items.forEach(function (v) {
          relatedGrid.insertAdjacentHTML('beforeend', B.videoCard(v));
        });
      })
      .catch(function () {
        relatedGrid.innerHTML = '<p class="fs-sm text-3" style="grid-column:1/-1;padding:8px 0;">相关推荐加载失败</p>';
      });
  }

  /* ------------------------------------------------------------------ */
  /* 评论                                                                */
  /* ------------------------------------------------------------------ */

  function renderComments(items) {
    if (!items.length) {
      commentList.innerHTML = '<p class="fs-sm text-3" style="padding:16px;text-align:center;">还没有评论，快来抢沙发</p>';
      return;
    }
    var html = '';
    items.forEach(function (c) {
      html +=
        '<div class="comment">' +
          '<span class="avatar avatar--sm"><img src="' + B.avatarUrl({ id: c.up_id || c.up_avatar, avatar: c.up_avatar, nickname: c.up_name }) + '" alt="" /></span>' +
          '<div class="comment__body">' +
            '<div class="comment__name">' + B.escapeHtml(c.up_name || '游客用户') + '</div>' +
            '<p class="comment__content">' + B.escapeHtml(c.content) + '</p>' +
            '<div class="comment__meta">' + B.fmtTime(c.created_at) + ' · ' + B.fmtCount(c.likes) + '赞</div>' +
          '</div>' +
        '</div>';
    });
    commentList.innerHTML = html;
  }

  function loadComments() {
    commentLoading.hidden = false;
    B.request('video', 'comments', { id: videoId })
      .then(function (data) {
        renderComments((data && data.items) || []);
        commentCount.textContent = String((data && data.total) || 0);
      })
      .catch(function (err) {
        commentList.innerHTML = '<p class="fs-sm text-3" style="padding:16px;text-align:center;">' + B.escapeHtml(err.message || '评论加载失败') + '</p>';
      })
      .then(function () {
        commentLoading.hidden = true;
      });
  }

  commentForm.addEventListener('submit', function (e) {
    e.preventDefault();
    var content = commentInput.value.trim();
    if (!content) {
      B.toast('说点什么再发送吧');
      return;
    }
    commentSubmit.disabled = true;
    B.request('video', 'comment', { vid: videoId, content: content }, 'POST')
      .then(function (item) {
        commentInput.value = '';
        commentCount.textContent = String((parseInt(commentCount.textContent, 10) || 0) + 1);
        if (commentList.querySelector('p')) {
          commentList.innerHTML = '';
        }
        commentList.insertAdjacentHTML('afterbegin',
          '<div class="comment">' +
            '<span class="avatar avatar--sm"><img src="' + B.avatarUrl({ id: 'guest', avatar: 'guest', nickname: item.up_name }) + '" alt="" /></span>' +
            '<div class="comment__body">' +
              '<div class="comment__name">' + B.escapeHtml(item.up_name || '游客用户') + '</div>' +
              '<p class="comment__content">' + B.escapeHtml(item.content) + '</p>' +
              '<div class="comment__meta">刚刚</div>' +
            '</div>' +
          '</div>');
        B.toast('评论发表成功');
      })
      .catch(function (err) {
        B.toast(err.message || '评论失败，请稍后再试');
      })
      .then(function () {
        commentSubmit.disabled = false;
      });
  });

  /* ------------------------------------------------------------------ */
  /* 观看历史上报                                                        */
  /* ------------------------------------------------------------------ */

  function reportHistory() {
    B.request('video', 'report', { id: videoId, duration: Math.floor(player.current) }, 'POST')
      .catch(function () { /* 静默处理 */ });
  }

  /* ------------------------------------------------------------------ */
  /* 初始化                                                              */
  /* ------------------------------------------------------------------ */

  if (!videoId) {
    titleEl.textContent = '视频不存在';
    B.toast('缺少视频 ID');
  } else {
    B.request('video', 'detail', { id: videoId })
      .then(function (data) {
        renderDetail(data);
        loadRelated();
        loadComments();
        // 进入页面即记录一次观看历史
        B.request('video', 'report', { id: videoId, duration: 0 }, 'POST')
          .catch(function () { /* 静默处理 */ });
      })
      .catch(function (err) {
        titleEl.textContent = '加载失败';
        navTitle.textContent = '加载失败';
        B.toast(err.message || '视频加载失败');
      });
  }
})();

```

```text
file=index.html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
<meta name="theme-color" content="#FB7299" />
<title>BiliLite - 首页</title>
<link rel="stylesheet" href="assets/css/app.css" />
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='8' fill='%23FB7299'/%3E%3Ctext x='16' y='22' font-size='16' text-anchor='middle' fill='%23fff' font-family='sans-serif'%3EB%3C/text%3E%3C/svg%3E" />
</head>
<body data-page="home">
<div class="app">

  <header class="statusbar" aria-label="状态栏">
    <span data-clock>09:41</span>
    <span class="statusbar__right">
      <svg width="16" height="12" viewBox="0 0 16 12" fill="none" aria-hidden="true"><rect x="0" y="8" width="3" height="4" rx="1" fill="currentColor"/><rect x="4.5" y="5.5" width="3" height="6.5" rx="1" fill="currentColor"/><rect x="9" y="3" width="3" height="9" rx="1" fill="currentColor"/><rect x="13.5" y="0" width="2.5" height="12" rx="1" fill="currentColor"/></svg>
      <svg width="16" height="12" viewBox="0 0 16 12" fill="none" aria-hidden="true"><path d="M8 10.5l2.2-2.6a3.3 3.3 0 0 0-4.4 0L8 10.5z" fill="currentColor"/><path d="M4.2 5.6a6 6 0 0 1 7.6 0M1.6 3a9.4 9.4 0 0 1 12.8 0" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>
      <svg width="22" height="12" viewBox="0 0 22 12" fill="none" aria-hidden="true"><rect x="0.6" y="0.6" width="18" height="10.8" rx="3" stroke="currentColor" stroke-width="1.1"/><rect x="2.2" y="2.2" width="13" height="7.6" rx="1.8" fill="currentColor"/><path d="M20.4 4v4c1.2-.4 1.6-1 1.6-2s-.4-1.6-1.6-2z" fill="currentColor"/></svg>
    </span>
  </header>

  <header class="appbar">
    <a class="searchbar__field" href="search.html" style="flex:1;text-decoration:none;" aria-label="前往搜索页">
      <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true"><circle cx="7" cy="7" r="5" stroke="currentColor" stroke-width="1.6"/><path d="M11 11l3.4 3.4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>
      <span>试试新番，万一火了呢</span>
    </a>
    <a class="iconbtn" href="message.html" aria-label="消息中心">
      <svg width="21" height="21" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v8a2.5 2.5 0 0 1-2.5 2.5H10l-4.6 3.2A.6.6 0 0 1 4.5 19.6V6.5z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></svg>
      <span class="badge" data-unread-badge hidden></span>
    </a>
  </header>

  <nav class="tabs" id="channelTabs" aria-label="频道"></nav>

  <main class="page" id="main">
    <div class="grid" id="videoGrid" aria-live="polite"></div>
    <div class="loader" id="loading" hidden>
      <span class="spinner" aria-hidden="true"></span><span>加载中</span>
    </div>
    <button class="loadmore" id="loadMore" type="button">换一批</button>
    <div class="empty" id="emptyState" hidden>
      <svg class="empty__icon" width="56" height="56" viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="3" stroke="currentColor" stroke-width="1.4"/><path d="M10 9.5l5 2.5-5 2.5v-5z" fill="currentColor" opacity="0.35"/></svg>
      <p class="empty__title">这里暂时没有内容</p>
      <p class="empty__desc">换个频道看看，或者先投稿一条吧</p>
    </div>
  </main>

  <nav class="tabbar" aria-label="底部导航">
    <a class="tabbar__item" data-nav="home" href="index.html">
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 10.4L12 4l8 6.4V19a1 1 0 0 1-1 1h-4.5v-5.5h-5V20H5a1 1 0 0 1-1-1v-8.6z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></svg>
      <span>首页</span>
    </a>
    <a class="tabbar__item" data-nav="search" href="search.html">
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="11" cy="11" r="6.4" stroke="currentColor" stroke-width="1.7"/><path d="M15.8 15.8L20 20" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>
      <span>搜索</span>
    </a>
    <button class="tabbar__item tabbar__publish" id="publishBtn" type="button" aria-label="投稿">
      <span class="tabbar__publish-btn">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
      </span>
    </button>
    <a class="tabbar__item" data-nav="message" href="message.html">
      <span style="position:relative;display:inline-flex;">
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v8a2.5 2.5 0 0 1-2.5 2.5H10l-4.6 3.2A.6.6 0 0 1 4.5 19.6V6.5z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></svg>
        <span class="badge" data-unread-badge hidden style="top:-2px;left:12px;"></span>
      </span>
      <span>消息</span>
    </a>
    <a class="tabbar__item" data-nav="mine" href="mine.html">
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="8.4" r="3.9" stroke="currentColor" stroke-width="1.7"/><path d="M4.8 20c0-3.4 3.2-5.6 7.2-5.6s7.2 2.2 7.2 5.6" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>
      <span>我的</span>
    </a>
  </nav>

  <!-- 投稿弹层 -->
  <div class="sheet" id="publishSheet" role="dialog" aria-modal="true" aria-labelledby="publishTitle">
    <div class="sheet__mask" data-close-sheet></div>
    <div class="sheet__panel">
      <div class="sheet__head">
        <h2 class="sheet__title" id="publishTitle">投稿</h2>
        <button class="sheet__close" type="button" data-close-sheet aria-label="关闭">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
        </button>
      </div>
      <form id="publishForm" novalidate>
        <div class="field">
          <label class="field__label" for="pubTitle">标题</label>
          <input class="input" id="pubTitle" name="title" type="text" maxlength="60" placeholder="起个好名字，标题最多 60 字" />
        </div>
        <div class="field">
          <label class="field__label" for="pubDesc">简介</label>
          <textarea class="textarea" id="pubDesc" name="desc" maxlength="500" placeholder="简单介绍一下你的作品"></textarea>
        </div>
        <div class="field">
          <label class="field__label" for="pubCat">分区</label>
          <select class="select" id="pubCat" name="cat">
            <option>动画</option><option>音乐</option><option>游戏</option><option>科技</option>
            <option>生活</option><option>知识</option><option>影视</option><option>美食</option>
          </select>
        </div>
        <div class="field">
          <span class="field__label">封面配色</span>
          <div class="color-row">
            <input id="pubColorA" type="color" value="#3a3550" aria-label="封面色 A" />
            <input id="pubColorB" type="color" value="#6d6390" aria-label="封面色 B" />
          </div>
        </div>
        <p class="form-error" id="pubError" role="alert"></p>
        <button class="btn btn--primary btn--block" type="submit" id="pubSubmit">发布投稿</button>
      </form>
    </div>
  </div>

</div>
<script src="assets/js/core.js"></script>
<script src="assets/js/home.js"></script>
</body>
</html>

```

```text
file=login.html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
<meta name="theme-color" content="#FB7299" />
<title>BiliLite - 登录</title>
<link rel="stylesheet" href="assets/css/app.css" />
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='8' fill='%23FB7299'/%3E%3Ctext x='16' y='22' font-size='16' text-anchor='middle' fill='%23fff' font-family='sans-serif'%3EB%3C/text%3E%3C/svg%3E" />
</head>
<body data-page="login">
<div class="app">

  <header class="appbar">
    <a class="iconbtn" id="backBtn" href="index.html" aria-label="返回首页">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M14.5 5.5L8 12l6.5 6.5" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/></svg>
    </a>
    <h1 class="appbar__title">账号</h1>
    <span style="width:32px;"></span>
  </header>

  <main class="page page--plain" id="main">
    <section class="login">

      <div class="login__logo">
        <svg width="112" height="78" viewBox="0 0 112 78" role="img" aria-label="BiliLite">
          <g fill="none" stroke="#FB7299" stroke-width="4.2" stroke-linecap="round">
            <path d="M40 26L30 15M72 26l10-11" />
          </g>
          <rect x="14" y="24" width="84" height="52" rx="14" fill="#FB7299" />
          <circle cx="40" cy="46" r="5.4" fill="#FFFFFF" />
          <circle cx="72" cy="46" r="5.4" fill="#FFFFFF" />
          <path d="M42 62h28" stroke="#FFFFFF" stroke-width="4.6" stroke-linecap="round" />
        </svg>
        <p class="login__slogan">欢迎来到 BiliLite，干杯！</p>
      </div>

      <div class="login__tabs" role="tablist" aria-label="登录或注册">
        <button class="login__tab is-active" id="loginTab" type="button" role="tab" aria-selected="true" aria-controls="authForm">登录</button>
        <button class="login__tab" id="registerTab" type="button" role="tab" aria-selected="false" aria-controls="authForm">注册</button>
      </div>

      <form id="authForm" novalidate>
        <div class="field">
          <label class="field__label" for="username">账号</label>
          <input class="input" id="username" name="username" type="text" autocomplete="username"
                 maxlength="16" placeholder="2-16 位昵称或账号" />
        </div>

        <div class="field" id="nicknameField" hidden>
          <label class="field__label" for="nickname">昵称（选填）</label>
          <input class="input" id="nickname" name="nickname" type="text" maxlength="16" placeholder="给自己起个昵称" />
        </div>

        <div class="field">
          <label class="field__label" for="password">密码</label>
          <input class="input" id="password" name="password" type="password" autocomplete="current-password"
                 maxlength="32" placeholder="不少于 6 位" />
        </div>

        <div class="field" id="confirmField" hidden>
          <label class="field__label" for="confirm">确认密码</label>
          <input class="input" id="confirm" name="confirm" type="password" autocomplete="new-password"
                 maxlength="32" placeholder="再输入一次密码" />
        </div>

        <p class="form-error" id="formError" role="alert"></p>

        <button class="btn btn--primary btn--block" id="submitBtn" type="submit">登 录</button>
      </form>

      <div class="divider">其他方式</div>

      <p class="guest-tip" id="guestTip">
        演示账号：demo，密码：123456
      </p>

      <div class="login__foot">
        <a href="index.html" id="guestLink">先随便逛逛</a>
        <a href="#" id="forgotLink">忘记密码？</a>
      </div>

    </section>
  </main>

</div>
<script src="assets/js/core.js"></script>
<script src="assets/js/login.js"></script>
</body>
</html>

```

```text
file=message.html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
<meta name="theme-color" content="#FB7299" />
<title>BiliLite - 消息</title>
<link rel="stylesheet" href="assets/css/app.css" />
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='8' fill='%23FB7299'/%3E%3Ctext x='16' y='22' font-size='16' text-anchor='middle' fill='%23fff' font-family='sans-serif'%3EB%3C/text%3E%3C/svg%3E" />
</head>
<body data-page="message">
<div class="app">

  <header class="statusbar" aria-label="状态栏">
    <span data-clock>09:41</span>
    <span class="statusbar__right">
      <svg width="16" height="12" viewBox="0 0 16 12" fill="none" aria-hidden="true"><rect x="0" y="8" width="3" height="4" rx="1" fill="currentColor"/><rect x="4.5" y="5.5" width="3" height="6.5" rx="1" fill="currentColor"/><rect x="9" y="3" width="3" height="9" rx="1" fill="currentColor"/><rect x="13.5" y="0" width="2.5" height="12" rx="1" fill="currentColor"/></svg>
      <svg width="16" height="12" viewBox="0 0 16 12" fill="none" aria-hidden="true"><path d="M8 10.5l2.2-2.6a3.3 3.3 0 0 0-4.4 0L8 10.5z" fill="currentColor"/><path d="M4.2 5.6a6 6 0 0 1 7.6 0M1.6 3a9.4 9.4 0 0 1 12.8 0" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>
      <svg width="22" height="12" viewBox="0 0 22 12" fill="none" aria-hidden="true"><rect x="0.6" y="0.6" width="18" height="10.8" rx="3" stroke="currentColor" stroke-width="1.1"/><rect x="2.2" y="2.2" width="13" height="7.6" rx="1.8" fill="currentColor"/><path d="M20.4 4v4c1.2-.4 1.6-1 1.6-2s-.4-1.6-1.6-2z" fill="currentColor"/></svg>
    </span>
  </header>

  <header class="appbar">
    <h1 class="appbar__title">消息</h1>
    <button class="btn btn--ghost btn--sm" id="readAllBtn" type="button">全部已读</button>
  </header>

  <nav class="segment" id="typeSegment" aria-label="消息分类">
    <button class="segment__item is-active" type="button" data-type="notice" aria-pressed="true">通知</button>
    <button class="segment__item" type="button" data-type="dm" aria-pressed="false">私信</button>
    <button class="segment__item" type="button" data-type="system" aria-pressed="false">系统</button>
  </nav>

  <main class="page page--plain" id="main">
    <div class="list" id="messageList" aria-live="polite"></div>

    <div class="loader" id="msgLoading" hidden>
      <span class="spinner" aria-hidden="true"></span><span>加载中</span>
    </div>

    <button class="loadmore" id="loadMore" type="button" hidden>加载更多</button>

    <div class="empty" id="emptyState" hidden>
      <svg class="empty__icon" width="56" height="56" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v8a2.5 2.5 0 0 1-2.5 2.5H10l-4.6 3.2A.6.6 0 0 1 4.5 19.6V6.5z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/></svg>
      <p class="empty__title">这里还没有消息</p>
      <p class="empty__desc">去首页逛逛，关注喜欢的 UP 主吧</p>
    </div>
  </main>

  <nav class="tabbar" aria-label="底部导航">
    <a class="tabbar__item" data-nav="home" href="index.html">
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 10.4L12 4l8 6.4V19a1 1 0 0 1-1 1h-4.5v-5.5h-5V20H5a1 1 0 0 1-1-1v-8.6z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></svg>
      <span>首页</span>
    </a>
    <a class="tabbar__item" data-nav="search" href="search.html">
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="11" cy="11" r="6.4" stroke="currentColor" stroke-width="1.7"/><path d="M15.8 15.8L20 20" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>
      <span>搜索</span>
    </a>
    <a class="tabbar__item tabbar__publish" href="index.html#publish" aria-label="投稿">
      <span class="tabbar__publish-btn">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
      </span>
    </a>
    <a class="tabbar__item" data-nav="message" href="message.html">
      <span style="position:relative;display:inline-flex;">
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v8a2.5 2.5 0 0 1-2.5 2.5H10l-4.6 3.2A.6.6 0 0 1 4.5 19.6V6.5z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></svg>
        <span class="badge" data-unread-badge hidden style="top:-2px;left:12px;"></span>
      </span>
      <span>消息</span>
    </a>
    <a class="tabbar__item" data-nav="mine" href="mine.html">
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="8.4" r="3.9" stroke="currentColor" stroke-width="1.7"/><path d="M4.8 20c0-3.4 3.2-5.6 7.2-5.6s7.2 2.2 7.2 5.6" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>
      <span>我的</span>
    </a>
  </nav>

</div>
<script src="assets/js/core.js"></script>
<script src="assets/js/message.js"></script>
</body>
</html>

```

```text
file=mine.html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
<meta name="theme-color" content="#FB7299" />
<title>BiliLite - 我的</title>
<link rel="stylesheet" href="assets/css/app.css" />
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='8' fill='%23FB7299'/%3E%3Ctext x='16' y='22' font-size='16' text-anchor='middle' fill='%23fff' font-family='sans-serif'%3EB%3C/text%3E%3C/svg%3E" />
</head>
<body data-page="mine">
<div class="app">

  <header class="statusbar" aria-label="状态栏">
    <span data-clock>09:41</span>
    <span class="statusbar__right">
      <svg width="16" height="12" viewBox="0 0 16 12" fill="none" aria-hidden="true"><rect x="0" y="8" width="3" height="4" rx="1" fill="currentColor"/><rect x="4.5" y="5.5" width="3" height="6.5" rx="1" fill="currentColor"/><rect x="9" y="3" width="3" height="9" rx="1" fill="currentColor"/><rect x="13.5" y="0" width="2.5" height="12" rx="1" fill="currentColor"/></svg>
      <svg width="16" height="12" viewBox="0 0 16 12" fill="none" aria-hidden="true"><path d="M8 10.5l2.2-2.6a3.3 3.3 0 0 0-4.4 0L8 10.5z" fill="currentColor"/><path d="M4.2 5.6a6 6 0 0 1 7.6 0M1.6 3a9.4 9.4 0 0 1 12.8 0" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>
      <svg width="22" height="12" viewBox="0 0 22 12" fill="none" aria-hidden="true"><rect x="0.6" y="0.6" width="18" height="10.8" rx="3" stroke="currentColor" stroke-width="1.1"/><rect x="2.2" y="2.2" width="13" height="7.6" rx="1.8" fill="currentColor"/><path d="M20.4 4v4c1.2-.4 1.6-1 1.6-2s-.4-1.6-1.6-2z" fill="currentColor"/></svg>
    </span>
  </header>

  <header class="appbar">
    <h1 class="appbar__title">我的</h1>
    <button class="iconbtn iconbtn--muted" id="settingBtn" type="button" aria-label="设置">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="3.2" stroke="currentColor" stroke-width="1.7"/><path d="M12 3.6v2.2M12 18.2v2.2M20.4 12h-2.2M5.8 12H3.6M18 6l-1.6 1.6M7.6 16.4L6 18M18 18l-1.6-1.6M7.6 7.6L6 6" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>
    </button>
  </header>

  <main class="page page--plain" id="main">

    <!-- 未登录引导 -->
    <section class="empty" id="loginHint" hidden>
      <svg class="empty__icon" width="56" height="56" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="8.4" r="3.9" stroke="currentColor" stroke-width="1.4"/><path d="M4.8 20c0-3.4 3.2-5.6 7.2-5.6s7.2 2.2 7.2 5.6" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>
      <p class="empty__title">登录后查看你的收藏与历史</p>
      <p class="empty__desc">登录即可同步观看记录、投稿与关注</p>
      <a class="btn btn--primary" id="goLoginBtn" href="login.html?redirect=mine.html">立即登录</a>
    </section>

    <!-- 资料卡 -->
    <section class="profile" id="profileCard" hidden aria-label="用户资料">
      <div class="profile__top">
        <span class="avatar avatar--lg" id="profileAvatar"></span>
        <div class="profile__info">
          <div class="profile__name">
            <span id="profileName">—</span>
            <span class="level" id="profileLevel">LV1</span>
          </div>
          <p class="profile__sig" id="profileSig">—</p>
        </div>
        <button class="iconbtn iconbtn--muted" id="settingBtn2" type="button" aria-label="账号设置">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="3.2" stroke="currentColor" stroke-width="1.7"/><path d="M12 3.6v2.2M12 18.2v2.2M20.4 12h-2.2M5.8 12H3.6M18 6l-1.6 1.6M7.6 16.4L6 18M18 18l-1.6-1.6M7.6 7.6L6 6" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>
        </button>
      </div>
      <div class="profile__stats">
        <div class="profile__stat"><b id="statFollowing">0</b><span>关注</span></div>
        <div class="profile__stat"><b id="statFollowers">0</b><span>粉丝</span></div>
        <div class="profile__stat"><b id="statLikes">0</b><span>获赞</span></div>
      </div>
    </section>

    <!-- 入口宫格 -->
    <nav class="entries" id="entries" hidden aria-label="我的内容">
      <button class="entry" type="button" data-entry="videos">
        <span class="entry__icon">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="3" stroke="currentColor" stroke-width="1.7"/><path d="M10.4 9.6l4.6 2.4-4.6 2.4V9.6z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></svg>
        </span>
        <span>投稿</span>
        <span class="entry__count" data-count="videos">0</span>
      </button>
      <button class="entry" type="button" data-entry="favorites">
        <span class="entry__icon">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 4.2l2.3 4.8 5.2.7-3.8 3.7.9 5.2-4.6-2.5-4.6 2.5.9-5.2L4.5 9.7l5.2-.7L12 4.2z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></svg>
        </span>
        <span>收藏</span>
        <span class="entry__count" data-count="favorites">0</span>
      </button>
      <button class="entry" type="button" data-entry="watch_later">
        <span class="entry__icon">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="8.2" stroke="currentColor" stroke-width="1.7"/><path d="M12 7.6V12l3 1.8" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </span>
        <span>稍后再看</span>
        <span class="entry__count" data-count="watch_later">0</span>
      </button>
      <button class="entry" type="button" data-entry="history">
        <span class="entry__icon">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 12a8 8 0 1 0 2.4-5.7" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/><path d="M4 5.4V9h3.6" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 8v4.4l3 1.8" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>
        </span>
        <span>历史</span>
        <span class="entry__count" data-count="history">0</span>
      </button>
    </nav>

    <!-- 列表区 -->
    <section class="section" id="listSection" hidden aria-labelledby="listTitle">
      <div class="section__head">
        <h2 class="section__title" id="listTitle">最近观看</h2>
        <span class="section__more" id="listCount"></span>
      </div>
      <div class="list" id="myList" aria-live="polite"></div>
      <div class="loader" id="listLoading" hidden><span class="spinner" aria-hidden="true"></span><span>加载中</span></div>
      <div class="empty" id="listEmpty" hidden>
        <svg class="empty__icon" width="52" height="52" viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="3" stroke="currentColor" stroke-width="1.4"/><path d="M10.4 9.6l4.6 2.4-4.6 2.4V9.6z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/></svg>
        <p class="empty__title" id="listEmptyTitle">这里还没有内容</p>
        <p class="empty__desc" id="listEmptyDesc">去首页看看精彩内容吧</p>
      </div>
    </section>

    <div class="section" id="actionSection" hidden>
      <div class="section__head">
        <button class="btn btn--ghost btn--block" id="logoutBtn" type="button">退出登录</button>
      </div>
    </div>

  </main>

  <nav class="tabbar" aria-label="底部导航">
    <a class="tabbar__item" data-nav="home" href="index.html">
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 10.4L12 4l8 6.4V19a1 1 0 0 1-1 1h-4.5v-5.5h-5V20H5a1 1 0 0 1-1-1v-8.6z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></svg>
      <span>首页</span>
    </a>
    <a class="tabbar__item" data-nav="search" href="search.html">
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="11" cy="11" r="6.4" stroke="currentColor" stroke-width="1.7"/><path d="M15.8 15.8L20 20" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>
      <span>搜索</span>
    </a>
    <a class="tabbar__item tabbar__publish" href="index.html#publish" aria-label="投稿">
      <span class="tabbar__publish-btn">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
      </span>
    </a>
    <a class="tabbar__item" data-nav="message" href="message.html">
      <span style="position:relative;display:inline-flex;">
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v8a2.5 2.5 0 0 1-2.5 2.5H10l-4.6 3.2A.6.6 0 0 1 4.5 19.6V6.5z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></svg>
        <span class="badge" data-unread-badge hidden style="top:-2px;left:12px;"></span>
      </span>
      <span>消息</span>
    </a>
    <a class="tabbar__item" data-nav="mine" href="mine.html">
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="8.4" r="3.9" stroke="currentColor" stroke-width="1.7"/><path d="M4.8 20c0-3.4 3.2-5.6 7.2-5.6s7.2 2.2 7.2 5.6" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>
      <span>我的</span>
    </a>
  </nav>

</div>
<script src="assets/js/core.js"></script>
<script src="assets/js/mine.js"></script>
</body>
</html>

```

```text
file=search.html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
<meta name="theme-color" content="#FB7299" />
<title>BiliLite - 搜索</title>
<link rel="stylesheet" href="assets/css/app.css" />
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='8' fill='%23FB7299'/%3E%3Ctext x='16' y='22' font-size='16' text-anchor='middle' fill='%23fff' font-family='sans-serif'%3EB%3C/text%3E%3C/svg%3E" />
</head>
<body data-page="search">
<div class="app">

  <header class="statusbar" aria-label="状态栏">
    <span data-clock>09:41</span>
    <span class="statusbar__right">
      <svg width="16" height="12" viewBox="0 0 16 12" fill="none" aria-hidden="true"><rect x="0" y="8" width="3" height="4" rx="1" fill="currentColor"/><rect x="4.5" y="5.5" width="3" height="6.5" rx="1" fill="currentColor"/><rect x="9" y="3" width="3" height="9" rx="1" fill="currentColor"/><rect x="13.5" y="0" width="2.5" height="12" rx="1" fill="currentColor"/></svg>
      <svg width="16" height="12" viewBox="0 0 16 12" fill="none" aria-hidden="true"><path d="M8 10.5l2.2-2.6a3.3 3.3 0 0 0-4.4 0L8 10.5z" fill="currentColor"/><path d="M4.2 5.6a6 6 0 0 1 7.6 0M1.6 3a9.4 9.4 0 0 1 12.8 0" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>
      <svg width="22" height="12" viewBox="0 0 22 12" fill="none" aria-hidden="true"><rect x="0.6" y="0.6" width="18" height="10.8" rx="3" stroke="currentColor" stroke-width="1.1"/><rect x="2.2" y="2.2" width="13" height="7.6" rx="1.8" fill="currentColor"/><path d="M20.4 4v4c1.2-.4 1.6-1 1.6-2s-.4-1.6-1.6-2z" fill="currentColor"/></svg>
    </span>
  </header>

  <header class="appbar appbar--center">
    <a class="iconbtn" href="index.html" aria-label="返回首页">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M14.5 5.5L8 12l6.5 6.5" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/></svg>
    </a>
    <h1 class="appbar__title">搜索</h1>
    <span style="width:32px;"></span>
  </header>

  <div class="searchbar">
    <label class="search-page__field" for="searchInput">
      <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true"><circle cx="7" cy="7" r="5" stroke="currentColor" stroke-width="1.6"/><path d="M11 11l3.4 3.4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>
      <input id="searchInput" type="search" placeholder="搜索你感兴趣的视频" autocomplete="off" />
    </label>
    <button class="searchbar__submit" id="searchBtn" type="button">搜索</button>
  </div>

  <main class="page page--plain" id="main">

    <section aria-labelledby="historyTitle" id="historyBlock">
      <div class="block-head">
        <span id="historyTitle">最近搜索</span>
        <button class="block-head__action" id="clearHistory" type="button">清空</button>
      </div>
      <div class="chip-row" id="historyChips"></div>
    </section>

    <section aria-labelledby="hotTitle" id="hotBlock">
      <div class="block-head">
        <span id="hotTitle">热门搜索</span>
      </div>
      <div class="chip-row" id="hotChips"></div>
    </section>

    <section id="resultBlock" hidden>
      <div class="block-head">
        <span id="resultTitle">搜索结果</span>
        <span class="block-head__action" id="resultCount"></span>
      </div>
      <div class="list" id="resultList"></div>
      <div class="loader" id="resultLoading" hidden><span class="spinner" aria-hidden="true"></span><span>搜索中</span></div>
    </section>

    <div class="empty" id="emptyState" hidden>
      <svg class="empty__icon" width="56" height="56" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="1.4"/><path d="M16.2 16.2L21 21" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><path d="M8.5 11h5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>
      <p class="empty__title">没有找到相关视频</p>
      <p class="empty__desc">换个关键词试试吧</p>
    </div>

  </main>

  <nav class="tabbar" aria-label="底部导航">
    <a class="tabbar__item" data-nav="home" href="index.html">
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 10.4L12 4l8 6.4V19a1 1 0 0 1-1 1h-4.5v-5.5h-5V20H5a1 1 0 0 1-1-1v-8.6z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></svg>
      <span>首页</span>
    </a>
    <a class="tabbar__item" data-nav="search" href="search.html">
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="11" cy="11" r="6.4" stroke="currentColor" stroke-width="1.7"/><path d="M15.8 15.8L20 20" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>
      <span>搜索</span>
    </a>
    <button class="tabbar__item tabbar__publish" id="publishBtn" type="button" aria-label="投稿">
      <span class="tabbar__publish-btn">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
      </span>
    </button>
    <a class="tabbar__item" data-nav="message" href="message.html">
      <span style="position:relative;display:inline-flex;">
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v8a2.5 2.5 0 0 1-2.5 2.5H10l-4.6 3.2A.6.6 0 0 1 4.5 19.6V6.5z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></svg>
        <span class="badge" data-unread-badge hidden style="top:-2px;left:12px;"></span>
      </span>
      <span>消息</span>
    </a>
    <a class="tabbar__item" data-nav="mine" href="mine.html">
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="8.4" r="3.9" stroke="currentColor" stroke-width="1.7"/><path d="M4.8 20c0-3.4 3.2-5.6 7.2-5.6s7.2 2.2 7.2 5.6" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>
      <span>我的</span>
    </a>
  </nav>

  <!-- 投稿弹层 -->
  <div class="sheet" id="publishSheet" role="dialog" aria-modal="true" aria-labelledby="publishTitle">
    <div class="sheet__mask" data-close-sheet></div>
    <div class="sheet__panel">
      <div class="sheet__head">
        <h2 class="sheet__title" id="publishTitle">投稿</h2>
        <button class="sheet__close" type="button" data-close-sheet aria-label="关闭">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
        </button>
      </div>
      <form id="publishForm" novalidate>
        <div class="field">
          <label class="field__label" for="pubTitle">标题</label>
          <input class="input" id="pubTitle" name="title" type="text" maxlength="60" placeholder="起个好名字，标题最多 60 字" />
        </div>
        <div class="field">
          <label class="field__label" for="pubDesc">简介</label>
          <textarea class="textarea" id="pubDesc" name="desc" maxlength="500" placeholder="简单介绍一下你的作品"></textarea>
        </div>
        <div class="field">
          <label class="field__label" for="pubCat">分区</label>
          <select class="select" id="pubCat" name="cat">
            <option>动画</option><option>音乐</option><option>游戏</option><option>科技</option>
            <option>生活</option><option>知识</option><option>影视</option><option>美食</option>
          </select>
        </div>
        <div class="field">
          <span class="field__label">封面配色</span>
          <div class="color-row">
            <input id="pubColorA" type="color" value="#3a3550" aria-label="封面色 A" />
            <input id="pubColorB" type="color" value="#6d6390" aria-label="封面色 B" />
          </div>
        </div>
        <p class="form-error" id="pubError" role="alert"></p>
        <button class="btn btn--primary btn--block" type="submit" id="pubSubmit">发布投稿</button>
      </form>
    </div>
  </div>

</div>
<script src="assets/js/core.js"></script>
<script src="assets/js/search.js"></script>
</body>
</html>

```

```text
file=video.html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
<meta name="theme-color" content="#FB7299" />
<title>BiliLite - 播放</title>
<link rel="stylesheet" href="assets/css/app.css" />
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='8' fill='%23FB7299'/%3E%3Ctext x='16' y='22' font-size='16' text-anchor='middle' fill='%23fff' font-family='sans-serif'%3EB%3C/text%3E%3C/svg%3E" />
</head>
<body data-page="video">
<div class="app">

  <header class="statusbar" aria-label="状态栏">
    <span data-clock>09:41</span>
    <span class="statusbar__right">
      <svg width="16" height="12" viewBox="0 0 16 12" fill="none" aria-hidden="true"><rect x="0" y="8" width="3" height="4" rx="1" fill="currentColor"/><rect x="4.5" y="5.5" width="3" height="6.5" rx="1" fill="currentColor"/><rect x="9" y="3" width="3" height="9" rx="1" fill="currentColor"/><rect x="13.5" y="0" width="2.5" height="12" rx="1" fill="currentColor"/></svg>
      <svg width="16" height="12" viewBox="0 0 16 12" fill="none" aria-hidden="true"><path d="M8 10.5l2.2-2.6a3.3 3.3 0 0 0-4.4 0L8 10.5z" fill="currentColor"/><path d="M4.2 5.6a6 6 0 0 1 7.6 0M1.6 3a9.4 9.4 0 0 1 12.8 0" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>
      <svg width="22" height="12" viewBox="0 0 22 12" fill="none" aria-hidden="true"><rect x="0.6" y="0.6" width="18" height="10.8" rx="3" stroke="currentColor" stroke-width="1.1"/><rect x="2.2" y="2.2" width="13" height="7.6" rx="1.8" fill="currentColor"/><path d="M20.4 4v4c1.2-.4 1.6-1 1.6-2s-.4-1.6-1.6-2z" fill="currentColor"/></svg>
    </span>
  </header>

  <header class="appbar">
    <a class="iconbtn" href="index.html" id="backBtn" aria-label="返回">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M14.5 5.5L8 12l6.5 6.5" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/></svg>
    </a>
    <h1 class="appbar__title" id="navTitle">视频</h1>
    <button class="iconbtn" id="shareBtn" type="button" aria-label="分享">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="18" cy="5.5" r="2.6" stroke="currentColor" stroke-width="1.6"/><circle cx="6" cy="12" r="2.6" stroke="currentColor" stroke-width="1.6"/><circle cx="18" cy="18.5" r="2.6" stroke="currentColor" stroke-width="1.6"/><path d="M8.3 10.8l7.4-4M8.3 13.2l7.4 4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>
    </button>
  </header>

  <main class="page" id="main">

    <!-- 播放器 -->
    <div class="player" id="player">
      <div class="player__stage" id="playerStage">
        <span class="player__hint" id="stageHint">演示播放画面</span>
      </div>
      <div class="player__center">
        <button class="player__playbtn" id="playBtn" type="button" aria-label="播放">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5.5v13l11-6.5-11-6.5z"/></svg>
        </button>
      </div>
      <div class="player__bar">
        <button class="player__ctrl" id="playToggle" type="button" aria-label="播放或暂停">播放</button>
        <div class="player__progress" id="progress" role="slider" aria-label="播放进度" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" tabindex="0">
          <div class="player__track"><div class="player__bar-fill" id="barFill"></div></div>
        </div>
        <span class="player__time"><span id="curTime">00:00</span> / <span id="totalTime">00:00</span></span>
        <button class="player__ctrl" id="speedBtn" type="button" aria-label="倍速">1x</button>
        <button class="player__ctrl" id="fullBtn" type="button" aria-label="全屏">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>
      </div>
    </div>

    <!-- 标题与数据 -->
    <section class="section" aria-labelledby="videoTitle">
      <h2 class="detail__title" id="videoTitle" style="padding:12px 16px 0;">加载中</h2>
      <div class="detail__stats" id="videoStats" style="padding:0 16px 12px;"></div>
    </section>

    <!-- UP 主卡片 -->
    <section class="upcard" id="upCard" aria-label="UP 主信息">
      <span class="avatar avatar--lg" id="upAvatar"></span>
      <div class="upcard__body">
        <div class="upcard__name" id="upName">—</div>
        <div class="upcard__meta" id="upMeta">—</div>
      </div>
      <div class="upcard__actions">
        <button class="btn btn--primary btn--sm" id="followBtn" type="button">关注</button>
        <button class="btn btn--ghost btn--sm" id="dmBtn" type="button">发消息</button>
      </div>
    </section>

    <!-- 简介 -->
    <section class="desc" id="descBox">
      <p class="desc__text" id="descText">暂无简介</p>
      <button class="desc__toggle" id="descToggle" type="button" hidden>展开</button>
    </section>

    <!-- 相关推荐 -->
    <section class="section" aria-labelledby="relatedTitle">
      <div class="section__head">
        <h3 class="section__title" id="relatedTitle">相关推荐</h3>
        <span class="section__more">换一批</span>
      </div>
      <div class="grid" id="relatedGrid"></div>
    </section>

    <!-- 评论 -->
    <section class="section" aria-labelledby="commentTitle">
      <div class="section__head">
        <h3 class="section__title" id="commentTitle">评论</h3>
        <span class="section__more" id="commentCount">0</span>
      </div>
      <form class="comment-form" id="commentForm">
        <input class="comment-form__input" id="commentInput" type="text" maxlength="200" placeholder="说点什么…" aria-label="评论内容" />
        <button class="btn btn--primary btn--sm" id="commentSubmit" type="submit">发送</button>
      </form>
      <div id="commentList"></div>
      <div class="loader" id="commentLoading" hidden><span class="spinner" aria-hidden="true"></span><span>加载评论</span></div>
    </section>

  </main>

  <!-- 底部操作栏 -->
  <div class="actionbar" id="actionBar">
    <button class="actionbar__item" id="likeBtn" type="button">
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M7 10.5v8.5H4.6A1.6 1.6 0 0 1 3 17.4v-5.3a1.6 1.6 0 0 1 1.6-1.6H7zM7 10.5l4.2-6.6A1.6 1.6 0 0 1 14 5.2l-.7 5.3h4.9a2 2 0 0 1 2 2.4l-1.3 5.6a2.2 2.2 0 0 1-2.2 1.7H7" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>
      <span id="likeText">点赞</span>
    </button>
    <button class="actionbar__item" id="favBtn" type="button">
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 4.2l2.3 4.8 5.2.7-3.8 3.7.9 5.2-4.6-2.5-4.6 2.5.9-5.2L4.5 9.7l5.2-.7L12 4.2z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>
      <span id="favText">收藏</span>
    </button>
    <button class="actionbar__item" id="coinBtn" type="button">
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="8.2" stroke="currentColor" stroke-width="1.6"/><path d="M12 7.4v9.2M9.6 9.6h3.6a1.8 1.8 0 0 1 0 3.6H9.6h3.9a1.8 1.8 0 0 1 0 3.6H9.6" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>
      <span id="coinText">投币</span>
    </button>
    <button class="actionbar__item" id="shareAction" type="button">
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="18" cy="5.5" r="2.6" stroke="currentColor" stroke-width="1.6"/><circle cx="6" cy="12" r="2.6" stroke="currentColor" stroke-width="1.6"/><circle cx="18" cy="18.5" r="2.6" stroke="currentColor" stroke-width="1.6"/><path d="M8.3 10.8l7.4-4M8.3 13.2l7.4 4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>
      <span>分享</span>
    </button>
  </div>

</div>
<script src="assets/js/core.js"></script>
<script src="assets/js/video.js"></script>
</body>
</html>

```
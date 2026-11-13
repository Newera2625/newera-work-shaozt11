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

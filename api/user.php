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

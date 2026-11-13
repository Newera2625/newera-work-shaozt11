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

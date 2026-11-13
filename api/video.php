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

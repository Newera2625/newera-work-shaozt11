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

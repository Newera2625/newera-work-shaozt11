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

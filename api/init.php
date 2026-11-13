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

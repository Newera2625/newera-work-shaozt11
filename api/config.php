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

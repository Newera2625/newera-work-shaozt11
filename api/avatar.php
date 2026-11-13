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

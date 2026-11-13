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

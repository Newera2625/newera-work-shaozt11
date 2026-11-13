<?php
/**
 * 公共引导文件：会话、JSON 输出、参数解析、通用工具
 */

declare(strict_types=1);

error_reporting(E_ALL);
ini_set('display_errors', '0');
ini_set('log_errors', '1');
date_default_timezone_set('Asia/Shanghai');

/** 站点配置 */
$GLOBALS['bili_config'] = require __DIR__ . '/config.php';

/**
 * 读取配置，支持 cfg('db.host') 形式
 */
function cfg(string $key, $default = null)
{
    $config = $GLOBALS['bili_config'];
    foreach (explode('.', $key) as $part) {
        if (!is_array($config) || !array_key_exists($part, $config)) {
            return $default;
        }
        $config = $config[$part];
    }
    return $config;
}

require_once __DIR__ . '/store.php';

/* ------------------------------------------------------------------ */
/* 会话                                                                */
/* ------------------------------------------------------------------ */

if (session_status() === PHP_SESSION_NONE) {
    session_name((string)cfg('session_name', 'BILILITE_SID'));
    if (PHP_VERSION_ID >= 70300) {
        session_set_cookie_params([
            'httponly' => true,
            'samesite' => 'Lax',
            'path'     => '/',
        ]);
    } else {
        session_set_cookie_params(0, '/');
    }
    @session_start();
}

/* ------------------------------------------------------------------ */
/* 异常与致命错误：统一输出 JSON，绝不输出 HTML 报错页                  */
/* ------------------------------------------------------------------ */

set_exception_handler(function (Throwable $e) {
    json_out([
        'code' => 500,
        'msg'  => '服务器内部错误：' . $e->getMessage(),
        'data' => null,
    ]);
});

register_shutdown_function(function () {
    $err = error_get_last();
    if (!$err) {
        return;
    }
    if (!in_array($err['type'], [E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR], true)) {
        return;
    }
    if (headers_sent()) {
        return;
    }
    json_out([
        'code' => 500,
        'msg'  => '服务器错误：' . $err['message'],
        'data' => null,
    ]);
});

/* ------------------------------------------------------------------ */
/* JSON 输出                                                           */
/* ------------------------------------------------------------------ */

function json_out(array $payload, int $status = 200): void
{
    static $done = false;
    if ($done) {
        return;
    }
    $done = true;
    if (!headers_sent()) {
        http_response_code($status);
        header('Content-Type: application/json; charset=utf-8');
        header('Cache-Control: no-store, no-cache, must-revalidate');
        header('X-Content-Type-Options: nosniff');
    }
    $json = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    if ($json === false) {
        $json = '{"code":500,"msg":"数据编码失败","data":null}';
    }
    echo $json;
    exit;
}

/** 成功响应 */
function ok($data = null, string $msg = 'ok'): void
{
    json_out(['code' => 0, 'msg' => $msg, 'data' => $data]);
}

/** 失败响应（HTTP 状态码始终 200，业务错误通过 code 表达） */
function fail(string $msg = '请求失败', int $code = 400): void
{
    json_out(['code' => $code, 'msg' => $msg, 'data' => null]);
}

/* ------------------------------------------------------------------ */
/* 参数解析                                                            */
/* ------------------------------------------------------------------ */

function body_json(): array
{
    static $body = null;
    if ($body === null) {
        $body = [];
        $raw = file_get_contents('php://input');
        if (is_string($raw) && $raw !== '') {
            $decoded = json_decode($raw, true);
            if (is_array($decoded)) {
                $body = $decoded;
            } else {
                $form = [];
                parse_str($raw, $form);
                $body = $form;
            }
        }
    }
    return $body;
}

/** 统一取参：请求体优先，其次 GET / POST */
function param(string $key, $default = null)
{
    $body = body_json();
    if (array_key_exists($key, $body)) {
        return $body[$key];
    }
    if (isset($_GET[$key])) {
        return $_GET[$key];
    }
    if (isset($_POST[$key])) {
        return $_POST[$key];
    }
    return $default;
}

function str_param(string $key, string $default = ''): string
{
    $value = param($key, $default);
    if (is_array($value)) {
        return $default;
    }
    return trim((string)$value);
}

function int_param(string $key, int $default = 0): int
{
    $value = param($key, $default);
    if (is_array($value) || $value === null || $value === '') {
        return $default;
    }
    return (int)$value;
}

function bool_param(string $key, bool $default = false): bool
{
    $value = param($key, null);
    if ($value === null) {
        return $default;
    }
    if (is_bool($value)) {
        return $value;
    }
    $value = strtolower((string)$value);
    return in_array($value, ['1', 'true', 'yes', 'on'], true);
}

function is_post(): bool
{
    return strtoupper((string)($_SERVER['REQUEST_METHOD'] ?? 'GET')) === 'POST';
}

/* ------------------------------------------------------------------ */
/* 用户态                                                              */
/* ------------------------------------------------------------------ */

function current_uid(): ?string
{
    $uid = $_SESSION['uid'] ?? null;
    return is_string($uid) && $uid !== '' ? $uid : null;
}

/** 游客会话标识：用于游客的已读状态记录 */
function guest_uid(): string
{
    if (empty($_SESSION['guest_id'])) {
        $_SESSION['guest_id'] = 'g_' . bin2hex(random_bytes(6));
    }
    return (string)$_SESSION['guest_id'];
}

function current_user(): ?array
{
    $uid = current_uid();
    if ($uid === null) {
        return null;
    }
    $user = Store::find('users', $uid);
    if (!$user) {
        unset($_SESSION['uid']);
        return null;
    }
    return $user;
}

/** 需要登录，未登录直接输出错误并结束 */
function require_login(): string
{
    $uid = current_uid();
    if ($uid === null) {
        fail('请先登录后再试', 401);
    }
    return $uid;
}

/* ------------------------------------------------------------------ */
/* 工具函数                                                            */
/* ------------------------------------------------------------------ */

function now(): int
{
    return time();
}

function make_id(string $prefix = 'id'): string
{
    return $prefix . '_' . bin2hex(random_bytes(6));
}

/** HTML 转义 */
function h(?string $text): string
{
    return htmlspecialchars((string)$text, ENT_QUOTES, 'UTF-8');
}

/** 去除数组中的 null 键 */
function array_filter_null(array $data): array
{
    return array_filter($data, static function ($v) {
        return $v !== null;
    });
}

/** 用户公开字段（不含密码） */
function public_user(?array $user): ?array
{
    if (!$user) {
        return null;
    }
    return array_filter_null([
        'id'         => $user['id'] ?? '',
        'username'   => $user['username'] ?? '',
        'nickname'   => $user['nickname'] ?? ($user['username'] ?? ''),
        'level'      => (int)($user['level'] ?? 1),
        'signature'  => $user['signature'] ?? '',
        'avatar'     => $user['avatar'] ?? ($user['id'] ?? ''),
        'created_at' => (int)($user['created_at'] ?? 0),
        'following'  => (int)($user['following'] ?? 0),
        'followers'  => (int)($user['followers'] ?? 0),
        'likes'      => (int)($user['likes'] ?? 0),
    ]);
}

/** 视频列表项统一输出结构 */
function video_item(array $video, ?array $up = null): array
{
    if ($up === null) {
        $up = Store::find('users', (string)($video['uid'] ?? ''));
    }
    return array_filter_null([
        'id'          => (string)($video['id'] ?? ''),
        'title'       => (string)($video['title'] ?? ''),
        'desc'        => (string)($video['desc'] ?? ''),
        'cat'         => (string)($video['cat'] ?? ''),
        'tags'        => $video['tags'] ?? [],
        'duration'    => (int)($video['duration'] ?? 0),
        'views'       => (int)($video['views'] ?? 0),
        'likes'       => (int)($video['likes'] ?? 0),
        'coins'       => (int)($video['coins'] ?? 0),
        'favorites'   => (int)($video['favorites'] ?? 0),
        'danmaku'     => (int)($video['danmaku'] ?? 0),
        'comments'    => (int)($video['comments'] ?? 0),
        'cover_a'     => (string)($video['cover_a'] ?? '#2b2d42'),
        'cover_b'     => (string)($video['cover_b'] ?? '#4a4e69'),
        'published_at' => (int)($video['published_at'] ?? 0),
        'up_id'       => (string)($video['uid'] ?? ''),
        'up_name'     => (string)($up['nickname'] ?? '未知UP主'),
        'up_avatar'   => (string)($up['avatar'] ?? ($up['id'] ?? '')),
    ]);
}

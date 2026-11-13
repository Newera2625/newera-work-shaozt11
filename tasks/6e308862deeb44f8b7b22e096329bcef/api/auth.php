<?php
/**
 * 账号体系：注册 / 登录 / 退出 / 当前用户
 */

declare(strict_types=1);
require_once __DIR__ . '/bootstrap.php';

$action = str_param('action', 'me');

switch ($action) {
    case 'register':
        $username = str_param('username');
        $password = (string)param('password', '');
        $confirm  = (string)param('confirm', $password);
        $nickname = str_param('nickname');

        if ($username === '') {
            fail('请输入账号', 4001);
        }
        if (mb_strlen($username) < 2 || mb_strlen($username) > 16) {
            fail('账号长度需为 2-16 位', 4002);
        }
        if (mb_strlen($password) < 6) {
            fail('密码长度不能少于 6 位', 4003);
        }
        if ($password !== $confirm) {
            fail('两次输入的密码不一致', 4004);
        }

        foreach (Store::all('users') as $row) {
            if ((string)($row['username'] ?? '') === $username) {
                fail('该账号已被注册，换一个试试', 4005);
            }
        }

        $uid = make_id('u');
        $user = [
            'id'         => $uid,
            'username'   => $username,
            'nickname'   => $nickname !== '' ? mb_substr($nickname, 0, 16) : $username,
            'password'   => password_hash($password, PASSWORD_DEFAULT),
            'level'      => 2,
            'signature'  => '这个人很懒，什么都没写',
            'avatar'     => $uid,
            'following'  => 0,
            'followers'  => 0,
            'likes'      => 0,
            'created_at' => now(),
        ];
        Store::insert('users', $user);
        $_SESSION['uid'] = $uid;
        ok(public_user($user), '注册成功，已自动登录');

    case 'login':
        $username = str_param('username');
        $password = (string)param('password', '');
        if ($username === '' || $password === '') {
            fail('请输入账号和密码', 4001);
        }
        $target = null;
        foreach (Store::all('users') as $row) {
            if ((string)($row['username'] ?? '') === $username) {
                $target = $row;
                break;
            }
        }
        if (!$target || !password_verify($password, (string)($target['password'] ?? ''))) {
            fail('账号或密码错误，请重新输入', 4002);
        }
        session_regenerate_id(true);
        $_SESSION['uid'] = (string)$target['id'];
        ok(public_user($target), '登录成功');

    case 'logout':
        $_SESSION = [];
        if (ini_get('session.use_cookies')) {
            $params = session_get_cookie_params();
            setcookie(session_name(), '', time() - 42000, $params['path'] ?? '/', $params['domain'] ?? '', (bool)($params['secure'] ?? false), (bool)($params['httponly'] ?? true));
        }
        @session_destroy();
        ok(null, '已退出登录');

    case 'me':
        $user = current_user();
        if (!$user) {
            ok(['logged_in' => false, 'user' => null]);
        }
        ok([
            'logged_in' => true,
            'user'      => public_user($user),
        ]);

    default:
        fail('不支持的操作：' . $action, 404);
}

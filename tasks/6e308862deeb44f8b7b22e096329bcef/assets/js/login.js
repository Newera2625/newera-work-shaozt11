/* ==========================================================================
   登录 / 注册页脚本
   ========================================================================== */

(function () {
  'use strict';

  var B = window.Bili;

  var mode = 'login';

  var loginTab = document.getElementById('loginTab');
  var registerTab = document.getElementById('registerTab');
  var form = document.getElementById('authForm');
  var usernameEl = document.getElementById('username');
  var nicknameEl = document.getElementById('nickname');
  var passwordEl = document.getElementById('password');
  var confirmEl = document.getElementById('confirm');
  var nicknameField = document.getElementById('nicknameField');
  var confirmField = document.getElementById('confirmField');
  var errorEl = document.getElementById('formError');
  var submitBtn = document.getElementById('submitBtn');
  var guestLink = document.getElementById('guestLink');
  var forgotLink = document.getElementById('forgotLink');
  var backBtn = document.getElementById('backBtn');

  var redirect = B.query('redirect', '');

  function safeRedirect() {
    if (!redirect) {
      return 'index.html';
    }
    // 仅允许站内相对路径，避免开放重定向
    if (redirect.charAt(0) === '/' || redirect.indexOf('://') !== -1) {
      return 'index.html';
    }
    return redirect;
  }

  function setMode(next) {
    mode = next;
    var isLogin = mode === 'login';
    loginTab.classList.toggle('is-active', isLogin);
    registerTab.classList.toggle('is-active', !isLogin);
    loginTab.setAttribute('aria-selected', isLogin ? 'true' : 'false');
    registerTab.setAttribute('aria-selected', isLogin ? 'false' : 'true');
    nicknameField.hidden = isLogin;
    confirmField.hidden = isLogin;
    submitBtn.textContent = isLogin ? '登 录' : '注 册';
    passwordEl.setAttribute('autocomplete', isLogin ? 'current-password' : 'new-password');
    errorEl.textContent = '';
  }

  loginTab.addEventListener('click', function () {
    setMode('login');
  });

  registerTab.addEventListener('click', function () {
    setMode('register');
  });

  forgotLink.addEventListener('click', function (e) {
    e.preventDefault();
    B.toast('演示环境未提供找回密码功能');
  });

  guestLink.setAttribute('href', safeRedirect());
  backBtn.setAttribute('href', safeRedirect());

  function validate() {
    var username = usernameEl.value.trim();
    var password = passwordEl.value;
    var confirm = confirmEl.value;

    if (!username) {
      return { ok: false, msg: '请输入账号' };
    }
    if (mode === 'register') {
      if (username.length < 2 || username.length > 16) {
        return { ok: false, msg: '账号长度需为 2-16 位' };
      }
      if (!password) {
        return { ok: false, msg: '请输入密码' };
      }
      if (password.length < 6) {
        return { ok: false, msg: '密码长度不能少于 6 位' };
      }
      if (password !== confirm) {
        return { ok: false, msg: '两次输入的密码不一致' };
      }
      return { ok: true, username: username, password: password, confirm: confirm };
    }

    if (!password) {
      return { ok: false, msg: '请输入密码' };
    }
    return { ok: true, username: username, password: password, confirm: confirm };
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    errorEl.textContent = '';

    var result = validate();
    if (!result.ok) {
      errorEl.textContent = result.msg;
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = mode === 'login' ? '登录中' : '注册中';

    var action = mode === 'login' ? 'login' : 'register';
    var payload = {
      username: result.username,
      password: result.password,
      confirm: result.confirm
    };
    if (mode === 'register') {
      payload.nickname = nicknameEl.value.trim();
    }

    B.request('auth', action, payload, 'POST')
      .then(function (user) {
        if (user) {
          B.setUser(user);
        }
        B.toast(mode === 'login' ? '登录成功' : '注册成功，已自动登录');
        window.setTimeout(function () {
          window.location.href = safeRedirect();
        }, 700);
      })
      .catch(function (err) {
        errorEl.textContent = err.message || '操作失败，请稍后再试';
        submitBtn.disabled = false;
        submitBtn.textContent = mode === 'login' ? '登 录' : '注 册';
      });
  });

  setMode('login');
})();

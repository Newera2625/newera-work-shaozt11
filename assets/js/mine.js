/* ==========================================================================
   我的页面脚本：资料卡、入口宫格、收藏 / 稍后再看 / 历史 / 投稿列表
   ========================================================================== */

(function () {
  'use strict';

  var B = window.Bili;

  var profileCard = document.getElementById('profileCard');
  var loginHint = document.getElementById('loginHint');
  var entriesEl = document.getElementById('entries');
  var listSection = document.getElementById('listSection');
  var listTitle = document.getElementById('listTitle');
  var listCount = document.getElementById('listCount');
  var listEl = document.getElementById('myList');
  var listLoading = document.getElementById('listLoading');
  var listEmpty = document.getElementById('listEmpty');
  var listEmptyTitle = document.getElementById('listEmptyTitle');
  var listEmptyDesc = document.getElementById('listEmptyDesc');
  var actionSection = document.getElementById('actionSection');
  var logoutBtn = document.getElementById('logoutBtn');

  var ENTRY_META = {
    videos: { title: '我的投稿', empty: '还没有投稿', desc: '点击底部加号发布你的第一条作品' },
    favorites: { title: '我的收藏', empty: '还没有收藏', desc: '在播放页点击收藏即可加入这里' },
    watch_later: { title: '稍后再看', empty: '暂存列表是空的', desc: '把想看的视频存起来慢慢看' },
    history: { title: '最近观看', empty: '还没有观看记录', desc: '看过的视频会自动出现在这里' }
  };

  var currentEntry = 'history';

  /* ------------------------------------------------------------------ */
  /* 资料                                                                */
  /* ------------------------------------------------------------------ */

  function renderProfile(user, stats) {
    profileCard.hidden = false;
    loginHint.hidden = true;
    entriesEl.hidden = false;
    actionSection.hidden = false;

    document.getElementById('profileAvatar').innerHTML =
      '<img src="' + B.avatarUrl(user) + '" alt="' + B.escapeHtml(user.nickname || '') + '" />';
    document.getElementById('profileName').textContent = user.nickname || user.username || '用户';
    document.getElementById('profileLevel').textContent = 'LV' + (user.level || 1);
    document.getElementById('profileSig').textContent = user.signature || '这个人很懒，什么都没写';
    document.getElementById('statFollowing').textContent = B.fmtCount(stats.following || 0);
    document.getElementById('statFollowers').textContent = B.fmtCount(stats.followers || 0);
    document.getElementById('statLikes').textContent = B.fmtCount(stats.likes || 0);
  }

  function showGuest() {
    profileCard.hidden = true;
    loginHint.hidden = false;
    entriesEl.hidden = true;
    listSection.hidden = true;
    actionSection.hidden = true;
  }

  function loadProfile() {
    return B.request('user', 'profile')
      .then(function (data) {
        var user = (data && data.user) || null;
        var stats = (data && data.stats) || {};
        if (!user) {
          showGuest();
          return;
        }
        renderProfile(user, stats);
      })
      .catch(function (err) {
        showGuest();
        B.toast(err.message || '加载个人资料失败');
      });
  }

  /* ------------------------------------------------------------------ */
  /* 列表                                                                */
  /* ------------------------------------------------------------------ */

  function renderList(items) {
    listEl.innerHTML = '';
    if (!items.length) {
      listEmpty.hidden = false;
      return;
    }
    listEmpty.hidden = true;
    var html = '';
    items.forEach(function (video) {
      html += B.videoRow(video, { time: video.watched_at ? B.fmtTime(video.watched_at) : '' });
    });
    listEl.innerHTML = html;
  }

  function loadList(entry) {
    var meta = ENTRY_META[entry] || ENTRY_META.history;
    currentEntry = entry;
    listTitle.textContent = meta.title;
    listEmptyTitle.textContent = meta.empty;
    listEmptyDesc.textContent = meta.desc;
    listSection.hidden = false;
    listLoading.hidden = false;
    listEl.innerHTML = '';
    listCount.textContent = '';

    B.request('user', entry)
      .then(function (data) {
        var items = (data && data.items) || [];
        renderList(items);
        listCount.textContent = items.length ? '共 ' + items.length + ' 个' : '';
        var counter = document.querySelector('[data-count="' + entry + '"]');
        if (counter) {
          counter.textContent = String(items.length);
        }
      })
      .catch(function (err) {
        renderList([]);
        B.toast(err.message || '加载失败，请稍后再试');
      })
      .then(function () {
        listLoading.hidden = true;
      });
  }

  B.qsa('.entry', entriesEl).forEach(function (btn) {
    btn.addEventListener('click', function () {
      var entry = btn.getAttribute('data-entry');
      if (entry === currentEntry) {
        loadList(entry);
        return;
      }
      loadList(entry);
    });
  });

  /* ------------------------------------------------------------------ */
  /* 其他                                                                */
  /* ------------------------------------------------------------------ */

  function onSetting() {
    B.toast('演示环境暂不支持资料编辑');
  }

  var settingBtn = document.getElementById('settingBtn');
  var settingBtn2 = document.getElementById('settingBtn2');
  if (settingBtn) {
    settingBtn.addEventListener('click', onSetting);
  }
  if (settingBtn2) {
    settingBtn2.addEventListener('click', onSetting);
  }

  logoutBtn.addEventListener('click', function () {
    logoutBtn.disabled = true;
    B.request('auth', 'logout', {}, 'POST')
      .then(function () {
        B.setUser(null);
        B.toast('已退出登录');
        window.location.reload();
      })
      .catch(function (err) {
        B.toast(err.message || '退出失败，请稍后再试');
        logoutBtn.disabled = false;
      });
  });

  /* ------------------------------------------------------------------ */
  /* 初始化                                                              */
  /* ------------------------------------------------------------------ */

  loadProfile().then(function () {
    if (!loginHint.hidden) {
      return;
    }
    loadList('history');
    // 统计收藏 / 稍后再看 / 投稿数量
    ['videos', 'favorites', 'watch_later'].forEach(function (entry) {
      B.request('user', entry)
        .then(function (data) {
          var counter = document.querySelector('[data-count="' + entry + '"]');
          if (counter) {
            counter.textContent = String((data && data.total) || 0);
          }
        })
        .catch(function () { /* 静默处理 */ });
    });
  });
})();

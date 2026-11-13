/* ==========================================================================
   首页脚本：频道切换、列表加载、触底加载更多、投稿
   ========================================================================== */

(function () {
  'use strict';

  var B = window.Bili;

  var state = {
    channel: 'recommend',
    cat: '',
    page: 1,
    hasMore: true,
    loading: false
  };

  var tabsEl = document.getElementById('channelTabs');
  var gridEl = document.getElementById('videoGrid');
  var loadingEl = document.getElementById('loading');
  var loadMoreEl = document.getElementById('loadMore');
  var emptyEl = document.getElementById('emptyState');
  var sheetEl = document.getElementById('publishSheet');
  var formEl = document.getElementById('publishForm');
  var errorEl = document.getElementById('pubError');
  var submitEl = document.getElementById('pubSubmit');
  var publishBtn = document.getElementById('publishBtn');

  /* ------------------------------------------------------------------ */
  /* 频道导航                                                            */
  /* ------------------------------------------------------------------ */

  function buildTabs(channels, categories) {
    tabsEl.innerHTML = '';
    channels.forEach(function (ch) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'tab' + (ch.key === state.channel ? ' is-active' : '');
      btn.textContent = ch.name;
      btn.setAttribute('data-channel', ch.key);
      btn.addEventListener('click', function () {
        if (state.channel === ch.key) {
          return;
        }
        state.channel = ch.key;
        state.cat = '';
        syncTabs();
        reload();
      });
      tabsEl.appendChild(btn);
    });

    categories.forEach(function (cat) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'tab' + (state.cat === cat ? ' is-active' : '');
      btn.textContent = cat;
      btn.setAttribute('data-cat', cat);
      btn.addEventListener('click', function () {
        if (state.cat === cat) {
          return;
        }
        state.cat = cat;
        state.channel = 'cat';
        syncTabs();
        reload();
      });
      tabsEl.appendChild(btn);
    });
  }

  function syncTabs() {
    B.qsa('.tab', tabsEl).forEach(function (tab) {
      var key = tab.getAttribute('data-channel');
      var cat = tab.getAttribute('data-cat');
      var active = cat ? state.cat === cat : state.channel === key && !state.cat;
      tab.classList.toggle('is-active', active);
    });
  }

  /* ------------------------------------------------------------------ */
  /* 列表渲染                                                            */
  /* ------------------------------------------------------------------ */

  function renderItems(items, append) {
    if (!append) {
      gridEl.innerHTML = '';
    }
    var html = '';
    items.forEach(function (v) {
      html += B.videoCard(v, { rank: v.rank });
    });
    gridEl.insertAdjacentHTML('beforeend', html);
    emptyEl.hidden = items.length > 0 || gridEl.children.length > 0;
  }

  function setLoading(on) {
    state.loading = on;
    loadingEl.hidden = !on;
    loadMoreEl.disabled = on;
    loadMoreEl.textContent = on ? '加载中' : (state.hasMore ? '换一批' : '没有更多了');
  }

  function load() {
    if (state.loading || !state.hasMore) {
      return;
    }
    setLoading(true);
    B.request('videos', 'list', {
      channel: state.channel,
      cat: state.cat,
      page: state.page,
      page_size: 10
    })
      .then(function (data) {
        var items = (data && data.items) || [];
        state.hasMore = !!(data && data.has_more);
        renderItems(items, state.page > 1);
        if (state.page === 1 && items.length === 0) {
          emptyEl.hidden = false;
        }
        if (!state.hasMore) {
          loadMoreEl.textContent = '没有更多了';
        }
      })
      .catch(function (err) {
        B.toast(err.message || '加载失败');
        emptyEl.hidden = false;
      })
      .then(function () {
        setLoading(false);
        loadMoreEl.textContent = state.hasMore ? '换一批' : '没有更多了';
      });
  }

  function reload() {
    state.page = 1;
    state.hasMore = true;
    gridEl.innerHTML = '';
    emptyEl.hidden = true;
    load();
  }

  /* ------------------------------------------------------------------ */
  /* 触底加载                                                            */
  /* ------------------------------------------------------------------ */

  loadMoreEl.addEventListener('click', function () {
    if (state.loading || !state.hasMore) {
      return;
    }
    state.page += 1;
    load();
  });

  function onScroll() {
    if (state.loading || !state.hasMore) {
      return;
    }
    var nearBottom = window.innerHeight + window.scrollY >= document.body.offsetHeight - 320;
    if (nearBottom) {
      state.page += 1;
      load();
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });

  /* ------------------------------------------------------------------ */
  /* 投稿                                                                */
  /* ------------------------------------------------------------------ */

  function openSheet() {
    if (!B.isLoggedIn()) {
      B.requireLogin('登录后即可投稿');
      return;
    }
    sheetEl.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    var titleInput = document.getElementById('pubTitle');
    if (titleInput) {
      titleInput.focus();
    }
  }

  function closeSheet() {
    sheetEl.classList.remove('is-open');
    document.body.style.overflow = '';
  }

  publishBtn.addEventListener('click', openSheet);
  B.qsa('[data-close-sheet]', sheetEl).forEach(function (el) {
    el.addEventListener('click', closeSheet);
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && sheetEl.classList.contains('is-open')) {
      closeSheet();
    }
  });

  formEl.addEventListener('submit', function (e) {
    e.preventDefault();
    errorEl.textContent = '';
    var title = document.getElementById('pubTitle').value.trim();
    var desc = document.getElementById('pubDesc').value.trim();
    var cat = document.getElementById('pubCat').value;
    var colorA = document.getElementById('pubColorA').value;
    var colorB = document.getElementById('pubColorB').value;

    if (title.length < 2) {
      errorEl.textContent = '标题至少需要 2 个字';
      return;
    }
    if (title.length > 60) {
      errorEl.textContent = '标题不能超过 60 个字';
      return;
    }

    submitEl.disabled = true;
    submitEl.textContent = '发布中';

    B.request('videos', 'publish', {
      title: title,
      desc: desc,
      cat: cat,
      cover_a: colorA,
      cover_b: colorB
    }, 'POST')
      .then(function () {
        B.toast('投稿成功，已出现在动态频道');
        formEl.reset();
        closeSheet();
        state.channel = 'latest';
        state.cat = '';
        syncTabs();
        reload();
      })
      .catch(function (err) {
        errorEl.textContent = err.message || '投稿失败，请稍后再试';
      })
      .then(function () {
        submitEl.disabled = false;
        submitEl.textContent = '发布投稿';
      });
  });

  /* ------------------------------------------------------------------ */
  /* 初始化                                                              */
  /* ------------------------------------------------------------------ */

  B.request('videos', 'channels')
    .then(function (data) {
      buildTabs((data && data.channels) || [], (data && data.categories) || []);
      syncTabs();
      load();
    })
    .catch(function (err) {
      B.toast(err.message || '频道加载失败');
      emptyEl.hidden = false;
    });

  // 其他页面通过 index.html#publish 跳回来时，直接打开投稿弹层
  if (window.location.hash === '#publish') {
    window.setTimeout(function () {
      openSheet();
    }, 300);
  }
})();

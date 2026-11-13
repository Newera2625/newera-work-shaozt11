/* ==========================================================================
   搜索页脚本：历史、热门、结果检索
   ========================================================================== */

(function () {
  'use strict';

  var B = window.Bili;

  var inputEl = document.getElementById('searchInput');
  var btnEl = document.getElementById('searchBtn');
  var historyEl = document.getElementById('historyChips');
  var hotEl = document.getElementById('hotChips');
  var resultBlock = document.getElementById('resultBlock');
  var resultList = document.getElementById('resultList');
  var resultTitle = document.getElementById('resultTitle');
  var resultCount = document.getElementById('resultCount');
  var resultLoading = document.getElementById('resultLoading');
  var emptyEl = document.getElementById('emptyState');
  var clearBtn = document.getElementById('clearHistory');
  var historyBlock = document.getElementById('historyBlock');
  var hotBlock = document.getElementById('hotBlock');

  /* ------------------------------------------------------------------ */
  /* 最近搜索（本地缓存 + 服务端同步）                                    */
  /* ------------------------------------------------------------------ */

  var LOCAL_KEY = 'bili_search_history';

  function localHistory() {
    try {
      var raw = window.localStorage.getItem(LOCAL_KEY);
      var arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr : [];
    } catch (e) {
      return [];
    }
  }

  function saveLocalHistory(list) {
    try {
      window.localStorage.setItem(LOCAL_KEY, JSON.stringify(list.slice(0, 20)));
    } catch (e) {
      /* 忽略存储异常 */
    }
  }

  function renderHistory(words) {
    historyEl.innerHTML = '';
    if (!words.length) {
      var span = document.createElement('span');
      span.className = 'fs-sm text-3';
      span.textContent = '暂无搜索记录';
      historyEl.appendChild(span);
      return;
    }
    words.forEach(function (word) {
      var chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'chip';
      chip.textContent = word;
      chip.addEventListener('click', function () {
        inputEl.value = word;
        doSearch(word);
      });
      historyEl.appendChild(chip);
    });
  }

  function loadHistory() {
    var local = localHistory();
    renderHistory(local);
    if (!B.isLoggedIn()) {
      return;
    }
    B.request('search', 'history')
      .then(function (data) {
        var items = (data && data.items) || [];
        var words = items.map(function (i) { return i.word; });
        var merged = words.slice();
        local.forEach(function (w) {
          if (merged.indexOf(w) === -1) {
            merged.push(w);
          }
        });
        renderHistory(merged);
      })
      .catch(function () { /* 静默处理 */ });
  }

  clearBtn.addEventListener('click', function () {
    var local = localHistory();
    saveLocalHistory([]);
    renderHistory([]);
    if (B.isLoggedIn()) {
      B.request('search', 'history_clear', {}, 'POST')
        .then(function () { B.toast('搜索历史已清空'); })
        .catch(function () { B.toast('清空失败，请稍后再试'); });
    } else {
      B.toast('搜索历史已清空');
    }
  });

  /* ------------------------------------------------------------------ */
  /* 热门搜索                                                            */
  /* ------------------------------------------------------------------ */

  function loadHot() {
    B.request('search', 'hot')
      .then(function (data) {
        var items = (data && data.items) || [];
        hotEl.innerHTML = '';
        items.forEach(function (item) {
          var chip = document.createElement('button');
          chip.type = 'button';
          chip.className = 'chip';
          chip.textContent = item.word;
          chip.addEventListener('click', function () {
            inputEl.value = item.word;
            doSearch(item.word);
          });
          hotEl.appendChild(chip);
        });
      })
      .catch(function () {
        hotEl.innerHTML = '<span class="fs-sm text-3">热门搜索暂时不可用</span>';
      });
  }

  /* ------------------------------------------------------------------ */
  /* 搜索                                                                */
  /* ------------------------------------------------------------------ */

  function doSearch(keyword) {
    var word = (keyword || inputEl.value || '').trim();
    if (!word) {
      B.toast('请输入搜索关键词');
      inputEl.focus();
      return;
    }
    inputEl.value = word;

    // 记录本地历史（按时间倒序，去重）
    var local = localHistory().filter(function (w) { return w !== word; });
    local.unshift(word);
    saveLocalHistory(local);
    renderHistory(local);

    if (B.isLoggedIn()) {
      B.request('search', 'history_add', { word: word }, 'POST')
        .then(function () { loadHistory(); })
        .catch(function () { /* 静默处理 */ });
    }

    resultBlock.hidden = false;
    emptyEl.hidden = true;
    resultLoading.hidden = false;
    resultList.innerHTML = '';
    resultTitle.textContent = '搜索「' + word + '」';
    resultCount.textContent = '搜索中';

    B.request('search', 'search', { q: word })
      .then(function (data) {
        var items = (data && data.items) || [];
        resultCount.textContent = '共 ' + ((data && data.total) || 0) + ' 个结果';
        if (!items.length) {
          resultList.innerHTML = '';
          emptyEl.hidden = false;
          hotBlock.scrollIntoView({ behavior: 'smooth', block: 'start' });
          return;
        }
        var html = '';
        items.forEach(function (v) {
          html += B.videoRow(v, { keyword: word });
        });
        resultList.innerHTML = html;
      })
      .catch(function (err) {
        B.toast(err.message || '搜索失败');
        resultCount.textContent = '';
        emptyEl.hidden = false;
      })
      .then(function () {
        resultLoading.hidden = true;
      });
  }

  btnEl.addEventListener('click', function () {
    doSearch();
  });

  inputEl.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      doSearch();
    }
  });

  /* ------------------------------------------------------------------ */
  /* 分享 / 投稿入口                                                     */
  /* ------------------------------------------------------------------ */

  var publishBtn = document.getElementById('publishBtn');
  var sheetEl = document.getElementById('publishSheet');
  var formEl = document.getElementById('publishForm');
  var errorEl = document.getElementById('pubError');
  var submitEl = document.getElementById('pubSubmit');

  function closeSheet() {
    sheetEl.classList.remove('is-open');
    document.body.style.overflow = '';
  }

  publishBtn.addEventListener('click', function () {
    if (!B.isLoggedIn()) {
      B.requireLogin('登录后即可投稿');
      return;
    }
    sheetEl.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  });

  B.qsa('[data-close-sheet]', sheetEl).forEach(function (el) {
    el.addEventListener('click', closeSheet);
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
    submitEl.disabled = true;
    submitEl.textContent = '发布中';
    B.request('videos', 'publish', {
      title: title, desc: desc, cat: cat, cover_a: colorA, cover_b: colorB
    }, 'POST')
      .then(function () {
        B.toast('投稿成功');
        formEl.reset();
        closeSheet();
      })
      .catch(function (err) {
        errorEl.textContent = err.message || '投稿失败';
      })
      .then(function () {
        submitEl.disabled = false;
        submitEl.textContent = '发布投稿';
      });
  });

  /* ------------------------------------------------------------------ */
  /* 初始化                                                              */
  /* ------------------------------------------------------------------ */

  loadHistory();
  loadHot();

  var preset = B.query('q', '');
  if (preset) {
    inputEl.value = preset;
    doSearch(preset);
  } else {
    inputEl.focus();
  }
})();

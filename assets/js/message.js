/* ==========================================================================
   消息页脚本：分段切换、列表加载、未读标记、全部已读
   ========================================================================== */

(function () {
  'use strict';

  var B = window.Bili;

  var state = {
    type: 'notice',
    page: 1,
    hasMore: true,
    loading: false
  };

  var listEl = document.getElementById('messageList');
  var loadingEl = document.getElementById('msgLoading');
  var loadMoreEl = document.getElementById('loadMore');
  var emptyEl = document.getElementById('emptyState');
  var readAllBtn = document.getElementById('readAllBtn');
  var segmentEl = document.getElementById('typeSegment');

  var TYPE_NAMES = {
    notice: '通知',
    dm: '私信',
    system: '系统'
  };

  /* ------------------------------------------------------------------ */
  /* 渲染                                                                */
  /* ------------------------------------------------------------------ */

  function messageRow(item) {
    var unread = item.unread ? '<span class="dot" aria-label="未读"></span>' : '';
    var time = B.fmtTime(item.created_at);
    return (
      '<div class="msg" data-mid="' + B.escapeHtml(item.id) + '" role="button" tabindex="0">' +
        '<span class="avatar">' +
          '<img src="' + B.avatarUrl({ id: item.from_avatar, avatar: item.from_avatar, nickname: item.from_name }) + '" alt="' + B.escapeHtml(item.from_name || '') + '" />' +
        '</span>' +
        '<div class="msg__body">' +
          '<p class="msg__title">' + B.escapeHtml(item.title || TYPE_NAMES[item.type] || '消息') + '</p>' +
          '<p class="msg__content">' + B.escapeHtml(item.content || '') + '</p>' +
          '<div class="msg__meta"><span>' + B.escapeHtml(time) + '</span></div>' +
        '</div>' +
        '<span class="msg__side">' + unread + '</span>' +
      '</div>'
    );
  }

  function render(items, append) {
    if (!append) {
      listEl.innerHTML = '';
    }
    if (!items.length) {
      if (!append) {
        emptyEl.hidden = false;
        listEl.innerHTML = '';
      }
      return;
    }
    var html = '';
    items.forEach(function (item) {
      html += messageRow(item);
    });
    listEl.insertAdjacentHTML('beforeend', html);
    emptyEl.hidden = true;
  }

  /* ------------------------------------------------------------------ */
  /* 加载                                                                */
  /* ------------------------------------------------------------------ */

  function setLoading(on) {
    state.loading = on;
    loadingEl.hidden = !on;
    loadMoreEl.disabled = on;
  }

  function load(append) {
    if (state.loading) {
      return;
    }
    if (!append && !state.hasMore) {
      return;
    }
    setLoading(true);
    B.request('messages', 'list', {
      type: state.type,
      page: state.page,
      page_size: 15
    })
      .then(function (data) {
        var items = (data && data.items) || [];
        state.hasMore = !!(data && data.has_more);
        render(items, !!append);
        loadMoreEl.hidden = !state.hasMore;
        loadMoreEl.textContent = state.hasMore ? '加载更多' : '没有更多了';
      })
      .catch(function (err) {
        B.toast(err.message || '消息加载失败');
        if (!append) {
          emptyEl.hidden = false;
        }
      })
      .then(function () {
        setLoading(false);
      });
  }

  function reload() {
    state.page = 1;
    state.hasMore = true;
    listEl.innerHTML = '';
    emptyEl.hidden = true;
    load(false);
  }

  /* ------------------------------------------------------------------ */
  /* 交互                                                                */
  /* ------------------------------------------------------------------ */

  B.qsa('.segment__item', segmentEl).forEach(function (btn) {
    btn.addEventListener('click', function () {
      var type = btn.getAttribute('data-type');
      if (type === state.type) {
        return;
      }
      state.type = type;
      B.qsa('.segment__item', segmentEl).forEach(function (other) {
        var active = other === btn;
        other.classList.toggle('is-active', active);
        other.setAttribute('aria-pressed', active ? 'true' : 'false');
      });
      reload();
    });
  });

  loadMoreEl.addEventListener('click', function () {
    if (state.loading || !state.hasMore) {
      return;
    }
    state.page += 1;
    load(true);
  });

  window.addEventListener('scroll', function () {
    if (state.loading || !state.hasMore) {
      return;
    }
    if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 260) {
      state.page += 1;
      load(true);
    }
  }, { passive: true });

  /* 单条消息点击后标记为已读 */
  function markRead(row) {
    var mid = row.getAttribute('data-mid');
    if (!mid || row.getAttribute('data-read') === '1') {
      return;
    }
    row.setAttribute('data-read', '1');
    var dot = row.querySelector('.dot');
    if (dot && dot.parentNode) {
      dot.parentNode.removeChild(dot);
    }
    if (!B.isLoggedIn()) {
      return;
    }
    B.request('messages', 'read', { id: mid }, 'POST')
      .then(function () {
        B.refreshUnread();
      })
      .catch(function () { /* 静默处理 */ });
  }

  listEl.addEventListener('click', function (e) {
    var row = e.target.closest ? e.target.closest('.msg') : null;
    if (row) {
      markRead(row);
    }
  });

  listEl.addEventListener('keydown', function (e) {
    if (e.key !== 'Enter' && e.key !== ' ') {
      return;
    }
    var row = e.target.closest ? e.target.closest('.msg') : null;
    if (row) {
      e.preventDefault();
      markRead(row);
    }
  });

  readAllBtn.addEventListener('click', function () {
    if (!B.isLoggedIn()) {
      B.requireLogin('登录后可以查看和标记私信');
      return;
    }
    readAllBtn.disabled = true;
    readAllBtn.textContent = '处理中';
    B.request('messages', 'read_all', {}, 'POST')
      .then(function () {
        B.toast('全部消息已读');
        reload();
        return B.refreshUnread();
      })
      .catch(function (err) {
        B.toast(err.message || '操作失败，请稍后再试');
      })
      .then(function () {
        readAllBtn.disabled = false;
        readAllBtn.textContent = '全部已读';
      });
  });

  /* ------------------------------------------------------------------ */
  /* 初始化                                                              */
  /* ------------------------------------------------------------------ */

  reload();
})();

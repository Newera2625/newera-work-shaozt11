/* ==========================================================================
   播放页脚本：模拟播放器、详情渲染、互动、评论
   ========================================================================== */

(function () {
  'use strict';

  var B = window.Bili;

  var videoId = B.query('id', '');

  var playerEl = document.getElementById('player');
  var playBtn = document.getElementById('playBtn');
  var playToggle = document.getElementById('playToggle');
  var speedBtn = document.getElementById('speedBtn');
  var fullBtn = document.getElementById('fullBtn');
  var progressEl = document.getElementById('progress');
  var barFill = document.getElementById('barFill');
  var curTimeEl = document.getElementById('curTime');
  var totalTimeEl = document.getElementById('totalTime');
  var stageHint = document.getElementById('stageHint');

  var titleEl = document.getElementById('videoTitle');
  var navTitle = document.getElementById('navTitle');
  var statsEl = document.getElementById('videoStats');
  var descText = document.getElementById('descText');
  var descToggle = document.getElementById('descToggle');
  var descBox = document.getElementById('descBox');
  var relatedGrid = document.getElementById('relatedGrid');
  var commentList = document.getElementById('commentList');
  var commentCount = document.getElementById('commentCount');
  var commentLoading = document.getElementById('commentLoading');
  var commentForm = document.getElementById('commentForm');
  var commentInput = document.getElementById('commentInput');
  var commentSubmit = document.getElementById('commentSubmit');

  var upAvatar = document.getElementById('upAvatar');
  var upName = document.getElementById('upName');
  var upMeta = document.getElementById('upMeta');
  var followBtn = document.getElementById('followBtn');
  var dmBtn = document.getElementById('dmBtn');

  var likeBtn = document.getElementById('likeBtn');
  var likeText = document.getElementById('likeText');
  var favBtn = document.getElementById('favBtn');
  var favText = document.getElementById('favText');
  var coinBtn = document.getElementById('coinBtn');
  var coinText = document.getElementById('coinText');
  var shareBtn = document.getElementById('shareBtn');
  var shareAction = document.getElementById('shareAction');

  /* ------------------------------------------------------------------ */
  /* 播放器状态                                                          */
  /* ------------------------------------------------------------------ */

  var player = {
    playing: false,
    current: 0,
    duration: 0,
    speed: 1,
    speeds: [1, 1.5, 2],
    timer: null,
    fullscreen: false
  };

  function renderProgress() {
    var ratio = player.duration ? (player.current / player.duration) : 0;
    var pct = Math.max(0, Math.min(100, ratio * 100));
    barFill.style.width = pct + '%';
    curTimeEl.textContent = B.fmtDuration(player.current);
    totalTimeEl.textContent = B.fmtDuration(player.duration);
    progressEl.setAttribute('aria-valuenow', String(Math.round(pct)));
    progressEl.setAttribute('aria-valuetext', B.fmtDuration(player.current) + ' / ' + B.fmtDuration(player.duration));
  }

  function setPlaying(playing) {
    player.playing = playing;
    playerEl.classList.toggle('is-playing', playing);
    playerEl.classList.toggle('is-paused', !playing);
    playToggle.textContent = playing ? '暂停' : '播放';
    playBtn.setAttribute('aria-label', playing ? '暂停' : '播放');
    stageHint.textContent = playing ? '正在播放 · ' + player.speed + 'x' : '演示播放画面';
    if (playing) {
      startTimer();
    } else {
      stopTimer();
    }
  }

  function startTimer() {
    stopTimer();
    player.timer = window.setInterval(function () {
      player.current += player.speed;
      if (player.current >= player.duration) {
        player.current = player.duration;
        renderProgress();
        setPlaying(false);
        reportHistory();
        return;
      }
      renderProgress();
    }, 1000);
  }

  function stopTimer() {
    if (player.timer) {
      window.clearInterval(player.timer);
      player.timer = null;
    }
  }

  playBtn.addEventListener('click', function () {
    setPlaying(!player.playing);
  });

  playToggle.addEventListener('click', function () {
    setPlaying(!player.playing);
  });

  speedBtn.addEventListener('click', function () {
    var idx = player.speeds.indexOf(player.speed);
    player.speed = player.speeds[(idx + 1) % player.speeds.length];
    speedBtn.textContent = player.speed + 'x';
    stageHint.textContent = player.playing ? '正在播放 · ' + player.speed + 'x' : '演示播放画面';
    B.toast('播放速度 ' + player.speed + 'x');
  });

  fullBtn.addEventListener('click', function () {
    player.fullscreen = !player.fullscreen;
    playerEl.classList.toggle('is-fullscreen', player.fullscreen);
    if (player.fullscreen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    B.toast(player.fullscreen ? '已全屏播放' : '已退出全屏');
  });

  progressEl.addEventListener('click', function (e) {
    var rect = progressEl.getBoundingClientRect();
    var ratio = (e.clientX - rect.left) / rect.width;
    ratio = Math.max(0, Math.min(1, ratio));
    player.current = Math.round(ratio * player.duration);
    renderProgress();
  });

  progressEl.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowRight') {
      player.current = Math.min(player.duration, player.current + 5);
      renderProgress();
    } else if (e.key === 'ArrowLeft') {
      player.current = Math.max(0, player.current - 5);
      renderProgress();
    }
  });

  /* ------------------------------------------------------------------ */
  /* 详情数据                                                            */
  /* ------------------------------------------------------------------ */

  var detail = null;

  function renderDetail(data) {
    detail = data;
    var video = data.video;
    var up = data.up || {};
    var state = data.state || {};

    titleEl.textContent = video.title;
    navTitle.textContent = video.title;
    document.title = video.title + ' - BiliLite';

    statsEl.innerHTML =
      '<span><b>' + B.fmtCount(video.views) + '</b> 播放</span>' +
      '<span><b>' + B.fmtCount(video.danmaku) + '</b> 弹幕</span>' +
      '<span><b>' + B.fmtCount(video.likes) + '</b> 点赞</span>' +
      '<span><b>' + B.fmtCount(video.coins) + '</b> 投币</span>' +
      '<span><b>' + B.fmtCount(video.favorites) + '</b> 收藏</span>';

    upAvatar.innerHTML = '<img src="' + B.avatarUrl({ id: up.id, avatar: up.avatar, nickname: up.nickname }) + '" alt="' + B.escapeHtml(up.nickname || '') + '" />';
    upName.textContent = up.nickname || '未知UP主';
    upMeta.textContent = B.fmtCount(up.followers || 0) + '粉丝 · ' + (up.signature || '');

    followBtn.textContent = data.followed ? '已关注' : '关注';
    followBtn.classList.toggle('btn--primary', !data.followed);
    followBtn.classList.toggle('btn--ghost', !!data.followed);

    descText.textContent = video.desc || '暂无简介';
    updateDescToggle();

    likeBtn.classList.toggle('is-active', !!state.liked);
    likeText.textContent = B.fmtCount(video.likes);
    favBtn.classList.toggle('is-active', !!state.favorited);
    favText.textContent = state.favorited ? '已收藏' : '收藏';
    coinText.textContent = B.fmtCount(video.coins);

    player.duration = video.duration || 0;
    player.current = 0;
    renderProgress();
  }

  function updateDescToggle() {
    var text = descText.textContent || '';
    var long = text.length > 40;
    descToggle.hidden = !long;
    descToggle.textContent = descBox.classList.contains('is-open') ? '收起' : '展开';
  }

  descToggle.addEventListener('click', function () {
    descBox.classList.toggle('is-open');
    updateDescToggle();
  });

  /* ------------------------------------------------------------------ */
  /* 互动                                                                */
  /* ------------------------------------------------------------------ */

  function interact(action, payload, onDone) {
    if (!B.isLoggedIn()) {
      B.requireLogin('登录后才能使用该功能');
      return;
    }
    B.request('interact', action, payload, 'POST')
      .then(function (data) {
        onDone(data);
      })
      .catch(function (err) {
        B.toast(err.message || '操作失败');
      });
  }

  likeBtn.addEventListener('click', function () {
    if (!detail) {
      return;
    }
    interact('like', { id: videoId }, function (data) {
      detail.video.likes = data.count;
      likeBtn.classList.toggle('is-active', !!data.liked);
      likeText.textContent = B.fmtCount(data.count);
      statsEl.querySelectorAll('span')[2].innerHTML = '<b>' + B.fmtCount(data.count) + '</b> 点赞';
      B.toast(data.liked ? '点赞成功' : '已取消点赞');
    });
  });

  favBtn.addEventListener('click', function () {
    if (!detail) {
      return;
    }
    interact('favorite', { id: videoId }, function (data) {
      detail.video.favorites = data.count;
      detail.state.favorited = data.favorited;
      favBtn.classList.toggle('is-active', !!data.favorited);
      favText.textContent = data.favorited ? '已收藏' : '收藏';
      statsEl.querySelectorAll('span')[4].innerHTML = '<b>' + B.fmtCount(data.count) + '</b> 收藏';
      B.toast(data.favorited ? '收藏成功，可在「我的-收藏」查看' : '已取消收藏');
    });
  });

  coinBtn.addEventListener('click', function () {
    if (!detail) {
      return;
    }
    interact('coin', { id: videoId }, function (data) {
      detail.video.coins = data.count;
      coinText.textContent = B.fmtCount(data.count);
      statsEl.querySelectorAll('span')[3].innerHTML = '<b>' + B.fmtCount(data.count) + '</b> 投币';
      B.toast('投币成功，感谢支持');
    });
  });

  followBtn.addEventListener('click', function () {
    if (!detail || !detail.up) {
      return;
    }
    interact('follow', { target_id: detail.up.id }, function (data) {
      detail.followed = data.followed;
      followBtn.textContent = data.followed ? '已关注' : '关注';
      followBtn.classList.toggle('btn--primary', !data.followed);
      followBtn.classList.toggle('btn--ghost', !!data.followed);
      B.toast(data.followed ? '关注成功' : '已取消关注');
    });
  });

  dmBtn.addEventListener('click', function () {
    if (!B.isLoggedIn()) {
      B.requireLogin('登录后才能发送私信');
      return;
    }
    B.toast('私信功能演示：已生成给「' + (detail && detail.up ? detail.up.nickname : 'UP主') + '」的会话');
  });

  function share() {
    var url = window.location.href;
    if (navigator.share) {
      navigator.share({ title: detail ? detail.video.title : 'BiliLite', url: url }).catch(function () { /* 取消分享 */ });
      return;
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(function () {
        B.toast('链接已复制到剪贴板');
      }).catch(function () {
        B.toast('复制失败，请手动复制地址栏链接');
      });
      return;
    }
    B.toast('分享链接：' + url);
  }

  shareBtn.addEventListener('click', share);
  shareAction.addEventListener('click', share);

  /* ------------------------------------------------------------------ */
  /* 相关推荐                                                            */
  /* ------------------------------------------------------------------ */

  function loadRelated() {
    B.request('video', 'related', { id: videoId })
      .then(function (data) {
        var items = (data && data.items) || [];
        relatedGrid.innerHTML = '';
        if (!items.length) {
          relatedGrid.innerHTML = '<p class="fs-sm text-3" style="grid-column:1/-1;padding:8px 0;">暂无相关推荐</p>';
          return;
        }
        items.forEach(function (v) {
          relatedGrid.insertAdjacentHTML('beforeend', B.videoCard(v));
        });
      })
      .catch(function () {
        relatedGrid.innerHTML = '<p class="fs-sm text-3" style="grid-column:1/-1;padding:8px 0;">相关推荐加载失败</p>';
      });
  }

  /* ------------------------------------------------------------------ */
  /* 评论                                                                */
  /* ------------------------------------------------------------------ */

  function renderComments(items) {
    if (!items.length) {
      commentList.innerHTML = '<p class="fs-sm text-3" style="padding:16px;text-align:center;">还没有评论，快来抢沙发</p>';
      return;
    }
    var html = '';
    items.forEach(function (c) {
      html +=
        '<div class="comment">' +
          '<span class="avatar avatar--sm"><img src="' + B.avatarUrl({ id: c.up_id || c.up_avatar, avatar: c.up_avatar, nickname: c.up_name }) + '" alt="" /></span>' +
          '<div class="comment__body">' +
            '<div class="comment__name">' + B.escapeHtml(c.up_name || '游客用户') + '</div>' +
            '<p class="comment__content">' + B.escapeHtml(c.content) + '</p>' +
            '<div class="comment__meta">' + B.fmtTime(c.created_at) + ' · ' + B.fmtCount(c.likes) + '赞</div>' +
          '</div>' +
        '</div>';
    });
    commentList.innerHTML = html;
  }

  function loadComments() {
    commentLoading.hidden = false;
    B.request('video', 'comments', { id: videoId })
      .then(function (data) {
        renderComments((data && data.items) || []);
        commentCount.textContent = String((data && data.total) || 0);
      })
      .catch(function (err) {
        commentList.innerHTML = '<p class="fs-sm text-3" style="padding:16px;text-align:center;">' + B.escapeHtml(err.message || '评论加载失败') + '</p>';
      })
      .then(function () {
        commentLoading.hidden = true;
      });
  }

  commentForm.addEventListener('submit', function (e) {
    e.preventDefault();
    var content = commentInput.value.trim();
    if (!content) {
      B.toast('说点什么再发送吧');
      return;
    }
    commentSubmit.disabled = true;
    B.request('video', 'comment', { vid: videoId, content: content }, 'POST')
      .then(function (item) {
        commentInput.value = '';
        commentCount.textContent = String((parseInt(commentCount.textContent, 10) || 0) + 1);
        if (commentList.querySelector('p')) {
          commentList.innerHTML = '';
        }
        commentList.insertAdjacentHTML('afterbegin',
          '<div class="comment">' +
            '<span class="avatar avatar--sm"><img src="' + B.avatarUrl({ id: 'guest', avatar: 'guest', nickname: item.up_name }) + '" alt="" /></span>' +
            '<div class="comment__body">' +
              '<div class="comment__name">' + B.escapeHtml(item.up_name || '游客用户') + '</div>' +
              '<p class="comment__content">' + B.escapeHtml(item.content) + '</p>' +
              '<div class="comment__meta">刚刚</div>' +
            '</div>' +
          '</div>');
        B.toast('评论发表成功');
      })
      .catch(function (err) {
        B.toast(err.message || '评论失败，请稍后再试');
      })
      .then(function () {
        commentSubmit.disabled = false;
      });
  });

  /* ------------------------------------------------------------------ */
  /* 观看历史上报                                                        */
  /* ------------------------------------------------------------------ */

  function reportHistory() {
    B.request('video', 'report', { id: videoId, duration: Math.floor(player.current) }, 'POST')
      .catch(function () { /* 静默处理 */ });
  }

  /* ------------------------------------------------------------------ */
  /* 初始化                                                              */
  /* ------------------------------------------------------------------ */

  if (!videoId) {
    titleEl.textContent = '视频不存在';
    B.toast('缺少视频 ID');
  } else {
    B.request('video', 'detail', { id: videoId })
      .then(function (data) {
        renderDetail(data);
        loadRelated();
        loadComments();
        // 进入页面即记录一次观看历史
        B.request('video', 'report', { id: videoId, duration: 0 }, 'POST')
          .catch(function () { /* 静默处理 */ });
      })
      .catch(function (err) {
        titleEl.textContent = '加载失败';
        navTitle.textContent = '加载失败';
        B.toast(err.message || '视频加载失败');
      });
  }
})();

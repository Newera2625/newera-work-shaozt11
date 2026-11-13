/* ==========================================================================
   BiliLite 公共脚本
   - 接口请求封装
   - 格式化工具
   - 卡片渲染
   - 通用交互（提示条、消息角标、登录态）
   ========================================================================== */

(function (global) {
  'use strict';

  var API_BASE = 'api/';
  var USER_KEY = 'bili_user';
  var TOKEN_KEY = 'bili_token';

  /* ------------------------------------------------------------------ */
  /* 基础工具                                                            */
  /* ------------------------------------------------------------------ */

  function qs(sel, root) {
    return (root || document).querySelector(sel);
  }

  function qsa(sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  }

  function escapeHtml(str) {
    return String(str === null || str === undefined ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function highlight(text, keyword) {
    var safe = escapeHtml(text);
    if (!keyword) {
      return safe;
    }
    var kw = escapeHtml(keyword).trim();
    if (!kw) {
      return safe;
    }
    try {
      var reg = new RegExp('(' + kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'gi');
      return safe.replace(reg, '<mark>$1</mark>');
    } catch (e) {
      return safe;
    }
  }

  /** 播放量 / 数字格式化：12345 -> 1.2万 */
  function fmtCount(num) {
    var n = Number(num) || 0;
    if (n >= 100000000) {
      return (n / 100000000).toFixed(1).replace(/\.0$/, '') + '亿';
    }
    if (n >= 10000) {
      return (n / 10000).toFixed(1).replace(/\.0$/, '') + '万';
    }
    return String(n);
  }

  /** 秒 -> mm:ss */
  function fmtDuration(sec) {
    var s = Math.max(0, Math.floor(Number(sec) || 0));
    var m = Math.floor(s / 60);
    var r = s % 60;
    return (m < 10 ? '0' : '') + m + ':' + (r < 10 ? '0' : '') + r;
  }

  /** 时间戳 -> 相对时间 */
  function fmtTime(ts) {
    var t = Number(ts) || 0;
    if (!t) {
      return '';
    }
    var diff = Math.floor(Date.now() / 1000) - t;
    if (diff < 60) {
      return '刚刚';
    }
    if (diff < 3600) {
      return Math.floor(diff / 60) + '分钟前';
    }
    if (diff < 86400) {
      return Math.floor(diff / 3600) + '小时前';
    }
    if (diff < 86400 * 30) {
      return Math.floor(diff / 86400) + '天前';
    }
    var d = new Date(t * 1000);
    return (d.getMonth() + 1) + '月' + d.getDate() + '日';
  }

  /** 时钟文本 */
  function fmtClock(ts) {
    var d = new Date((Number(ts) || Date.now() / 1000) * 1000);
    var h = d.getHours();
    var m = d.getMinutes();
    return (h < 10 ? '0' : '') + h + ':' + (m < 10 ? '0' : '') + m;
  }

  /** 查询参数 */
  function query(key, fallback) {
    var params = new URLSearchParams(global.location.search);
    var v = params.get(key);
    return v === null ? (fallback === undefined ? '' : fallback) : v;
  }

  /* ------------------------------------------------------------------ */
  /* 接口封装                                                            */
  /* ------------------------------------------------------------------ */

  /* ------------------------------------------------------------------ */
  /* 离线演示数据                                                        */
  /* 仅当页面以 file:// 协议直接打开（本地静态预览）时启用，              */
  /* 部署到 PHP 服务器后请求会走真实接口，不会进入这个分支。             */
  /* ------------------------------------------------------------------ */

  var MOCK_USERS = [
    { id: 'u_1', username: 'bilibili', nickname: '哔哩哔哩', level: 6, signature: '官方账号，陪你度过每一个快乐时刻', followers: 3000, following: 12, likes: 3000, avatar: 'u_1', password: '123456' },
    { id: 'u_2', username: 'music', nickname: '音乐播放器', level: 5, signature: '每天一首好听的旋律', followers: 860, following: 20, likes: 1200, avatar: 'u_2', password: '123456' },
    { id: 'u_3', username: 'gamer', nickname: '游戏解说君', level: 5, signature: '认真做游戏，也认真做内容', followers: 1200, following: 18, likes: 2400, avatar: 'u_3', password: '123456' },
    { id: 'u_4', username: 'tech', nickname: '科技前线', level: 4, signature: '用最简单的方式讲科技', followers: 420, following: 15, likes: 900, avatar: 'u_4', password: '123456' },
    { id: 'u_5', username: 'anime', nickname: '手绘动画社', level: 4, signature: '一帧一帧画给你看', followers: 260, following: 9, likes: 800, avatar: 'u_5', password: '123456' },
    { id: 'u_6', username: 'life', nickname: '生活日记本', level: 3, signature: '记录平凡日子里的闪光', followers: 188, following: 6, likes: 460, avatar: 'u_6', password: '123456' },
    { id: 'u_7', username: 'knowledge', nickname: '知识胶囊', level: 4, signature: '三分钟涨一个知识点', followers: 350, following: 11, likes: 700, avatar: 'u_7', password: '123456' },
    { id: 'u_8', username: 'food', nickname: '美食猎人', level: 3, signature: '好吃的东西值得被记录', followers: 150, following: 5, likes: 520, avatar: 'u_8', password: '123456' },
    { id: 'u_demo', username: 'demo', nickname: '新同学', level: 2, signature: '欢迎来到 BiliLite', followers: 36, following: 12, likes: 128, avatar: 'u_demo', password: '123456' }
  ];

  var MOCK_VIDEO_ROWS = [
    ['v_1', '【4K修复】三个镜头，讲透一部电影的开场', 'u_2', '影视', 734, 1286400, 86200, 24100, 3180, 9200, 26, '我们请来了三位剪辑师，用三个镜头拆解开场调度，看完你再看任何电影都会多一层理解。', '#2b2d42', '#4a4e69'],
    ['v_2', '十年之后重听《晴天》，你听出什么了吗', 'u_2', '音乐', 486, 986000, 64300, 15800, 2260, 12400, 48, '有些歌只是陪伴，有些歌是青春本身。这一期我们聊重听的意义。', '#3a2c4a', '#6b5b95'],
    ['v_3', '这波操作我给满分！名场面逐帧复盘', 'u_3', '游戏', 613, 1520400, 92400, 27600, 4120, 15600, 30, '这一次我们把节奏、站位、决策全部拆开，看看高手是怎么思考的。', '#1f3a5f', '#2c5f8a'],
    ['v_4', '手机摄影进阶：从构图到色彩，一次讲清', 'u_4', '科技', 528, 452000, 31500, 8200, 1580, 4300, 52, '不需要昂贵的设备，构图与调色才是分水岭，附赠实用参数表。', '#264653', '#3d6b74'],
    ['v_5', '手绘一只会飞的猫，全过程没有一笔擦掉', 'u_5', '动画', 372, 386000, 45200, 9600, 2240, 6800, 72, '从铅笔稿到成稿一共 11 小时，完整记录一只猫诞生记。', '#4a3f6b', '#7b6ca8'],
    ['v_6', '一个人的深夜食堂，简单又好吃的拌面', 'u_8', '美食', 298, 274000, 23800, 5400, 1720, 2600, 74, '十分钟做一碗面，厨房新手也不会翻车。', '#4a3730', '#8a6a5a'],
    ['v_7', '十分钟讲明白「复利」到底是个什么东西', 'u_7', '知识', 604, 512000, 38900, 11200, 2180, 5100, 96, '不聊玄学，只用最朴素的方式算一遍给你看。', '#33415e', '#5b6b8c'],
    ['v_8', '在城市最高点看日出，值了', 'u_6', '生活', 421, 168000, 15400, 3200, 980, 1900, 120, '四点半起床，爬二十八层楼，值当。', '#485563', '#7b8794'],
    ['v_9', '开箱！这台复古游戏机也太好玩了', 'u_3', '游戏', 517, 736000, 51200, 13900, 2960, 8300, 50, '开机那一声「滴」，是很多人的青春开关。', '#1d3557', '#457b9d'],
    ['v_10', '用脚本爬取自己的听歌记录，折腾一整晚', 'u_4', '科技', 892, 342000, 22700, 6800, 1340, 3700, 140, '从零到一的完整过程，附带可复用的思路。', '#2f3e46', '#52616b'],
    ['v_11', '钢琴改编版《起风了》，越听越上头', 'u_2', '音乐', 447, 1210000, 89300, 26400, 5240, 18700, 70, '把一段旋律拆成三个层次，重新铺一遍。', '#3b2f45', '#6d597a'],
    ['v_12', '猫咪的一天，用镜头记录 30 分钟', 'u_5', '动画', 1832, 486000, 37600, 8100, 2050, 4900, 98, '一只猫、三个纸箱、无限循环。', '#4c3b47', '#8a6274'],
    ['v_13', '徒步 20 公里，我在山里看了一场雾', 'u_6', '生活', 962, 218000, 19300, 4100, 1120, 2300, 160, '走过的路不会白走，看过的雾也是。', '#2f4034', '#5d7461'],
    ['v_16', '一碗牛肉面的十二种做法，总有一种适合你', 'u_8', '美食', 742, 632000, 46500, 12300, 2740, 7100, 92, '从汤底到配菜，一次讲透。', '#41352c', '#7f6552'],
    ['v_20', '我用一周时间戒掉了短视频', 'u_6', '生活', 688, 892000, 73600, 18800, 5820, 13400, 66, '不是失败记录，是一份可复制的实验报告。', '#3d3a35', '#787164']
  ];

  var MOCK_COMMENT_ROWS = [
    ['c_1', 'v_1', 'u_6', '第三个镜头的调度太舒服了，看完立刻想重看一遍原片。', 32, 1800],
    ['c_2', 'v_1', 'u_7', '剪辑思路讲得很清楚，建议出一期完整的后期教程。', 18, 5400],
    ['c_3', 'v_3', 'u_2', '这波真的教科书级别，收藏了。', 26, 1200],
    ['c_4', 'v_3', 'u_8', '评论区比游戏本身还精彩。', 11, 3600],
    ['c_5', 'v_5', 'u_4', '手绘过程太治愈了，一帧一帧看完全不腻。', 24, 900],
    ['c_6', 'v_7', 'u_3', '终于有人把复利讲人话了。', 40, 7200],
    ['c_7', 'v_7', 'u_6', '算完突然想赶紧开始存钱了。', 15, 4800],
    ['c_8', 'v_11', 'u_1', '钢琴版比原唱更有味道了。', 21, 2400],
    ['c_9', 'v_11', 'u_5', '求一份钢琴谱！', 8, 600],
    ['c_10', 'v_16', 'u_2', '汤底才是灵魂，记下了。', 13, 1500],
    ['c_11', 'v_20', 'u_7', '这条视频说出了我的心声，第七天最难熬。', 29, 300],
    ['c_12', 'v_13', 'u_3', '山里的雾拍得太有氛围感了。', 17, 4200]
  ];

  var MOCK_MESSAGE_ROWS = [
    ['m_1', 'notice', 'u_2', '音乐播放器 更新了投稿', '《十年之后重听晴天》已更新，欢迎来听。', 600],
    ['m_2', 'notice', 'u_3', '游戏解说君 更新了投稿', '名场面逐帧复盘第二期上线了。', 3600],
    ['m_3', 'dm', 'u_6', '生活日记本', '你好，明天想约个时间一起爬山吗？', 7200],
    ['m_4', 'system', 'u_1', '系统公告', 'BiliLite 移动端新版上线，欢迎反馈使用体验。', 86400],
    ['m_5', 'notice', 'u_7', '知识胶囊 更新了投稿', '三分钟讲明白复利，已发布。', 172800],
    ['m_6', 'dm', 'u_5', '手绘动画社', '上一张线稿的授权已经发你邮箱了，注意查收。', 259200],
    ['m_7', 'system', 'u_1', '账号安全提醒', '你的账号最近在新设备上登录，如非本人操作请及时修改密码。', 345600],
    ['m_8', 'notice', 'u_8', '美食猎人 更新了投稿', '牛肉面的十二种做法，附赠配方表。', 432000]
  ];

  function mockCopy(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  function mockNow() {
    return Math.floor(Date.now() / 1000);
  }

  function mockUserByName(state, username) {
    var found = null;
    (state.users || []).forEach(function (row) {
      if (row.username === username) {
        found = row;
      }
    });
    return found;
  }

  function mockUserById(state, id) {
    var found = null;
    (state.users || []).forEach(function (row) {
      if (row.id === id) {
        found = row;
      }
    });
    return found;
  }

  function mockCurrentUser(state) {
    if (!state.session) {
      return null;
    }
    return mockUserById(state, state.session.uid);
  }

  function mockPublicUser(user) {
    if (!user) {
      return null;
    }
    return {
      id: user.id,
      username: user.username,
      nickname: user.nickname,
      level: user.level,
      signature: user.signature || '',
      avatar: user.avatar || user.id,
      created_at: user.created_at || 0,
      following: user.following || 0,
      followers: user.followers || 0,
      likes: user.likes || 0
    };
  }

  function mockState() {
    var state = null;
    try {
      state = JSON.parse(global.localStorage.getItem('bili_mock_state') || 'null');
    } catch (e) {
      state = null;
    }
    if (!state || typeof state !== 'object') {
      state = {
        users: mockCopy(MOCK_USERS),
        videos: [],
        comments: [],
        messages: [],
        session: null,
        favorites: [],
        history: [],
        likes: [],
        coins: [],
        follows: [],
        watch_later: [],
        read: [],
        searches: []
      };
      var base = mockNow();
      state.videos = MOCK_VIDEO_ROWS.map(function (row) {
        var up = mockUserById(state, row[2]) || MOCK_USERS[0];
        return {
          id: row[0],
          title: row[1],
          uid: row[2],
          cat: row[3],
          duration: row[4],
          views: row[5],
          likes: row[6],
          coins: row[7],
          favorites: row[8],
          danmaku: row[9],
          desc: row[11],
          cover_a: row[12],
          cover_b: row[13],
          tags: [row[3], '精选', '推荐'],
          comments: 0,
          published_at: base - row[10] * 3600,
          up_name: up.nickname,
          up_avatar: up.avatar
        };
      });
      state.comments = MOCK_COMMENT_ROWS.map(function (row) {
        return {
          id: row[0],
          vid: row[1],
          uid: row[2],
          content: row[3],
          likes: row[4],
          created_at: base - row[5]
        };
      });
      state.messages = MOCK_MESSAGE_ROWS.map(function (row) {
        return {
          id: row[0],
          uid: 'all',
          type: row[1],
          from_uid: row[2],
          title: row[3],
          content: row[4],
          created_at: base - row[5]
        };
      });
      mockSave(state);
    }
    return state;
  }

  function mockSave(state) {
    try {
      global.localStorage.setItem('bili_mock_state', JSON.stringify(state));
    } catch (e) {
      /* 忽略存储异常 */
    }
  }

  function mockVideos(state) {
    if (!state.videos || !state.videos.length) {
      var base = mockNow();
      state.videos = MOCK_VIDEO_ROWS.map(function (row) {
        var up = mockUserById(state, row[2]) || MOCK_USERS[0];
        return {
          id: row[0],
          title: row[1],
          uid: row[2],
          cat: row[3],
          duration: row[4],
          views: row[5],
          likes: row[6],
          coins: row[7],
          favorites: row[8],
          danmaku: row[9],
          desc: row[11],
          cover_a: row[12],
          cover_b: row[13],
          tags: [row[3], '精选', '推荐'],
          comments: 0,
          published_at: base - row[10] * 3600,
          up_name: up.nickname,
          up_avatar: up.avatar
        };
      });
    }
    return state.videos;
  }

  function mockVideoItem(video) {
    return {
      id: video.id,
      title: video.title,
      desc: video.desc || '',
      cat: video.cat || '',
      tags: video.tags || [],
      duration: video.duration || 0,
      views: video.views || 0,
      likes: video.likes || 0,
      coins: video.coins || 0,
      favorites: video.favorites || 0,
      danmaku: video.danmaku || 0,
      comments: video.comments || 0,
      cover_a: video.cover_a || '#3a3550',
      cover_b: video.cover_b || '#6d6390',
      published_at: video.published_at || 0,
      up_id: video.uid || '',
      up_name: video.up_name || '未知UP主',
      up_avatar: video.up_avatar || video.uid || ''
    };
  }

  function mockFindVideo(state, id) {
    var found = null;
    mockVideos(state).forEach(function (video) {
      if (video.id === id) {
        found = video;
      }
    });
    return found;
  }

  function mockPickVideos(state, ids) {
    var items = [];
    ids.forEach(function (id) {
      var video = mockFindVideo(state, id);
      if (video) {
        items.push(mockVideoItem(video));
      }
    });
    return items;
  }

  function mockError(msg, code) {
    var err = new Error(msg);
    err.code = code || 400;
    return err;
  }

  function mockHotScore(video) {
    var ageDays = Math.max(0, (mockNow() - (video.published_at || mockNow())) / 86400);
    return (video.views || 0) * 0.25 + (video.likes || 0) * 3.5 + (video.coins || 0) * 9 +
      (video.favorites || 0) * 6 + (30 - Math.min(ageDays, 30)) * 40;
  }

  function mockRequest(file, action, params, method) {
    var state = mockState();
    var p = params || {};

    if (file === 'auth') {
      if (action === 'me') {
        var me = mockCurrentUser(state);
        return { logged_in: !!me, user: me ? mockPublicUser(me) : null };
      }
      if (action === 'register') {
        var username = String(p.username || '').trim();
        var password = String(p.password || '');
        var confirm = p.confirm === undefined ? password : String(p.confirm);
        var nickname = String(p.nickname || '').trim();
        if (!username) {
          throw mockError('请输入账号', 4001);
        }
        if (username.length < 2 || username.length > 16) {
          throw mockError('账号长度需为 2-16 位', 4002);
        }
        if (password.length < 6) {
          throw mockError('密码长度不能少于 6 位', 4003);
        }
        if (password !== confirm) {
          throw mockError('两次输入的密码不一致', 4004);
        }
        if (mockUserByName(state, username)) {
          throw mockError('该账号已被注册，换一个试试', 4005);
        }
        var uid = 'u_' + Math.random().toString(36).slice(2, 10);
        var user = {
          id: uid,
          username: username,
          nickname: nickname || username,
          password: password,
          level: 2,
          signature: '这个人很懒，什么都没写',
          avatar: uid,
          following: 0,
          followers: 0,
          likes: 0,
          created_at: mockNow()
        };
        state.users.push(user);
        state.session = { uid: uid };
        mockSave(state);
        return mockPublicUser(user);
      }
      if (action === 'login') {
        var name = String(p.username || '').trim();
        var pass = String(p.password || '');
        if (!name || !pass) {
          throw mockError('请输入账号和密码', 4001);
        }
        var target = mockUserByName(state, name);
        if (!target || target.password !== pass) {
          throw mockError('账号或密码错误，请重新输入', 4002);
        }
        state.session = { uid: target.id };
        mockSave(state);
        return mockPublicUser(target);
      }
      if (action === 'logout') {
        state.session = null;
        mockSave(state);
        return null;
      }
    }

    if (file === 'videos') {
      if (action === 'channels') {
        return {
          channels: [
            { key: 'recommend', name: '推荐' },
            { key: 'latest', name: '动态' },
            { key: 'rank', name: '排行榜' }
          ],
          categories: ['动画', '音乐', '游戏', '科技', '生活', '知识', '影视', '美食']
        };
      }
      if (action === 'list') {
        var channel = p.channel || 'recommend';
        var cat = p.cat || '';
        var page = Math.max(1, parseInt(p.page || 1, 10));
        var limit = Math.max(1, parseInt(p.page_size || 10, 10));
        var list = mockVideos(state).slice();
        if (channel === 'cat') {
          list = list.filter(function (video) {
            return video.cat === cat;
          });
        }
        if (channel === 'latest') {
          list.sort(function (a, b) {
            return b.published_at - a.published_at;
          });
        } else {
          list.sort(function (a, b) {
            return mockHotScore(b) - mockHotScore(a);
          });
        }
        var slice = list.slice((page - 1) * limit, page * limit);
        var items = slice.map(function (video, index) {
          var item = mockVideoItem(video);
          if (channel === 'rank') {
            item.rank = (page - 1) * limit + index + 1;
          }
          return item;
        });
        return {
          items: items,
          page: page,
          page_size: limit,
          total: list.length,
          has_more: page * limit < list.length,
          channel: channel,
          cat: cat
        };
      }
      if (action === 'publish') {
        var author = mockCurrentUser(state);
        if (!author) {
          throw mockError('请先登录后再试', 401);
        }
        var title = String(p.title || '').trim();
        if (title.length < 2 || title.length > 60) {
          throw mockError('标题长度需为 2-60 个字', 4001);
        }
        var vid = 'v_' + Math.random().toString(36).slice(2, 10);
        var video = {
          id: vid,
          title: title,
          uid: author.id,
          cat: p.cat || '生活',
          tags: [p.cat || '生活', '自制'],
          duration: 60,
          views: 0,
          likes: 0,
          coins: 0,
          favorites: 0,
          danmaku: 0,
          comments: 0,
          desc: String(p.desc || ''),
          cover_a: p.cover_a || '#3a3550',
          cover_b: p.cover_b || '#6d6390',
          published_at: mockNow(),
          up_name: author.nickname,
          up_avatar: author.avatar
        };
        mockVideos(state).push(video);
        mockSave(state);
        return { id: vid, video: mockVideoItem(video) };
      }
    }

    if (file === 'search') {
      if (action === 'search') {
        var keyword = String(p.q || p.keyword || '').trim();
        if (!keyword) {
          throw mockError('请输入搜索关键词', 4001);
        }
        var needle = keyword.toLowerCase();
        var results = [];
        mockVideos(state).forEach(function (video) {
          var score = 0;
          if (String(video.title || '').toLowerCase().indexOf(needle) >= 0) {
            score += 10;
          }
          if (String(video.desc || '').toLowerCase().indexOf(needle) >= 0) {
            score += 4;
          }
          if ((video.tags || []).join(',').toLowerCase().indexOf(needle) >= 0) {
            score += 6;
          }
          if (String(video.up_name || '').toLowerCase().indexOf(needle) >= 0) {
            score += 3;
          }
          if (score > 0) {
            var item = mockVideoItem(video);
            item.score = score;
            results.push(item);
          }
        });
        results.sort(function (a, b) {
          return (b.score - a.score) || (b.views - a.views);
        });
        return { keyword: keyword, items: results, total: results.length, page: 1, has_more: false };
      }
      if (action === 'hot') {
        return {
          items: ['推荐', '钢琴', '复利', '开箱', '游戏实况', '深夜电台', '手绘', '摄影', '徒步', '牛肉面']
            .map(function (word) {
              return { word: word, count: 1 };
            })
        };
      }
      if (action === 'history') {
        var rows = (state.searches || []).slice().sort(function (a, b) {
          return b.created_at - a.created_at;
        });
        return { items: rows.slice(0, 20) };
      }
      if (action === 'history_add') {
        var word = String(p.word || p.q || '').trim();
        if (!word) {
          throw mockError('搜索词不能为空', 4001);
        }
        state.searches = (state.searches || []).filter(function (row) {
          return row.word !== word;
        });
        state.searches.unshift({ word: word, created_at: mockNow() });
        state.searches = state.searches.slice(0, 20);
        mockSave(state);
        return { saved: true };
      }
      if (action === 'history_clear') {
        state.searches = [];
        mockSave(state);
        return { cleared: true };
      }
    }

    if (file === 'messages') {
      var reader = mockCurrentUser(state);
      var readerId = reader ? reader.id : 'guest';
      var readMap = {};
      (state.read || []).forEach(function (key) {
        readMap[key] = true;
      });
      if (action === 'list') {
        var type = p.type || 'all';
        var msgRows = (state.messages || []).filter(function (row) {
          return type === 'all' || row.type === type;
        });
        msgRows.sort(function (a, b) {
          return b.created_at - a.created_at;
        });
        var msgPage = Math.max(1, parseInt(p.page || 1, 10));
        var msgLimit = Math.max(1, parseInt(p.page_size || 15, 10));
        var msgSlice = msgRows.slice((msgPage - 1) * msgLimit, msgPage * msgLimit);
        return {
          items: msgSlice.map(function (row) {
            var from = mockUserById(state, row.from_uid) || {};
            return {
              id: row.id,
              type: row.type,
              title: row.title,
              content: row.content,
              created_at: row.created_at,
              unread: !readMap[readerId + '_' + row.id],
              from_name: from.nickname || '系统',
              from_avatar: from.avatar || row.from_uid
            };
          }),
          total: msgRows.length,
          page: msgPage,
          has_more: msgPage * msgLimit < msgRows.length
        };
      }
      if (action === 'unread') {
        var counts = { total: 0, notice: 0, dm: 0, system: 0 };
        (state.messages || []).forEach(function (row) {
          if (readMap[readerId + '_' + row.id]) {
            return;
          }
          counts.total += 1;
          if (counts[row.type] !== undefined) {
            counts[row.type] += 1;
          }
        });
        return counts;
      }
      if (action === 'read') {
        var mid = String(p.id || '');
        if (!mid) {
          throw mockError('缺少消息 ID', 4001);
        }
        var readKey = readerId + '_' + mid;
        if (state.read.indexOf(readKey) < 0) {
          state.read.push(readKey);
          mockSave(state);
        }
        return { id: mid };
      }
      if (action === 'read_all') {
        (state.messages || []).forEach(function (row) {
          var key = readerId + '_' + row.id;
          if (state.read.indexOf(key) < 0) {
            state.read.push(key);
          }
        });
        mockSave(state);
        return { cleared: true };
      }
    }

    if (file === 'user') {
      var current = mockCurrentUser(state);
      if (!current) {
        throw mockError('请先登录后再试', 401);
      }
      var myVideos = mockVideos(state).filter(function (video) {
        return video.uid === current.id;
      });
      var stats = {
        following: (state.follows || []).filter(function (row) { return row.uid === current.id; }).length,
        followers: (state.follows || []).filter(function (row) { return row.target_id === current.id; }).length,
        likes: myVideos.reduce(function (sum, video) { return sum + (video.likes || 0); }, 0),
        coins: (state.coins || []).filter(function (row) { return row.uid === current.id; }).length,
        videos: myVideos.length
      };
      if (action === 'profile') {
        var profile = mockPublicUser(current);
        profile.stats = stats;
        return { user: profile, stats: stats };
      }
      if (action === 'stats') {
        return stats;
      }
      if (action === 'favorites') {
        var favIds = (state.favorites || []).filter(function (row) {
          return row.uid === current.id;
        }).map(function (row) { return row.vid; });
        return { items: mockPickVideos(state, favIds), total: favIds.length };
      }
      if (action === 'history') {
        var historyRows = (state.history || []).filter(function (row) {
          return row.uid === current.id;
        }).sort(function (a, b) {
          return b.updated_at - a.updated_at;
        });
        var historyIds = historyRows.map(function (row) { return row.vid; });
        return { items: mockPickVideos(state, historyIds), total: historyIds.length };
      }
      if (action === 'videos') {
        var mine = myVideos.slice().sort(function (a, b) {
          return b.published_at - a.published_at;
        });
        return { items: mine.map(mockVideoItem), total: mine.length };
      }
      if (action === 'watch_later') {
        var laterIds = (state.watch_later || []).filter(function (row) {
          return row.uid === current.id;
        }).map(function (row) { return row.vid; });
        return { items: mockPickVideos(state, laterIds), total: laterIds.length };
      }
      if (action === 'following') {
        var followIds = (state.follows || []).filter(function (row) {
          return row.uid === current.id;
        }).map(function (row) { return mockPublicUser(mockUserById(state, row.target_id)); });
        return { items: followIds.filter(Boolean), total: followIds.length };
      }
    }

    if (file === 'video') {
      var targetId = String(p.id || p.vid || '');
      var video = mockFindVideo(state, targetId);
      if (action === 'detail') {
        if (!video) {
          throw mockError('视频不存在或已下架', 404);
        }
        var owner = mockCurrentUser(state);
        var stateFlags = {
          favorited: !!(owner && (state.favorites || []).some(function (row) {
            return row.uid === owner.id && row.vid === video.id;
          })),
          liked: !!(owner && (state.likes || []).some(function (row) {
            return row.uid === owner.id && row.vid === video.id;
          })),
          watched: !!(owner && (state.history || []).some(function (row) {
            return row.uid === owner.id && row.vid === video.id;
          }))
        };
        var followed = !!(owner && (state.follows || []).some(function (row) {
          return row.uid === owner.id && row.target_id === video.uid;
        }));
        return {
          video: mockVideoItem(video),
          up: mockPublicUser(mockUserById(state, video.uid)),
          state: stateFlags,
          followed: followed,
          comments_count: video.comments || 0
        };
      }
      if (action === 'related') {
        if (!video) {
          throw mockError('视频不存在或已下架', 404);
        }
        var others = mockVideos(state).filter(function (item) {
          return item.id !== video.id;
        });
        others.sort(function (a, b) {
          return (b.likes || 0) - (a.likes || 0);
        });
        return { items: others.slice(0, 6).map(mockVideoItem) };
      }
      if (action === 'comments') {
        var commentRows = (state.comments || []).filter(function (row) {
          return row.vid === targetId;
        }).sort(function (a, b) {
          return b.created_at - a.created_at;
        });
        return {
          items: commentRows.map(function (row) {
            var author = mockUserById(state, row.uid) || {};
            return {
              id: row.id,
              content: row.content,
              likes: row.likes || 0,
              created_at: row.created_at,
              up_name: author.nickname || '游客用户',
              up_avatar: author.avatar || row.uid
            };
          }),
          total: commentRows.length,
          page: 1,
          has_more: false
        };
      }
      if (action === 'comment') {
        var content = String(p.content || '').trim();
        if (!video) {
          throw mockError('视频不存在或已下架', 404);
        }
        if (!content) {
          throw mockError('评论内容不能为空', 4002);
        }
        if (content.length > 200) {
          throw mockError('评论内容不能超过 200 字', 4003);
        }
        var cid = 'c_' + Math.random().toString(36).slice(2, 10);
        var author2 = mockCurrentUser(state);
        state.comments.push({
          id: cid,
          vid: targetId,
          uid: author2 ? author2.id : 'guest',
          content: content,
          likes: 0,
          created_at: mockNow()
        });
        video.comments = (video.comments || 0) + 1;
        mockSave(state);
        return {
          id: cid,
          content: content,
          likes: 0,
          created_at: mockNow(),
          up_name: author2 ? author2.nickname : '游客用户',
          up_avatar: author2 ? author2.avatar : 'guest'
        };
      }
      if (action === 'report') {
        if (video) {
          video.views = (video.views || 0) + 1;
        }
        var watcher = mockCurrentUser(state);
        if (watcher && video) {
          var existing = null;
          (state.history || []).forEach(function (row) {
            if (row.uid === watcher.id && row.vid === video.id) {
              existing = row;
            }
          });
          if (existing) {
            existing.progress = p.duration || 0;
            existing.updated_at = mockNow();
          } else {
            state.history.push({
              id: 'h_' + Math.random().toString(36).slice(2, 10),
              uid: watcher.id,
              vid: video.id,
              progress: p.duration || 0,
              created_at: mockNow(),
              updated_at: mockNow()
            });
          }
        }
        mockSave(state);
        return { views: video ? video.views : 0, recorded: !!watcher };
      }
    }

    if (file === 'interact') {
      var actor = mockCurrentUser(state);
      if (!actor) {
        throw mockError('请先登录后再试', 401);
      }
      var vid = String(p.id || '');
      var targetVideo = mockFindVideo(state, vid);
      if (!targetVideo) {
        throw mockError('视频不存在或已下架', 404);
      }
      if (action === 'favorite') {
        var index = -1;
        (state.favorites || []).forEach(function (row, i) {
          if (row.uid === actor.id && row.vid === vid) {
            index = i;
          }
        });
        if (index >= 0) {
          state.favorites.splice(index, 1);
          targetVideo.favorites = Math.max(0, (targetVideo.favorites || 0) - 1);
          mockSave(state);
          return { favorited: false, count: targetVideo.favorites };
        }
        state.favorites.push({
          id: 'f_' + Math.random().toString(36).slice(2, 10),
          uid: actor.id,
          vid: vid,
          created_at: mockNow()
        });
        targetVideo.favorites = (targetVideo.favorites || 0) + 1;
        mockSave(state);
        return { favorited: true, count: targetVideo.favorites };
      }
      if (action === 'like') {
        var likeIndex = -1;
        (state.likes || []).forEach(function (row, i) {
          if (row.uid === actor.id && row.vid === vid) {
            likeIndex = i;
          }
        });
        if (likeIndex >= 0) {
          state.likes.splice(likeIndex, 1);
          targetVideo.likes = Math.max(0, (targetVideo.likes || 0) - 1);
          mockSave(state);
          return { liked: false, count: targetVideo.likes };
        }
        state.likes.push({
          id: 'l_' + Math.random().toString(36).slice(2, 10),
          uid: actor.id,
          vid: vid,
          created_at: mockNow()
        });
        targetVideo.likes = (targetVideo.likes || 0) + 1;
        mockSave(state);
        return { liked: true, count: targetVideo.likes };
      }
      if (action === 'coin') {
        var hasCoin = (state.coins || []).some(function (row) {
          return row.uid === actor.id && row.vid === vid;
        });
        if (hasCoin) {
          throw mockError('本视频已投过币啦', 4001);
        }
        state.coins.push({
          id: 'co_' + Math.random().toString(36).slice(2, 10),
          uid: actor.id,
          vid: vid,
          created_at: mockNow()
        });
        targetVideo.coins = (targetVideo.coins || 0) + 1;
        mockSave(state);
        return { count: targetVideo.coins };
      }
      if (action === 'follow') {
        var targetId2 = String(p.target_id || p.uid || '');
        if (!targetId2) {
          throw mockError('缺少目标用户 ID', 4001);
        }
        if (targetId2 === actor.id) {
          throw mockError('不能关注自己', 4002);
        }
        var followIndex = -1;
        (state.follows || []).forEach(function (row, i) {
          if (row.uid === actor.id && row.target_id === targetId2) {
            followIndex = i;
          }
        });
        if (followIndex >= 0) {
          state.follows.splice(followIndex, 1);
          mockSave(state);
          return { followed: false, followers: Math.max(0, (mockUserById(state, targetId2) || {}).followers - 1) };
        }
        state.follows.push({
          id: 'fo_' + Math.random().toString(36).slice(2, 10),
          uid: actor.id,
          target_id: targetId2,
          created_at: mockNow()
        });
        mockSave(state);
        return { followed: true, followers: (mockUserById(state, targetId2) || {}).followers + 1 };
      }
      if (action === 'history') {
        var historyExisting = null;
        (state.history || []).forEach(function (row) {
          if (row.uid === actor.id && row.vid === vid) {
            historyExisting = row;
          }
        });
        if (historyExisting) {
          historyExisting.updated_at = mockNow();
        } else {
          state.history.push({
            id: 'h_' + Math.random().toString(36).slice(2, 10),
            uid: actor.id,
            vid: vid,
            progress: p.progress || 0,
            created_at: mockNow(),
            updated_at: mockNow()
          });
        }
        mockSave(state);
        return { recorded: true };
      }
      if (action === 'watch_later') {
        var laterIndex = -1;
        (state.watch_later || []).forEach(function (row, i) {
          if (row.uid === actor.id && row.vid === vid) {
            laterIndex = i;
          }
        });
        if (laterIndex >= 0) {
          state.watch_later.splice(laterIndex, 1);
          mockSave(state);
          return { saved: false };
        }
        state.watch_later.push({
          id: 'w_' + Math.random().toString(36).slice(2, 10),
          uid: actor.id,
          vid: vid,
          created_at: mockNow()
        });
        mockSave(state);
        return { saved: true };
      }
    }

    throw mockError('不支持的操作：' + action, 404);
  }

  /**
   * 调用后端 JSON 接口
   * @param {string} file  api 下的文件名，不含 .php
   * @param {string} action 动作名
   * @param {object} params 参数
   * @param {string} method GET / POST
   */
  function request(file, action, params, method) {
    if (global.location && global.location.protocol === 'file:') {
      return new Promise(function (resolve, reject) {
        try {
          resolve(mockRequest(file, action, params || {}, method || 'GET'));
        } catch (err) {
          reject(err);
        }
      });
    }
    var url = API_BASE + file + '.php?action=' + encodeURIComponent(action);
    var body = params || {};
    var opt = { method: method || 'GET', credentials: 'same-origin', headers: {} };

    if (opt.method === 'POST') {
      opt.headers['Content-Type'] = 'application/json';
      opt.body = JSON.stringify(body);
    } else {
      var qsStr = Object.keys(body)
        .filter(function (k) {
          return body[k] !== undefined && body[k] !== null && body[k] !== '';
        })
        .map(function (k) {
          return encodeURIComponent(k) + '=' + encodeURIComponent(body[k]);
        })
        .join('&');
      if (qsStr) {
        url += '&' + qsStr;
      }
    }

    return fetch(url, opt)
      .then(function (res) {
        return res.text();
      })
      .then(function (text) {
        var json;
        try {
          json = JSON.parse(text);
        } catch (e) {
          throw new Error('服务返回了非 JSON 数据，请确认 api 目录已完整上传');
        }
        if (!json || typeof json.code === 'undefined') {
          throw new Error('服务返回格式异常');
        }
        if (json.code !== 0) {
          var err = new Error(json.msg || '请求失败');
          err.code = json.code;
          throw err;
        }
        return json.data;
      });
  }

  /* ------------------------------------------------------------------ */
  /* 登录态                                                              */
  /* ------------------------------------------------------------------ */

  function getUser() {
    try {
      var raw = global.localStorage.getItem(USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function setUser(user) {
    try {
      if (user) {
        global.localStorage.setItem(USER_KEY, JSON.stringify(user));
      } else {
        global.localStorage.removeItem(USER_KEY);
      }
    } catch (e) {
      /* 忽略存储异常 */
    }
  }

  function isLoggedIn() {
    return !!getUser();
  }

  function requireLogin(message) {
    if (isLoggedIn()) {
      return true;
    }
    toast(message || '请先登录');
    setTimeout(function () {
      global.location.href = 'login.html?redirect=' + encodeURIComponent(global.location.pathname + global.location.search);
    }, 900);
    return false;
  }

  /* ------------------------------------------------------------------ */
  /* 资源地址                                                            */
  /* ------------------------------------------------------------------ */

  function isFileProtocol() {
    return !!(global.location && global.location.protocol === 'file:');
  }

  /** 本地离线预览时用内联 SVG 生成封面，避免 file:// 下无法加载 PHP 图片 */
  function inlineCover(video) {
    var title = String((video && video.title) || 'BiliLite');
    var a = ((video && video.cover_a) || '#3a3550');
    var b = ((video && video.cover_b) || '#6d6390');
    var short = title.length > 12 ? title.slice(0, 12) : title;
    var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360" viewBox="0 0 640 360">' +
      '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">' +
      '<stop offset="0%" stop-color="' + a + '"/><stop offset="100%" stop-color="' + b + '"/>' +
      '</linearGradient></defs>' +
      '<rect width="640" height="360" fill="url(#g)"/>' +
      '<text x="40" y="196" font-family="PingFang SC,Microsoft YaHei,system-ui,sans-serif" font-size="34" font-weight="600" fill="#ffffff">' +
      escapeHtml(short) + '</text>' +
      '<rect y="354" width="640" height="6" fill="#FB7299"/></svg>';
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  }

  /** 本地离线预览时用内联 SVG 生成头像 */
  function inlineAvatar(user) {
    var name = String((user && (user.nickname || user.name)) || 'B').slice(0, 1);
    var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96">' +
      '<rect width="96" height="96" rx="48" fill="#FB7299"/>' +
      '<text x="48" y="48" dy="0.36em" text-anchor="middle" font-family="PingFang SC,Microsoft YaHei,system-ui,sans-serif" ' +
      'font-size="42" font-weight="600" fill="#ffffff">' + escapeHtml(name) + '</text></svg>';
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  }

  function coverUrl(video) {
    if (isFileProtocol()) {
      return inlineCover(video);
    }
    var id = encodeURIComponent((video && video.id) || '');
    var a = encodeURIComponent(((video && video.cover_a) || '#3a3550').replace('#', '%23'));
    var b = encodeURIComponent(((video && video.cover_b) || '#6d6390').replace('#', '%23'));
    return API_BASE + 'cover.php?id=' + id + '&a=' + a + '&b=' + b;
  }

  function avatarUrl(user) {
    if (isFileProtocol()) {
      return inlineAvatar(user);
    }
    var id = encodeURIComponent((user && (user.avatar || user.id)) || '');
    var name = encodeURIComponent((user && user.nickname) || '');
    return API_BASE + 'avatar.php?id=' + id + '&name=' + name;
  }

  /* ------------------------------------------------------------------ */
  /* 提示条                                                              */
  /* ------------------------------------------------------------------ */

  var toastTimer = null;

  function toast(msg) {
    var el = qs('.toast');
    if (!el) {
      el = document.createElement('div');
      el.className = 'toast';
      el.setAttribute('role', 'status');
      document.body.appendChild(el);
    }
    el.textContent = msg;
    // 强制重排以便连续触发时过渡生效
    void el.offsetWidth;
    el.classList.add('is-show');
    if (toastTimer) {
      global.clearTimeout(toastTimer);
    }
    toastTimer = global.setTimeout(function () {
      el.classList.remove('is-show');
    }, 2000);
  }

  /* ------------------------------------------------------------------ */
  /* 消息角标                                                            */
  /* ------------------------------------------------------------------ */

  function refreshUnread() {
    return request('messages', 'unread')
      .then(function (data) {
        var total = (data && data.total) || 0;
        qsa('[data-unread-badge]').forEach(function (badge) {
          if (total > 0) {
            badge.textContent = total > 99 ? '99+' : String(total);
            badge.removeAttribute('hidden');
          } else {
            badge.setAttribute('hidden', 'hidden');
            badge.textContent = '';
          }
        });
        return total;
      })
      .catch(function () {
        return 0;
      });
  }

  /* ------------------------------------------------------------------ */
  /* 卡片渲染                                                            */
  /* ------------------------------------------------------------------ */

  /** 视频卡片（首页双列流） */
  function videoCard(video, options) {
    var opt = options || {};
    var rank = opt.rank ? '<span class="card__rank">' + escapeHtml(video.rank) + '</span>' : '';
    return (
      '<a class="card" href="video.html?id=' + encodeURIComponent(video.id) + '">' +
        '<span class="card__thumb">' +
          '<img src="' + coverUrl(video) + '" alt="' + escapeHtml(video.title) + '" loading="lazy" />' +
          rank +
          '<span class="card__duration">' + fmtDuration(video.duration) + '</span>' +
        '</span>' +
        '<span class="card__title">' + (opt.keyword ? highlight(video.title, opt.keyword) : escapeHtml(video.title)) + '</span>' +
        '<span class="card__meta">' +
          '<span class="avatar"><img src="' + avatarUrl({ id: video.up_id, avatar: video.up_avatar, nickname: video.up_name }) + '" alt="" /></span>' +
          '<span class="card__up">' + escapeHtml(video.up_name) + '</span>' +
          '<span class="card__views">' + fmtCount(video.views) + '播放</span>' +
        '</span>' +
      '</a>'
    );
  }

  /** 横向列表条目（搜索结果 / 我的历史 / 相关推荐） */
  function videoRow(video, options) {
    var opt = options || {};
    var meta = [
      '<span>' + escapeHtml(video.up_name || '') + '</span>',
      '<span>' + fmtCount(video.views) + '播放</span>'
    ];
    if (opt.time) {
      meta.push('<span>' + escapeHtml(opt.time) + '</span>');
    }
    return (
      '<a class="list__item" href="video.html?id=' + encodeURIComponent(video.id) + '">' +
        '<span class="list__body">' +
          '<span class="list__title">' + (opt.keyword ? highlight(video.title, opt.keyword) : escapeHtml(video.title)) + '</span>' +
          (opt.desc ? '<span class="list__desc">' + escapeHtml(video.desc) + '</span>' : '') +
          '<span class="list__meta">' + meta.join('') + '</span>' +
        '</span>' +
        '<span class="list__side">' +
          '<span class="list__thumb"><img src="' + coverUrl(video) + '" alt="' + escapeHtml(video.title) + '" loading="lazy" /></span>' +
        '</span>' +
      '</a>'
    );
  }

  /* ------------------------------------------------------------------ */
  /* 状态栏时钟                                                          */
  /* ------------------------------------------------------------------ */

  function startClock() {
    var el = qs('[data-clock]');
    if (!el) {
      return;
    }
    function tick() {
      el.textContent = fmtClock(Date.now() / 1000);
    }
    tick();
    global.setInterval(tick, 20000);
  }

  /* ------------------------------------------------------------------ */
  /* 底部导航高亮                                                        */
  /* ------------------------------------------------------------------ */

  function markActiveNav() {
    var page = document.body.getAttribute('data-page');
    qsa('.tabbar__item[data-nav]').forEach(function (item) {
      if (item.getAttribute('data-nav') === page) {
        item.classList.add('is-active');
        item.setAttribute('aria-current', 'page');
      }
    });
  }

  /* ------------------------------------------------------------------ */
  /* 导出                                                                */
  /* ------------------------------------------------------------------ */

  global.Bili = {
    API_BASE: API_BASE,
    qs: qs,
    qsa: qsa,
    escapeHtml: escapeHtml,
    highlight: highlight,
    fmtCount: fmtCount,
    fmtDuration: fmtDuration,
    fmtTime: fmtTime,
    fmtClock: fmtClock,
    query: query,
    request: request,
    getUser: getUser,
    setUser: setUser,
    isLoggedIn: isLoggedIn,
    requireLogin: requireLogin,
    coverUrl: coverUrl,
    avatarUrl: avatarUrl,
    toast: toast,
    refreshUnread: refreshUnread,
    videoCard: videoCard,
    videoRow: videoRow,
    startClock: startClock,
    markActiveNav: markActiveNav
  };

  document.addEventListener('DOMContentLoaded', function () {
    startClock();
    markActiveNav();
    refreshUnread();
    syncLoginState();
  });

  /**
   * 与后端会话同步登录态：浏览器本地缓存缺失时也能识别到已登录用户
   */
  function syncLoginState() {
    return request('auth', 'me')
      .then(function (data) {
        if (data && data.logged_in && data.user) {
          setUser(data.user);
        } else if (!data || !data.logged_in) {
          setUser(null);
        }
        return data;
      })
      .catch(function () {
        return null;
      });
  }
})(window);

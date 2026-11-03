/* 综合实践 · 寻找宝藏（新增）
 * 本文件只放内容：知识卡、知识点、题目生成器。地图、路线、答案都由代码计算。
 * 地图上北下南、左西右东；用“方向 + 几格”描述路线。 */
(function (root) {
  'use strict';
  var MI = root.MathIsland = root.MathIsland || {};
  var U = MI.util;
  var COLS = 7, ROWS = 6;
  var DIRS = { 东: [1, 0], 西: [-1, 0], 南: [0, 1], 北: [0, -1], 东北: [1, -1], 东南: [1, 1], 西北: [-1, -1], 西南: [-1, 1] };
  var OPP = { 东: '西', 西: '东', 南: '北', 北: '南', 东北: '西南', 西南: '东北', 东南: '西北', 西北: '东南' };
  var MAIN = ['东', '南', '西', '北'], ALL8 = ['东', '南', '西', '北', '东北', '东南', '西北', '西南'];

  function inside(p) { return p[0] >= 0 && p[1] >= 0 && p[0] < COLS && p[1] < ROWS; }
  function key(p) { return p[0] + ',' + p[1]; }
  /** 按路线走：返回经过的每一格（含起点），走出地图返回 null */
  function walk(start, legs) {
    var p = start.slice(), cells = [p.slice()];
    for (var i = 0; i < legs.length; i++) {
      var d = DIRS[legs[i].dir];
      for (var k = 0; k < legs[i].n; k++) {
        p = [p[0] + d[0], p[1] + d[1]];
        if (!inside(p)) return null;
        cells.push(p.slice());
      }
    }
    return cells;
  }
  function describe(legs) {
    return legs.map(function (l, i) { return (i === 0 ? '向' : '再向') + l.dir + '走 ' + l.n + ' 格'; }).join('，');
  }
  /** 拐点（画路线用） */
  function corners(start, legs) {
    var p = start.slice(), out = [p.slice()];
    legs.forEach(function (l) { var d = DIRS[l.dir]; p = [p[0] + d[0] * l.n, p[1] + d[1] * l.n]; out.push(p.slice()); });
    return out;
  }
  /** 随机一条路线：每段方向不同、不往回走，最后不回到起点 */
  function randomRoute(rng, nLegs, dirs) {
    for (;;) {
      var start = [rng.int(0, COLS - 1), rng.int(0, ROWS - 1)], legs = [], last = null;
      for (var i = 0; i < nLegs; i++) {
        var cands = dirs.filter(function (d) { return d !== last && d !== OPP[last]; });
        legs.push({ dir: rng.pick(cands), n: rng.int(1, 4) });
        last = legs[i].dir;
      }
      var cells = walk(start, legs);
      if (!cells) continue;
      var end = cells[cells.length - 1];
      if (key(end) === key(start)) continue;
      if (U.uniq(cells.map(key)).length !== cells.length) continue; // 不走重复的格子
      return { start: start, legs: legs, cells: cells, end: end };
    }
  }

  var cards = [
    {
      id: 'map', emoji: '🗺️', title: '地图上的方向',
      points: ['地图通常是“上北下南、左西右东”。', '八个方向：东、南、西、北、东北、东南、西北、西南。'],
      examples: ['东北在东和北的中间，西南在西和南的中间。'],
      pitfall: '先找到地图上的指北针 ⬆️。'
    },
    {
      id: 'route', emoji: '👣', title: '描述路线',
      points: ['用“方向 + 距离（几格或几米）”描述位置和路线。', '路线要一段一段说：先往哪走几格，再往哪走几格。'],
      examples: ['从起点向东走 3 格，再向北走 2 格。'],
      pitfall: '每一段的方向和格数都要说清楚，顺序也不能乱。'
    },
    {
      id: 'relative', emoji: '🧭', title: '谁在谁的什么方向',
      points: ['A 在 B 的东边，那么 B 就在 A 的西边——方向正好相反。'],
      examples: ['宝藏在小明的东北方向，小明就在宝藏的西南方向。'],
      pitfall: '先看“以谁为中心”。'
    },
    {
      id: 'obstacle', emoji: '🪨', title: '绕过障碍',
      points: ['路上有障碍时要绕路：可以先换一个方向走，再走回来。', '走之前在图上一格一格试一试。'],
      examples: ['向东的路被石头挡住，可以先向北走，再向东走。'],
      pitfall: '绕路以后，最后还要走到宝藏那一格。'
    }
  ];

  var skills = [
    { id: 'follow', name: '按路线走' },
    { id: 'describe', name: '描述路线' },
    { id: 'direction', name: '判断方向' },
    { id: 'obstacle', name: '绕过障碍' }
  ];

  var G = {};

  // ① 按指令移动小人
  // 基础：两段，东南西北；提高：三段；挑战：可能有东北等斜方向，地图上有石头（不挡在正确路线上）
  G.follow = {
    skill: 'follow', levels: [1, 2, 3], weight: 1.6,
    gen: function (rng, d) {
      var r = randomRoute(rng, d === 1 ? 2 : 3, d === 3 ? ALL8 : MAIN);
      var on = r.cells.map(key), rocks = [];
      if (d === 3) {
        for (var t = 0; t < 40 && rocks.length < 3; t++) {
          var c = [rng.int(0, COLS - 1), rng.int(0, ROWS - 1)];
          if (on.indexOf(key(c)) < 0 && !rocks.some(function (x) { return key(x) === key(c); })) rocks.push(c);
        }
      }
      return {
        type: 'walk', prompt: '按路线走：从 🚩 出发，' + describe(r.legs) + '。',
        data: { map: { cols: COLS, rows: ROWS, start: r.start, rocks: rocks }, diag: d === 3, route: corners(r.start, r.legs) },
        answer: key(r.end),
        answerText: '走到第 ' + (r.end[0] + 1) + ' 列、第 ' + (r.end[1] + 1) + ' 行那一格',
        hint: '上北下南、左西右东。一段一段走，每走一格数一下。',
        explanation: U.steps(r.legs.map(function (l) { return '向' + l.dir + '走 ' + l.n + ' 格（' + { 东: '往右', 西: '往左', 南: '往下', 北: '往上', 东北: '往右上', 东南: '往右下', 西北: '往左上', 西南: '往左下' }[l.dir] + '）'; })).concat(['图上的绿色虚线就是正确路线。'])
      };
    }
  };

  // ② 根据路线选出正确描述
  G.describe = {
    skill: 'describe', levels: [1, 2, 3], weight: 1.4,
    gen: function (rng, d) {
      var r = randomRoute(rng, d === 1 ? 2 : 3, d === 3 ? ALL8 : MAIN);
      var right = describe(r.legs), wrongs = [];
      r.legs.forEach(function (l, i) {
        var a = r.legs.map(function (x) { return { dir: x.dir, n: x.n }; });
        a[i].dir = OPP[l.dir]; wrongs.push(describe(a));
        var b = r.legs.map(function (x) { return { dir: x.dir, n: x.n }; });
        b[i].n = l.n === 1 ? 2 : l.n - 1; wrongs.push(describe(b));
      });
      wrongs.push(describe(r.legs.slice().reverse()));
      wrongs = U.uniq(wrongs).filter(function (w) { return w !== right; });
      var opts = rng.shuffle([right].concat(rng.sample(wrongs, 3)));
      return {
        type: 'choice', prompt: '小明从 🧒 出发，沿着图上的路线找到了 💎。下面哪句话描述得对？',
        data: { figure: { kind: 'tmap', cols: COLS, rows: ROWS, start: r.start, treasure: r.end, route: corners(r.start, r.legs) }, options: opts },
        answer: right,
        hint: '先找指北针。沿着路线一段一段看：往哪个方向、走了几格。',
        explanation: U.steps(r.legs.map(function (l, i) { return '第 ' + (i + 1) + ' 段：向' + l.dir + '走了 ' + l.n + ' 格'; })).concat(['合起来：' + right + '。'])
      };
    }
  };

  // ③ 判断方向：宝藏在小明的什么方向（或反过来）
  G.direction = {
    skill: 'direction', levels: [1, 2, 3],
    gen: function (rng, d) {
      var dirs = d === 1 ? MAIN : ALL8;
      for (;;) {
        var dir = rng.pick(dirs), n = rng.int(1, 3), v = DIRS[dir];
        var a = [rng.int(0, COLS - 1), rng.int(0, ROWS - 1)], b = [a[0] + v[0] * n, a[1] + v[1] * n];
        if (!inside(b)) continue;
        var reverse = d >= 2 && rng.chance(0.5);
        var ans = reverse ? OPP[dir] : dir;
        return {
          type: 'choice', prompt: reverse ? '看地图：小明（🧒）在宝藏（💎）的什么方向？' : '看地图：宝藏（💎）在小明（🧒）的什么方向？',
          data: { figure: { kind: 'tmap', cols: COLS, rows: ROWS, start: a, treasure: b }, options: d === 1 ? MAIN.slice() : rng.shuffle([ans, OPP[ans]].concat(rng.sample(ALL8.filter(function (x) { return x !== ans && x !== OPP[ans]; }), 2))) },
          answer: ans,
          hint: reverse ? '这次是“以宝藏为中心”看小明。' : '以小明为中心：上北下南、左西右东。',
          explanation: U.steps(['以' + (reverse ? '宝藏' : '小明') + '为中心看', (reverse ? '小明' : '宝藏') + '在它的' + { 东: '右边', 西: '左边', 南: '下边', 北: '上边', 东北: '右上方', 东南: '右下方', 西北: '左上方', 西南: '左下方' }[ans] + '，是' + ans + '方向']).concat(reverse ? ['宝藏在小明的' + dir + '方向，反过来小明就在宝藏的' + ans + '方向。'] : [])
        };
      }
    }
  };

  // ④ 有障碍的路线推理：哪条路线走得通
  G.obstacle = {
    skill: 'obstacle', levels: [2, 3], weight: 1.4,
    gen: function (rng, d) {
      for (;;) {
        var s = [rng.int(0, 2), rng.int(3, ROWS - 1)];
        var e = [rng.int(s[0] + 2, COLS - 1), rng.int(0, s[1] - 2)];
        var dx = e[0] - s[0], dy = s[1] - e[1];
        var A = [{ dir: '东', n: dx }, { dir: '北', n: dy }];   // 先东后北
        var B = [{ dir: '北', n: dy }, { dir: '东', n: dx }];   // 先北后东
        var cellsA = walk(s, A), cellsB = walk(s, B);
        // 在路线 A 的拐弯之前放一块石头挡住它（不挡 B）
        var block = cellsA[rng.int(1, dx)];
        if (cellsB.map(key).indexOf(key(block)) >= 0) continue;
        var rocks = [block];
        var swap = rng.chance(0.5); // 有时候挡住 B，让 A 走得通
        if (swap) {
          block = cellsB[rng.int(1, dy)];
          if (cellsA.map(key).indexOf(key(block)) >= 0) continue;
          rocks = [block];
        }
        if (d === 3) {
          for (var t = 0; t < 30 && rocks.length < 3; t++) {
            var c = [rng.int(0, COLS - 1), rng.int(0, ROWS - 1)];
            var ok = swap ? cellsA : cellsB;
            if (ok.map(key).indexOf(key(c)) < 0 && key(c) !== key(s) && key(c) !== key(e) && !rocks.some(function (x) { return key(x) === key(c); })) rocks.push(c);
          }
        }
        var good = swap ? A : B, blocked = swap ? B : A;
        var wrong1 = good.map(function (l, i) { return { dir: l.dir, n: l.n + (i === 0 ? 1 : 0) }; });
        var wrong2 = good.map(function (l, i) { return { dir: i === 1 ? OPP[l.dir] : l.dir, n: l.n }; });
        var routes = [good, blocked, wrong1, wrong2];
        function works(legs) {
          var cells = walk(s, legs);
          if (!cells) return false;
          if (cells.some(function (c2) { return rocks.some(function (r) { return key(r) === key(c2); }); })) return false;
          return key(cells[cells.length - 1]) === key(e);
        }
        var valid = routes.filter(works);
        if (valid.length !== 1 || valid[0] !== good) continue;
        var texts = routes.map(describe);
        if (U.uniq(texts).length !== 4) continue;
        return {
          type: 'choice', prompt: '从 🧒 到 💎，路上有大石头（🪨）挡着。下面哪条路线走得通？',
          data: { figure: { kind: 'tmap', cols: COLS, rows: ROWS, start: s, treasure: e, rocks: rocks }, options: rng.shuffle(texts.slice()) },
          answer: describe(good),
          hint: '每条路线都在图上用手指一格一格走一遍：碰到石头就不行，最后也要正好到宝藏。',
          explanation: U.steps([
            '“' + describe(blocked) + '”：半路会碰到石头，走不通',
            '“' + describe(wrong1) + '”：格数不对，到不了宝藏',
            '“' + describe(wrong2) + '”：方向不对，到不了宝藏',
            '“' + describe(good) + '”：绕开了石头，正好走到宝藏 ✔'
          ])
        };
      }
    }
  };

  // ⑤ 面向某个方向，左手、右手是什么方向
  G.facing = {
    skill: 'direction', levels: [2, 3],
    gen: function (rng) {
      var order = ['北', '东', '南', '西'];
      var f = rng.int(0, 3), side = rng.pick(['右手边', '左手边', '背后']);
      var ans = side === '右手边' ? order[(f + 1) % 4] : side === '左手边' ? order[(f + 3) % 4] : order[(f + 2) % 4];
      return {
        type: 'choice', prompt: '小红面向' + order[f] + '站着，她的' + side + '是什么方向？',
        data: { options: order.slice() }, answer: ans,
        hint: '按顺时针记：北 → 东 → 南 → 西。右手边就是顺时针的下一个。',
        explanation: U.steps(['顺时针方向是：北 → 东 → 南 → 西 → 北', '面向' + order[f] + '：右手边是' + order[(f + 1) % 4] + '，左手边是' + order[(f + 3) % 4] + '，背后是' + order[(f + 2) % 4], '所以' + side + '是' + ans])
      };
    }
  };

  var fixed = [
    { skill: 'direction', prompt: '地图通常是上北下南、左西右东。', answer: true, explanation: ['看地图时，上面是北，下面是南，左边是西，右边是东。'] },
    { skill: 'direction', prompt: '东北方向在东和北的中间。', answer: true, explanation: ['东北在东和北之间，西南在西和南之间。'] },
    { skill: 'direction', prompt: 'A 在 B 的东边，那么 B 在 A 的东边。', answer: false, explanation: ['方向是相对的：A 在 B 的东边，B 就在 A 的西边。'] }
  ];
  G.concept = {
    skill: 'direction', levels: [1, 2], weight: 0.6,
    gen: function (rng) { var f = rng.pick(fixed); return { type: 'judge', prompt: '判断对错：' + f.prompt, data: {}, answer: f.answer, hint: '想想地图上的方向。', explanation: f.explanation.slice() }; }
  };

  MI.registerUnit({ id: 'u7', title: '寻找宝藏', cards: cards, skills: skills, generators: G, fixed: fixed });
  MI.u7 = { walk: walk, describe: describe, DIRS: DIRS };
})(typeof window !== 'undefined' ? window : globalThis);

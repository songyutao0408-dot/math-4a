/* 第⑤单元 · 平行四边形和梯形
 * 本文件只放内容：知识卡、知识点、题目生成器。所有答案都由代码计算。
 * 本册不学“高”（平行四边形和梯形的高、底和高在五年级上册）。
 * 新版教材的“尺规作图”具体步骤知识清单里没有写，这里没有出题（见 README 的待确认事项）。 */
(function (root) {
  'use strict';
  var MI = root.MathIsland = root.MathIsland || {};
  var U = MI.util;
  var RAD = Math.PI / 180;

  function options(rng, correct, wrongs, k) {
    var w = U.uniq(wrongs.filter(function (x) { return x !== correct && x != null; }));
    w = rng.shuffle(w).slice(0, (k || 4) - 1);
    return rng.shuffle([correct].concat(w));
  }
  function rotate(pts, deg) {
    var c = Math.cos(deg * RAD), s = Math.sin(deg * RAD);
    return pts.map(function (p) { return [p[0] * c - p[1] * s, p[0] * s + p[1] * c]; });
  }
  function round1(pts) { return pts.map(function (p) { return [Math.round(p[0] * 10) / 10, Math.round(p[1] * 10) / 10]; }); }

  var cards = [
    {
      id: 'position', emoji: '✖️', title: '平行与垂直',
      points: ['同一平面内两条直线的位置关系：相交、不相交（平行）。', '在同一平面内不相交的两条直线叫平行线。a ∥ b，读作“a 平行于 b”。', '两条直线相交成直角，就说它们互相垂直，交点叫垂足。a ⊥ b，读作“a 垂直于 b”。'],
      examples: ['垂直是相交的一种特殊情况。'],
      pitfall: '说平行线时，别漏了“在同一平面内”。'
    },
    {
      id: 'perp', emoji: '📐', title: '画垂线',
      points: ['用三角尺：一条直角边和已知直线重合，沿直线移动三角尺，使已知点落在另一条直角边上，画线，标直角符号。', '过直线上或直线外一点，都只能画一条已知直线的垂线。'],
      examples: ['画好后别忘了标上直角符号。'],
      pitfall: '只能画一条，不是无数条。'
    },
    {
      id: 'distance', emoji: '📏', title: '点到直线的距离',
      points: ['从直线外一点到这条直线所画的垂直线段最短，它的长度叫做这点到直线的距离。'],
      examples: ['从村子修一条路到公路，沿垂直线段修最近。'],
      pitfall: '斜着连的线段都比垂直线段长。'
    },
    {
      id: 'pdist', emoji: '🛤️', title: '平行线之间的距离',
      points: ['两条平行线之间的垂直线段都相等，平行线之间的距离处处相等。'],
      examples: ['铁轨的两条轨道是平行的，距离处处相等。'],
      pitfall: '要量垂直线段，不能斜着量。'
    },
    {
      id: 'parallel', emoji: '🖊️', title: '画平行线',
      points: ['三角尺 + 直尺：一合、二靠、三移、四画。', '新版教材还有尺规作图画平行线（具体步骤以课本为准）。'],
      examples: ['一合：三角尺的一条边和已知直线重合；二靠：直尺靠紧三角尺另一条边；三移：沿直尺移动三角尺；四画：沿三角尺画直线。'],
      pitfall: '移动时直尺不能动。'
    },
    {
      id: 'pgram', emoji: '▱', title: '平行四边形',
      points: ['两组对边分别平行的四边形叫平行四边形。', '特征：对边平行且相等，对角相等。', '可以用圆规比较边的长短，用量角器量角来验证。'],
      examples: ['长方形、正方形是特殊的平行四边形；正方形是特殊的长方形。'],
      pitfall: '平行四边形不一定有直角。'
    },
    {
      id: 'trap', emoji: '⏢', title: '梯形',
      points: ['只有一组对边平行的四边形叫梯形。', '互相平行的一组对边：较短的叫上底，较长的叫下底；不平行的一组对边叫腰。', '两腰相等的叫等腰梯形；有一个角是直角的叫直角梯形。'],
      examples: ['梯形倒过来放，上底还是较短的那条。'],
      pitfall: '梯形不是平行四边形。'
    },
    {
      id: 'relation', emoji: '🔗', title: '四边形之间的关系',
      points: ['按对边是否平行分：两组对边分别平行（平行四边形）/ 只有一组对边平行（梯形）/ 没有平行的对边（一般四边形）。'],
      examples: ['两个完全一样的梯形可以拼成一个平行四边形；在平行四边形里剪一刀可以得到两个梯形。'],
      pitfall: '判断时只看“对边是不是平行”，不看怎么摆放。'
    }
  ];

  var skills = [
    { id: 'position', name: '平行与垂直' },
    { id: 'distance', name: '点到直线的距离' },
    { id: 'quad', name: '四边形分类' },
    { id: 'trapezoid', name: '梯形各部分名称' },
    { id: 'features', name: '平行四边形的特征' },
    { id: 'drawing', name: '画垂线和平行线' }
  ];

  var G = {};

  // ---------- ① 方格纸上两条直线的位置关系 ----------
  var DIRS = [[1, 0], [0, 1], [1, 1], [1, -1], [2, 1], [1, 2], [2, -1], [1, -2], [3, 1], [1, 3], [3, -1], [1, -3]];
  function ang(v) { return Math.atan2(v[1], v[0]) / RAD; }
  function angleBetween(u, v) { var d = Math.abs(ang(u) - ang(v)) % 180; return Math.min(d, 180 - d); }
  /** 过点 p、方向 v 的直线与方格纸边框求两个格点（用于显示） */
  function lineThrough(p, v) { return [p[0], p[1], p[0] + v[0], p[1] + v[1]]; }

  G.position = {
    skill: 'position', levels: [1, 2, 3], weight: 1.6,
    gen: function (rng, d) {
      var cols = 10, rows = 7;
      var kind = rng.pick(['parallel', 'perp', 'cross']);
      var u = rng.pick(d === 1 ? DIRS.slice(0, 4) : DIRS), v;
      if (kind === 'parallel') v = u;
      else if (kind === 'perp') v = [-u[1], u[0]];
      else {
        var cands = DIRS.filter(function (w) { var a = angleBetween(u, w); return a >= 25 && a <= 65; });
        v = rng.pick(cands);
      }
      var p1, p2, l1, l2, ok = false;
      for (var tries = 0; tries < 200 && !ok; tries++) {
        p1 = [rng.int(2, cols - 2), rng.int(1, rows - 2)];
        p2 = [rng.int(2, cols - 2), rng.int(1, rows - 2)];
        l1 = lineThrough(p1, u); l2 = lineThrough(p2, v);
        var cross = (p2[0] - p1[0]) * u[1] - (p2[1] - p1[1]) * u[0];
        if (kind === 'parallel') ok = Math.abs(cross) >= 2 * Math.hypot(u[0], u[1]); // 离得开一点
        else {
          // 交点
          var den = u[0] * v[1] - u[1] * v[0];
          var t = ((p2[0] - p1[0]) * v[1] - (p2[1] - p1[1]) * v[0]) / den;
          var ix = p1[0] + t * u[0], iy = p1[1] + t * u[1];
          var inside = ix > 0.5 && ix < cols - 0.5 && iy > 0.5 && iy < rows - 0.5;
          ok = d === 3 ? true : inside; // 挑战题的交点可能在纸外，要想到“延长”
        }
      }
      var ans = kind === 'parallel' ? '互相平行' : kind === 'perp' ? '互相垂直' : '相交，但不垂直';
      var why = kind === 'parallel' ? '两条直线的方向一样（都是每走 ' + Math.abs(u[0]) + ' 格横、' + Math.abs(u[1]) + ' 格竖），怎么延长都不会相交'
        : kind === 'perp' ? '两条直线相交成直角（可以用三角尺的直角比一比）' : '两条直线延长后会相交，但相交成的角不是直角';
      return {
        type: 'choice', prompt: '方格纸上，直线 a 和直线 b 的位置关系是（　）。',
        data: { figure: { kind: 'gridLines', cols: cols, rows: rows, lines: [l1, l2] }, options: ['互相平行', '互相垂直', '相交，但不垂直'] },
        answer: ans,
        hint: '看两条直线的方向：方向一样就平行；相交成直角就垂直。不相交的，想象把它们延长。',
        explanation: U.steps([why, '所以 a 和 b ' + ans]).concat(kind === 'perp' ? ['垂直是相交的一种特殊情况。'] : [])
      };
    }
  };

  // ---------- ② 点到直线的距离：在几条线段里点出最短的那条 ----------
  G.shortest = {
    skill: 'distance', levels: [1, 2, 3], weight: 1.3,
    gen: function (rng, d) {
      var W = 320, H = 210;
      var rot = d === 1 ? 0 : rng.int(-35, 35);
      var P = [0, -110 + rng.int(0, 20)];
      var offs = [0, -rng.int(70, 110), rng.int(50, 70), rng.int(110, 140)];
      var labels = rng.shuffle(['①', '②', '③', '④']);
      var foots = offs.map(function (o) { return [o, 0]; });
      var cx = 160, cy = 160;
      function tr(p) { var r = rotate([p], rot)[0]; return [Math.round((r[0] + cx) * 10) / 10, Math.round((r[1] + cy) * 10) / 10]; }
      var segs = foots.map(function (f, i) { return { id: labels[i], a: tr(P), b: tr(f), label: labels[i], labelOff: [12, -4], labelT: 0.8 }; });
      var ans = labels[offs.indexOf(0)];
      return {
        type: 'pick', prompt: '从点 A 到直线有好几条线段。点出最短的那一条。',
        data: { w: W, h: H, shape: { base: [tr([-170, 0]), tr([170, 0])], segs: segs, dots: [{ p: tr(P), label: 'A', off: [0, -16] }] } },
        answer: ans,
        hint: '最短的线段和直线是垂直的。',
        explanation: U.steps(['从直线外一点到这条直线所画的线段中，垂直线段最短', '线段 ' + ans + ' 和直线互相垂直，所以它最短', '它的长度就是点 A 到这条直线的距离'])
      };
    }
  };

  // ---------- ③ 方格纸上数距离 ----------
  G.gridDistance = {
    skill: 'distance', levels: [1, 2],
    gen: function (rng) {
      var cols = 10, rows = 7, horiz = rng.chance(0.5), l, p, dist;
      if (horiz) { var y = rng.int(1, rows - 1); l = [0, y, cols, y]; p = [rng.int(1, cols - 1), rng.pick(U.range(0, rows).filter(function (k) { return Math.abs(k - y) >= 2; }))]; dist = Math.abs(p[1] - y); }
      else { var x = rng.int(1, cols - 1); l = [x, 0, x, rows]; p = [rng.pick(U.range(0, cols).filter(function (k) { return Math.abs(k - x) >= 2; })), rng.int(1, rows - 1)]; dist = Math.abs(p[0] - x); }
      return {
        type: 'fill', prompt: '点 A 到这条直线的距离是几格？',
        data: { figure: { kind: 'gridPoint', cols: cols, rows: rows, line: l, point: p }, template: '[] 格' },
        answer: String(dist),
        hint: '从点 A 画一条和直线垂直的线段，数一数它有几格长。',
        explanation: U.steps(['从点 A 向直线画垂直线段（沿着方格线' + (horiz ? '竖着' : '横着') + '走）', '数一数有 ' + dist + ' 格，点 A 到直线的距离是 ' + dist + ' 格'])
      };
    }
  };

  // ---------- ④ 四边形分类拖拽（随机旋转、随机比例） ----------
  function quad(rng, kind) {
    var pts;
    if (kind === 'rect') { var w = rng.int(50, 90), hh = rng.int(25, 45); pts = [[0, 0], [w, 0], [w, hh], [0, hh]]; }
    else if (kind === 'square') { var s = rng.int(40, 70); pts = [[0, 0], [s, 0], [s, s], [0, s]]; }
    else if (kind === 'pgram') { var b = rng.int(50, 80), sx = rng.pick([-1, 1]) * rng.int(15, 30), sy = rng.int(28, 45); pts = [[0, 0], [b, 0], [b + sx, sy], [sx, sy]]; }
    else if (kind === 'trap') {
      var bot = rng.int(70, 95), top = rng.int(25, bot - 25), th = rng.int(30, 45);
      var sub = rng.pick(['any', 'iso', 'right']);
      var off = sub === 'iso' ? (bot - top) / 2 : sub === 'right' ? 0 : rng.int(5, bot - top - 5);
      pts = [[0, 0], [bot, 0], [off + top, th], [off, th]];
    } else {
      // 一般四边形：四个点围成凸四边形，两组对边都不平行
      for (;;) {
        var as = [rng.int(0, 80), rng.int(100, 170), rng.int(190, 260), rng.int(280, 350)];
        pts = as.map(function (a) { var r = rng.int(30, 50); return [r * Math.cos(a * RAD), r * Math.sin(a * RAD)]; });
        var v = function (i) { var a = pts[i], b2 = pts[(i + 1) % 4]; return [b2[0] - a[0], b2[1] - a[1]]; };
        if (angleBetween(v(0), v(2)) > 12 && angleBetween(v(1), v(3)) > 12) break;
      }
    }
    var r = rotate(pts, rng.int(0, 359));
    if (rng.chance(0.5)) r = r.map(function (p) { return [-p[0], p[1]]; });
    return { t: 'poly', pts: round1(r), kind: kind };
  }
  var QBINS = ['平行四边形', '梯形', '其他四边形'];
  var QBIN_OF = { rect: 0, square: 0, pgram: 0, trap: 1, other: 2 };
  var QNAME = { rect: '长方形', square: '正方形', pgram: '平行四边形', trap: '梯形', other: '一般四边形' };
  var QWHY = { rect: '它是长方形，两组对边分别平行，是特殊的平行四边形', square: '它是正方形，两组对边分别平行，是特殊的平行四边形', pgram: '两组对边分别平行，是平行四边形', trap: '只有一组对边平行，是梯形', other: '没有互相平行的对边，是一般四边形' };

  G.sortQuads = {
    skill: 'quad', levels: [1, 2, 3], weight: 1.6,
    gen: function (rng, d) {
      var n = d === 1 ? 4 : d === 2 ? 5 : 6;
      var pool = d === 1 ? ['pgram', 'trap', 'other', 'rect'] : ['rect', 'square', 'pgram', 'trap', 'trap', 'other', 'pgram'];
      var kinds = rng.shuffle(pool.concat(pool)).slice(0, n);
      if (kinds.indexOf('trap') < 0) kinds[0] = 'trap';
      var items = kinds.map(function (k) { return quad(rng, k); });
      return {
        type: 'sort', prompt: '按对边是否平行，把这些四边形拖进对应的筐里。（图形摆放的方向不一样哦）',
        data: { bins: QBINS, items: items, why: items.map(function (it) { return QWHY[it.kind] + '。'; }) },
        answer: items.map(function (it) { return QBIN_OF[it.kind]; }),
        answerText: items.map(function (it, i) { return '第 ' + (i + 1) + ' 个：' + QBINS[QBIN_OF[it.kind]]; }).join('；'),
        hint: '一组一组看对边：两组都平行是平行四边形，只有一组平行是梯形。',
        explanation: U.steps(items.map(function (it, i) { return '第 ' + (i + 1) + ' 个：' + QWHY[it.kind]; })).concat(['长方形、正方形是特殊的平行四边形；梯形不是平行四边形。'])
      };
    }
  };

  // ---------- ⑤ 梯形各部分名称：点出上底/下底/腰 ----------
  G.trapParts = {
    skill: 'trapezoid', levels: [1, 2, 3], weight: 1.3,
    gen: function (rng, d) {
      var bot = rng.int(170, 230), top = rng.int(70, bot - 60), th = rng.int(90, 120);
      var sub = rng.pick(['any', 'iso', 'right']);
      var off = sub === 'iso' ? (bot - top) / 2 : sub === 'right' ? 0 : rng.int(20, bot - top - 20);
      var pts = [[0, 0], [bot, 0], [off + top, -th], [off, -th]];
      var rot = d === 1 ? 0 : d === 2 ? rng.pick([180, 90, -90, rng.int(-30, 30)]) : rng.int(0, 359);
      var r = rotate(pts.map(function (p) { return [p[0] - bot / 2, p[1] + th / 2]; }), rot);
      var W = 320, H = 260;
      // 放进画布中央
      var xs = r.map(function (p) { return p[0]; }), ys = r.map(function (p) { return p[1]; });
      var k = Math.min((W - 60) / (Math.max.apply(null, xs) - Math.min.apply(null, xs)), (H - 60) / (Math.max.apply(null, ys) - Math.min.apply(null, ys)));
      var mx = (Math.max.apply(null, xs) + Math.min.apply(null, xs)) / 2, my = (Math.max.apply(null, ys) + Math.min.apply(null, ys)) / 2;
      var P = round1(r.map(function (p) { return [(p[0] - mx) * k + W / 2, (p[1] - my) * k + H / 2]; }));
      var ids = ['bottom', 'leg1', 'top', 'leg2'];
      var segs = ids.map(function (id, i) { return { id: id, a: P[i], b: P[(i + 1) % 4] }; });
      var ask = rng.pick(['top', 'bottom', 'leg']);
      var names = { top: '上底', bottom: '下底', leg: '一条腰' };
      return {
        type: 'pick', prompt: '这是一个梯形。点出它的' + names[ask] + '。',
        data: { w: W, h: H, shape: { segs: segs, poly: true } },
        answer: ask === 'leg' ? ['leg1', 'leg2'] : ask,
        answerText: names[ask],
        hint: '先找出互相平行的那一组对边：较短的是上底，较长的是下底；另外两条是腰。',
        explanation: U.steps(['先找互相平行的一组对边', '平行的两条里，较短的叫上底，较长的叫下底', '不平行的两条叫腰']).concat(rot ? ['梯形转了个方向，上底、下底还是按长短来分。'] : []).concat(sub === 'iso' ? ['这个梯形两腰相等，是等腰梯形。'] : sub === 'right' ? ['这个梯形有直角，是直角梯形。'] : [])
      };
    }
  };

  // ---------- ⑥ 平行四边形的特征（对角相等、对边相等） ----------
  G.features = {
    skill: 'features', levels: [1, 2, 3],
    gen: function (rng, d) {
      if (d >= 2 && rng.chance(0.5)) {
        var a = rng.int(5, 20) * 5, b = rng.int(4, 12) * 5;
        return {
          type: 'fill', prompt: '一个平行四边形相邻的两条边分别长 ' + a + ' 厘米和 ' + b + ' 厘米，另外两条边分别长多少厘米？',
          data: { template: '[] 厘米和 [] 厘米' }, answer: [String(a), String(b)],
          hint: '平行四边形的对边相等。',
          explanation: U.steps(['平行四边形的对边相等', '和 ' + a + ' 厘米那条边相对的边也是 ' + a + ' 厘米，和 ' + b + ' 厘米相对的也是 ' + b + ' 厘米'])
        };
      }
      var deg = rng.int(11, 34) * 5;
      if (deg === 90) deg = 75;
      return {
        type: 'fill', prompt: '平行四边形的一个角是 ' + deg + '°，和它相对的那个角是多少度？',
        data: { template: '[] °', suffix: '°' }, answer: String(deg),
        hint: '平行四边形的对角相等（可以用量角器量一量验证）。',
        explanation: U.steps(['平行四边形的对角相等', '和 ' + deg + '° 相对的角也是 ' + deg + '°'])
      };
    }
  };

  // ---------- ⑦ 画平行线的步骤 ----------
  G.drawSteps = {
    skill: 'drawing', levels: [1, 2],
    gen: function (rng) {
      var right = '一合、二靠、三移、四画';
      return {
        type: 'choice', prompt: '用三角尺和直尺画平行线，正确的顺序是（　）。',
        data: { options: rng.shuffle([right, '一靠、二合、三移、四画', '一合、二移、三靠、四画', '一移、二合、三靠、四画']) }, answer: right,
        hint: '先让三角尺的一条边和已知直线重合。',
        explanation: U.steps(['合：三角尺的一条边和已知直线重合', '靠：用直尺紧靠三角尺的另一条边', '移：沿着直尺移动三角尺', '画：沿三角尺的边画出直线'])
      };
    }
  };

  // ---------- ⑧ 概念判断（少量精选固定题） ----------
  var fixed = [
    { skill: 'position', prompt: '不相交的两条直线叫平行线。', answer: false, explanation: ['漏了“在同一平面内”：在同一平面内不相交的两条直线才叫平行线。'] },
    { skill: 'position', prompt: '垂直是相交的一种特殊情况。', answer: true, explanation: ['两条直线相交成直角，就是互相垂直。'] },
    { skill: 'position', prompt: '在同一平面内，两条直线不是相交就是平行。', answer: true, explanation: ['同一平面内两条直线的位置关系只有相交和不相交（平行）两种。'] },
    { skill: 'drawing', prompt: '过直线外一点，可以画无数条已知直线的垂线。', answer: false, explanation: ['过直线上或直线外一点，都只能画一条已知直线的垂线。'] },
    { skill: 'distance', prompt: '两条平行线之间的距离处处相等。', answer: true, explanation: ['两条平行线之间的垂直线段都相等。'] },
    { skill: 'quad', prompt: '梯形是特殊的平行四边形。', answer: false, explanation: ['梯形只有一组对边平行，平行四边形有两组，梯形不是平行四边形。'] },
    { skill: 'quad', prompt: '正方形是特殊的长方形。', answer: true, explanation: ['长方形、正方形都是特殊的平行四边形；正方形是特殊的长方形。'] },
    { skill: 'quad', prompt: '长方形是特殊的平行四边形。', answer: true, explanation: ['长方形两组对边分别平行，是特殊的平行四边形。'] },
    { skill: 'quad', prompt: '两个完全一样的梯形可以拼成一个平行四边形。', answer: true, explanation: ['把其中一个梯形倒过来，和另一个拼在一起，就是平行四边形。'] },
    { skill: 'features', prompt: '平行四边形的对边平行且相等，对角相等。', answer: true, explanation: ['这是平行四边形的特征。'] },
    { skill: 'trapezoid', prompt: '有一个角是直角的梯形叫直角梯形。', answer: true, explanation: ['两腰相等的叫等腰梯形；有一个角是直角的叫直角梯形。'] },
    { skill: 'trapezoid', prompt: '梯形中较长的那条腰叫下底。', answer: false, explanation: ['上底、下底是互相平行的那组对边；不平行的两条叫腰。'] }
  ];
  ['position', 'drawing', 'distance', 'quad', 'features', 'trapezoid'].forEach(function (sid) {
    G['concept_' + sid] = {
      skill: sid, levels: [1, 2], weight: 0.6,
      gen: function (rng) {
        var list = fixed.filter(function (f) { return f.skill === sid; });
        var f = rng.pick(list);
        return { type: 'judge', prompt: '判断对错：' + f.prompt, data: {}, answer: f.answer, hint: '回忆一下课本上的定义。', explanation: f.explanation.slice() };
      }
    };
  });

  MI.registerUnit({ id: 'u5', title: '平行四边形和梯形', cards: cards, skills: skills, generators: G, fixed: fixed });
  MI.u5 = { quad: quad, angleBetween: angleBetween };
})(typeof window !== 'undefined' ? window : globalThis);

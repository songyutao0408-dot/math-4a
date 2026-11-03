/* 第②单元 · 角的度量
 * 本文件只放内容：知识卡、知识点、题目生成器。所有答案都由代码计算。 */
(function (root) {
  'use strict';
  var MI = root.MathIsland = root.MathIsland || {};
  var U = MI.util;

  function options(rng, correct, wrongs, k) {
    var w = U.uniq(wrongs.filter(function (x) { return x !== correct && x != null; }));
    w = rng.shuffle(w).slice(0, (k || 4) - 1);
    return rng.shuffle([correct].concat(w));
  }
  /** 按度数分类 */
  function kindOf(d) { return d < 90 ? '锐角' : d === 90 ? '直角' : d < 180 ? '钝角' : d === 180 ? '平角' : '周角'; }
  var KINDS = ['锐角', '直角', '钝角', '平角', '周角'];
  var RANGE = { '锐角': '大于 0°、小于 90°', '直角': '等于 90°', '钝角': '大于 90°、小于 180°', '平角': '等于 180°', '周角': '等于 360°' };

  var cards = [
    {
      id: 'lines', emoji: '📏', title: '线段、射线、直线（复习）',
      points: ['线段有两个端点，可以量长度；射线有一个端点，无限长；直线没有端点，无限长。', '过一点可以画无数条直线；过两点只能画一条直线；两点之间线段最短。'],
      examples: ['手电筒射出的光可以看成射线。'],
      pitfall: '射线和直线都不能量长度。'
    },
    {
      id: 'angle', emoji: '📐', title: '角的再认识',
      points: ['从一点引出两条射线所组成的图形叫角。这个点叫顶点，两条射线叫边。', '一条射线绕它的端点旋转半周形成平角，旋转一周形成周角。', '角的大小和边的长短无关，和两条边叉开的大小有关。'],
      examples: ['∠1 读作“角 1”。', '用放大镜看角，角的大小不变。'],
      pitfall: '把边画长了，角并没有变大。'
    },
    {
      id: 'kinds', emoji: '🗂️', title: '角的分类',
      points: ['锐角：大于 0°、小于 90°', '直角：等于 90°', '钝角：大于 90°、小于 180°', '平角：等于 180°', '周角：等于 360°'],
      examples: ['1 周角 = 2 平角 = 4 直角', '锐角 < 直角 < 钝角 < 平角 < 周角'],
      pitfall: '平角不是一条直线，周角也不是一条射线，它们都有顶点和两条边。'
    },
    {
      id: 'degree', emoji: '🔅', title: '角的度量单位',
      points: ['计量角的大小用“度”作单位，符号“°”。', '把半圆平均分成 180 份，每份所对的角是 1°。'],
      examples: ['直角是 90°，平角是 180°。'],
      pitfall: '写度数别忘了“°”。'
    },
    {
      id: 'measure', emoji: '🧭', title: '量角：两重合，一看',
      points: ['量角器的中心点和角的顶点重合，0° 刻度线和角的一条边重合，再看另一条边对着的刻度。', '和边重合的 0° 刻度线在哪一圈，就读哪一圈。'],
      examples: ['边和右边的 0°（内圈）重合，就读内圈的数。'],
      pitfall: '最常错：读成另一圈，得到 180° 减去正确度数。'
    },
    {
      id: 'draw', emoji: '✏️', title: '画角',
      points: ['先画一条射线；量角器中心点对准射线端点，0° 刻度线和射线重合；', '在要画的度数的刻度上点一个点；', '从端点出发，过这个点画射线，标上度数。'],
      examples: ['画 65° 的角：从和射线重合的那一圈 0° 开始数到 65。'],
      pitfall: '点点的时候，也要看对那一圈。'
    },
    {
      id: 'triangle', emoji: '📐', title: '用三角尺拼角',
      points: ['一副三角尺的角：30°、60°、90° 和 45°、45°、90°。', '能拼出 15°、75°、105°、120°、135°、150° 等，都是 15° 的倍数。'],
      examples: ['30° + 45° = 75°', '45° − 30° = 15°', '45° + 60° = 105°'],
      pitfall: '拼出来的角一定是 15° 的倍数，不是的就拼不出。'
    },
    {
      id: 'clock', emoji: '🕒', title: '钟面上的角',
      points: ['钟面一大格是 30°。', '整时：时针和分针之间有几大格，就是几个 30°。'],
      examples: ['3 时整 90°（直角），6 时整 180°（平角），1 时整 30°，2 时整 60°，4 时整 120°。'],
      pitfall: '数大格时，数的是两根针之间较小的那一边。'
    },
    {
      id: 'calc', emoji: '🧮', title: '角的计算',
      points: ['平角里：∠1 + ∠2 = 180°，已知一个，用 180° 减去它求另一个。', '直角里：∠1 + ∠2 = 90°。'],
      examples: ['∠1 = 60°，∠1 和 ∠2 组成平角，∠2 = 180° − 60° = 120°。'],
      pitfall: '先看清是平角还是直角。'
    }
  ];

  var skills = [
    { id: 'concept', name: '角的认识' },
    { id: 'classify', name: '角的分类' },
    { id: 'measure', name: '量角' },
    { id: 'draw', name: '画角' },
    { id: 'triangle', name: '用三角尺拼角' },
    { id: 'clock', name: '钟面上的角' },
    { id: 'calc', name: '角的计算' }
  ];

  var G = {};

  // ① 读量角器：故意出现内外圈陷阱
  // 基础：10 的倍数，边和右边的 0° 重合；提高：10 的倍数，边在左或右；挑战：5 的倍数（读两个大刻度之间）
  G.readProtractor = {
    skill: 'measure', levels: [1, 2, 3], weight: 1.8,
    gen: function (rng, d) {
      var deg = d === 3 ? rng.int(2, 34) * 5 : rng.int(1, 17) * 10;
      if (d === 3 && deg % 10 === 0) deg += 5;
      if (deg === 90 && rng.chance(0.7)) deg = d === 3 ? 125 : 130;
      var base = d === 1 ? 'right' : rng.pick(['right', 'left']);
      var ring = base === 'right' ? '内圈' : '外圈', other = base === 'right' ? '外圈' : '内圈';
      return {
        type: 'fill', prompt: '量角器上的 ∠1 是多少度？',
        data: { figure: { kind: 'protractor', deg: deg, base: base }, template: '∠1 = [] °', keys: [], suffix: '°', tolerance: 1 },
        answer: String(deg),
        hint: '先看和边重合的 0° 在哪一圈（左边还是右边），就读那一圈的数。',
        explanation: U.steps([
          '角的一条边和' + (base === 'right' ? '右' : '左') + '边的 0° 刻度线重合，这个 0° 在' + ring,
          '所以读' + ring + '：另一条边对着' + ring + '的 ' + deg + '°',
          '别读成' + other + '的 ' + (180 - deg) + '°（那是 180° − ' + deg + '°）'
        ]).concat(['∠1 = ' + deg + '°，是' + kindOf(deg) + '。'])
      };
    }
  };

  // ② 画角：拖动射线到指定度数（误差 ±2°）
  G.drawAngle = {
    skill: 'draw', levels: [1, 2, 3], weight: 1.5,
    gen: function (rng, d) {
      var deg = d === 1 ? rng.int(2, 16) * 10 : d === 2 ? rng.int(2, 34) * 5 : rng.int(12, 168);
      if (deg === 90) deg = 95;
      var base = d === 1 ? 'right' : rng.pick(['right', 'left']);
      var ring = base === 'right' ? '内圈' : '外圈';
      return {
        type: 'drawAngle', prompt: '画一个 ' + deg + '° 的角：拖动圆点，把射线转到 ' + deg + '°。',
        data: { base: base, tolerance: 2 },
        answer: deg,
        answerText: deg + '°',
        hint: '已经画好的边和' + (base === 'right' ? '右' : '左') + '边的 0° 重合，要看' + ring + '的刻度。',
        explanation: U.steps([
          '量角器中心点对准射线的端点，0° 刻度线和射线重合',
          '这条 0° 在' + ring + '，从 0° 开始沿着' + ring + '数到 ' + deg + '°，在那里点一个点',
          '从端点出发，过这个点画射线，标上 ' + deg + '°'
        ])
      };
    }
  };

  /** 随机生成某一类的角（随机旋转、随机边长） */
  function randomAngle(rng, kind) {
    var deg = kind === '锐角' ? rng.int(2, 17) * 5 : kind === '直角' ? 90 : kind === '钝角' ? rng.int(20, 34) * 5 : kind === '平角' ? 180 : 360;
    if (kind === '锐角' && deg >= 90) deg = 80;
    return { t: 'angle', deg: deg, rot: rng.int(0, 11) * 30 + rng.int(-10, 10), l1: rng.int(34, 46), l2: rng.int(34, 46) };
  }

  // ③ 把角拖进“锐角/直角/钝角/平角/周角”筐
  G.sortAngles = {
    skill: 'classify', levels: [1, 2, 3], weight: 1.5,
    gen: function (rng, d) {
      var n = d === 1 ? 4 : d === 2 ? 5 : 6;
      var bins = d === 1 ? ['锐角', '直角', '钝角'] : KINDS;
      var kinds = rng.shuffle(bins.concat(bins).concat(bins)).slice(0, n);
      var items = kinds.map(function (k) { return randomAngle(rng, k); });
      return {
        type: 'sort', prompt: '这些角各是什么角？把它们拖进对应的筐里。',
        data: { bins: bins, items: items, why: items.map(function (it) { return '它是 ' + it.deg + '°，' + RANGE[kindOf(it.deg)] + '，是' + kindOf(it.deg) + '。'; }) },
        answer: items.map(function (it) { return bins.indexOf(kindOf(it.deg)); }),
        answerText: items.map(function (it, i) { return '第 ' + (i + 1) + ' 个：' + kindOf(it.deg); }).join('；'),
        hint: '和直角比一比：比直角小是锐角，比直角大、比平角小是钝角。',
        explanation: U.steps(items.map(function (it, i) { return '第 ' + (i + 1) + ' 个角 ' + it.deg + '°，' + RANGE[kindOf(it.deg)] + '，是' + kindOf(it.deg); })).concat(['角的大小和边的长短、摆的方向都没有关系。'])
      };
    }
  };

  // ④ 给出度数判断类型 / 1 周角 = ? 平角 = ? 直角
  G.classifyDeg = {
    skill: 'classify', levels: [1, 2, 3],
    gen: function (rng, d) {
      if (d === 3 && rng.chance(0.5)) {
        return {
          type: 'fill', prompt: '填一填：', data: { template: '1 周角 = [] 平角 = [] 直角' }, answer: ['2', '4'],
          hint: '平角是 180°，直角是 90°，周角是 360°。',
          explanation: U.steps(['1 周角 = 360°，360° ÷ 180° = 2，是 2 个平角', '360° ÷ 90° = 4，是 4 个直角'])
        };
      }
      var kind = rng.pick(KINDS.slice(0, d === 1 ? 3 : 5));
      var deg = kind === '锐角' ? rng.int(1, 89) : kind === '钝角' ? rng.int(91, 179) : kind === '直角' ? 90 : kind === '平角' ? 180 : 360;
      return {
        type: 'choice', prompt: deg + '° 的角是（　）。', data: { options: KINDS.slice() }, answer: kind,
        hint: '记住两个“分界线”：90° 和 180°。',
        explanation: [kind + '：' + RANGE[kind] + '。', deg + '° ' + RANGE[kind].replace(/^(大于|等于)/, '$1') + '，所以是' + kind + '。']
      };
    }
  };

  // ⑤ 钟面上的角（整时）
  G.clock = {
    skill: 'clock', levels: [1, 2, 3], weight: 1.2,
    gen: function (rng, d) {
      var hour = rng.int(1, 11), big = Math.min(hour, 12 - hour), deg = big * 30;
      if (d === 3) {
        var want = rng.pick([90, 180]);
        var right = want === 90 ? '3 时和 9 时' : '6 时';
        var opts = want === 90 ? [right, '3 时和 6 时', '6 时和 12 时', '2 时和 10 时'] : [right, '3 时', '12 时', '9 时'];
        return {
          type: 'choice', prompt: '一天里（只看 1 时～12 时的整时），哪个时刻时针和分针成' + (want === 90 ? '直角' : '平角') + '？',
          data: { options: rng.shuffle(opts) }, answer: right,
          hint: '一大格是 30°，' + (want === 90 ? '90° 是 3 大格' : '180° 是 6 大格') + '。',
          explanation: U.steps(['钟面一大格是 30°，' + want + '° 是 ' + want / 30 + ' 大格', '分针指着 12，时针要离 12 有 ' + want / 30 + ' 大格：' + right])
        };
      }
      if (d === 2 && rng.chance(0.5)) {
        return {
          type: 'choice', prompt: hour + ' 时整，时针和分针所成的角是（　）。',
          data: { figure: { kind: 'clock', hour: hour }, options: KINDS.slice(0, 4) }, answer: kindOf(deg),
          hint: '先数一数两根针之间有几大格，一大格是 30°。',
          explanation: U.steps(['两根针之间有 ' + big + ' 大格', big + ' × 30° = ' + deg + '°', deg + '° 是' + kindOf(deg)])
        };
      }
      return {
        type: 'fill', prompt: hour + ' 时整，时针和分针所成的角是多少度？',
        data: { figure: { kind: 'clock', hour: hour }, template: '[] °', suffix: '°' }, answer: String(deg),
        hint: '钟面一大格是 30°。',
        explanation: U.steps(['分针指着 12，时针指着 ' + hour + '，两根针之间有 ' + big + ' 大格', '一大格 30°：' + big + ' × 30° = ' + deg + '°'])
      };
    }
  };

  var SET1 = [30, 60, 90], SET2 = [45, 90];

  // ⑥ 用三角尺拼角
  G.triangle = {
    skill: 'triangle', levels: [1, 2, 3], weight: 1.2,
    gen: function (rng, d) {
      if (d === 3) {
        if (rng.chance(0.5)) {
          var cand = [15, 75, 105, 120, 135, 150], bad = rng.pick([100, 80, 110, 125, 140, 95]);
          var opts = rng.sample(cand, 3).map(function (x) { return x + '°'; }).concat([bad + '°']);
          return {
            type: 'choice', prompt: '用一副三角尺，不能拼出的角是（　）。', data: { options: rng.shuffle(opts) }, answer: bad + '°',
            hint: '一副三角尺拼出的角都是 15° 的倍数。',
            explanation: U.steps(['一副三角尺的角：30°、60°、90° 和 45°、45°、90°', '拼出的角都是 15° 的倍数', bad + '° 不是 15° 的倍数（' + bad + ' ÷ 15 除不尽），拼不出'])
          };
        }
        var pairs = [];
        SET1.forEach(function (a) { SET2.forEach(function (b) { if (a + b < 180) pairs.push([a, b]); }); });
        var pr = rng.pick(pairs), total = pr[0] + pr[1];
        var right = pr[0] + '° 和 ' + pr[1] + '°';
        var wrongs = pairs.filter(function (p) { return p[0] + p[1] !== total; }).map(function (p) { return p[0] + '° 和 ' + p[1] + '°'; });
        return {
          type: 'choice', prompt: '用一副三角尺拼出 ' + total + '° 的角，要用哪两个角？', data: { options: options(rng, right, wrongs) }, answer: right,
          hint: '一个角来自 30°/60°/90° 那块，另一个来自 45°/90° 那块，加起来是 ' + total + '°。',
          explanation: U.steps([pr[0] + '° + ' + pr[1] + '° = ' + total + '°', '所以用 ' + right])
        };
      }
      var mode = d === 1 ? 'sum' : rng.pick(['sum', 'diff']);
      var a, b;
      if (mode === 'sum') { a = rng.pick([30, 60, 45]); b = a === 45 ? rng.pick([30, 60, 90]) : rng.pick([45, 90]); }
      else { var p2 = rng.pick([[30, 45], [45, 60], [45, 90], [30, 90], [60, 90]]); a = p2[0]; b = p2[1]; }
      var ans = mode === 'sum' ? a + b : Math.abs(b - a);
      return {
        type: 'fill', prompt: '用三角尺拼成的这个角是多少度？' + (mode === 'diff' ? '（两块重叠，问的是没有重叠的那部分）' : ''),
        data: { figure: { kind: 'wedges', mode: mode, parts: [{ deg: a, label: a + '°' }, { deg: b, label: b + '°' }], ask: '?' }, template: '[] °', suffix: '°' },
        answer: String(ans),
        hint: mode === 'sum' ? '两个角拼在一起，度数相加。' : '大角减去重叠的小角。',
        explanation: U.steps([mode === 'sum' ? '两个角拼在一起：' + a + '° + ' + b + '° = ' + ans + '°' : '大角减小角：' + Math.max(a, b) + '° − ' + Math.min(a, b) + '° = ' + ans + '°'])
      };
    }
  };

  // ⑦ 角的计算（平角、直角）
  G.calc = {
    skill: 'calc', levels: [1, 2, 3], weight: 1.2,
    gen: function (rng, d) {
      var total = d === 1 ? 180 : rng.pick([180, 90]);
      var a = total === 180 ? rng.int(4, 32) * 5 : rng.int(3, 15) * 5;
      if (d === 3) a = total === 180 ? rng.int(21, 159) : rng.int(11, 79);
      var askFirst = d >= 2 && rng.chance(0.4);
      var shown = askFirst ? ['?', (total - a) + '°'] : [a + '°', '?'];
      var known = askFirst ? total - a : a, ans = total - known;
      return {
        type: 'fill', prompt: '∠1 和 ∠2 组成一个' + (total === 180 ? '平角' : '直角') + '，' + (askFirst ? '∠2 = ' + (total - a) + '°，∠1' : '∠1 = ' + a + '°，∠2') + ' 是多少度？',
        data: { figure: { kind: 'split', total: total, a: a, labels: ['∠1', '∠2'], show: shown }, template: (askFirst ? '∠1' : '∠2') + ' = [] °', suffix: '°' },
        answer: String(ans),
        hint: (total === 180 ? '平角是 180°' : '直角是 90°') + '，用它减去已知的角。',
        explanation: U.steps([(total === 180 ? '平角' : '直角') + '：∠1 + ∠2 = ' + total + '°', (askFirst ? '∠1' : '∠2') + ' = ' + total + '° − ' + known + '° = ' + ans + '°'])
      };
    }
  };

  // ⑧ 概念判断（少量精选固定题）
  var fixed = [
    { skill: 'concept', prompt: '平角就是一条直线。', answer: false, explanation: ['平角有一个顶点和两条边，只是两条边在一条直线上，它不是直线。'] },
    { skill: 'concept', prompt: '周角是一条射线。', answer: false, explanation: ['周角有顶点和两条重合的边，它是角，不是射线。'] },
    { skill: 'concept', prompt: '角的两条边画得越长，角就越大。', answer: false, explanation: ['角的大小和边的长短无关，和两条边叉开的大小有关。'] },
    { skill: 'concept', prompt: '用放大镜看一个 30° 的角，看到的还是 30°。', answer: true, explanation: ['放大镜只能把边放大，两条边叉开的大小不变。'] },
    { skill: 'concept', prompt: '射线有一个端点，可以向一端无限延伸。', answer: true, explanation: ['射线有一个端点，无限长。'] },
    { skill: 'concept', prompt: '过两点可以画无数条直线。', answer: false, explanation: ['过一点可以画无数条直线；过两点只能画一条直线。'] },
    { skill: 'concept', prompt: '直线比射线长。', answer: false, explanation: ['直线和射线都是无限长的，不能比较长短。'] },
    { skill: 'classify', prompt: '大于 90° 的角都是钝角。', answer: false, explanation: ['钝角是大于 90°、小于 180° 的角；180° 是平角，360° 是周角。'] },
    { skill: 'classify', prompt: '1 周角 = 2 平角 = 4 直角。', answer: true, explanation: ['360° = 2 × 180° = 4 × 90°。'] },
    { skill: 'measure', prompt: '量角时，量角器的中心点要和角的顶点重合。', answer: true, explanation: ['量角“两重合”：中心点和顶点重合，0° 刻度线和一条边重合。'] }
  ];
  ['concept', 'classify', 'measure'].forEach(function (sid) {
    G['concept_' + sid] = {
      skill: sid, levels: [1, 2], weight: sid === 'concept' ? 1.2 : 0.5,
      gen: function (rng) {
        var list = fixed.filter(function (f) { return f.skill === sid; });
        var f = rng.pick(list);
        return { type: 'judge', prompt: '判断对错：' + f.prompt, data: {}, answer: f.answer, hint: '想一想角是怎么定义的。', explanation: f.explanation.slice() };
      }
    };
  });

  // ⑨ 比较角的大小
  G.order = {
    skill: 'classify', levels: [2, 3],
    gen: function (rng) {
      var right = '锐角 < 直角 < 钝角 < 平角 < 周角';
      return {
        type: 'choice', prompt: '下面排列正确的是（　）。',
        data: { options: rng.shuffle([right, '直角 < 锐角 < 钝角 < 平角 < 周角', '锐角 < 钝角 < 直角 < 平角 < 周角', '锐角 < 直角 < 钝角 < 周角 < 平角']) },
        answer: right, hint: '按度数从小到大排。',
        explanation: ['锐角（小于 90°）< 直角（90°）< 钝角（90°～180°）< 平角（180°）< 周角（360°）']
      };
    }
  };

  MI.registerUnit({ id: 'u2', title: '角的度量', cards: cards, skills: skills, generators: G, fixed: fixed });
  MI.u2 = { kindOf: kindOf };
})(typeof window !== 'undefined' ? window : globalThis);

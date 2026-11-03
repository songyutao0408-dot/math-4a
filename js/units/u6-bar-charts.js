/* 第⑥单元 · 条形统计图（单式和复式）
 * 本文件只放内容：知识卡、知识点、题目生成器。图都由代码现场画，答案都由代码计算。 */
(function (root) {
  'use strict';
  var MI = root.MathIsland = root.MathIsland || {};
  var U = MI.util;

  function options(rng, correct, wrongs, k) {
    var w = U.uniq(wrongs.filter(function (x) { return x !== correct && x != null; }));
    w = rng.shuffle(w).slice(0, (k || 4) - 1);
    return rng.shuffle([correct].concat(w));
  }

  var CONTEXTS = [
    { title: '四（1）班同学最喜欢的运动', cats: ['跳绳', '踢毽', '拍球', '跑步'], unit: '人数/人', u: '人', groups: ['男生', '女生'] },
    { title: '水果店一天卖出的水果', cats: ['苹果', '香蕉', '橘子', '梨'], unit: '数量/千克', u: '千克', groups: ['上午', '下午'] },
    { title: '四年级各班借书情况', cats: ['一班', '二班', '三班', '四班'], unit: '数量/本', u: '本', groups: ['故事书', '科技书'] },
    { title: '小区各月用电情况', cats: ['一月', '二月', '三月', '四月', '五月'], unit: '电量/千瓦时', u: '千瓦时', groups: ['今年', '去年'] }
  ];

  /** 生成一组互不相同的数据（都是 step 的倍数；half 为真时可以是半格） */
  function values(rng, n, step, maxCells, half) {
    var unit = half ? step / 2 : step, top = maxCells * step / unit, out = [];
    while (out.length < n) {
      var v = rng.int(2, top) * unit;
      if (out.indexOf(v) < 0) out.push(v);
    }
    return out;
  }
  function chartOf(ctx, series, step, orient, showValues) {
    var max = 0;
    series.forEach(function (s) { s.values.forEach(function (v) { max = Math.max(max, v); }); });
    var cells = Math.max(4, Math.ceil(max / step) + 1);
    return { kind: 'bars', title: ctx.title, unit: ctx.unit, cats: ctx.cats, series: series, step: step, cells: cells, orient: orient || 'v', showValues: !!showValues };
  }
  /** “几格（半）是多少”的说法 */
  function howMuch(v, step) {
    var c = Math.floor(v / step), half = v % step !== 0;
    return half ? c + ' 格是 ' + c + ' × ' + step + ' = ' + c * step + '，半格是 ' + step / 2 + '，合起来是 ' + v
      : c + ' × ' + step + ' = ' + v;
  }
  function stepFor(rng, d) { return rng.pick(d === 1 ? [1, 2, 5] : d === 2 ? [2, 5, 10] : [10, 20, 50, 100]); }

  var cards = [
    {
      id: 'single', emoji: '📊', title: '单式条形统计图',
      points: ['用一个单位长度表示一定的数量，根据数量的多少画成长短不同的直条，按一定顺序排列。', '有纵向和横向两种。', '优点：能直观地看出数量的多少，便于比较。'],
      examples: ['直条越长，表示的数量越多。'],
      pitfall: '看清楚每格代表多少，再读数。'
    },
    {
      id: 'step', emoji: '📐', title: '每格代表几',
      points: ['1 格可以代表 1、2、5、10、20、50、100 等，要根据数据大小选择合适的。', '数据越大，每格代表的数就要越大，最长的直条才画得下。'],
      examples: ['最大的数据是 86，纵轴有 10 格：每格代表 10 才画得下。'],
      pitfall: '每格代表的数不是 1 时，最容易读错数据。'
    },
    {
      id: 'draw', emoji: '🖍️', title: '画条形统计图',
      points: ['写标题 → 确定每格代表多少 → 画直条 → 在直条上方（或右侧）标数据 → 注明制图日期。'],
      examples: ['每格代表 5，数据是 35，就画 7 格。'],
      pitfall: '数据不是整格时，要画到格子的一半，比如每格代表 10，45 画 4 格半。'
    },
    {
      id: 'double', emoji: '📈', title: '复式条形统计图',
      points: ['同时表示两组（或多组）数据，用不同颜色或花纹的直条区分，一定要有图例。', '便于对两组数据进行比较。'],
      examples: ['某班男生、女生最喜欢的运动人数。'],
      pitfall: '先看图例，分清哪种颜色代表哪一组。'
    },
    {
      id: 'read', emoji: '🔎', title: '读图分析',
      points: ['找最多、最少；算相差多少、一共多少。', '根据数据提出问题、作出判断或给出建议。'],
      examples: ['最长的直条代表的项目最多。'],
      pitfall: '直条不是从 0 开始画时，不能只看直条长短来比较。'
    }
  ];

  var skills = [
    { id: 'read', name: '读条形统计图' },
    { id: 'step', name: '每格代表几' },
    { id: 'draw', name: '补全统计图' },
    { id: 'double', name: '复式条形统计图' },
    { id: 'concept', name: '统计图知识' }
  ];

  var G = {};

  // ① 读单式条形统计图（不标数据，要自己读）
  // 基础：每格 1/2/5；提高：每格 2/5/10，问相差、一共；挑战：每格 10～100，有半格
  G.readSingle = {
    skill: 'read', levels: [1, 2, 3], weight: 1.6,
    gen: function (rng, d) {
      var ctx = rng.pick(CONTEXTS), step = stepFor(rng, d), n = ctx.cats.length;
      var vals = values(rng, n, step, 8, d === 3);
      var chart = chartOf(ctx, [{ name: '', values: vals }], step, rng.chance(0.3) ? 'h' : 'v', false);
      var ask = d === 1 ? rng.pick(['value', 'most', 'least']) : rng.pick(['value', 'diff', 'sum', 'most']);
      var i = rng.int(0, n - 1), j = (i + rng.int(1, n - 1)) % n;
      var readStep = '每格代表 ' + step + ' ' + ctx.u;
      var cellsOf = function (v) { var c = v / step; return c === Math.floor(c) ? c + ' 格' : Math.floor(c) + ' 格半'; };
      if (ask === 'most' || ask === 'least') {
        var best = vals.indexOf(ask === 'most' ? Math.max.apply(null, vals) : Math.min.apply(null, vals));
        return {
          type: 'choice', prompt: '看统计图：' + (ask === 'most' ? '哪一项最多？' : '哪一项最少？'),
          data: { figure: chart, options: ctx.cats.slice() }, answer: ctx.cats[best],
          hint: '直条' + (ask === 'most' ? '最长' : '最短') + '的那一项。',
          explanation: U.steps([(ask === 'most' ? '最长' : '最短') + '的直条是“' + ctx.cats[best] + '”', readStep + '，它有 ' + cellsOf(vals[best]) + '，是 ' + vals[best] + ' ' + ctx.u])
        };
      }
      if (ask === 'value') {
        return {
          type: 'fill', prompt: '看统计图：“' + ctx.cats[i] + '”是多少' + ctx.u + '？',
          data: { figure: chart, template: '[] ' + ctx.u }, answer: String(vals[i]),
          hint: '先看每格代表多少，再数直条有几格。',
          explanation: U.steps([readStep, '“' + ctx.cats[i] + '”的直条有 ' + cellsOf(vals[i]), howMuch(vals[i], step)])
        };
      }
      if (ask === 'diff') {
        var a = Math.max(vals[i], vals[j]), b = Math.min(vals[i], vals[j]);
        var big = vals[i] > vals[j] ? ctx.cats[i] : ctx.cats[j], small = vals[i] > vals[j] ? ctx.cats[j] : ctx.cats[i];
        return {
          type: 'fill', prompt: '看统计图：“' + big + '”比“' + small + '”多多少' + ctx.u + '？',
          data: { figure: chart, template: '多 [] ' + ctx.u }, answer: String(a - b),
          hint: '先分别读出两个数，再相减。',
          explanation: U.steps([readStep, big + ' 是 ' + a + '，' + small + ' 是 ' + b, a + ' − ' + b + ' = ' + (a - b) + '（' + ctx.u + '）'])
        };
      }
      var sum = vals.reduce(function (s, v) { return s + v; }, 0);
      return {
        type: 'fill', prompt: '看统计图：一共是多少' + ctx.u + '？',
        data: { figure: chart, template: '一共 [] ' + ctx.u }, answer: String(sum),
        hint: '每一项都读出来，再加起来。',
        explanation: U.steps([readStep, '读出每一项：' + ctx.cats.map(function (c, k) { return c + ' ' + vals[k]; }).join('，'), vals.join(' + ') + ' = ' + sum + '（' + ctx.u + '）'])
      };
    }
  };

  // ② 每格代表几才合适
  G.pickStep = {
    skill: 'step', levels: [1, 2, 3],
    gen: function (rng, d) {
      var STEPS = [1, 2, 5, 10, 20, 50, 100];
      var ctx = rng.pick(CONTEXTS), n = ctx.cats.length;
      var si = d === 1 ? rng.int(0, 2) : d === 2 ? rng.int(1, 4) : rng.int(3, 6);
      var s = STEPS[si];
      var lower = si > 0 ? STEPS[si - 1] : 0;
      // 最大值在 (lower×10, s×10] 之间，保证每格最少要代表 s
      var max = rng.int(Math.max(lower * 10 + 1, 6), s * 10);
      var vals = [max];
      while (vals.length < n) { var v = rng.int(Math.max(1, Math.floor(max / 4)), max - 1); if (vals.indexOf(v) < 0) vals.push(v); }
      vals = rng.shuffle(vals);
      var opts = STEPS.slice(Math.max(0, si - 2), si + 2).map(String);
      return {
        type: 'choice', prompt: '要把下表的数据画成条形统计图，纵轴一共只有 10 格。每格最少要代表几，最长的直条才画得下？',
        data: { table: { head: ['项目'].concat(ctx.cats), rows: [['数量/' + ctx.u].concat(vals.map(String))] }, options: opts },
        answer: String(s),
        hint: '最大的数据是 ' + max + '，10 格要装得下它。',
        explanation: U.steps(['最大的数据是 ' + max, (lower ? '如果每格代表 ' + lower + '，10 格最多表示 ' + lower * 10 + '，画不下；' : '') + '每格代表 ' + s + '，10 格最多表示 ' + s * 10 + '，画得下', '所以每格最少要代表 ' + s])
      };
    }
  };

  // ③ 拖动直条高度补全统计图
  G.fillBars = {
    skill: 'draw', levels: [1, 2, 3], weight: 1.5,
    gen: function (rng, d) {
      var ctx = rng.pick(CONTEXTS), step = stepFor(rng, d), n = ctx.cats.length;
      var double = d === 3 && rng.chance(0.5);
      var series = [{ name: ctx.groups[0], values: values(rng, n, step, 8, d === 3) }];
      if (double) series.push({ name: ctx.groups[1], values: values(rng, n, step, 8, d === 3) });
      var chart = chartOf(ctx, series, step, d === 2 && rng.chance(0.4) ? 'h' : 'v', true);
      if (!double) chart.series[0].name = '';
      var total = n * series.length;
      var missing = rng.sample(U.range(0, total - 1), d === 1 ? 1 : 2).sort(function (a, b) { return a - b; });
      var ans = missing.map(function (idx) { return series[Math.floor(idx / n)].values[idx % n]; });
      var head = ['项目'].concat(ctx.cats);
      var rows = series.map(function (s) { return [(double ? s.name : '数量') + '/' + ctx.u].concat(s.values.map(String)); });
      var names = missing.map(function (idx) { return (double ? series[Math.floor(idx / n)].name + '·' : '') + ctx.cats[idx % n]; });
      return {
        type: 'barFill', skill: double ? 'double' : 'draw',
        prompt: '根据统计表，把统计图里虚线的直条补画完整（每格代表 ' + step + ' ' + ctx.u + '）。',
        data: { table: { head: head, rows: rows }, chart: chart, missing: missing, snap: d === 3 ? 0.5 : 1 },
        answer: ans,
        answerText: names.map(function (nm, i) { return nm + ' ' + ans[i]; }).join('，'),
        hint: '每格代表 ' + step + '，用数据除以 ' + step + '，就是要画几格。',
        explanation: U.steps(['每格代表 ' + step + ' ' + ctx.u].concat(names.map(function (nm, i) {
          var c = ans[i] / step;
          return nm + '：' + ans[i] + ' ÷ ' + step + ' = ' + (c === Math.floor(c) ? c + '，画 ' + c + ' 格' : Math.floor(c) + ' 还多半格，画 ' + Math.floor(c) + ' 格半');
        })))
      };
    }
  };

  // ④ 复式条形统计图
  G.readDouble = {
    skill: 'double', levels: [2, 3], weight: 1.5,
    gen: function (rng, d) {
      var ctx = rng.pick(CONTEXTS), step = stepFor(rng, d), n = ctx.cats.length;
      var A = values(rng, n, step, 8, d === 3), B = values(rng, n, step, 8, d === 3);
      // 每一项两组不相等，“相差最多”只有一个
      var unit = d === 3 ? step / 2 : step, diffs, maxDiff;
      for (var t = 0; ; t++) {
        diffs = A.map(function (a, i) { return Math.abs(a - B[i]); });
        maxDiff = Math.max.apply(null, diffs);
        if (diffs.indexOf(0) < 0 && diffs.filter(function (x) { return x === maxDiff; }).length === 1) break;
        if (t > 200) { B = A.map(function (a, k) { return a + (k + 1) * unit; }); continue; }
        B = values(rng, n, step, 8, d === 3);
      }
      var chart = chartOf(ctx, [{ name: ctx.groups[0], values: A }, { name: ctx.groups[1], values: B }], step, 'v', d === 2);
      var ask = rng.pick(['diffOne', 'maxDiff', 'groupTotal']);
      var g0 = ctx.groups[0], g1 = ctx.groups[1];
      if (ask === 'maxDiff') {
        var mi = diffs.indexOf(maxDiff);
        return {
          type: 'choice', prompt: '看复式条形统计图：哪一项' + g0 + '和' + g1 + '相差最多？',
          data: { figure: chart, options: ctx.cats.slice() }, answer: ctx.cats[mi],
          hint: '先看图例分清两种颜色，再比较每一项两根直条的长短差。',
          explanation: U.steps(['每格代表 ' + step, ctx.cats.map(function (c, i) { return c + '：' + A[i] + ' 和 ' + B[i] + '，相差 ' + diffs[i]; }).join('；'), '相差最多的是' + ctx.cats[mi]])
        };
      }
      if (ask === 'groupTotal') {
        var useA = rng.chance(0.5), arr = useA ? A : B, sum = arr.reduce(function (s, v) { return s + v; }, 0);
        return {
          type: 'fill', prompt: '看复式条形统计图：' + (useA ? g0 : g1) + '一共是多少' + ctx.u + '？',
          data: { figure: chart, template: '一共 [] ' + ctx.u }, answer: String(sum),
          hint: '先看图例，只读' + (useA ? g0 : g1) + '那种颜色的直条。',
          explanation: U.steps(['看图例：' + (useA ? g0 : g1) + '是' + (useA ? '第一种' : '第二种') + '颜色', '读出每一项：' + arr.join('、'), arr.join(' + ') + ' = ' + sum + '（' + ctx.u + '）'])
        };
      }
      var i = rng.int(0, n - 1), more = A[i] > B[i];
      return {
        type: 'fill', prompt: '看复式条形统计图：“' + ctx.cats[i] + '”这一项，' + (more ? g0 + '比' + g1 : g1 + '比' + g0) + '多多少' + ctx.u + '？',
        data: { figure: chart, template: '多 [] ' + ctx.u }, answer: String(Math.abs(A[i] - B[i])),
        hint: '先看图例分清颜色，再分别读出两个数相减。',
        explanation: U.steps(['看图例分清两组', ctx.cats[i] + '：' + g0 + ' ' + A[i] + '，' + g1 + ' ' + B[i], Math.max(A[i], B[i]) + ' − ' + Math.min(A[i], B[i]) + ' = ' + Math.abs(A[i] - B[i]) + '（' + ctx.u + '）'])
      };
    }
  };

  // ⑤ 每格代表几、有几格 → 表示多少
  G.cellValue = {
    skill: 'read', levels: [1, 2, 3],
    gen: function (rng, d) {
      var step = stepFor(rng, d), c = rng.int(3, 9), half = d === 3 && rng.chance(0.6);
      var v = c * step + (half ? step / 2 : 0);
      return {
        type: 'fill', prompt: '条形统计图里每格代表 ' + step + '，一根直条画了 ' + c + ' 格' + (half ? '半' : '') + '，它表示多少？',
        data: {}, answer: String(v),
        hint: '几格就是几个 ' + step + (half ? '，半格是 ' + step / 2 : '') + '。',
        explanation: U.steps([c + ' 格是 ' + c + ' × ' + step + ' = ' + c * step].concat(half ? ['半格是 ' + step / 2 + '，一共 ' + c * step + ' + ' + step / 2 + ' = ' + v] : ['所以表示 ' + v]))
      };
    }
  };

  // ⑥ 统计图知识（固定题）
  var fixed = [
    { skill: 'concept', prompt: '复式条形统计图一定要有图例。', answer: true, explanation: ['复式条形统计图用不同颜色或花纹表示不同的组，要有图例才看得懂。'] },
    { skill: 'concept', prompt: '条形统计图能直观地看出数量的多少，便于比较。', answer: true, explanation: ['这是条形统计图的优点。'] },
    { skill: 'step', prompt: '条形统计图里，1 格只能代表 1。', answer: false, explanation: ['1 格可以代表 1、2、5、10、20、50、100 等，要根据数据大小选择。'] },
    { skill: 'concept', prompt: '条形统计图只能画成竖着的。', answer: false, explanation: ['有纵向和横向两种。'] },
    { skill: 'read', prompt: '直条越长，表示的数量越多（每格代表的数相同）。', answer: true, explanation: ['同一幅图里每格代表的数一样，直条越长数量越多。'] }
  ];
  ['concept', 'step', 'read'].forEach(function (sid) {
    G['concept_' + sid] = {
      skill: sid, levels: [1, 2], weight: sid === 'concept' ? 1 : 0.4,
      gen: function (rng) {
        var f = rng.pick(fixed.filter(function (x) { return x.skill === sid; }));
        return { type: 'judge', prompt: '判断对错：' + f.prompt, data: {}, answer: f.answer, hint: '回忆一下条形统计图的特点。', explanation: f.explanation.slice() };
      }
    };
  });

  // ⑦ 画图的步骤
  G.drawSteps = {
    skill: 'draw', levels: [2, 3],
    gen: function (rng) {
      var right = '写标题 → 定每格代表几 → 画直条 → 标数据 → 写制图日期';
      return {
        type: 'choice', prompt: '画条形统计图的步骤，正确的顺序是（　）。',
        data: { options: rng.shuffle([right, '画直条 → 写标题 → 定每格代表几 → 标数据 → 写制图日期', '写标题 → 画直条 → 定每格代表几 → 标数据 → 写制图日期', '定每格代表几 → 标数据 → 画直条 → 写标题 → 写制图日期']) },
        answer: right, hint: '要先知道每格代表几，才能画直条。',
        explanation: U.steps(['写标题', '确定每格代表多少', '画直条', '在直条上方（或右侧）标数据', '注明制图日期'])
      };
    }
  };

  MI.registerUnit({ id: 'u6', title: '条形统计图', cards: cards, skills: skills, generators: G, fixed: fixed });
})(typeof window !== 'undefined' ? window : globalThis);

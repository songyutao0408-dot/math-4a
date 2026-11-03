/* 第①单元 · 大数的认识
 * 本文件只放“内容”：知识卡、知识点、题目生成器、少量固定题。界面代码不在这里。
 * 家长对照课本修改时：知识卡改 cards；数字位数范围改每个生成器里的 LEN 表。
 * 所有答案都由代码计算。 */
(function (root) {
  'use strict';
  var MI = root.MathIsland = root.MathIsland || {};
  var N = MI.num, U = MI.util;
  var read = N.toChineseReading;
  var PLACE = N.PLACE_NAMES, CU = N.COUNT_UNITS, FULL = N.UNIT_FULL;

  // ---------------------------------------------------------------
  // 小工具
  // ---------------------------------------------------------------

  /** 位数范围（按难度）：1 基础 / 2 提高 / 3 挑战 */
  var LEN = { 1: [5, 8], 2: [7, 10], 3: [9, 12] };

  /** 随机生成 len 位数字串，首位不为 0；zeroP 控制 0 出现的概率 */
  function randDigits(rng, len, zeroP) {
    var s = String(rng.int(1, 9));
    for (var i = 1; i < len; i++) s += rng.chance(zeroP) ? '0' : String(rng.int(1, 9));
    return s;
  }
  function randLen(rng, d) { return rng.int(LEN[d][0], LEN[d][1]); }

  /** 数字串里从右往左第 p 位的数字 */
  function dig(s, p) { return Number(s[s.length - 1 - p]); }

  /** 把读法切成拼读块：三｜亿｜零｜二百｜万｜零｜五百 */
  function tokenize(reading) {
    return reading.match(/零|[一二三四五六七八九]?[十百千]|[一二三四五六七八九]|[万亿]/g) || [];
  }

  /** 选项：去重、打乱，保证正确答案在里面 */
  function options(rng, correct, wrongs, k) {
    var w = U.uniq(wrongs.filter(function (x) { return x !== correct && x != null; }));
    w = rng.shuffle(w).slice(0, (k || 4) - 1);
    return rng.shuffle([correct].concat(w));
  }

  /** 读数讲解（逐级） */
  function readingExplain(n) {
    var segs = N.readingSegments(n);
    var out = ['从右往左四位一级分级 → ' + N.splitLevelsText(n)];
    segs.forEach(function (seg) {
      var label = N.LEVEL_LABELS[seg.level];
      if (!seg.text) {
        if (seg.level === 0) out.push('个级 ' + seg.digits + ' 全是 0，什么也不读');
        else out.push(label + ' ' + seg.digits + ' 全是 0，这一级不读，“' + N.LEVEL_NAMES[seg.level] + '”字也不读');
        return;
      }
      var note = [];
      if (seg.text.charAt(0) === '零') note.push('前面有 0，只读一个“零”');
      if (/0$/.test(seg.digits) && seg.level > 0) note.push('这一级末尾的 0 不读');
      if (/0$/.test(seg.digits) && seg.level === 0 && segs.length > 1) note.push('末尾的 0 不读');
      var how = seg.level > 0 ? '（先按个级的读法读，再加“' + N.LEVEL_NAMES[seg.level] + '”）' : '';
      out.push('读' + label + '：' + seg.digits + ' → “' + seg.text + '”' + how + (note.length ? '，' + note.join('，') : ''));
    });
    out = U.steps(out);
    out.push('合起来读作：' + read(n));
    return out;
  }

  /** 写数讲解（逐级） */
  function writingExplain(n) {
    var segs = N.readingSegments(n);
    var out = [];
    segs.forEach(function (seg) {
      var label = N.LEVEL_LABELS[seg.level];
      if (!seg.text) out.push(label + '一个单位也没有，写 0000 占位');
      else out.push('写' + label + '：“' + seg.text + '” → ' + seg.digits + (/0/.test(seg.digits) ? '（一个单位也没有的数位写 0 占位）' : ''));
    });
    out = U.steps(out);
    out.push('合起来是 ' + n + '。分级检查：' + N.splitLevelsText(n) + '，除了最高级，每级都是四位 ✔');
    return out;
  }

  // ---------------------------------------------------------------
  // 知识卡（要点 + 例子 + 易错提醒）
  // ---------------------------------------------------------------
  var cards = [
    {
      id: 'units', emoji: '🧱', title: '计数单位和数位',
      points: [
        '计数单位：一、十、百、千、万、十万、百万、千万、亿、十亿、百亿、千亿。',
        '10 个一万是十万，10 个十万是一百万，10 个一百万是一千万，10 个一千万是一亿。',
        '每相邻两个计数单位之间的进率都是 10，这叫十进制计数法。'
      ],
      examples: ['360000 中的“6”在万位上，表示 6 个万；“3”在十万位上，表示 3 个十万。'],
      pitfall: '“万”是计数单位，“万位”是数位，别说混啦。'
    },
    {
      id: 'levels', emoji: '✂️', title: '数级：四位一级',
      points: [
        '从右往左每四位一级。',
        '个级：个位、十位、百位、千位。',
        '万级：万位、十万位、百万位、千万位。',
        '亿级：亿位、十亿位、百亿位、千亿位。'
      ],
      examples: ['302000500 → ' + N.splitLevelsText(302000500) + '（亿级｜万级｜个级）'],
      pitfall: '一定要从右往左分，从左往右分就全乱了。'
    },
    {
      id: 'compose', emoji: '🧩', title: '数的组成',
      points: ['几个亿、几个千万……组成的数：在对应数位上写几，其他数位写 0 占位。'],
      examples: ['3 个亿、5 个千万和 8 个万组成的数是 350080000。', '4 个十万、6 个千、2 个一组成的数是 406002。'],
      pitfall: '空着的数位别忘了写 0。'
    },
    {
      id: 'read', emoji: '🗣️', title: '读数',
      points: [
        '先分级，从最高级读起。',
        '亿级、万级的数，先按个级的读法读，再在后面加“亿”或“万”。',
        '每一级末尾的 0 都不读；其他数位上有一个 0 或连续几个 0，都只读一个“零”。'
      ],
      examples: [302000500, 50060000, 10010010, 101000, 1000010000].map(function (n) { return n + ' → ' + read(n); }),
      pitfall: '101000 读作“十万一千”，万级末尾的 0 不读，不要读成“十万零一千”。'
    },
    {
      id: 'write', emoji: '✍️', title: '写数',
      points: [
        '从高位起，一级一级往下写。',
        '哪个数位上一个单位也没有，就写 0 占位。',
        '写完分级检查：除了最高级，每级都必须是四位。'
      ],
      examples: ['二十亿零三百万 → 2003000000', '四千零五万六千 → 40056000'],
      pitfall: '“零”不一定只代表一个 0，可能是好几个 0。'
    },
    {
      id: 'compare', emoji: '⚖️', title: '比较大小',
      points: ['位数不同：位数多的数大。', '位数相同：从最高位起依次比，第一个不同的数位上，数大的那个数就大。'],
      examples: ['5□8000 > 568000，□ 里可以填 7、8、9。填 6 时还要往后比：568000 = 568000，不成立。'],
      pitfall: '先数清楚位数，再比。'
    },
    {
      id: 'rewrite', emoji: '🔁', title: '改写成“万”“亿”作单位',
      points: ['整万数：去掉末尾 4 个 0，加“万”字，用“=”。', '整亿数：去掉末尾 8 个 0，加“亿”字，用“=”。'],
      examples: ['360000 = 36万', '2700000000 = 27亿'],
      pitfall: '改写是准确数，用“=”，不能用“≈”。'
    },
    {
      id: 'approx', emoji: '🎯', title: '求近似数（四舍五入）',
      points: [
        '省略“万”位后面的尾数：看千位，小于 5 舍去，大于或等于 5 向万位进一，加“万”字。',
        '省略“亿”位后面的尾数：看千万位。',
        '求近似数用“≈”。'
      ],
      examples: ['485600 ≈ ' + N.approxText(485600, '万'), '449999 ≈ ' + N.approxText(449999, '万') + '（只看千位，后面的 9 不用管）', '2346000000 ≈ ' + N.approxText(2346000000, '亿')],
      pitfall: '改写用“=”，求近似数用“≈”，这是最常错的地方！'
    },
    {
      id: 'approx-back', emoji: '🔍', title: '近似数倒着想',
      points: [
        '四舍五入到万位约是 5 万：“舍”来的最大，是 54999；“入”来的最小，是 45000。',
        '□ 题：把 0～9 一个个放进去试一试，看哪些符合。'
      ],
      examples: ['49□500 ≈ 50万，要向万位进一，千位要 ≥ 5，□ 里可以填 5～9。'],
      pitfall: '最大的那个数千位是 4，最小的那个数千位是 5。'
    },
    {
      id: 'yi', emoji: '📏', title: '1 亿有多大',
      points: ['100 张纸约厚 1 厘米，1 亿张纸约高 1 万米，比珠穆朗玛峰还高！', '可以从数数、叠纸、称重、时间等角度感受。'],
      examples: ['1 亿里面有 100 万个 100，所以 1 亿张纸约厚 100 万厘米 = 1 万米。'],
      pitfall: '100 厘米 = 1 米，换单位时数一数 0。'
    },
    {
      id: 'natural', emoji: '🌱', title: '自然数',
      points: ['表示物体个数的 0、1、2、3……都是自然数。', '0 是最小的自然数，没有最大的自然数，自然数的个数是无限的。'],
      examples: ['一个物体也没有，用 0 表示。'],
      pitfall: '最小的自然数是 0，不是 1。'
    },
    {
      id: 'history', emoji: '🧮', title: '算盘和数的产生',
      points: ['算盘：上珠一颗表示 5，下珠一颗表示 1。', '古人用结绳计数、刻痕计数等方法记数。', '阿拉伯数字最早是由古印度人发明的。'],
      examples: ['某一档上珠拨下 1 颗、下珠拨上 3 颗，表示 5 + 3 = 8。'],
      pitfall: '靠近横梁的珠子才算数。'
    }
  ];

  // ---------------------------------------------------------------
  // 知识点
  // ---------------------------------------------------------------
  var skills = [
    { id: 'place', name: '计数单位和数位' },
    { id: 'levels', name: '数级与分级' },
    { id: 'compose', name: '数的组成' },
    { id: 'read', name: '读数' },
    { id: 'write', name: '写数' },
    { id: 'compare', name: '比较大小' },
    { id: 'rewrite', name: '改写成万、亿作单位' },
    { id: 'approx', name: '求近似数' },
    { id: 'yi', name: '1 亿有多大' },
    { id: 'natural', name: '自然数' },
    { id: 'history', name: '算盘和数的产生' }
  ];

  // ---------------------------------------------------------------
  // 生成器。每个生成器：{ skill, levels, weight?, gen(rng, d) → 题目 }
  // ---------------------------------------------------------------
  var G = {};

  // ① 数字在哪一位、表示多少
  // 参数范围：基础 5～8 位，提高 7～10 位，挑战 9～12 位；所选数字在数中只出现一次，且不在个位
  G.placeOfDigit = {
    skill: 'place', levels: [1, 2, 3], weight: 1.2,
    gen: function (rng, d) {
      var s, p, x;
      for (;;) {
        s = randDigits(rng, randLen(rng, d), 0.25);
        var cands = [];
        for (var i = 1; i < s.length; i++) {
          var dd = dig(s, i);
          if (dd > 0 && s.split(String(dd)).length === 2) cands.push(i);
        }
        if (cands.length) { p = rng.pick(cands); x = dig(s, p); break; }
      }
      var correct = PLACE[p] + '上，表示 ' + x + ' 个' + CU[p];
      var wrongs = [];
      if (p + 1 < 12) wrongs.push(PLACE[p + 1] + '上，表示 ' + x + ' 个' + CU[p + 1]);
      if (p - 1 >= 0) wrongs.push(PLACE[p - 1] + '上，表示 ' + x + ' 个' + CU[p - 1]);
      wrongs.push(PLACE[p] + '上，表示 ' + x + ' 个一');
      if (p + 4 < 12) wrongs.push(PLACE[p + 4] + '上，表示 ' + x + ' 个' + CU[p + 4]);
      return {
        type: 'choice',
        prompt: '在下面这个数中，数字“' + x + '”在什么位上？表示多少？',
        data: { show: s, options: options(rng, correct, wrongs) },
        answer: correct,
        hint: '从右往左数：个位、十位、百位、千位、万位……数到“' + x + '”停下来。',
        explanation: U.steps([
          '从右往左数数位：个位、十位、百位、千位、万位……',
          '“' + x + '”在从右往左第 ' + (p + 1) + ' 位，是' + PLACE[p],
          PLACE[p] + '的计数单位是“' + CU[p] + '”，所以表示 ' + x + ' 个' + CU[p] + '，也就是 ' + (x * N.pow10(p))
        ]).concat(['小提醒：“万”是计数单位，“万位”是数位。'])
      };
    }
  };

  // ② 计数单位之间的进率
  // 基础：10 个某单位是多少（千→千亿范围内）；提高：1 个大单位里有几个小单位（10 或 100）；挑战：100/1000 个某单位是多少
  G.unitRate = {
    skill: 'place', levels: [1, 2, 3],
    gen: function (rng, d) {
      if (d === 1) {
        var k = rng.int(2, 10);
        return {
          type: 'choice',
          prompt: '10 个' + FULL[k] + '是（　）。',
          data: { options: options(rng, FULL[k + 1], [FULL[k + 2], FULL[k], FULL[k - 1], FULL[k + 3]]) },
          answer: FULL[k + 1],
          hint: '相邻两个计数单位之间的进率是 10。',
          explanation: U.steps(['相邻两个计数单位之间的进率都是 10', FULL[k] + '的下一个计数单位是' + FULL[k + 1], '所以 10 个' + FULL[k] + '是' + FULL[k + 1]])
        };
      }
      if (d === 2) {
        var m = rng.int(1, 2), k2 = rng.int(2, 11 - m);
        var big = FULL[k2 + m], small = FULL[k2], ans = String(N.pow10(m));
        return {
          type: 'fill',
          prompt: big + '里面有几个' + small + '？',
          data: { template: big + '里面有 [] 个' + small },
          answer: ans,
          hint: '一个一个计数单位往上数，每升一级就是 10 倍。',
          explanation: U.steps([
            '从' + small + '往上数：' + FULL.slice(k2, k2 + m + 1).join(' → '),
            '升了 ' + m + ' 级，每级 10 倍' + (m === 2 ? '，10 × 10 = 100' : ''),
            '所以' + big + '里面有 ' + ans + ' 个' + small
          ])
        };
      }
      var m3 = rng.int(2, 3), k3 = rng.int(2, 11 - m3), cnt = N.pow10(m3);
      return {
        type: 'choice',
        prompt: cnt + ' 个' + FULL[k3] + '是（　）。',
        data: { options: options(rng, FULL[k3 + m3], [FULL[k3 + m3 - 1], FULL[k3 + m3 + 1], FULL[k3 + 1], FULL[k3 + m3 - 2]]) },
        answer: FULL[k3 + m3],
        hint: cnt + ' 有 ' + m3 + ' 个 0，就往上数 ' + m3 + ' 个计数单位。',
        explanation: U.steps(['10 个' + FULL[k3] + '是' + FULL[k3 + 1], cnt + ' 是 ' + m3 + ' 个 10 连乘，要往上数 ' + m3 + ' 级：' + FULL.slice(k3, k3 + m3 + 1).join(' → '), '所以 ' + cnt + ' 个' + FULL[k3] + '是' + FULL[k3 + m3]])
      };
    }
  };

  // ③ 数位顺序
  G.placeOrder = {
    skill: 'place', levels: [1, 2],
    gen: function (rng, d) {
      if (d === 1) {
        var k = rng.int(5, 12);
        return {
          type: 'choice',
          prompt: '从右往左数，第 ' + k + ' 位是（　）。',
          data: { options: options(rng, PLACE[k - 1], [PLACE[k - 2], PLACE[k] || PLACE[k - 3], PLACE[k - 3], CU[k - 1]]) },
          answer: PLACE[k - 1],
          hint: '从右往左：个位、十位、百位、千位、万位、十万位、百万位、千万位、亿位……',
          explanation: U.steps(['从右往左依次是：' + PLACE.slice(0, k).join('、'), '第 ' + k + ' 位是' + PLACE[k - 1]])
        };
      }
      var p = rng.int(1, 10);
      var correct = PLACE[p + 1] + '和' + PLACE[p - 1];
      var wrongs = [PLACE[p + 1] + '和' + PLACE[p], (PLACE[p + 2] || PLACE[p - 2]) + '和' + PLACE[p - 1], PLACE[p] + '和' + PLACE[p - 1]];
      if (p >= 2) wrongs.push(PLACE[p + 1] + '和' + PLACE[p - 2]);
      return {
        type: 'choice',
        prompt: '和' + PLACE[p] + '相邻的两个数位是（　）。',
        data: { options: options(rng, correct, wrongs) },
        answer: correct,
        hint: '把数位顺序从右往左背一遍，找' + PLACE[p] + '的左边和右边。',
        explanation: U.steps(['数位顺序（从右往左）：' + PLACE.slice(0, p + 2).join('、'), PLACE[p] + '左边是' + PLACE[p + 1] + '，右边是' + PLACE[p - 1]])
      };
    }
  };

  // ④ 点击分级（分级线）
  G.splitLevels = {
    skill: 'levels', levels: [1, 2, 3], weight: 1.2,
    gen: function (rng, d) {
      var len = d === 1 ? rng.int(6, 8) : d === 2 ? rng.int(8, 10) : rng.int(10, 12);
      var s = randDigits(rng, len, 0.3);
      var ans = [];
      // 第 i 个空隙在第 i 个数字后面（从左往右，从 0 开始）
      for (var i = 0; i < len - 1; i++) if ((len - 1 - i) % 4 === 0) ans.push(i);
      return {
        type: 'split',
        prompt: '给这个数分级：点一点数字之间的空隙，画上分级线。',
        data: { digits: s },
        answer: ans,
        answerText: N.splitLevelsText(Number(s)),
        hint: '从右往左，每数四位画一条线。',
        explanation: U.steps([
          '从右往左，每四位画一条分级线 → ' + N.splitLevelsText(Number(s)),
          '一共分成 ' + (ans.length + 1) + ' 级：' + N.LEVEL_LABELS.slice(0, ans.length + 1).reverse().join('、')
        ])
      };
    }
  };

  // ⑤ 数字在哪一级 / 某数位在哪一级
  G.levelOf = {
    skill: 'levels', levels: [1, 2, 3],
    gen: function (rng, d) {
      var labels = N.LEVEL_LABELS.slice();
      if (rng.chance(0.4)) {
        var p = rng.int(1, 11);
        return {
          type: 'choice',
          prompt: PLACE[p] + '属于哪一级？',
          data: { options: rng.shuffle(labels) },
          answer: labels[N.levelOfPlace(p)],
          hint: '个级：个、十、百、千；万级：万、十万、百万、千万；亿级：亿、十亿、百亿、千亿。',
          explanation: U.steps([labels[N.levelOfPlace(p)] + '包括：' + PLACE.slice(N.levelOfPlace(p) * 4, N.levelOfPlace(p) * 4 + 4).join('、'), '所以' + PLACE[p] + '在' + labels[N.levelOfPlace(p)]])
        };
      }
      var s, q;
      for (;;) {
        s = randDigits(rng, randLen(rng, d), 0.25);
        var cands = [];
        for (var i = 0; i < s.length; i++) { var dd = dig(s, i); if (dd > 0 && s.split(String(dd)).length === 2) cands.push(i); }
        if (cands.length) { q = rng.pick(cands); break; }
      }
      var x = dig(s, q);
      return {
        type: 'choice',
        prompt: '在下面这个数中，数字“' + x + '”在哪一级？',
        data: { show: s, options: rng.shuffle(labels) },
        answer: labels[N.levelOfPlace(q)],
        hint: '先从右往左四位一级分级，再看“' + x + '”落在哪一段。',
        explanation: U.steps(['分级：' + N.splitLevelsText(Number(s)), '“' + x + '”在' + PLACE[q] + '，属于' + labels[N.levelOfPlace(q)]])
      };
    }
  };

  // ⑥ 数的组成 → 写出这个数（基础用数位顺序表拖拽）
  G.compose = {
    skill: 'compose', levels: [1, 2, 3], weight: 1.2,
    gen: function (rng, d) {
      var maxP = d === 1 ? 7 : d === 2 ? 9 : 11;
      var k = d === 3 ? rng.int(3, 4) : rng.int(2, 3);
      var places = rng.sample(U.range(0, maxP), k).sort(function (a, b) { return b - a; });
      if (places[0] < 4) places[0] = rng.int(4, maxP); // 至少到万位
      places = U.uniq(places).sort(function (a, b) { return b - a; });
      var n = 0, parts = [];
      places.forEach(function (p) { var c = rng.int(1, 9); n += c * N.pow10(p); parts.push({ p: p, c: c }); });
      var shown = d === 3 ? rng.shuffle(parts) : parts;
      var desc = shown.map(function (x) { return x.c + ' 个' + CU[x.p]; });
      var descText = desc.length > 1 ? desc.slice(0, -1).join('、') + '和 ' + desc[desc.length - 1] : desc[0];
      var s = String(n);
      var exp = U.steps([
        parts.map(function (x) { return '在' + PLACE[x.p] + '写 ' + x.c; }).join('，'),
        '其他数位一个单位也没有，写 0 占位',
        '所以这个数是 ' + s + '（分级：' + N.splitLevelsText(n) + '）'
      ]);
      if (d === 1) {
        return {
          type: 'placeValue',
          prompt: '一个数由 ' + descText + '组成。把数字卡拖进数位顺序表，组成这个数。',
          data: { levels: n >= 1e8 ? 3 : 2 },
          answer: s,
          hint: '先找到每个计数单位对应的数位，再把空着的数位补上 0。',
          explanation: exp
        };
      }
      return {
        type: 'fill',
        prompt: '一个数由 ' + descText + '组成，这个数是多少？',
        data: {},
        answer: s,
        hint: d === 3 ? '注意顺序被打乱了，先按从高到低排好。空着的数位写 0。' : '在对应数位上写数，空着的数位写 0 占位。',
        explanation: exp
      };
    }
  };

  // ⑦ 分解：这个数由几个几组成
  G.decompose = {
    skill: 'compose', levels: [2, 3],
    gen: function (rng, d) {
      var maxP = d === 2 ? 7 : 11;
      var places = rng.sample(U.range(0, maxP), 3).sort(function (a, b) { return b - a; });
      if (places[0] < 4) places[0] = rng.int(5, maxP);
      if (places[0] === places[1]) places[0] = Math.min(maxP, places[1] + 2);
      var n = 0, cs = [];
      places.forEach(function (p) { var c = rng.int(1, 9); n += c * N.pow10(p); cs.push(String(c)); });
      return {
        type: 'fill',
        prompt: '填一填：',
        data: { show: String(n), template: String(n) + ' 是由 [] 个' + CU[places[0]] + '、[] 个' + CU[places[1]] + '和 [] 个' + CU[places[2]] + '组成的。' },
        answer: cs,
        hint: '找到每个计数单位对应的数位，看那一位上是几。',
        explanation: U.steps([
          '从右往左数数位：' + places.map(function (p) { return PLACE[p] + '上是 ' + N.digitAt(n, p); }).join('，'),
          '所以 ' + n + ' 是由 ' + places.map(function (p, i) { return cs[i] + ' 个' + CU[p]; }).join('、') + '组成的'
        ])
      };
    }
  };

  /** 读数用的数字：保证有一定数量的 0 */
  function readNumber(rng, d) {
    for (;;) {
      var s = randDigits(rng, randLen(rng, d), d === 1 ? 0.3 : d === 2 ? 0.45 : 0.55);
      var n = Number(s);
      var z = N.zeroCount(n);
      if (d === 1 && z <= 1) return n;
      if (d === 2 && z >= 1 && z <= 2) return n;
      if (d === 3 && (z >= 2 || /0000/.test(s.slice(-8, -4)) || (/0$/.test(s.slice(-8, -4)) && s.length > 4))) return n;
    }
  }

  // ⑧ 点选拼读
  G.readTiles = {
    skill: 'read', levels: [1, 2, 3], weight: 1.5,
    gen: function (rng, d) {
      var n = readNumber(rng, d);
      var r = read(n);
      var tokens = tokenize(r);
      var extras = ['零'];
      tokens.forEach(function (t) {
        if (/^[一二三四五六七八九][十百千]$/.test(t)) {
          var units = '十百千'.replace(t[1], '');
          extras.push(t[0] + units[Math.floor(rng.next() * 2)]);
        }
      });
      extras.push(n >= 1e8 ? '万' : rng.pick(['万', '亿']));
      extras = rng.sample(U.uniq(extras), d === 1 ? 2 : 3);
      return {
        type: 'reading',
        prompt: '点一点下面的字块，拼出这个数的读法。',
        data: { show: String(n), tiles: rng.shuffle(tokens.concat(extras)) },
        answer: r,
        hint: '先从右往左四位一级分级：' + N.splitLevelsText(n) + '。每级末尾的 0 不读哦。',
        explanation: readingExplain(n)
      };
    }
  };

  /** 读错的几种常见读法 */
  function wrongReadings(n) {
    var r = read(n), s = String(n), out = [];
    out.push(r.replace(/零/g, '')); // 漏读零
    // 级末尾的 0 也读出来（不按级处理）
    out.push(naiveReading(n));
    // 少写/多写一个 0 的数的读法
    var zi = s.indexOf('0', 1);
    if (zi > 0) out.push(read(Number(s.slice(0, zi) + s.slice(zi + 1))));
    if (s.length < 12) { var pos = rng0(s); out.push(read(Number(s.slice(0, pos) + '0' + s.slice(pos)))); }
    return out.filter(function (x) { return x && x !== r; });
  }
  function rng0(s) { return Math.max(1, Math.floor(s.length / 2)); }
  /** 不分级、把每段 0 都读出来的“错误读法” */
  function naiveReading(n) {
    var s = String(n), len = s.length, out = '', pending = false;
    for (var i = 0; i < len; i++) {
      var p = len - 1 - i, d0 = Number(s[i]), pos = p % 4, lv = Math.floor(p / 4);
      if (d0 === 0) { if (out) pending = true; }
      else {
        if (pending) { out += '零'; pending = false; }
        out += ((d0 === 1 && pos === 1 && !out) ? '' : N.DIGITS[d0]) + N.POS_UNITS[pos];
      }
      if (pos === 0 && lv > 0 && Math.floor(n / Math.pow(10000, lv)) % 10000 > 0) out += N.LEVEL_NAMES[lv];
    }
    return out;
  }

  // ⑨ 选出正确读法
  G.readChoice = {
    skill: 'read', levels: [2, 3],
    gen: function (rng, d) {
      var n, wrongs;
      for (;;) {
        n = readNumber(rng, d);
        wrongs = U.uniq(wrongReadings(n));
        if (wrongs.length >= 2) break;
      }
      var r = read(n);
      return {
        type: 'choice',
        prompt: '下面这个数，读法正确的是（　）。',
        data: { show: String(n), options: options(rng, r, wrongs) },
        answer: r,
        hint: '分级：' + N.splitLevelsText(n) + '。想想哪些 0 要读，哪些 0 不读。',
        explanation: readingExplain(n)
      };
    }
  };

  // ⑩ 读几个零
  G.zeroCount = {
    skill: 'read', levels: [2, 3],
    gen: function (rng, d) {
      var n, z;
      do { n = readNumber(rng, d); z = N.zeroCount(n); } while (z > 3);
      var opts = ['不读零', '1 个', '2 个', '3 个'];
      var ans = z === 0 ? '不读零' : z + ' 个';
      return {
        type: 'choice',
        prompt: '读下面这个数时，一共要读出几个“零”？',
        data: { show: String(n), options: opts },
        answer: ans,
        hint: '先分级，再一级一级读。每级末尾的 0 不读，中间连续的 0 只读一个“零”。',
        explanation: readingExplain(n).concat(['数一数“零”：' + (z === 0 ? '一个零也不读' : '一共读出 ' + z + ' 个零')])
      };
    }
  };

  // ⑪ 用数字卡组成八位数（一个零也不读 / 只读一个零）
  G.arrangeCards = {
    skill: 'read', levels: [3],
    gen: function (rng) {
      for (;;) {
        var a = rng.int(1, 9), m = rng.int(3, 5);
        // 首位是 a，其余 7 位里放 m-1 个 a
        var all = [];
        (function rec(i, left, s) {
          if (i === 8) { if (left === 0) all.push(s); return; }
          if (left > 0) rec(i + 1, left - 1, s + a);
          if (8 - i > left) rec(i + 1, left, s + '0');
        })(1, m - 1, String(a));
        var target = rng.pick([0, 1, 2]);
        var good = all.filter(function (s) { return N.zeroCount(Number(s)) === target; });
        var bad = all.filter(function (s) { return N.zeroCount(Number(s)) !== target; });
        if (!good.length || bad.length < 3) continue;
        var ans = rng.pick(good);
        var opts = rng.shuffle([ans].concat(rng.sample(bad, 3)));
        var want = target === 0 ? '一个零也不读' : target === 1 ? '只读一个零' : '读出两个零';
        return {
          type: 'choice',
          prompt: '用 ' + m + ' 个 ' + a + ' 和 ' + (8 - m) + ' 个 0 组成八位数。下面哪个数' + want + '？',
          data: { options: opts },
          answer: ans,
          hint: '把每个数分级读一读，数一数读出几个“零”。',
          explanation: U.steps(opts.map(function (s) {
            var z = N.zeroCount(Number(s));
            return N.splitLevelsText(Number(s)) + ' 读作“' + read(Number(s)) + '”，' + (z ? '读 ' + z + ' 个零' : '不读零') + (s === ans ? ' ✔' : '');
          })).concat(['小窍门：0 放在每一级的末尾就不读。'])
        };
      }
    }
  };

  // ⑫ 写数（基础可用数位顺序表）
  G.writeNumber = {
    skill: 'write', levels: [1, 2, 3], weight: 1.5,
    gen: function (rng, d) {
      var n = readNumber(rng, d);
      var r = read(n);
      if (d === 1 && rng.chance(0.5)) {
        return {
          type: 'placeValue',
          prompt: '把数字卡拖进数位顺序表，写出：' + r,
          data: { levels: n >= 1e8 ? 3 : 2 },
          answer: String(n),
          hint: '从高位起，一级一级往下写；哪个数位上一个单位也没有，就写 0。',
          explanation: writingExplain(n)
        };
      }
      return {
        type: 'fill',
        prompt: '写出这个数：' + r,
        data: {},
        answer: String(n),
        hint: '从高位起一级一级写，写完分级检查：除了最高级，每级都是四位。',
        explanation: writingExplain(n)
      };
    }
  };

  // ⑬ 选出正确写法
  G.writeChoice = {
    skill: 'write', levels: [2, 3],
    gen: function (rng, d) {
      var n = readNumber(rng, d), s = String(n);
      var wrongs = [];
      for (var i = 1; i < s.length; i++) {
        if (s[i] === '0') wrongs.push(s.slice(0, i) + s.slice(i + 1)); // 少一个 0
      }
      for (var j = 0; j < 3; j++) { var pos = rng.int(1, s.length - 1); wrongs.push(s.slice(0, pos) + '0' + s.slice(pos)); } // 多一个 0
      wrongs = U.uniq(wrongs).filter(function (w) { return w !== s && w.length <= 12; });
      var r = read(n);
      return {
        type: 'choice',
        prompt: '“' + r + '”写作（　）。',
        data: { options: options(rng, s, wrongs) },
        answer: s,
        hint: '一级一级写，空着的数位写 0，写完数一数每级是不是四位。',
        explanation: writingExplain(n)
      };
    }
  };

  /** 两数比较讲解 */
  function compareExplain(a, b) {
    var sa = String(a), sb = String(b);
    if (sa.length !== sb.length) {
      return U.steps([a + ' 是 ' + sa.length + ' 位数，' + b + ' 是 ' + sb.length + ' 位数', '位数多的数大，所以 ' + a + (sa.length > sb.length ? ' > ' : ' < ') + b]);
    }
    if (a === b) return U.steps(['两个数位数相同，每一位都相同', '所以 ' + a + ' = ' + b]);
    for (var i = 0; i < sa.length; i++) {
      if (sa[i] !== sb[i]) {
        var p = sa.length - 1 - i;
        return U.steps([
          '两个数都是 ' + sa.length + ' 位数，从最高位起一位一位比',
          (i > 0 ? '前面 ' + i + ' 位都相同，' : '') + '第一个不同的是' + PLACE[p] + '：' + sa[i] + (sa[i] > sb[i] ? ' > ' : ' < ') + sb[i],
          '所以 ' + a + (a > b ? ' > ' : ' < ') + b
        ]);
      }
    }
    return [];
  }

  // ⑭ 比较大小（填 > < =）
  G.compare = {
    skill: 'compare', levels: [1, 2, 3], weight: 1.2,
    gen: function (rng, d) {
      var a, b, left, right, expl;
      if (d === 1) {
        var la = rng.int(6, 9), lb = la + rng.pick([-1, 1]);
        a = Number(randDigits(rng, la, 0.3)); b = Number(randDigits(rng, lb, 0.3));
        left = String(a); right = String(b); expl = compareExplain(a, b);
      } else if (d === 2) {
        var s = randDigits(rng, rng.int(7, 10), 0.3);
        var i = rng.int(1, s.length - 1);
        var t = s.slice(0, i) + String((Number(s[i]) + rng.int(1, 9)) % 10) + randDigits(rng, s.length - i, 0.3).slice(1);
        if (rng.chance(0.15)) t = s;
        a = Number(s); b = Number(t);
        if (rng.chance(0.5)) { var tmp = a; a = b; b = tmp; }
        left = String(a); right = String(b); expl = compareExplain(a, b);
      } else {
        // 一边用“万”“亿”作单位
        var unit = rng.pick(['万', '亿']), uv = N.unitValue(unit);
        var k = unit === '万' ? rng.int(12, 9999) : rng.int(2, 999);
        a = k * uv;
        var kind = rng.int(0, 2);
        if (kind === 0) b = a; // 相等
        else if (kind === 1) b = a + rng.int(1, uv - 1); // 稍大一点
        else b = a - rng.int(1, uv - 1); // 稍小一点
        var swap = rng.chance(0.5);
        var aText = k + unit;
        left = swap ? String(b) : aText; right = swap ? aText : String(b);
        var x = swap ? b : a, y = swap ? a : b;
        expl = U.steps(['先把 ' + aText + ' 改写成数：' + aText + ' = ' + a, '再比较 ' + x + ' 和 ' + y]).concat(compareExplain(x, y).map(function (s) { return '　' + s.replace(/^第.步：/, ''); }));
        a = x; b = y;
      }
      var ans = a > b ? '>' : a < b ? '<' : '=';
      return {
        type: 'choice',
        prompt: '在 ○ 里填上“>”“<”或“=”。',
        data: { show: left + ' ○ ' + right, options: ['>', '<', '='], big: true },
        answer: ans,
        hint: d === 3 ? '先把带“万”“亿”的数改写成普通的数，再比。' : '先比位数；位数相同，从最高位起一位一位比。',
        explanation: expl
      };
    }
  };

  // ⑮ □ 里能填几（比较大小）
  G.compareBox = {
    skill: 'compare', levels: [2, 3], weight: 1.2,
    gen: function (rng, d) {
      for (;;) {
        var len = rng.int(6, d === 2 ? 8 : 10);
        var s = randDigits(rng, len, 0.25);
        var i = rng.int(d === 2 ? 0 : 1, Math.min(len - 2, 4));
        var t = s.slice(0, i) + String(rng.int(i === 0 ? 1 : 0, 9)) + (d === 3 ? randDigits(rng, len - i, 0.4).slice(1) : s.slice(i + 1));
        var op = rng.pick(['>', '<']);
        var opts = U.range(i === 0 ? 1 : 0, 9).map(String);
        var ans = opts.filter(function (x) {
          var a = Number(s.slice(0, i) + x + s.slice(i + 1)), b = Number(t);
          return op === '>' ? a > b : a < b;
        });
        if (!ans.length || ans.length === opts.length) continue;
        var A = s.slice(0, i) + '□' + s.slice(i + 1);
        var bd = t[i];
        var a0 = Number(s.slice(0, i) + bd + s.slice(i + 1)), b0 = Number(t);
        var eqNote = '□ 填 ' + bd + ' 时这一位相同，要往后比：' + a0 + (a0 > b0 ? ' > ' : a0 < b0 ? ' < ' : ' = ') + b0 + '，' + (ans.indexOf(bd) >= 0 ? '成立' : '不成立');
        return {
          type: 'multi',
          prompt: '□ 里可以填哪些数字？把能填的都选上。',
          data: { show: A + ' ' + op + ' ' + t, options: opts },
          answer: ans,
          hint: '两个数位数相同，从最高位比起；□ 和对面那一位相同时，还要往后比。',
          explanation: U.steps([
            '两个数都是 ' + len + ' 位数，从最高位起比',
            (i > 0 ? '前面几位都相同，' : '') + '比 □ 所在的' + PLACE[len - 1 - i] + '：要' + (op === '>' ? '大于' : '小于') + ' ' + bd,
            eqNote,
            '所以 □ 里可以填：' + ans.join('、')
          ])
        };
      }
    }
  };

  // ⑯ 最大 / 最小的数
  G.largest = {
    skill: 'compare', levels: [1, 2],
    gen: function (rng, d) {
      var len = rng.int(6, 9), base = randDigits(rng, len, 0.3);
      var nums = [base];
      var guard = 0;
      while (nums.length < 4 && guard++ < 100) {
        var c;
        if (d === 1) c = randDigits(rng, len + rng.pick([-1, 0, 0, 1]), 0.3);
        else { var i = rng.int(1, len - 1); c = base.slice(0, i) + randDigits(rng, len - i, 0.3).replace(/^./, String(rng.int(0, 9))); }
        if (nums.indexOf(c) < 0) nums.push(c);
      }
      var wantMax = rng.chance(0.5);
      var sorted = nums.slice().sort(function (x, y) { return Number(y) - Number(x); });
      var ans = wantMax ? sorted[0] : sorted[sorted.length - 1];
      return {
        type: 'choice',
        prompt: '下面的数中，' + (wantMax ? '最大' : '最小') + '的是（　）。',
        data: { options: rng.shuffle(nums) },
        answer: ans,
        hint: '先比位数，位数相同再从最高位比起。',
        explanation: U.steps(['把这几个数从大到小排一排：' + sorted.join(' > '), (wantMax ? '最大' : '最小') + '的是 ' + ans])
      };
    }
  };

  // ⑰ 改写成“万”“亿”作单位
  G.rewrite = {
    skill: 'rewrite', levels: [1, 2, 3], weight: 1.2,
    gen: function (rng, d) {
      var unit = d === 1 ? '万' : d === 2 ? '亿' : rng.pick(['万', '亿']);
      var k = unit === '万' ? rng.int(2, 9999) : rng.int(2, 999);
      var n = k * N.unitValue(unit);
      var zeros = unit === '万' ? 4 : 8;
      var expl = U.steps([
        n + ' 是整' + unit + '数，末尾至少有 ' + zeros + ' 个 0',
        '去掉末尾 ' + zeros + ' 个 0，加上“' + unit + '”字',
        '改写是准确数，用“=”连接：' + n + ' = ' + k + unit
      ]);
      if (d === 3) {
        return {
          type: 'fill',
          prompt: '把 ' + n + ' 改写成用“' + unit + '”作单位的数（记得选对符号）。',
          data: { template: n + ' []', keys: ['=', '≈', '万', '亿'], prefix: String(n) },
          answer: '=' + k + unit,
          hint: '改写是准确数，用“=”；去掉末尾 ' + zeros + ' 个 0，再加“' + unit + '”。',
          explanation: expl
        };
      }
      return {
        type: 'fill',
        prompt: '把 ' + n + ' 改写成用“' + unit + '”作单位的数。',
        data: { template: n + ' = [] ' + unit, suffix: unit },
        answer: String(k),
        hint: '去掉末尾 ' + zeros + ' 个 0。',
        explanation: expl
      };
    }
  };

  // ⑱ 选“=”还是“≈”
  G.symbol = {
    skill: 'rewrite', levels: [1, 2],
    gen: function (rng, d) {
      var unit = d === 1 ? '万' : rng.pick(['万', '亿']);
      var uv = N.unitValue(unit);
      var exact = rng.chance(0.5);
      var n, k;
      if (exact) { k = unit === '万' ? rng.int(2, 999) : rng.int(2, 99); n = k * uv; }
      else {
        do { n = rng.int(2 * uv, (unit === '万' ? 999 : 99) * uv); } while (n % uv === 0);
        k = N.approx(n, unit);
      }
      return {
        type: 'choice',
        prompt: '在 ○ 里填“=”还是“≈”？',
        data: { show: n + ' ○ ' + k + unit, options: ['=', '≈'], big: true },
        answer: exact ? '=' : '≈',
        hint: '看看 ' + n + ' 和 ' + k + unit + ' 是不是正好相等。',
        explanation: exact
          ? U.steps([n + ' 是整' + unit + '数，去掉末尾 0 改写后和原数正好相等', '改写用“=”：' + n + ' = ' + k + unit])
          : U.steps([n + ' 不是整' + unit + '数，' + k + unit + ' 是四舍五入得到的近似数', '求近似数用“≈”：' + n + ' ≈ ' + k + unit])
      };
    }
  };

  /** 求近似数用的数字 */
  function roundNumber(rng, d, unit) {
    var uv = N.unitValue(unit), lp = N.lookPlace(unit);
    for (;;) {
      var len = unit === '万' ? (d === 1 ? rng.int(5, 7) : rng.int(6, 9)) : rng.int(9, 11);
      var s = randDigits(rng, len, 0.25);
      if (d === 3 && rng.chance(0.6)) {
        // 挑战题的陷阱：①看的那一位 ≥ 5，前面是 9，进一后要连续进位（如 495000 ≈ 50万）
        //            ②看的那一位是 4，后面全是 9，也要舍去（如 449999 ≈ 45万）
        var cut = len - 1 - lp; // 要看的那一位在字符串里的下标
        if (cut < 1) continue;
        var head = s.slice(0, cut), look, tail;
        if (rng.chance(0.5)) {
          var nines = Math.min(head.length, rng.int(1, 2));
          head = head.slice(0, head.length - nines) + '99'.slice(0, nines);
          look = String(rng.int(5, 9));
          tail = s.slice(cut + 1);
        } else {
          look = '4';
          tail = '99999999999'.slice(0, len - cut - 1);
        }
        s = head + look + tail;
      }
      var n = Number(s);
      if (n % uv !== 0 && n >= uv) return n;
    }
  }

  // ⑲ 求近似数：先点出“看哪一位”，再填写
  G.roundDigit = {
    skill: 'approx', levels: [1, 2, 3], weight: 1.6,
    gen: function (rng, d) {
      var unit = d === 1 ? '万' : rng.chance(0.6) ? '万' : '亿';
      var n = roundNumber(rng, d, unit);
      var lp = N.lookPlace(unit), uv = N.unitValue(unit);
      var look = N.digitAt(n, lp), trunc = Math.floor(n / uv), k = N.approx(n, unit);
      var up = look >= 5;
      var data = { n: String(n), unit: unit, look: lp };
      var ans;
      if (d === 1) { data.template = n + ' ≈ [] 万'; data.suffix = '万'; ans = String(k); }
      else { data.template = n + ' []'; data.keys = ['≈', '=', '万', '亿']; data.prefix = String(n); ans = '≈' + k + unit; }
      return {
        type: 'round',
        prompt: '省略“' + unit + '”位后面的尾数，求近似数。先点一点：要看哪一位？',
        data: data,
        answer: ans,
        hint: '省略' + unit + '位后面的尾数，看' + unit + '位的下一位——' + PLACE[lp] + '。',
        explanation: U.steps([
          '省略' + unit + '位后面的尾数，要看' + unit + '位的下一位：' + PLACE[lp],
          PLACE[lp] + '上是 ' + look + '，' + (up ? look + ' ≥ 5，向' + unit + '位进一' : look + ' < 5，把尾数舍去'),
          up ? trunc + unit + ' 进一变成 ' + k + unit : '剩下 ' + k + unit,
          '求近似数用“≈”：' + n + ' ≈ ' + k + unit
        ])
      };
    }
  };

  // ⑳ 近似数倒推：最大是几、最小是几
  G.roundRange = {
    skill: 'approx', levels: [2, 3],
    gen: function (rng, d) {
      var unit = d === 3 && rng.chance(0.4) ? '亿' : '万';
      var uv = N.unitValue(unit);
      var k = unit === '万' ? rng.int(1, 99) : rng.int(1, 30);
      var max = k * uv + uv / 2 - 1, min = k * uv - uv / 2;
      var lp = N.lookPlace(unit);
      return {
        type: 'fill',
        prompt: '一个整数省略“' + unit + '”位后面的尾数约是 ' + k + unit + '。这个数最大是多少？最小是多少？',
        data: { template: '最大是 []\n最小是 []' },
        answer: [String(max), String(min)],
        hint: '最大的数是“舍”来的，' + PLACE[lp] + '最大是 4；最小的数是“入”来的，' + PLACE[lp] + '最小是 5。',
        explanation: U.steps([
          '最大：是把尾数“舍”掉得来的，' + unit + '位上还是 ' + (k % 10) + '，' + PLACE[lp] + '最大填 4，后面都填 9 → ' + max,
          '最小：是“入”上来的，' + unit + '位上原来比现在少 1，' + PLACE[lp] + '最小填 5，后面都填 0 → ' + min,
          '所以最大是 ' + max + '，最小是 ' + min
        ])
      };
    }
  };

  // ㉑ □ 里能填几（近似数）
  G.roundBox = {
    skill: 'approx', levels: [2, 3], weight: 1.2,
    gen: function (rng, d) {
      var unit = '万', lp = 3;
      for (;;) {
        var len = rng.int(6, d === 2 ? 7 : 9);
        var s = randDigits(rng, len, 0.25);
        var p = rng.chance(d === 2 ? 0.7 : 0.4) ? lp : lp + 1; // □ 在千位或万位
        var i = len - 1 - p;
        if (i < 0) continue;
        var opts = U.range(i === 0 ? 1 : 0, 9).map(String);
        var x0 = rng.pick(opts);
        var target = N.approx(Number(s.slice(0, i) + x0 + s.slice(i + 1)), unit);
        var ans = opts.filter(function (x) { return N.approx(Number(s.slice(0, i) + x + s.slice(i + 1)), unit) === target; });
        if (ans.length === opts.length) continue;
        var A = s.slice(0, i) + '□' + s.slice(i + 1);
        var why;
        if (p === lp) {
          var up = Number(ans[0]) >= 5;
          why = '□ 在千位，正是要“看”的那一位。要得到 ' + target + '万，' + (up ? '必须向万位进一，所以 □ ≥ 5' : '要把尾数舍去，所以 □ < 5');
        } else {
          var lk = Number(s[len - 1 - lp]);
          why = '□ 在万位。千位上是 ' + lk + '，' + (lk >= 5 ? lk + ' ≥ 5，要向万位进一，所以 □ 要比结果的万位小 1' : lk + ' < 5，尾数舍去，□ 就是结果的万位');
        }
        return {
          type: 'multi',
          prompt: '□ 里可以填哪些数字？把能填的都选上。',
          data: { show: A + ' ≈ ' + target + '万', options: opts },
          answer: ans,
          hint: '省略万位后面的尾数要看千位。把 0～9 放进 □ 里试一试。',
          explanation: U.steps(['省略万位后面的尾数，看千位', why, '所以 □ 里可以填：' + ans.join('、')])
        };
      }
    }
  };

  // ㉒ 1 亿有多大（叠纸）
  G.paperYi = {
    skill: 'yi', levels: [1, 2],
    gen: function (rng, d) {
      var sizes = [{ n: 1e4, t: '1 万' }, { n: 1e5, t: '10 万' }, { n: 1e6, t: '100 万' }, { n: 1e7, t: '1000 万' }, { n: 1e8, t: '1 亿' }];
      var pickI = d === 1 ? rng.int(0, 3) : rng.int(2, 4);
      var it = sizes[pickI];
      var cm = it.n / 100, m = it.n / 1e4;
      var fmt = function (x) { return x + ' 米'; };
      var ans = fmt(m);
      var wrongs = [fmt(m * 10), fmt(m * 100), m >= 10 ? fmt(m / 10) : fmt(m * 1000), fmt(cm)];
      return {
        type: 'choice',
        prompt: '100 张纸叠起来大约厚 1 厘米。' + it.t + '张纸叠起来大约高多少米？',
        data: { options: options(rng, ans, wrongs) },
        answer: ans,
        hint: '先算有几个 100 张，就是几厘米；再想 100 厘米 = 1 米。',
        explanation: U.steps([
          it.t + '里面有 ' + cm + ' 个 100，所以大约厚 ' + cm + ' 厘米',
          '100 厘米 = 1 米，' + cm + ' 厘米 = ' + m + ' 米',
          it.n === 1e8 ? '1 亿张纸大约高 10000 米，比珠穆朗玛峰（约 8849 米）还高！' : '所以大约高 ' + m + ' 米'
        ])
      };
    }
  };

  // ㉓ 读算盘
  G.abacus = {
    skill: 'history', levels: [1, 2],
    gen: function (rng, d) {
      var rods = d === 1 ? 4 : 5;
      var s = randDigits(rng, rods, d === 1 ? 0.15 : 0.3);
      var n = Number(s);
      return {
        type: 'abacus',
        prompt: '算盘上表示的数是多少？（上珠一颗表示 5，下珠一颗表示 1，靠近横梁的珠子才算数）',
        data: { digits: s, template: '[]' },
        answer: s,
        hint: '一档一档看：靠梁的上珠算 5，靠梁的下珠一颗算 1。',
        explanation: U.steps(s.split('').map(function (c, i) {
          var v = Number(c), up = v >= 5 ? 1 : 0, low = v % 5;
          return PLACE[rods - 1 - i] + '：' + (up ? '上珠 1 颗（5）' : '') + (up && low ? ' + ' : '') + (low ? '下珠 ' + low + ' 颗（' + low + '）' : '') + (!v ? '没有珠子靠梁（0）' : '') + ' → ' + v;
        })).concat(['合起来是 ' + n])
      };
    }
  };

  // ㉔ 判断题（答案由代码计算）
  G.judgeMix = {
    skill: 'read', levels: [1, 2],
    gen: function (rng, d) {
      var kind = rng.int(0, 3);
      var n, truth, prompt, expl, hint, skill;
      if (kind === 0) {
        n = readNumber(rng, d);
        var r = read(n), wr = U.uniq(wrongReadings(n));
        truth = !wr.length || rng.chance(0.5);
        var shown = truth ? r : rng.pick(wr);
        prompt = n + ' 读作：' + shown + '。';
        skill = 'read'; hint = '分级读一读，注意哪些 0 要读。'; expl = readingExplain(n);
      } else if (kind === 1) {
        do { n = rng.int(20000, 9999999); } while (n % 10000 === 0);
        var k = N.approx(n, '万');
        var kk = rng.chance(0.5) ? k : k + (Math.floor(n / 1e4) === k ? 1 : -1);
        truth = kk === k;
        prompt = '省略万位后面的尾数：' + n + ' ≈ ' + kk + '万。';
        skill = 'approx'; hint = '看千位：≥ 5 进一，< 5 舍去。';
        expl = U.steps(['看千位：千位上是 ' + N.digitAt(n, 3), N.digitAt(n, 3) >= 5 ? '≥ 5，向万位进一' : '< 5，舍去', n + ' ≈ ' + k + '万，所以这句话' + (truth ? '对' : '错')]);
      } else if (kind === 2) {
        var len = rng.int(6, 11);
        n = Number(randDigits(rng, len, 0.3));
        var claim = rng.chance(0.5) ? len : len + rng.pick([-1, 1]);
        truth = claim === len;
        prompt = n + ' 是一个 ' + claim + ' 位数，最高位是' + PLACE[claim - 1] + '。';
        skill = 'place'; hint = '数一数一共有几位数字。';
        expl = U.steps([n + ' 一共有 ' + len + ' 位数字，是 ' + len + ' 位数', '最高位是' + PLACE[len - 1] + '，所以这句话' + (truth ? '对' : '错')]);
      } else {
        var exact = rng.chance(0.5), kw = rng.int(2, 999);
        n = exact ? kw * 1e4 : kw * 1e4 + rng.int(1, 9999);
        truth = exact;
        prompt = n + ' = ' + (exact ? kw : N.approx(n, '万')) + '万。';
        skill = 'rewrite'; hint = '“=”表示正好相等，近似数要用“≈”。';
        expl = exact ? U.steps([n + ' 是整万数，去掉末尾 4 个 0 正好是 ' + kw + '万', '用“=”没错，这句话对'])
          : U.steps([n + ' 不是整万数，只能求近似数', '近似数要用“≈”，这句话错']);
      }
      return {
        type: 'judge', skill: skill,
        prompt: '判断对错：' + prompt,
        data: {},
        answer: truth,
        hint: hint,
        explanation: expl
      };
    }
  };

  // ---------------------------------------------------------------
  // 少量精选固定题（概念题）。用 seed 选第几题，所以也能原样重现。
  // ---------------------------------------------------------------
  var fixed = [
    { skill: 'natural', prompt: '0 是最小的自然数。', answer: true, explanation: ['0、1、2、3……都是自然数，0 是最小的。'] },
    { skill: 'natural', prompt: '1 是最小的自然数。', answer: false, explanation: ['一个物体也没有用 0 表示，0 也是自然数，最小的自然数是 0。'] },
    { skill: 'natural', prompt: '最大的自然数是 999999999999。', answer: false, explanation: ['不管多大的数，加 1 还是自然数，所以没有最大的自然数。'] },
    { skill: 'natural', prompt: '自然数的个数是无限的。', answer: true, explanation: ['没有最大的自然数，所以自然数有无限多个。'] },
    { skill: 'place', prompt: '“万”是数位，“万位”是计数单位。', answer: false, explanation: ['说反啦：“万”是计数单位，“万位”是数位。'] },
    { skill: 'place', prompt: '每相邻两个计数单位之间的进率都是 10。', answer: true, explanation: ['10 个一是十，10 个十是一百……这叫十进制计数法。'] },
    { skill: 'levels', prompt: '分级时，从右往左每三位一级。', answer: false, explanation: ['我们的读法是从右往左每四位一级：个级、万级、亿级。'] },
    { skill: 'rewrite', prompt: '改写和求近似数，都用“=”连接。', answer: false, explanation: ['改写是准确数，用“=”；求近似数用“≈”。'] },
    { skill: 'history', prompt: '阿拉伯数字最早是由古印度人发明的。', answer: true, explanation: ['阿拉伯数字最早由古印度人发明，后来经阿拉伯人传到欧洲。'] },
    { skill: 'history', prompt: '在算盘上，一颗上珠表示 1。', answer: false, explanation: ['上珠一颗表示 5，下珠一颗表示 1。'] }
  ];

  skills.forEach(function (s) {
    if (!fixed.some(function (f) { return f.skill === s.id; })) return;
    G['concept_' + s.id] = {
      skill: s.id, levels: [1, 2], weight: s.id === 'natural' ? 1 : 0.5,
      gen: (function (sid) {
        return function (rng) {
          var list = fixed.filter(function (f) { return f.skill === sid; });
          var f = rng.pick(list);
          return { type: 'judge', prompt: '判断对错：' + f.prompt, data: {}, answer: f.answer, hint: '想一想课本上是怎么说的。', explanation: f.explanation.slice() };
        };
      })(s.id)
    };
  });

  MI.registerUnit({ id: 'u1', title: '大数的认识', cards: cards, skills: skills, generators: G, fixed: fixed });
  // 供测试使用
  MI.u1 = { tokenize: tokenize, naiveReading: naiveReading, readingExplain: readingExplain };
})(typeof window !== 'undefined' ? window : globalThis);

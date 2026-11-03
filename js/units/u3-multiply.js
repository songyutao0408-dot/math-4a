/* 第③单元 · 多位数乘两位数
 * 本文件只放内容：知识卡、知识点、题目生成器。所有答案都由代码计算。
 * 范围：两位数/三位数乘两位数；不出除数是两位数的除法。 */
(function (root) {
  'use strict';
  var MI = root.MathIsland = root.MathIsland || {};
  var U = MI.util, M = MI.mul;

  function options(rng, correct, wrongs, k) {
    var w = U.uniq(wrongs.filter(function (x) { return x !== correct && x != null && !/NaN|undefined/.test(String(x)); }));
    w = rng.shuffle(w).slice(0, (k || 4) - 1);
    return rng.shuffle([correct].concat(w));
  }
  function zerosOf(n) { return M.stripZeros(n).zeros; }
  /** 没有末尾 0 的 n 位数 */
  function randNoTail(rng, lo, hi) { var x; do { x = rng.int(lo, hi); } while (x % 10 === 0); return x; }

  // ---------------------------------------------------------------
  // 知识卡
  // ---------------------------------------------------------------
  var cards = [
    {
      id: 'oral', emoji: '⚡', title: '口算乘法',
      points: ['整十、整百数乘整十数：先把 0 前面的数相乘，再看因数末尾一共有几个 0，就在积的末尾添几个 0。'],
      examples: ['30 × 20 = 600', '300 × 40 = 12000', '12 × 30 = 360', '150 × 20 = 3000'],
      pitfall: '积末尾 0 的个数可能比因数末尾多：15 × 40 = 600，25 × 40 = 1000。'
    },
    {
      id: 'remember', emoji: '🧠', title: '要记住的好朋友',
      points: ['25 × 4 = 100', '125 × 8 = 1000', '15 × 4 = 60'],
      examples: ['25 × 40 = 1000', '125 × 80 = 10000'],
      pitfall: '先算 0 前面的数，结果本身也可能带 0。'
    },
    {
      id: 'v2', emoji: '📝', title: '笔算两位数乘两位数',
      points: ['先用第二个因数个位上的数去乘，再用十位上的数去乘，最后把两次乘得的积加起来。', '用哪一位上的数去乘，乘得的积的末位就和那一位对齐。'],
      examples: ['24 × 13：3 × 24 = 72；1 × 24 = 24 个十，末位写在十位上；72 + 240 = 312。'],
      pitfall: '第二步乘得的积，末位一定要和十位对齐！'
    },
    {
      id: 'v3', emoji: '🧾', title: '笔算三位数乘两位数',
      points: ['方法和两位数乘两位数一样，一位一位地乘，别漏了进位。'],
      examples: ['145 × 12 = 1740'],
      pitfall: '进位要加在下一位的乘积上，别加到下一步里去。'
    },
    {
      id: 'zero', emoji: '⭕', title: '因数中间或末尾有 0',
      points: ['因数中间有 0：0 乘任何数都得 0，但别漏了进位。', '因数末尾有 0：把 0 前面的数对齐，0 写在后面；先算 0 前面的数，再在积的末尾添上 0。'],
      examples: ['305 × 24 = 7320', '450 × 30：先算 45 × 3 = 135，再添 2 个 0，得 13500。'],
      pitfall: '末尾的 0 一共有几个，就添几个，数清楚！'
    },
    {
      id: 'digits', emoji: '🔢', title: '积是几位数',
      points: ['三位数乘两位数，积可能是四位数，也可能是五位数。'],
      examples: ['100 × 10 = 1000（四位数）', '999 × 99 = 98901（五位数）'],
      pitfall: '不确定时，先估一估。'
    },
    {
      id: 'names', emoji: '🏷️', title: '各部分名称与验算',
      points: ['因数 × 因数 = 积。', '验算乘法：交换两个因数的位置再乘一遍。'],
      examples: ['在 24 × 13 = 312 中，24 和 13 是因数，312 是积。验算：13 × 24 = 312。'],
      pitfall: '验算要真的再算一遍，不是看一眼。'
    },
    {
      id: 'estimate', emoji: '🎯', title: '估算',
      points: ['把因数看成和它接近的整十、整百数，再算。'],
      examples: ['198 × 21 ≈ 200 × 20 = 4000'],
      pitfall: '估算用“≈”。'
    },
    {
      id: 'enough', emoji: '💰', title: '用估算解决问题',
      points: ['要说明“够”，就往大估：估大了都够，实际一定够。', '要说明“不够”，就往小估：估小了都不够，实际一定不够。'],
      examples: ['门票 38 元，买 21 张，带 1000 元够吗？38 < 40，21 < 25，38 × 21 < 40 × 25 = 1000，够。'],
      pitfall: '说出理由：往哪边估、为什么。'
    },
    {
      id: 'rule', emoji: '📈', title: '积的变化规律',
      points: ['一个因数不变，另一个因数乘（或除以）几（0 除外），积也乘（或除以）几。', '一个因数乘几，另一个因数除以同一个数（0 除外），积不变。', '两个因数分别乘 a 和 b，积就乘 a × b。'],
      examples: ['18 × 5 = 90 → 18 × 50 = 900 → 180 × 50 = 9000', '25 × 16 = 100 × 4 = 400'],
      pitfall: '两个因数都变了，积的变化要乘起来算。'
    },
    {
      id: 'pattern', emoji: '🔍', title: '找规律',
      points: ['观察 → 发现规律 → 用规律写出下一个算式 → 计算验证。'],
      examples: ['11 × 11 = 121，111 × 111 = 12321，1111 × 1111 = 1234321', '99 × 11 = 1089，99 × 12 = 1188，99 × 13 = 1287……'],
      pitfall: '发现了规律，也要算一算验证。'
    },
    {
      id: 'mistakes', emoji: '⚠️', title: '常错点',
      points: ['第二步乘得的积没有和十位对齐。', '进位忘记加，或把上一步的进位加到下一步里。', '末尾有 0 的乘法，0 的个数添错。'],
      examples: ['写完用“交换因数再乘一遍”验算。'],
      pitfall: '每一步都可以点“检查这一步”。'
    }
  ];

  var skills = [
    { id: 'oral', name: '口算乘法' },
    { id: 'vertical2', name: '笔算两位数乘两位数' },
    { id: 'vertical3', name: '笔算三位数乘两位数' },
    { id: 'names', name: '各部分名称与验算' },
    { id: 'estimate', name: '估算' },
    { id: 'productRule', name: '积的变化规律' },
    { id: 'pattern', name: '找规律' }
  ];

  var G = {};

  /** 口算讲解 */
  function oralExplain(a, b) {
    var A = M.stripZeros(a), B = M.stripZeros(b), z = A.zeros + B.zeros, core = A.core * B.core;
    var out = [];
    if (z) {
      out.push('先把 0 前面的数相乘：' + A.core + ' × ' + B.core + ' = ' + core);
      out.push('因数末尾一共有 ' + z + ' 个 0，在积的末尾添 ' + z + ' 个 0：' + a * b);
      if (zerosOf(a * b) > z) out.push('注意：' + core + ' 本身末尾就有 0，所以积末尾的 0 比因数末尾多');
    } else out.push(a + ' × ' + b + ' = ' + a * b);
    return U.steps(out);
  }

  // ① 整十、整百数乘整十数
  // 参数：基础 2～9 个十/百 × 2～9 个十；提高含 15×40、25×40 等积末尾 0 变多的题
  G.oralTens = {
    skill: 'oral', levels: [1, 2], weight: 1.2,
    gen: function (rng, d) {
      var a, b;
      if (d === 1) { a = rng.int(2, 9) * (rng.chance(0.5) ? 10 : 100); b = rng.int(2, 9) * 10; }
      else {
        var special = [[15, 4], [25, 4], [5, 2], [5, 4], [5, 6], [5, 8], [25, 8], [15, 6], [35, 2], [45, 2]];
        var p = rng.pick(special);
        a = p[0] * (rng.chance(0.5) ? 1 : 10); b = p[1] * 10;
        if (rng.chance(0.5)) { var t = a; a = b; b = t; }
      }
      return {
        type: 'fill', prompt: '口算：', data: { template: a + ' × ' + b + ' = []', blitz: true },
        answer: String(a * b),
        hint: '先算 0 前面的数，再看因数末尾一共有几个 0。',
        explanation: oralExplain(a, b)
      };
    }
  };

  // ② 两位数乘整十数、几百几十乘整十数
  G.oralMixed = {
    skill: 'oral', levels: [1, 2, 3],
    gen: function (rng, d) {
      var a, b;
      if (d === 1) { a = rng.int(11, 49); b = rng.int(2, 3) * 10; while (a * (b / 10) >= 100 && rng.chance(0.7)) a = rng.int(11, 33); }
      else if (d === 2) { a = rng.int(11, 99); b = rng.int(2, 9) * 10; if (rng.chance(0.4)) a = rng.int(11, 49) * 10; }
      else {
        var p = rng.pick([[125, 8], [25, 4], [125, 4], [25, 8], [125, 2], [75, 4]]);
        a = p[0] * (rng.chance(0.4) ? 10 : 1); b = p[1] * 10;
      }
      return {
        type: 'fill', prompt: '口算：', data: { template: a + ' × ' + b + ' = []', blitz: d < 3 },
        answer: String(a * b),
        hint: '先算 0 前面的数相乘，再添 0。',
        explanation: oralExplain(a, b)
      };
    }
  };

  // ③ 填因数：□ × 40 = 1200
  G.oralMissing = {
    skill: 'oral', levels: [2, 3],
    gen: function (rng, d) {
      var x = rng.int(2, 9) * (d === 3 && rng.chance(0.5) ? 100 : 10);
      var y = d === 3 ? rng.pick([25, 125, 15, 50]) * (rng.chance(0.5) ? 10 : 1) : rng.int(2, 9) * 10;
      var p = x * y, left = rng.chance(0.5);
      return {
        type: 'fill', prompt: '在空格里填上合适的数。',
        data: { template: left ? '[] × ' + y + ' = ' + p : y + ' × [] = ' + p },
        answer: String(x),
        hint: '想一想：' + y + ' 乘几等于 ' + p + '？先看 0 前面的数。',
        explanation: U.steps(['想乘法：' + y + ' × ? = ' + p, '试一试：' + y + ' × ' + x + ' = ' + p + ' ✔', '所以空格里填 ' + x])
      };
    }
  };

  // ④ 积的末尾有几个 0
  G.tailZeros = {
    skill: 'oral', levels: [2, 3],
    gen: function (rng) {
      var p = rng.pick([[25, 4], [15, 4], [125, 8], [5, 2], [5, 6], [35, 2], [12, 3], [21, 4], [45, 2], [25, 8]]);
      var a = p[0] * (rng.chance(0.5) ? 1 : 10), b = p[1] * 10;
      var n = zerosOf(a * b);
      var opts = ['1 个', '2 个', '3 个', '4 个', '5 个'].filter(function (o) { return Math.abs(Number(o[0]) - n) <= 2; }).slice(0, 4);
      if (opts.indexOf(n + ' 个') < 0) opts.push(n + ' 个');
      return {
        type: 'choice', prompt: a + ' × ' + b + ' 的积末尾有几个 0？',
        data: { options: rng.shuffle(U.uniq(opts)) }, answer: n + ' 个',
        hint: '先算出积，再数末尾的 0。',
        explanation: oralExplain(a, b).concat(['数一数：' + a * b + ' 末尾有 ' + n + ' 个 0'])
      };
    }
  };

  /** 竖式题 */
  function vmulQ(a, b, skill) {
    var L = M.layout(a, b);
    return {
      type: 'vmul', skill: skill,
      prompt: '用竖式计算：' + a + ' × ' + b,
      data: { a: a, b: b },
      answer: L.rows.map(function (r) { return M.rowString(r.cols); }),
      answerText: a + ' × ' + b + ' = ' + a * b,
      hint: L.z ? '因数末尾有 0：先把 0 前面的数对齐来乘，最后在积的末尾添 0。' : '先用个位上的数去乘，再用十位上的数去乘，末位和十位对齐，最后相加。',
      explanation: M.explain(L)
    };
  }

  // ⑤ 竖式：两位数乘两位数
  // 基础：每一步进位都不超过 1 次左右（因数较小）；提高、挑战：任意两位数（不含末尾 0）
  G.vmul2 = {
    skill: 'vertical2', levels: [1, 2, 3], weight: 1.6,
    gen: function (rng, d) {
      var a, b;
      if (d === 1) { a = randNoTail(rng, 11, 39); b = randNoTail(rng, 11, 23); }
      else if (d === 2) { a = randNoTail(rng, 23, 79); b = randNoTail(rng, 13, 49); }
      else { a = randNoTail(rng, 47, 99); b = randNoTail(rng, 37, 99); }
      return vmulQ(a, b, 'vertical2');
    }
  };

  // ⑥ 竖式：三位数乘两位数
  // 基础：一般三位数；提高：中间有 0（如 305 × 24）；挑战：末尾有 0（如 450 × 30、160 × 25）
  G.vmul3 = {
    skill: 'vertical3', levels: [1, 2, 3], weight: 1.6,
    gen: function (rng, d) {
      var a, b;
      if (d === 1) { a = randNoTail(rng, 101, 399); b = randNoTail(rng, 11, 29); }
      else if (d === 2) { a = rng.int(1, 9) * 100 + rng.int(1, 9); b = randNoTail(rng, 12, 69); }
      else if (rng.chance(0.5)) { a = rng.int(11, 99) * 10; b = randNoTail(rng, 12, 49); }
      else { a = rng.chance(0.5) ? rng.int(11, 99) * 10 : randNoTail(rng, 101, 999); b = rng.int(2, 9) * 10; }
      return vmulQ(a, b, 'vertical3');
    }
  };

  /** 典型错误的结果 */
  function wrongProducts(a, b) {
    var L = M.layout(a, b), out = [];
    var c = L.coreA, z = L.z, bs = String(L.coreB);
    function noCarry(x, m) { var s = String(x), v = 0; for (var j = 0; j < s.length; j++) v += ((m * Number(s[s.length - 1 - j])) % 10) * Math.pow(10, j); return v; }
    if (bs.length === 2) {
      var m1 = Number(bs[1]), m0 = Number(bs[0]);
      out.push((c * m1 + c * m0) * Math.pow(10, z));                       // 第二步没对齐
      out.push((noCarry(c, m1) + noCarry(c, m0) * 10) * Math.pow(10, z));   // 忘了进位
    } else out.push(noCarry(c, Number(bs)) * Math.pow(10, z));
    if (z) { out.push(a * b / 10); out.push(a * b * 10); }                  // 0 添错
    else out.push(a * b + (rng1(a) ? 100 : 10));
    return out;
  }
  function rng1(a) { return a % 2 === 0; }

  // ⑦ 选出正确的积（陷阱选项来自常见错误）
  G.mulChoice = {
    skill: 'vertical3', levels: [2, 3],
    gen: function (rng, d) {
      var a, b, w;
      for (;;) {
        a = d === 2 ? randNoTail(rng, 102, 699) : rng.chance(0.5) ? rng.int(11, 99) * 10 : randNoTail(rng, 102, 999);
        b = d === 3 && rng.chance(0.4) ? rng.int(2, 9) * 10 : randNoTail(rng, 12, 98);
        w = wrongProducts(a, b).filter(function (x) { return x !== a * b && x > 0 && Math.floor(x) === x; });
        if (U.uniq(w).length >= 2) break;
      }
      var L = M.layout(a, b);
      return {
        type: 'choice', skill: 'vertical3',
        prompt: '计算 ' + a + ' × ' + b + '，正确的结果是（　）。',
        data: { options: options(rng, String(a * b), w.map(String).concat([String(a * b + 100)])) },
        answer: String(a * b),
        hint: '可以列竖式算一算；注意对齐、进位和末尾的 0。',
        explanation: M.explain(L)
      };
    }
  };

  // ⑧ 积是几位数
  G.productDigits = {
    skill: 'vertical3', levels: [1, 2],
    gen: function (rng) {
      var a = rng.int(100, 999), b = rng.int(10, 99);
      var n = String(a * b).length, names = { 3: '三位数', 4: '四位数', 5: '五位数', 6: '六位数' };
      var A = Math.round(a / 100) * 100, B = Math.round(b / 10) * 10;
      return {
        type: 'choice', prompt: a + ' × ' + b + ' 的积是几位数？',
        data: { options: ['三位数', '四位数', '五位数', '六位数'] }, answer: names[n],
        hint: '可以先估一估，或者直接算出来数一数。',
        explanation: U.steps(['估一估：' + a + ' × ' + b + ' ≈ ' + A + ' × ' + B + ' = ' + A * B, '算一算：' + a + ' × ' + b + ' = ' + a * b, a * b + ' 是' + names[n]]).concat(['三位数乘两位数，积可能是四位数，也可能是五位数。'])
      };
    }
  };

  // ⑨ 各部分名称与验算
  G.names = {
    skill: 'names', levels: [1, 2],
    gen: function (rng) {
      var a = rng.int(12, 399), b = rng.int(11, 99), c = a * b;
      var kind = rng.int(0, 2);
      if (kind === 0) {
        var askProduct = rng.chance(0.5);
        return {
          type: 'choice', prompt: '在 ' + a + ' × ' + b + ' = ' + c + ' 中，' + (askProduct ? c + ' 叫做（　）。' : a + ' 和 ' + b + ' 都叫做（　）。'),
          data: { options: ['因数', '积', '和', '差'] }, answer: askProduct ? '积' : '因数',
          hint: '因数 × 因数 = 积。',
          explanation: ['因数 × 因数 = 积', a + ' 和 ' + b + ' 是因数，' + c + ' 是积。']
        };
      }
      if (kind === 1) {
        var right = b + ' × ' + a;
        return {
          type: 'choice', prompt: '验算 ' + a + ' × ' + b + ' = ' + c + ' 对不对，可以算（　）。',
          data: { options: rng.shuffle([right, c + ' − ' + a, a + ' + ' + b, a + ' × ' + b + ' × 2']) }, answer: right,
          hint: '验算乘法：交换两个因数的位置再乘一遍。',
          explanation: U.steps(['验算乘法：交换两个因数的位置再乘一遍', b + ' × ' + a + ' = ' + c + '，和原来的积相同，说明算对了'])
        };
      }
      var wrongC = c + rng.pick([10, -10, 100, 9]);
      var truth = rng.chance(0.5);
      var shown = truth ? c : wrongC;
      return {
        type: 'judge', prompt: '判断对错：' + a + ' × ' + b + ' = ' + shown + '。',
        data: {}, answer: truth,
        hint: '列竖式算一算，或者交换因数验算。',
        explanation: U.steps(['算一算：' + a + ' × ' + b + ' = ' + c, shown === c ? '和题目一样，对' : '题目写的是 ' + shown + '，不对'])
      };
    }
  };

  /** 接近整十、整百的数：返回 { n, near } */
  function nearNumber(rng, digits) {
    if (digits === 2) { var t = rng.int(2, 9) * 10, off = rng.pick([-2, -1, 1, 2]); return { n: t + off, near: t }; }
    var hh = rng.int(1, 9) * 100, o = rng.pick([-4, -3, -2, -1, 1, 2, 3, 4]);
    if (hh === 100 && o < 0) o = -o;
    return { n: hh + o, near: hh };
  }

  // ⑩ 估算
  G.estimate = {
    skill: 'estimate', levels: [1, 2, 3],
    gen: function (rng, d) {
      var A = nearNumber(rng, d === 1 ? 2 : 3), B = nearNumber(rng, 2);
      var est = A.near * B.near;
      if (d === 3) {
        // 选项格式一样，只有一个是“两个因数都看成最接近的整十、整百数”
        var f = function (x, y) { return x + ' × ' + y + ' = ' + x * y; };
        var wrongs = [f(A.near + 100, B.near), f(A.near, B.near + 10), f(A.near, B.near - 10), f(A.near - 100 > 0 ? A.near - 100 : A.near + 200, B.near)];
        return {
          type: 'choice', prompt: '估算 ' + A.n + ' × ' + B.n + '，下面哪个最合理？',
          data: { options: options(rng, f(A.near, B.near), wrongs) },
          answer: f(A.near, B.near),
          hint: '把两个因数分别看成和它最接近的整十、整百数。',
          explanation: U.steps([A.n + ' 接近 ' + A.near + '，' + B.n + ' 接近 ' + B.near, A.n + ' × ' + B.n + ' ≈ ' + A.near + ' × ' + B.near + ' = ' + est])
        };
      }
      return {
        type: 'fill', prompt: '估算（把因数看成和它接近的整十、整百数）：',
        data: { template: A.n + ' × ' + B.n + ' ≈ []' },
        answer: String(est),
        hint: A.n + ' 接近几？' + B.n + ' 接近几？',
        explanation: U.steps([A.n + ' 接近 ' + A.near + '，' + B.n + ' 接近 ' + B.near, A.n + ' × ' + B.n + ' ≈ ' + A.near + ' × ' + B.near + ' = ' + est])
      };
    }
  };

  // ⑪ 用估算解决问题：钱够不够（选出结论和理由）
  G.enough = {
    skill: 'estimate', levels: [2, 3], weight: 1.2,
    gen: function (rng) {
      var plans = [[40, 25], [50, 20], [25, 40], [20, 50], [30, 30], [40, 20], [50, 30], [25, 20]];
      var p = rng.pick(plans), P = p[0], N = p[1], money = P * N;
      var enough = rng.chance(0.5);
      var r1 = rng.int(1, 3), r2 = rng.int(0, 3);
      var price = enough ? P - r1 : P + r1, cnt = enough ? N - r2 : N + r2;
      var item = rng.pick([['门票', '张'], ['书', '本'], ['跳绳', '根'], ['足球', '个']]);
      var good = enough ? '够。' + price + ' × ' + cnt + ' < ' + P + ' × ' + N + ' = ' + money + '（往大估了都够）'
        : '不够。' + price + ' × ' + cnt + ' > ' + P + ' × ' + N + ' = ' + money + '（往小估了都不够）';
      // 错误选项也带上“理由”，不让格式泄露答案
      var bad1 = enough ? '不够。' + price + ' × ' + cnt + ' > ' + P + ' × ' + N + ' = ' + money + '（往小估了都不够）'
        : '够。' + price + ' × ' + cnt + ' < ' + P + ' × ' + N + ' = ' + money + '（往大估了都够）';
      var bad2 = enough ? '够。' + price + ' × ' + cnt + ' > ' + P + ' × ' + N + ' = ' + money + '（往小估了也够）'
        : '不够。' + price + ' × ' + cnt + ' < ' + P + ' × ' + N + ' = ' + money + '（往大估了也不够）';
      return {
        type: 'choice',
        prompt: '一' + item[1] + item[0] + ' ' + price + ' 元，买 ' + cnt + ' ' + item[1] + '，带 ' + money + ' 元够吗？选出正确的结论和理由。',
        data: { options: rng.shuffle([good, bad1, bad2]) }, answer: good,
        hint: enough ? '想说明“够”，就把两个数都往大估。' : '想说明“不够”，就把两个数都往小估。',
        explanation: U.steps([
          enough ? price + ' < ' + P + '，' + cnt + (cnt < N ? ' < ' : ' = ') + N + '，都往大估' : price + ' > ' + P + '，' + cnt + (cnt > N ? ' > ' : ' = ') + N + '，都往小估',
          (enough ? price + ' × ' + cnt + ' < ' : price + ' × ' + cnt + ' > ') + P + ' × ' + N + ' = ' + money,
          enough ? '往大估都不超过 ' + money + ' 元，实际一定够' : '往小估都超过 ' + money + ' 元，实际一定不够'
        ]).concat(['（实际：' + price + ' × ' + cnt + ' = ' + price * cnt + ' 元）'])
      };
    }
  };

  // ⑫ 积的变化规律
  G.productRule = {
    skill: 'productRule', levels: [1, 2, 3], weight: 1.3,
    gen: function (rng, d) {
      if (d === 1) {
        var a = rng.int(12, 49), b = rng.int(2, 9), c = a * b;
        return {
          type: 'fill', prompt: '已知 ' + a + ' × ' + b + ' = ' + c + '，直接写出得数。',
          data: { template: a + ' × ' + b * 10 + ' = []\n' + a * 10 + ' × ' + b * 10 + ' = []' },
          answer: [String(c * 10), String(c * 100)],
          hint: '一个因数乘 10，积也乘 10。',
          explanation: U.steps([a + ' 不变，' + b + ' 乘 10 变成 ' + b * 10 + '，积也乘 10：' + c * 10, '两个因数都乘 10，积就乘 10 × 10 = 100：' + c * 100])
        };
      }
      if (d === 2) {
        var x = rng.int(12, 60), y = rng.int(2, 9) * 2, k = rng.pick([2, 3, 4, 5]);
        var mode = rng.int(0, 2), p = x * y;
        if (mode === 0) {
          return {
            type: 'fill', prompt: '两个因数的积是 ' + p + '。如果一个因数乘 ' + k + '，另一个因数不变，积是多少？',
            data: {}, answer: String(p * k),
            hint: '一个因数乘几，积也乘几。',
            explanation: U.steps(['一个因数乘 ' + k + '，另一个不变，积也乘 ' + k, p + ' × ' + k + ' = ' + p * k])
          };
        }
        if (mode === 1) {
          var k2 = rng.pick([2, 3]), j = rng.pick([2, 5, 10]);
          return {
            type: 'fill', prompt: '一个因数乘 ' + k2 + '，另一个因数乘 ' + j + '，积就乘几？',
            data: { template: '积乘 []' }, answer: String(k2 * j),
            hint: '两个因数分别乘 a 和 b，积就乘 a × b。',
            explanation: U.steps(['第一个因数乘 ' + k2 + '，积乘 ' + k2, '第二个因数再乘 ' + j + '，积再乘 ' + j, '一共乘 ' + k2 + ' × ' + j + ' = ' + k2 * j])
          };
        }
        var yy = y % 2 === 0 ? y : y + 1;
        return {
          type: 'fill', prompt: '已知 ' + x + ' × ' + yy + ' = ' + x * yy + '，那么 ' + x + ' × ' + yy / 2 + ' 等于多少？',
          data: {}, answer: String(x * yy / 2),
          hint: '一个因数除以 2，积也除以 2。',
          explanation: U.steps([yy + ' 除以 2 变成 ' + yy / 2 + '，积也除以 2', x * yy + ' ÷ 2 = ' + x * yy / 2])
        };
      }
      // 挑战：积不变
      if (rng.chance(0.5)) {
        var pairs = [[25, 4], [125, 8], [50, 2], [25, 8], [5, 2]];
        var pr = rng.pick(pairs), big = pr[0], kk = pr[1], q4 = rng.int(2, 9);
        var other = kk * q4; // 能被 kk 整除
        return {
          type: 'fill', prompt: '根据“积不变”的规律填空：',
          data: { template: big + ' × ' + other + ' = ' + big * kk + ' × []' },
          answer: String(q4),
          hint: big + ' 乘 ' + kk + ' 变成 ' + big * kk + '，另一个因数要除以 ' + kk + '。',
          explanation: U.steps(['左边 ' + big + ' 变成右边 ' + big * kk + '，乘了 ' + kk, '要让积不变，' + other + ' 要除以 ' + kk + '：' + other + ' ÷ ' + kk + ' = ' + q4, '验证：' + big + ' × ' + other + ' = ' + big * other + '，' + big * kk + ' × ' + q4 + ' = ' + big * kk * q4])
        };
      }
      var kc = rng.pick([2, 3, 4, 5, 10]);
      return {
        type: 'choice', prompt: '一个因数乘 ' + kc + '，另一个因数除以 ' + kc + '，积（　）。',
        data: { options: ['不变', '乘 ' + kc, '除以 ' + kc, '乘 ' + kc * kc] }, answer: '不变',
        hint: '乘了几，又除以同一个数，会怎样？',
        explanation: U.steps(['一个因数乘 ' + kc + '，积乘 ' + kc, '另一个因数除以 ' + kc + '，积又除以 ' + kc, '乘 ' + kc + ' 再除以 ' + kc + '，积不变'])
      };
    }
  };

  // ⑬ 找规律
  G.pattern = {
    skill: 'pattern', levels: [1, 2, 3], weight: 1.2,
    gen: function (rng, d) {
      var kinds = d === 1 ? ['ones', 'nines99'] : d === 2 ? ['ones', 'nines99', 'thirty7'] : ['thirty7back', 'nine', 'ones'];
      var kind = rng.pick(kinds);
      var lines = [], ask, ans, rule;
      function rep(ch, n) { var s = ''; for (var i = 0; i < n; i++) s += ch; return s; }
      if (kind === 'ones') {
        var n = d === 1 ? 4 : 5;
        for (var i = 2; i < n; i++) { var r = Number(rep('1', i)); lines.push(r + ' × ' + r + ' = ' + r * r); }
        var rr = Number(rep('1', n)); ask = rr + ' × ' + rr + ' = []'; ans = rr * rr;
        rule = '几个 1 相乘，积从 1 开始一个个数到“几”，再倒着数回 1';
      } else if (kind === 'nines99') {
        var start = rng.int(11, 13), k = start + 3 + rng.int(0, 3);
        for (var j = start; j < start + 3; j++) lines.push('99 × ' + j + ' = ' + 99 * j);
        ask = '99 × ' + k + ' = []'; ans = 99 * k;
        rule = '第二个因数每多 1，积就多 99';
      } else if (kind === 'thirty7') {
        for (var m = 1; m <= 3; m++) lines.push('37 × ' + 3 * m + ' = ' + 37 * 3 * m);
        var mm = rng.int(4, 9); ask = '37 × ' + 3 * mm + ' = []'; ans = 37 * 3 * mm;
        rule = '37 × 3 = 111，第二个因数是 3 的几倍，积就是几个相同的数字';
      } else if (kind === 'thirty7back') {
        for (var m2 = 1; m2 <= 3; m2++) lines.push('37 × ' + 3 * m2 + ' = ' + 37 * 3 * m2);
        var m3 = rng.int(4, 9); ask = '37 × [] = ' + 111 * m3; ans = 3 * m3;
        rule = '积是几个相同的数字“' + m3 + '”，第二个因数就是 3 × ' + m3;
      } else {
        var seq = '1';
        for (var t = 1; t <= 3; t++) { lines.push(seq + ' × 9 + ' + (t + 1) + ' = ' + (Number(seq) * 9 + t + 1)); seq += String(t + 1); }
        ask = seq + ' × 9 + 5 = []'; ans = Number(seq) * 9 + 5;
        rule = '积全是 1，每往下一行多一个 1';
      }
      return {
        type: 'fill', prompt: '找规律，直接写出下一个算式的结果：\n' + lines.join('\n'),
        data: { template: ask }, answer: String(ans),
        hint: '仔细看每一行哪里变了、怎么变的。',
        explanation: U.steps(['观察：' + lines.join('，'), '发现规律：' + rule, '写出来：' + ask.replace('[]', String(ans)), '验证：可以用竖式算一算，结果一样 ✔'])
      };
    }
  };

  MI.registerUnit({
    id: 'u3', title: '多位数乘两位数', cards: cards, skills: skills, generators: G, fixed: [],
    // 练一练页面上的额外入口：60 秒口算挑战（只用口算乘法）
    extras: [{ icon: '⏱️', title: '口算挑战（60 秒）', desc: '只练口算乘法，看看 1 分钟能答对几道。', href: '#/blitz/u3' }]
  });
})(typeof window !== 'undefined' ? window : globalThis);

/* 期末大挑战（综合）
 * 练一练、闯关测验从前面 8 座岛的题里混合出题（mix），再加几道把单元串起来的“关联题”。
 * 关联关系来自知识清单“复习与关联”：大数读写 ↔ 多位数乘法结果；乘法模型 ↔ 多位数乘法计算；
 * 角的度量 ↔ 平行四边形对角相等；统计图 ↔ 大数比较。 */
(function (root) {
  'use strict';
  var MI = root.MathIsland = root.MathIsland || {};
  var U = MI.util, N = MI.num;

  function options(rng, correct, wrongs, k) {
    var w = U.uniq(wrongs.filter(function (x) { return x !== correct && x != null; }));
    w = rng.shuffle(w).slice(0, (k || 4) - 1);
    return rng.shuffle([correct].concat(w));
  }

  var cards = [
    {
      id: 'links', emoji: '🔗', title: '知识串一串',
      points: ['大数读写 ↔ 多位数乘法的结果：算出来的积，要会读、会写、会求近似数。', '乘法模型 ↔ 多位数乘法计算：总价、路程问题都要列竖式算。', '角的度量 ↔ 平行四边形：平行四边形的对角相等，可以用量角器量一量。', '统计图 ↔ 大数比较：读统计图、统计表里的大数，比较大小。'],
      examples: ['一台电脑 3 千多元，买 25 台要多少元？算出积，再求它约是几万元。'],
      pitfall: '综合题先想：这一步用的是哪个单元的知识？'
    },
    {
      id: 'tips', emoji: '🏁', title: '期末大挑战怎么玩',
      points: ['题目从前面 8 座岛里混合抽取，还有几道“串一串”的关联题。', '做错的题会进错题本，每日一练会优先帮你复习。'],
      examples: ['先在各个小岛把知识卡都“懂了”，再来挑战更轻松。'],
      pitfall: '不会的题先点 💡 提示，不要着急。'
    }
  ];

  var skills = [{ id: 'link', name: '知识串一串' }];
  var G = {};

  // ① 乘法的积 → 读数
  G.productRead = {
    skill: 'link', levels: [1, 2, 3],
    gen: function (rng, d) {
      for (;;) {
        var a = rng.int(d === 1 ? 105 : 201, 999), b = rng.int(d === 1 ? 11 : 21, 99), p = a * b;
        if (p < 10000) continue;
        var r = N.toChineseReading(p);
        var wrongs = [MI.u1.naiveReading(p), N.toChineseReading(p * 10), r.replace(/零/g, ''), N.toChineseReading(p + 1000)].filter(function (w) { return w !== r; });
        if (U.uniq(wrongs).length < 2) continue;
        return {
          type: 'choice', prompt: '工厂每天生产 ' + a + ' 个零件，' + b + ' 天一共生产多少个？这个数读作（　）。',
          data: { options: options(rng, r, wrongs) }, answer: r,
          hint: '先算 ' + a + ' × ' + b + '，再从右往左四位一级分级来读。',
          explanation: U.steps([a + ' × ' + b + ' = ' + p + '（个）', '分级：' + N.splitLevelsText(p), '读作：' + r])
        };
      }
    }
  };

  // ② 总价（多位数乘法）→ 求近似数
  G.priceApprox = {
    skill: 'link', levels: [2, 3],
    gen: function (rng) {
      for (;;) {
        var price = rng.int(150, 990), n = rng.int(21, 98), total = price * n;
        if (total < 15000 || total % 10000 === 0) continue;
        var k = N.approx(total, '万');
        return {
          type: 'fill', prompt: '学校买了 ' + n + ' 套桌椅，每套 ' + price + ' 元。一共要多少元？省略万位后面的尾数约是多少万元？',
          data: { template: '一共 [] 元\n约 [] 万元' }, answer: [String(total), String(k)],
          hint: '先用“总价 = 单价 × 数量”列竖式算，再看千位四舍五入。',
          explanation: U.steps(['总价 = 单价 × 数量：' + price + ' × ' + n + ' = ' + total + '（元）', '省略万位后面的尾数，看千位：' + N.digitAt(total, 3) + (N.digitAt(total, 3) >= 5 ? ' ≥ 5，进一' : ' < 5，舍去'), total + ' ≈ ' + k + '万（元）'])
        };
      }
    }
  };

  // ③ 量角器量平行四边形的角 → 对角相等
  G.pgramAngle = {
    skill: 'link', levels: [1, 2, 3],
    gen: function (rng, d) {
      var deg = rng.int(d === 3 ? 21 : 11, 34) * 5;
      if (deg === 90) deg = 110;
      if (d === 3 && deg % 10 === 0) deg += 5;
      var base = d === 1 ? 'right' : rng.pick(['right', 'left']);
      return {
        type: 'fill', prompt: '用量角器量出平行四边形的一个角（如图的 ∠1）。和它相对的那个角是多少度？',
        data: { figure: { kind: 'protractor', deg: deg, base: base }, template: '[] °', suffix: '°', tolerance: 1 }, answer: String(deg),
        hint: '先正确读出 ∠1（看和边重合的 0° 在哪一圈），再想平行四边形对角的关系。',
        explanation: U.steps(['读量角器：和边重合的 0° 在' + (base === 'right' ? '内圈' : '外圈') + '，∠1 = ' + deg + '°', '平行四边形的对角相等', '所以和它相对的角也是 ' + deg + '°'])
      };
    }
  };

  // ④ 统计表里的大数 → 比较大小
  G.bigTable = {
    skill: 'link', levels: [1, 2, 3],
    gen: function (rng, d) {
      var cities = ['甲市', '乙市', '丙市', '丁市'];
      var base = rng.int(12, 89) * 100000, vals = [];
      while (vals.length < 4) {
        var v = d === 1 ? rng.int(10, 99) * 100000 : base + rng.int(-99999, 99999);
        if (vals.indexOf(v) < 0) vals.push(v);
      }
      var wantMax = rng.chance(0.5);
      var target = wantMax ? Math.max.apply(null, vals) : Math.min.apply(null, vals);
      var ans = cities[vals.indexOf(target)];
      var sorted = vals.slice().sort(function (a, b) { return b - a; });
      return {
        type: 'choice', prompt: '下表是四个城市某年的旅游人数（单位：人）。哪个城市' + (wantMax ? '最多' : '最少') + '？',
        data: { table: { head: ['城市', '人数'], rows: cities.map(function (c, i) { return [c, String(vals[i])]; }) }, options: cities.slice() },
        answer: ans,
        hint: '位数相同，从最高位起一位一位比。',
        explanation: U.steps(['这几个数都是 ' + String(vals[0]).length + ' 位数，从最高位起比', '从大到小：' + sorted.join(' > '), (wantMax ? '最多' : '最少') + '的是' + ans])
      };
    }
  };

  MI.registerUnit({
    id: 'u9', title: '期末大挑战', cards: cards, skills: skills, generators: G, fixed: [],
    // 出题时混合这些单元（包括自己的关联题）
    mix: ['u1', 'u2', 'u3', 'u4', 'u5', 'u6', 'u7', 'u8', 'u9']
  });
})(typeof window !== 'undefined' ? window : globalThis);

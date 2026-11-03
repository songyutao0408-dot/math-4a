/* 第④单元 · 加法模型和乘法模型（新增单元）
 * 本文件只放内容：知识卡、知识点、题目生成器。所有答案都由代码计算。
 * 注意范围：除法只出“除数是一位数”的（除数是两位数的除法在四年级下册）。 */
(function (root) {
  'use strict';
  var MI = root.MathIsland = root.MathIsland || {};
  var U = MI.util;

  function options(rng, correct, wrongs, k) {
    var w = U.uniq(wrongs.filter(function (x) { return x !== correct && x != null; }));
    w = rng.shuffle(w).slice(0, (k || 4) - 1);
    return rng.shuffle([correct].concat(w));
  }
  function hm(min) { return Math.floor(min / 60) + ':' + U.pad2(min % 60); }

  var cards = [
    {
      id: 'add', emoji: '➕', title: '加法模型',
      points: ['总量 = 部分量 + 部分量（+ ……）', '部分量 = 总量 − 另一个部分量', '画线段图，表示出总量和部分量。'],
      examples: ['两个班一共 86 人，一班 43 人，二班 86 − 43 = 43（人）。'],
      pitfall: '先找清楚谁是总量、谁是部分量。'
    },
    {
      id: 'compare', emoji: '📏', title: '比多比少',
      points: ['“比……少”：较少的量 = 较多的量 − 相差的量。', '“比……多”：较多的量 = 较少的量 + 相差的量。'],
      examples: ['故事书 1250 本，科技书比故事书少 380 本。科技书 1250 − 380 = 870（本），一共 1250 + 870 = 2120（本）。'],
      pitfall: '问“一共”时，要先求出另一个量，再相加。'
    },
    {
      id: 'price', emoji: '🛒', title: '总价、单价、数量',
      points: ['总价 = 单价 × 数量', '单价 = 总价 ÷ 数量', '数量 = 总价 ÷ 单价'],
      examples: ['一个书包 128 元，买 15 个：128 × 15 = 1920（元）。'],
      pitfall: '单价是“一个”的价钱，总价是“一共”的价钱。'
    },
    {
      id: 'speed', emoji: '🚗', title: '速度',
      points: ['速度：单位时间内行的路程。', '写法：80 千米/时，读作“80 千米每时”。还有“米/分”“米/秒”等。'],
      examples: ['汽车每小时行 85 千米，速度是 85 千米/时。'],
      pitfall: '速度要带上“/时”“/分”，不能只写 85 千米。'
    },
    {
      id: 'distance', emoji: '🛣️', title: '路程、速度、时间',
      points: ['路程 = 速度 × 时间', '速度 = 路程 ÷ 时间', '时间 = 路程 ÷ 速度'],
      examples: ['汽车每小时行 85 千米，4 小时行 85 × 4 = 340（千米）。'],
      pitfall: '速度和时间的单位要配套：千米/时配小时。'
    },
    {
      id: 'time', emoji: '⏰', title: '开始、结束时刻的路程问题',
      points: ['先用“结束时刻 − 开始时刻”求经过的时间，再用速度 × 时间求路程。', '会用 24 时计时法：下午 2 时就是 14 时。'],
      examples: ['火车 8:30 出发，11:30 到达，每小时行 120 千米：经过 3 小时，120 × 3 = 360（千米）。'],
      pitfall: '跨过中午时，先把下午的时刻换成 24 时计时法再相减。'
    },
    {
      id: 'promo', emoji: '🏷️', title: '促销问题',
      points: ['买几送几、每满多少减多少、两家店比较哪家便宜。', '先弄清“实际要付几份的钱”，可以列表比较。'],
      examples: ['甲店每瓶 6 元，买 3 送 1；乙店每瓶 5 元。买 24 瓶：甲店只付 18 瓶的钱 18 × 6 = 108（元），乙店 24 × 5 = 120（元），甲店便宜。'],
      pitfall: '“买 3 送 1”是 4 瓶只付 3 瓶的钱。'
    },
    {
      id: 'steps', emoji: '🪜', title: '解题步骤',
      points: ['读题找信息 → 判断是哪种模型 → 画线段图或列表 → 列式计算 → 检验并写答语。'],
      examples: ['有“一共”“比……多/少” → 想加法模型；有“每个”“每小时” → 想乘法模型。'],
      pitfall: '最后别忘了写单位和答语。'
    }
  ];

  var skills = [
    { id: 'addModel', name: '加法模型' },
    { id: 'priceModel', name: '总价、单价、数量' },
    { id: 'speedModel', name: '路程、速度、时间' },
    { id: 'timeTrip', name: '开始、结束时刻的路程问题' },
    { id: 'promo', name: '促销问题' },
    { id: 'identify', name: '判断用哪种模型' }
  ];

  var PAIRS = [['故事书', '科技书', '本'], ['红花', '黄花', '朵'], ['男生', '女生', '人'], ['苹果树', '梨树', '棵'], ['白兔', '灰兔', '只'], ['篮球', '足球', '个']];

  var G = {};

  // ① 比多比少（加法模型）
  // 基础：求较少/较多的量（一步）；提高：求一共（两步）；挑战：“比……少”反过来求较多的量
  G.addCompare = {
    skill: 'addModel', levels: [1, 2, 3], weight: 1.4,
    gen: function (rng, d) {
      var p = rng.pick(PAIRS), A = p[0], B = p[1], u = p[2];
      var a = d === 1 ? rng.int(120, 900) : rng.int(560, 3800);
      var diff = rng.int(Math.floor(a * 0.15), Math.floor(a * 0.6));
      var less = rng.chance(0.6), b = less ? a - diff : a + diff;
      var rel = (less ? '比' + A + '少 ' : '比' + A + '多 ') + diff + ' ' + u;
      var diagram = { kind: 'compare', bars: [{ name: A, value: a, label: a + ' ' + u }, { name: B, value: b, label: '?' }], diff: (less ? '少 ' : '多 ') + diff + ' ' + u };
      if (d === 1) {
        return {
          type: 'fill', prompt: A + '有 ' + a + ' ' + u + '，' + B + rel + '。' + B + '有多少' + u + '？',
          data: { diagram: diagram, template: B + '有 [] ' + u }, answer: String(b),
          hint: less ? '“比……少”，用减法。' : '“比……多”，用加法。',
          explanation: U.steps(['看线段图：' + B + rel, less ? a + ' − ' + diff + ' = ' + b + '（' + u + '）' : a + ' + ' + diff + ' = ' + b + '（' + u + '）', '答：' + B + '有 ' + b + ' ' + u + '。'])
        };
      }
      if (d === 2) {
        diagram.total = '一共 ? ' + u;
        return {
          type: 'fill', prompt: A + '有 ' + a + ' ' + u + '，' + B + rel + '。两种一共有多少' + u + '？',
          data: { diagram: diagram, template: B + '有 [] ' + u + '\n一共 [] ' + u }, answer: [String(b), String(a + b)],
          hint: '先求出' + B + '有多少，再把两种加起来。',
          explanation: U.steps([B + '：' + (less ? a + ' − ' + diff : a + ' + ' + diff) + ' = ' + b + '（' + u + '）', '一共：' + a + ' + ' + b + ' = ' + (a + b) + '（' + u + '）', '答：两种一共有 ' + (a + b) + ' ' + u + '。'])
        };
      }
      // 挑战：B 有 b，比 A 少 diff，求 A（容易错用减法）
      var bb = rng.int(300, 2500), dd = rng.int(60, 600), aa = bb + dd;
      return {
        type: 'fill', prompt: B + '有 ' + bb + ' ' + u + '，比' + A + '少 ' + dd + ' ' + u + '。' + A + '有多少' + u + '？',
        data: { diagram: { kind: 'compare', bars: [{ name: A, value: aa, label: '?' }, { name: B, value: bb, label: bb + ' ' + u }], diff: '少 ' + dd + ' ' + u }, template: A + '有 [] ' + u },
        answer: String(aa),
        hint: '“' + B + '比' + A + '少”，说明' + A + '多。画线段图看看。',
        explanation: U.steps([B + '比' + A + '少 ' + dd + ' ' + u + '，就是' + A + '比' + B + '多 ' + dd + ' ' + u, bb + ' + ' + dd + ' = ' + aa + '（' + u + '）', '答：' + A + '有 ' + aa + ' ' + u + '。'])
      };
    }
  };

  // ② 总量与部分量
  G.addParts = {
    skill: 'addModel', levels: [1, 2, 3],
    gen: function (rng, d) {
      // 基础题用“班级”（人数少）；提高、挑战题用人数、数量更大的情境
      var ctxs = d === 1 ? [['四年级', ['一班', '二班', '三班'], '人', '学生']]
        : [['图书馆', ['上午', '下午', '晚上'], '人', '借书的人'], ['果园', ['第一天', '第二天', '第三天'], '千克', '摘的苹果'], ['学校', ['四年级', '五年级', '六年级'], '人', '参加运动会的']];
      var c = rng.pick(ctxs), n = d === 3 ? 3 : 2;
      var parts = []; for (var i = 0; i < n; i++) parts.push(rng.int(d === 1 ? 30 : 120, d === 1 ? 99 : 980));
      var total = parts.reduce(function (s, x) { return s + x; }, 0);
      var ask = rng.int(0, n - 1);
      var known = parts.map(function (x, i) { return i === ask ? null : c[1][i] + ' ' + x + ' ' + c[2]; }).filter(Boolean);
      var diagram = { kind: 'parts', parts: parts.map(function (x, i) { return { value: x, label: i === ask ? c[1][i] + ' ?' : c[1][i] + ' ' + x }; }), total: '一共 ' + total + ' ' + c[2] };
      return {
        type: 'fill', prompt: c[0] + c[3] + '一共 ' + total + ' ' + c[2] + '，其中' + known.join('，') + '。' + c[1][ask] + '有多少' + c[2] + '？',
        data: { diagram: diagram, template: c[1][ask] + ' [] ' + c[2] }, answer: String(parts[ask]),
        hint: '部分量 = 总量 − 其他部分量。',
        explanation: U.steps(['总量是 ' + total + '，' + c[1][ask] + '是其中一部分', total + ' − ' + parts.filter(function (x, i) { return i !== ask; }).join(' − ') + ' = ' + parts[ask] + '（' + c[2] + '）', '检验：' + parts.join(' + ') + ' = ' + total + ' ✔'])
      };
    }
  };

  // ③ 选出正确的算式（加法模型）
  G.addExpr = {
    skill: 'addModel', levels: [2, 3],
    gen: function (rng) {
      var p = rng.pick(PAIRS), A = p[0], B = p[1], u = p[2];
      var a = rng.int(300, 1500), diff = rng.int(40, Math.floor(a / 2));
      var less = rng.chance(0.5);
      var right = less ? a + ' + (' + a + ' − ' + diff + ')' : a + ' + (' + a + ' + ' + diff + ')';
      var val = less ? 2 * a - diff : 2 * a + diff;
      var cands = [[a + ' + ' + diff, a + diff], [a + ' − ' + diff, a - diff], [less ? a + ' + (' + a + ' + ' + diff + ')' : a + ' + (' + a + ' − ' + diff + ')', less ? 2 * a + diff : 2 * a - diff], [a + ' × 2', 2 * a]];
      var wrongs = cands.filter(function (c) { return c[1] !== val; }).map(function (c) { return c[0]; });
      return {
        type: 'choice', prompt: A + '有 ' + a + ' ' + u + '，' + B + '比' + A + (less ? '少 ' : '多 ') + diff + ' ' + u + '。两种一共多少' + u + '？下面算式正确的是（　）。',
        data: { diagram: { kind: 'compare', bars: [{ name: A, value: a, label: a + ' ' + u }, { name: B, value: less ? a - diff : a + diff, label: '?' }], diff: (less ? '少 ' : '多 ') + diff + ' ' + u, total: '一共 ?' }, options: options(rng, right, wrongs) },
        answer: right,
        hint: '一共 = ' + A + ' + ' + B + '，' + B + '要先算出来。',
        explanation: U.steps([B + '：' + a + (less ? ' − ' : ' + ') + diff, '一共：' + right + ' = ' + val + '（' + u + '）'])
      };
    }
  };

  var GOODS = [['书包', '个', [68, 168]], ['台灯', '盏', [45, 135]], ['足球', '个', [56, 98]], ['故事书', '本', [18, 45]], ['保温杯', '个', [39, 99]], ['跳绳', '根', [12, 28]]];

  // ④ 总价 = 单价 × 数量；单价 = 总价 ÷ 数量（数量是一位数）
  G.priceTotal = {
    skill: 'priceModel', levels: [1, 2, 3], weight: 1.3,
    gen: function (rng, d) {
      var g = rng.pick(GOODS), price = rng.int(g[2][0], g[2][1]);
      if (d === 1) {
        var n1 = rng.int(3, 9);
        return {
          type: 'fill', prompt: '一' + g[1] + g[0] + ' ' + price + ' 元，买 ' + n1 + ' ' + g[1] + '一共多少元？',
          data: { diagram: { kind: 'repeat', count: n1, unit: price + ' 元', countText: n1 + ' ' + g[1], total: '一共 ? 元' }, template: '一共 [] 元' },
          answer: String(price * n1), hint: '总价 = 单价 × 数量。',
          explanation: U.steps(['总价 = 单价 × 数量', price + ' × ' + n1 + ' = ' + price * n1 + '（元）'])
        };
      }
      if (d === 2) {
        var n2 = rng.int(12, 45), p2 = rng.int(100, 199);
        return {
          type: 'fill', prompt: '一' + g[1] + g[0] + ' ' + p2 + ' 元，学校买了 ' + n2 + ' ' + g[1] + '，一共要花多少元？',
          data: { diagram: { kind: 'repeat', count: n2, unit: p2 + ' 元', countText: n2 + ' ' + g[1], total: '一共 ? 元' }, template: '一共 [] 元' },
          answer: String(p2 * n2), hint: '总价 = 单价 × 数量，列竖式算一算。',
          explanation: U.steps(['总价 = 单价 × 数量', p2 + ' × ' + n2 + ' = ' + p2 * n2 + '（元）'])
        };
      }
      var n3 = rng.int(3, 9), total = price * n3;
      return {
        type: 'fill', prompt: '买 ' + n3 + ' ' + g[1] + '同样的' + g[0] + '一共花了 ' + total + ' 元，每' + g[1] + '多少元？',
        data: { diagram: { kind: 'repeat', count: n3, unit: '? 元', countText: n3 + ' ' + g[1], total: '一共 ' + total + ' 元' }, template: '每' + g[1] + ' [] 元' },
        answer: String(price), hint: '单价 = 总价 ÷ 数量。',
        explanation: U.steps(['单价 = 总价 ÷ 数量', total + ' ÷ ' + n3 + ' = ' + price + '（元）', '检验：' + price + ' × ' + n3 + ' = ' + total + ' ✔'])
      };
    }
  };

  var MOVERS = [['汽车', '千米/时', '千米', '小时', [55, 95]], ['火车', '千米/时', '千米', '小时', [110, 260]], ['飞机', '千米/时', '千米', '小时', [650, 880]], ['小明骑车', '米/分', '米', '分', [180, 260]], ['小红步行', '米/分', '米', '分', [55, 75]]];

  // ⑤ 路程 = 速度 × 时间；速度 = 路程 ÷ 时间（时间是一位数）
  G.speedDist = {
    skill: 'speedModel', levels: [1, 2, 3], weight: 1.3,
    gen: function (rng, d) {
      var m = rng.pick(MOVERS), v = rng.int(m[4][0], m[4][1]);
      var per = m[3] === '小时' ? '每小时' : '每分';
      if (d === 3) {
        var t3 = rng.int(2, 9), s3 = v * t3;
        return {
          type: 'fill', prompt: m[0] + ' ' + t3 + ' ' + m[3] + '行了 ' + s3 + ' ' + m[2] + '，平均' + per + '行多少' + m[2] + '？速度是多少？',
          data: { diagram: { kind: 'repeat', count: t3, unit: '? ' + m[2], countText: t3 + ' ' + m[3], total: '一共 ' + s3 + ' ' + m[2] }, template: '速度是 [] ' + m[1] },
          answer: String(v), hint: '速度 = 路程 ÷ 时间。',
          explanation: U.steps(['速度 = 路程 ÷ 时间', s3 + ' ÷ ' + t3 + ' = ' + v, '速度是 ' + v + ' ' + m[1] + '，读作“' + v + ' ' + m[1].replace('/', '每') + '”'])
        };
      }
      var t = d === 1 ? rng.int(2, 9) : rng.int(12, 36);
      return {
        type: 'fill', prompt: m[0] + per + '行 ' + v + ' ' + m[2] + '，' + t + ' ' + m[3] + '行多少' + m[2] + '？',
        data: { diagram: { kind: 'repeat', count: t, unit: v + ' ' + m[2], countText: t + ' ' + m[3], total: '路程 ? ' + m[2] }, template: '路程是 [] ' + m[2] },
        answer: String(v * t), hint: '路程 = 速度 × 时间。',
        explanation: U.steps(['速度是 ' + v + ' ' + m[1] + '，时间是 ' + t + ' ' + m[3], '路程 = 速度 × 时间：' + v + ' × ' + t + ' = ' + v * t + '（' + m[2] + '）'])
      };
    }
  };

  // ⑥ 速度的读法、写法
  G.speedRead = {
    skill: 'speedModel', levels: [1, 2],
    gen: function (rng) {
      var m = rng.pick(MOVERS), v = rng.int(m[4][0], m[4][1]);
      var unitRead = m[1].replace('/', '每');
      if (rng.chance(0.5)) {
        return {
          type: 'choice', prompt: '“' + v + ' ' + m[1] + '”读作（　）。',
          data: { options: rng.shuffle([v + ' ' + unitRead, v + ' ' + m[1].replace('/', ''), '每' + m[1].split('/')[1] + ' ' + v + ' ' + m[2], v + ' ' + m[1].split('/')[1] + '每' + m[2]]) },
          answer: v + ' ' + unitRead, hint: '“/”读作“每”。',
          explanation: ['速度的写法里，“/”读作“每”。', v + ' ' + m[1] + ' 读作“' + v + ' ' + unitRead + '”。']
        };
      }
      var per = m[3] === '小时' ? '每小时' : '每分';
      return {
        type: 'choice', prompt: m[0] + per + '行 ' + v + ' ' + m[2] + '，速度写作（　）。',
        data: { options: rng.shuffle([v + ' ' + m[1], v + ' ' + m[2], v + ' ' + m[1].split('/').reverse().join('/'), v + ' ' + m[3]]) },
        answer: v + ' ' + m[1], hint: '速度 = 路程单位 / 时间单位。',
        explanation: [per + '行 ' + v + ' ' + m[2] + '，速度写作 ' + v + ' ' + m[1] + '。', '只写 ' + v + ' ' + m[2] + ' 是路程，不是速度。']
      };
    }
  };

  // ⑦ 公式选择 / 判断
  G.formula = {
    skill: 'identify', levels: [1, 2],
    gen: function (rng) {
      var sets = [
        { a: '单价', b: '数量', c: '总价' },
        { a: '速度', b: '时间', c: '路程' }
      ];
      var s = rng.pick(sets), ask = rng.int(0, 2);
      var formulas = [s.c + ' = ' + s.a + ' × ' + s.b, s.a + ' = ' + s.c + ' ÷ ' + s.b, s.b + ' = ' + s.c + ' ÷ ' + s.a];
      var target = [s.c, s.a, s.b][ask];
      var right = formulas[ask].split(' = ')[1];
      var know = ask === 0 ? [s.a, s.b] : ask === 1 ? [s.c, s.b] : [s.c, s.a];
      var wrong = [s.a + ' × ' + s.c, s.b + ' ÷ ' + s.c, s.a + ' + ' + s.b, s.c + ' × ' + s.b, s.a + ' ÷ ' + s.b, s.c + ' ÷ ' + s.a, s.c + ' ÷ ' + s.b, s.a + ' × ' + s.b].filter(function (x) { return x !== right; });
      return {
        type: 'choice', prompt: '已知' + know[0] + '和' + know[1] + '，求' + target + '，用（　）。',
        data: { options: options(rng, right, wrong) }, answer: right,
        hint: '先想“' + s.c + ' = ' + s.a + ' × ' + s.b + '”，再推另外两个。',
        explanation: [formulas[0], formulas[1], formulas[2], '所以求' + target + '用 ' + right + '。']
      };
    }
  };

  // ⑧ 开始、结束时刻的路程问题（经过的时间都是整时）
  G.timeTrip = {
    skill: 'timeTrip', levels: [1, 2, 3], weight: 1.4,
    gen: function (rng, d) {
      var m = rng.pick(MOVERS.slice(0, 2)), v = rng.int(m[4][0], m[4][1]);
      var start, hours, rest = 0, startText, endText;
      if (d === 1) { start = rng.int(6, 9) * 60; hours = rng.int(2, 4); }
      else if (d === 2) { start = rng.int(6, 10) * 60 + rng.pick([0, 30]); hours = rng.int(2, 5); }
      else { start = rng.int(7, 11) * 60 + rng.pick([0, 30]); hours = rng.int(3, 7); rest = rng.chance(0.5) ? 1 : 0; }
      var end = start + (hours + rest) * 60;
      startText = hm(start);
      if (d === 3 && end >= 13 * 60) endText = '下午 ' + hm(end - 12 * 60);
      else endText = hm(end);
      var prompt = m[0] + (d === 3 ? '上午 ' : ' ') + startText + ' 出发，' + endText + ' 到达，' + (rest ? '中途休息了 1 小时，' : '') + '每小时行 ' + v + ' 千米。两地相距多少千米？';
      var exp = [];
      if (d === 3 && end >= 13 * 60) exp.push('先换成 24 时计时法：' + endText + ' 就是 ' + hm(end));
      exp.push('经过的时间：' + hm(end) + ' − ' + startText + ' = ' + (hours + rest) + ' 小时' + (rest ? '，去掉休息的 1 小时，行驶了 ' + hours + ' 小时' : ''));
      exp.push('路程 = 速度 × 时间：' + v + ' × ' + hours + ' = ' + v * hours + '（千米）');
      return {
        type: 'fill', prompt: prompt,
        data: { diagram: { kind: 'timeline', start: start, end: end, startText: startText, endText: hm(end), label: '经过 ? 小时' }, template: '行驶了 [] 小时\n相距 [] 千米' },
        answer: [String(hours), String(v * hours)],
        hint: rest ? '先算经过的时间，再减去休息的时间。' : '先用“到达时刻 − 出发时刻”算出经过几小时。',
        explanation: U.steps(exp)
      };
    }
  };

  /** 两家店的促销 */
  function promoCase(rng, d) {
    for (;;) {
      var item = rng.pick([['饮料', '瓶'], ['酸奶', '盒'], ['笔记本', '本'], ['面包', '个']]);
      var kind = d === 1 ? 'buyGet' : rng.pick(['buyGet', 'fullCut']);
      var pa = rng.int(4, 9), pb, n, A, desc, paidN = null, explainA;
      if (kind === 'buyGet') {
        var m = rng.int(2, 4);
        n = (m + 1) * rng.int(3, 8);
        paidN = n / (m + 1) * m;
        A = paidN * pa;
        desc = '买 ' + m + ' 送 1';
        explainA = '甲店买 ' + m + ' 送 1：每 ' + (m + 1) + ' ' + item[1] + '只付 ' + m + ' ' + item[1] + '的钱。' + n + ' ÷ ' + (m + 1) + ' = ' + n / (m + 1) + '（组），要付 ' + n / (m + 1) + ' × ' + m + ' = ' + paidN + ' ' + item[1] + '的钱：' + paidN + ' × ' + pa + ' = ' + A + '（元）';
      } else {
        pa = rng.int(12, 25); n = rng.int(6, 15);
        var full = rng.pick([50, 100]), cut = rng.pick(full === 50 ? [5, 10] : [10, 20, 30]);
        var raw = pa * n, times = Math.floor(raw / full);
        if (!times) continue;
        A = raw - times * cut;
        desc = '每满 ' + full + ' 元减 ' + cut + ' 元';
        explainA = '甲店先算原价：' + pa + ' × ' + n + ' = ' + raw + '（元），里面有 ' + times + ' 个 ' + full + '，减 ' + times + ' × ' + cut + ' = ' + times * cut + '（元），要付 ' + A + ' 元';
      }
      pb = pa - rng.int(1, Math.min(3, pa - 2));
      var B = pb * n;
      if (A === B) continue;
      return { item: item, kind: kind, pa: pa, pb: pb, n: n, A: A, B: B, desc: desc, paidN: paidN, explainA: explainA };
    }
  }

  // ⑨ 促销问题：列表比较两家店
  G.promo = {
    skill: 'promo', levels: [1, 2, 3], weight: 1.4,
    gen: function (rng, d) {
      var c = promoCase(rng, d), u = c.item[1];
      var table = { head: ['', '甲店', '乙店'], rows: [['单价', c.pa + ' 元/' + u, c.pb + ' 元/' + u], ['优惠', c.desc, '不优惠'], ['买 ' + c.n + u + '要付', '?', '?']] };
      var prompt = '两家店卖同样的' + c.item[0] + '（见下表），买 ' + c.n + ' ' + u + '。';
      var expl = U.steps([c.explainA, '乙店：' + c.n + ' × ' + c.pb + ' = ' + c.B + '（元）', (c.A < c.B ? '甲店' : '乙店') + '便宜，便宜 ' + Math.abs(c.A - c.B) + ' 元']);
      if (d === 1) {
        return {
          type: 'fill', prompt: prompt + '在甲店实际要付几' + u + '的钱？一共要付多少元？',
          data: { table: table, template: '付 [] ' + u + '的钱\n一共 [] 元' }, answer: [String(c.paidN), String(c.A)],
          hint: '“买 ' + c.desc.slice(2) + '”：先算一共有几组，每组只付几' + u + '的钱。',
          explanation: expl
        };
      }
      if (d === 2) {
        return {
          type: 'fill', prompt: prompt + '两家店各要付多少元？',
          data: { table: table, template: '甲店 [] 元\n乙店 [] 元' }, answer: [String(c.A), String(c.B)],
          hint: '先弄清甲店实际要付几份的钱。',
          explanation: expl
        };
      }
      var diff = Math.abs(c.A - c.B), cheap = c.A < c.B ? '甲店' : '乙店', other = cheap === '甲店' ? '乙店' : '甲店';
      var right = cheap + '便宜 ' + diff + ' 元';
      return {
        type: 'choice', prompt: prompt + '哪家店便宜？便宜多少元？',
        data: { table: table, options: options(rng, right, [other + '便宜 ' + diff + ' 元', cheap + '便宜 ' + (diff + c.pa) + ' 元', other + '便宜 ' + (c.pa - c.pb) * c.n + ' 元', '两家一样']) },
        answer: right, hint: '把两家店要付的钱都算出来，再比一比。',
        explanation: expl
      };
    }
  };

  // ⑩ 判断用哪种模型
  G.identify = {
    skill: 'identify', levels: [1, 2, 3],
    gen: function (rng) {
      var M_ADD = '加法模型', M_PRICE = '乘法模型：总价 = 单价 × 数量', M_SPEED = '乘法模型：路程 = 速度 × 时间';
      var kind = rng.int(0, 2), text;
      if (kind === 0) {
        var p = rng.pick(PAIRS), a = rng.int(200, 900), dd = rng.int(20, 150);
        text = p[0] + '有 ' + a + ' ' + p[2] + '，' + p[1] + '比' + p[0] + (rng.chance(0.5) ? '多 ' : '少 ') + dd + ' ' + p[2] + '，' + p[1] + '有多少' + p[2] + '？';
      } else if (kind === 1) {
        var g = rng.pick(GOODS), pr = rng.int(g[2][0], g[2][1]);
        text = '一' + g[1] + g[0] + ' ' + pr + ' 元，买 ' + rng.int(12, 30) + ' ' + g[1] + '要多少元？';
      } else {
        var mv = rng.pick(MOVERS), v = rng.int(mv[4][0], mv[4][1]);
        text = mv[0] + (mv[3] === '小时' ? '每小时' : '每分') + '行 ' + v + ' ' + mv[2] + '，' + rng.int(3, 15) + ' ' + mv[3] + '行多少' + mv[2] + '？';
      }
      var ans = [M_ADD, M_PRICE, M_SPEED][kind];
      return {
        type: 'choice', prompt: '这道题用哪种模型来想？\n“' + text + '”',
        data: { options: [M_ADD, M_PRICE, M_SPEED] }, answer: ans,
        hint: '有“比……多/少”“一共”想加法模型；有“每个多少元”“每小时行多少”想乘法模型。',
        explanation: [kind === 0 ? '题目里有“比……多/少”，是部分和总量的关系，用加法模型。' : kind === 1 ? '题目里有单价（一个多少元）和数量，求总价，用“总价 = 单价 × 数量”。' : '题目里有速度（每小时/每分行多少）和时间，求路程，用“路程 = 速度 × 时间”。']
      };
    }
  };

  MI.registerUnit({ id: 'u4', title: '加法模型和乘法模型', cards: cards, skills: skills, generators: G, fixed: [] });
})(typeof window !== 'undefined' ? window : globalThis);

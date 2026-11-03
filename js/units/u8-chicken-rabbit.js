/* 数学广角 · 鸡兔同笼
 * 本文件只放内容：知识卡、知识点、题目生成器。答案都由 MI.chickRabbit 计算。 */
(function (root) {
  'use strict';
  var MI = root.MathIsland = root.MathIsland || {};
  var U = MI.util;

  var cards = [
    {
      id: 'problem', emoji: '🐔', title: '鸡兔同笼问题',
      points: ['笼子里有鸡和兔，知道一共有几个头、几只脚，求鸡和兔各有几只。', '每只鸡 2 只脚，每只兔 4 只脚。'],
      examples: ['从上面数有 8 个头，从下面数有 26 只脚：鸡 3 只，兔 5 只。'],
      pitfall: '头数 = 鸡 + 兔；脚数 = 鸡 × 2 + 兔 × 4。'
    },
    {
      id: 'table', emoji: '📋', title: '列表法',
      points: ['逐一列表：鸡从 0 只开始一个一个试。', '跳跃列表：一次多调几只。', '取中列表：从鸡、兔各一半开始调整。'],
      examples: ['脚数比实际多，说明兔多了，要把兔换成鸡。'],
      pitfall: '每次调整都要同时算兔数和脚数。'
    },
    {
      id: 'assume', emoji: '💭', title: '假设法',
      points: ['假设全是鸡：兔的只数 =（总脚数 − 头数 × 2）÷（4 − 2）。', '假设全是兔：鸡的只数 =（头数 × 4 − 总脚数）÷（4 − 2）。'],
      examples: ['（26 − 8 × 2）÷ 2 = 5（只兔）', '（8 × 4 − 26）÷ 2 = 3（只鸡）'],
      pitfall: '假设全是鸡，先算出来的是兔！'
    },
    {
      id: 'draw', emoji: '✏️', title: '画图法',
      points: ['先每只画 2 只脚，再把多出来的脚两只两只补上。', '补了几次，就有几只兔。'],
      examples: ['8 个头先画 16 只脚，还差 10 只，补 5 次，所以兔有 5 只。'],
      pitfall: '还有抬脚法（拓展）：让每只动物抬起一半的脚。'
    },
    {
      id: 'history', emoji: '📜', title: '《孙子算经》',
      points: ['今有雉兔同笼，上有三十五头，下有九十四足，问雉兔各几何？', '雉就是鸡：雉 23 只，兔 12 只。'],
      examples: ['（94 − 35 × 2）÷ 2 = 12（只兔），35 − 12 = 23（只鸡）'],
      pitfall: '这道题有一千五百多年历史了！'
    },
    {
      id: 'variants', emoji: '🔄', title: '变式',
      points: ['龟鹤问题：龟 4 只脚，鹤 2 只脚。', '租船问题：大船坐 6 人，小船坐 4 人。', '钱币问题：2 元和 5 元。', '答题得分扣分问题（较难）。'],
      examples: ['都可以用假设法：假设全是“小的”，多出来的再一份一份换。'],
      pitfall: '先找清楚：谁相当于“鸡”，谁相当于“兔”，每个差多少。'
    }
  ];

  var skills = [
    { id: 'table', name: '列表法' },
    { id: 'assume', name: '假设法' },
    { id: 'draw', name: '画图法' },
    { id: 'variant', name: '鸡兔同笼的变式' }
  ];

  /** 随机鸡兔：返回 { H, L, c, r } */
  function cage(rng, hMin, hMax) {
    var H = rng.int(hMin, hMax), r = rng.int(1, H - 1), c = H - r;
    return { H: H, L: 2 * c + 4 * r, c: c, r: r };
  }

  var G = {};

  // ① 列表法互动表（基础：头 6～10；提高：头 10～16）
  G.table = {
    skill: 'table', levels: [1, 2], weight: 1.5,
    gen: function (rng, d) {
      var x = cage(rng, d === 1 ? 6 : 10, d === 1 ? 10 : 16);
      var sol = MI.chickRabbit(x.H, x.L);
      return {
        type: 'chickTable', prompt: '笼子里有鸡和兔，一共 ' + x.H + ' 个头、' + x.L + ' 只脚。调整鸡的只数，找出鸡和兔各有几只。（找到后点“确定”）',
        data: { heads: x.H, legs: x.L },
        answer: sol.small,
        answerText: '鸡 ' + sol.small + ' 只，兔 ' + sol.big + ' 只',
        hint: '脚数比实际多，就把兔换成鸡（鸡多一些）；脚数比实际少，就把鸡换成兔。',
        explanation: U.steps(['从鸡、兔各一半开始试（取中列表）', '每把 1 只兔换成鸡，脚少 2 只；每把 1 只鸡换成兔，脚多 2 只', '鸡 ' + sol.small + ' 只、兔 ' + sol.big + ' 只时：' + sol.small + ' × 2 + ' + sol.big + ' × 4 = ' + x.L + ' 只脚，正好'])
      };
    }
  };

  // ② 假设法分步填空（基础/提高：假设全是鸡；提高/挑战：假设全是兔；挑战数更大）
  G.assume = {
    skill: 'assume', levels: [1, 2, 3], weight: 1.5,
    gen: function (rng, d) {
      var x = d === 3 ? cage(rng, 20, 40) : cage(rng, 8, 16);
      var sol = MI.chickRabbit(x.H, x.L);
      var allChick = d === 1 || (d === 2 && rng.chance(0.5)) || (d === 3 && rng.chance(0.4));
      if (allChick) {
        return {
          type: 'fill', prompt: '鸡兔同笼，一共 ' + x.H + ' 个头、' + x.L + ' 只脚。用假设法，一步一步填：',
          data: { template: '假设全是鸡，一共有 [] 只脚\n比实际少了 [] 只脚\n把 1 只鸡换成兔，多 [] 只脚\n兔有 [] 只，鸡有 [] 只' },
          answer: [String(x.H * 2), String(x.L - x.H * 2), '2', String(sol.big), String(sol.small)],
          hint: '假设全是鸡：' + x.H + ' × 2。少了的脚，每 2 只就是 1 只兔。',
          explanation: U.steps(['假设全是鸡：' + x.H + ' × 2 = ' + x.H * 2 + '（只脚）', '比实际少：' + x.L + ' − ' + x.H * 2 + ' = ' + (x.L - x.H * 2) + '（只）', '每只兔比鸡多 4 − 2 = 2 只脚', '兔：' + (x.L - x.H * 2) + ' ÷ 2 = ' + sol.big + '（只）；鸡：' + x.H + ' − ' + sol.big + ' = ' + sol.small + '（只）'])
        };
      }
      return {
        type: 'fill', prompt: '鸡兔同笼，一共 ' + x.H + ' 个头、' + x.L + ' 只脚。用假设法（假设全是兔），一步一步填：',
        data: { template: '假设全是兔，一共有 [] 只脚\n比实际多了 [] 只脚\n把 1 只兔换成鸡，少 [] 只脚\n鸡有 [] 只，兔有 [] 只' },
        answer: [String(x.H * 4), String(x.H * 4 - x.L), '2', String(sol.small), String(sol.big)],
        hint: '假设全是兔：' + x.H + ' × 4。多出来的脚，每 2 只就是 1 只鸡。',
        explanation: U.steps(['假设全是兔：' + x.H + ' × 4 = ' + x.H * 4 + '（只脚）', '比实际多：' + x.H * 4 + ' − ' + x.L + ' = ' + (x.H * 4 - x.L) + '（只）', '每只鸡比兔少 2 只脚', '鸡：' + (x.H * 4 - x.L) + ' ÷ 2 = ' + sol.small + '（只）；兔：' + x.H + ' − ' + sol.small + ' = ' + sol.big + '（只）'])
      };
    }
  };

  // ③ 画图法（头 5～10 个）
  G.draw = {
    skill: 'draw', levels: [1, 2], weight: 1.3,
    gen: function (rng, d) {
      var x = cage(rng, 5, d === 1 ? 8 : 10);
      var sol = MI.chickRabbit(x.H, x.L);
      return {
        type: 'drawLegs', prompt: '鸡兔同笼，一共 ' + x.H + ' 个头、' + x.L + ' 只脚。用画图法找出兔有几只。（脚数对了就点“确定”）',
        data: { heads: x.H, legs: x.L },
        answer: sol.big,
        answerText: '兔 ' + sol.big + ' 只，鸡 ' + sol.small + ' 只',
        hint: '先每只画 2 只脚，一共 ' + x.H * 2 + ' 只；还差的脚两只两只补上。',
        explanation: U.steps(['每只先画 2 只脚：' + x.H + ' × 2 = ' + x.H * 2 + '（只）', '还差 ' + x.L + ' − ' + x.H * 2 + ' = ' + (x.L - x.H * 2) + '（只）', '两只两只补：' + (x.L - x.H * 2) + ' ÷ 2 = ' + sol.big + '，补了 ' + sol.big + ' 只，就有 ' + sol.big + ' 只兔', '鸡：' + x.H + ' − ' + sol.big + ' = ' + sol.small + '（只）'])
      };
    }
  };

  // ④ 变式：龟鹤、租船、钱币
  var VARIANTS = [
    { name: '龟鹤', small: '鹤', big: '龟', a: 2, b: 4, unitS: '只', head: '只', leg: '只脚', text: function (H, L) { return '龟和鹤一共 ' + H + ' 只，一共有 ' + L + ' 只脚。龟和鹤各有几只？'; } },
    { name: '租船', small: '小船', big: '大船', a: 4, b: 6, unitS: '条', head: '条', leg: '人', text: function (H, L) { return '大船每条坐 6 人，小船每条坐 4 人。一共租了 ' + H + ' 条船，正好坐了 ' + L + ' 人。大船和小船各租了几条？'; } },
    { name: '钱币', small: '2 元', big: '5 元', a: 2, b: 5, unitS: '张', head: '张', leg: '元', text: function (H, L) { return '小明有 2 元和 5 元的纸币一共 ' + H + ' 张，合起来是 ' + L + ' 元。两种纸币各有几张？'; } }
  ];
  G.variant = {
    skill: 'variant', levels: [2, 3], weight: 1.4,
    gen: function (rng, d) {
      var v = rng.pick(VARIANTS);
      var H = rng.int(d === 2 ? 8 : 15, d === 2 ? 15 : 30), big = rng.int(1, H - 1), small = H - big;
      var L = small * v.a + big * v.b;
      var sol = MI.chickRabbit(H, L, v.a, v.b);
      var per = v.b - v.a;
      return {
        type: 'fill', prompt: v.text(H, L),
        data: { template: v.big + ' [] ' + v.unitS + '，' + v.small + ' [] ' + v.unitS },
        answer: [String(sol.big), String(sol.small)],
        hint: '把' + v.small + '当成“鸡”，' + v.big + '当成“兔”。假设全是' + v.small + '试试。',
        explanation: U.steps([
          '假设全是' + v.small + '：' + H + ' × ' + v.a + ' = ' + H * v.a + '（' + v.leg + '）',
          '比实际少：' + L + ' − ' + H * v.a + ' = ' + (L - H * v.a) + '（' + v.leg + '）',
          '每把一个' + v.small + '换成' + v.big + '，多 ' + v.b + ' − ' + v.a + ' = ' + per + '（' + v.leg + '）',
          v.big + '：' + (L - H * v.a) + ' ÷ ' + per + ' = ' + sol.big + '（' + v.unitS + '）；' + v.small + '：' + H + ' − ' + sol.big + ' = ' + sol.small + '（' + v.unitS + '）'
        ])
      };
    }
  };

  // ⑤ 《孙子算经》古题（数字固定，答案由代码算）
  G.ancient = {
    skill: 'assume', levels: [2, 3],
    gen: function () {
      var sol = MI.chickRabbit(35, 94);
      return {
        type: 'fill', prompt: '《孙子算经》：“今有雉兔同笼，上有三十五头，下有九十四足，问雉兔各几何？”（雉就是鸡）',
        data: { template: '雉 [] 只，兔 [] 只' }, answer: [String(sol.small), String(sol.big)],
        hint: '上有 35 头：一共 35 只；下有 94 足：一共 94 只脚。',
        explanation: U.steps(['35 个头、94 只脚', '假设全是鸡：35 × 2 = 70，少了 94 − 70 = 24 只脚', '兔：24 ÷ 2 = ' + sol.big + '（只），鸡：35 − ' + sol.big + ' = ' + sol.small + '（只）'])
      };
    }
  };

  // ⑥ 答题得分扣分（拓展，较难）
  G.score = {
    skill: 'variant', levels: [3],
    gen: function (rng) {
      var a = rng.pick([5, 8, 10]), b = rng.pick([2, 3, 5]), N = rng.pick([10, 15, 20]);
      var c;
      do { c = rng.int(Math.ceil(N / 2), N - 1); } while (a * c - b * (N - c) <= 0);
      var S = a * c - b * (N - c);
      var w = (a * N - S) / (a + b);
      return {
        type: 'fill', prompt: '数学竞赛共 ' + N + ' 道题，答对一题得 ' + a + ' 分，答错（或不答）一题扣 ' + b + ' 分。小华得了 ' + S + ' 分，她答对了几题？',
        data: { template: '答对 [] 题' }, answer: String(c),
        hint: '假设全答对，能得多少分？答错一题，不光少得 ' + a + ' 分，还要扣 ' + b + ' 分。',
        explanation: U.steps(['假设全答对：' + N + ' × ' + a + ' = ' + a * N + '（分）', '比实际多：' + a * N + ' − ' + S + ' = ' + (a * N - S) + '（分）', '每答错一题，少得 ' + a + ' + ' + b + ' = ' + (a + b) + '（分）', '答错：' + (a * N - S) + ' ÷ ' + (a + b) + ' = ' + w + '（题），答对：' + N + ' − ' + w + ' = ' + c + '（题）'])
      };
    }
  };

  // ⑦ 公式选择
  G.formula = {
    skill: 'assume', levels: [1, 2, 3],
    gen: function (rng) {
      var x = cage(rng, 8, 20);
      var allChick = rng.chance(0.5);
      var right = allChick ? '（' + x.L + ' − ' + x.H + ' × 2）÷ 2' : '（' + x.H + ' × 4 − ' + x.L + '）÷ 2';
      var opts = ['（' + x.L + ' − ' + x.H + ' × 2）÷ 2', '（' + x.H + ' × 4 − ' + x.L + '）÷ 2', '（' + x.L + ' − ' + x.H + '）÷ 2', x.L + ' ÷ 4'];
      return {
        type: 'choice', prompt: '鸡兔同笼，' + x.H + ' 个头、' + x.L + ' 只脚。求' + (allChick ? '兔' : '鸡') + '的只数，可以用哪个算式？',
        data: { options: rng.shuffle(opts) }, answer: right,
        hint: allChick ? '假设全是鸡，算出来的是兔。' : '假设全是兔，算出来的是鸡。',
        explanation: U.steps([allChick ? '假设全是鸡，少了的脚 ÷ 2 = 兔的只数' : '假设全是兔，多出的脚 ÷ 2 = 鸡的只数', right + ' = ' + (allChick ? x.r : x.c)])
      };
    }
  };

  MI.registerUnit({ id: 'u8', title: '鸡兔同笼', cards: cards, skills: skills, generators: G, fixed: [] });
})(typeof window !== 'undefined' ? window : globalThis);

/* 数学岛 · 单元注册、出题、组卷（纯逻辑，可在 Node 中测试） */
(function (root) {
  'use strict';
  var MI = root.MathIsland = root.MathIsland || {};

  /** 9 座小岛：主题色 + emoji。ready=false 的岛还在建设中。 */
  MI.ISLANDS = [
    { id: 'u1', no: 1, title: '大数的认识', emoji: '🔢', color: '#FF6B4A' },
    { id: 'u2', no: 2, title: '角的度量', emoji: '📐', color: '#7B68EE' },
    { id: 'u3', no: 3, title: '多位数乘两位数', emoji: '✖️', color: '#14A89A' },
    { id: 'u4', no: 4, title: '加法模型和乘法模型', emoji: '🧩', color: '#EE9B1C' },
    { id: 'u5', no: 5, title: '平行四边形和梯形', emoji: '🔷', color: '#3A8EE6' },
    { id: 'u6', no: 6, title: '条形统计图', emoji: '📊', color: '#E5508A' },
    { id: 'u7', no: 7, title: '寻找宝藏', emoji: '🧭', color: '#3FA34D' },
    { id: 'u8', no: 8, title: '鸡兔同笼', emoji: '🐔', color: '#D9692B' },
    { id: 'u9', no: 9, title: '期末大挑战', emoji: '🏆', color: '#C79A12' }
  ];

  MI.DIFFICULTY = { 1: '基础', 2: '提高', 3: '挑战' };

  MI.units = {};

  MI.island = function (id) {
    for (var i = 0; i < MI.ISLANDS.length; i++) if (MI.ISLANDS[i].id === id) return MI.ISLANDS[i];
    return null;
  };

  MI.registerUnit = function (unit) {
    ['id', 'title', 'cards', 'skills', 'generators'].forEach(function (k) {
      if (!unit[k]) throw new Error('单元缺少字段 ' + k + '：' + unit.id);
    });
    unit.fixed = unit.fixed || [];
    Object.keys(unit.generators).forEach(function (gid) {
      var g = unit.generators[gid];
      g.id = gid;
      if (!g.levels) g.levels = [1, 2, 3];
      if (!unit.skills.some(function (s) { return s.id === g.skill; })) {
        throw new Error('生成器 ' + gid + ' 的知识点 ' + g.skill + ' 不在 skills 里');
      }
    });
    MI.units[unit.id] = unit;
    return unit;
  };

  MI.skillName = function (unitId, skillId) {
    var u = MI.units[unitId];
    if (!u) return skillId;
    for (var i = 0; i < u.skills.length; i++) if (u.skills[i].id === skillId) return u.skills[i].name;
    return skillId;
  };

  /**
   * 由 {unit, gen, seed, d} 原样生成一道题。
   * 同样的参数永远得到同样的题（错题本靠这一点重现题目）。
   */
  MI.makeQuestion = function (ref) {
    var u = MI.units[ref.unit];
    if (!u) throw new Error('没有这个单元：' + ref.unit);
    var g = u.generators[ref.gen];
    if (!g) throw new Error('没有这个生成器：' + ref.gen);
    var d = ref.d || 1;
    var rng = MI.makeRng((ref.seed ^ MI.hashStr(ref.gen + '#' + d)) >>> 0);
    var q = g.gen(rng, d, u);
    q.unit = ref.unit;
    q.skill = q.skill || g.skill;
    q.difficulty = d;
    q.gen = { unit: ref.unit, gen: ref.gen, seed: ref.seed >>> 0, d: d };
    q.id = ref.unit + ':' + ref.gen + ':' + d + ':' + (ref.seed >>> 0);
    q.data = q.data || {};
    q.explanation = q.explanation || [];
    q.hint = q.hint || '慢慢读题，把每个条件都用上。';
    return q;
  };

  /** 某个难度下可用的生成器 */
  MI.generatorsFor = function (unitId, d) {
    var u = MI.units[unitId];
    if (!u) return [];
    return Object.keys(u.generators).map(function (k) { return u.generators[k]; })
      .filter(function (g) { return g.levels.indexOf(d) >= 0; });
  };

  /**
   * 组一轮题。difficulties 是每一题的难度列表，比如 [1,1,1…] 或 [1,1,2,3…]。
   * 尽量让知识点轮流出现：先挑出现最少的知识点，再在其中按权重挑生成器。
   */
  MI.buildRound = function (unitIds, difficulties, rng) {
    rng = rng || MI.makeRng(MI.newSeed());
    var skillUse = {}, genUse = {};
    var items = [];
    difficulties.forEach(function (d) {
      var cands = [];
      unitIds.forEach(function (uid) {
        MI.generatorsFor(uid, d).forEach(function (g) { cands.push({ unit: uid, g: g }); });
      });
      if (!cands.length) return;
      var minUse = Infinity;
      cands.forEach(function (c) {
        var k = c.unit + '.' + c.g.skill;
        minUse = Math.min(minUse, skillUse[k] || 0);
      });
      var pool = cands.filter(function (c) { return (skillUse[c.unit + '.' + c.g.skill] || 0) === minUse; });
      // 同一知识点里，少用的生成器优先，再按权重随机
      var minGen = Infinity;
      pool.forEach(function (c) { minGen = Math.min(minGen, genUse[c.g.id] || 0); });
      pool = pool.filter(function (c) { return (genUse[c.g.id] || 0) === minGen; });
      var total = 0;
      pool.forEach(function (c) { total += c.g.weight || 1; });
      var x = rng.next() * total, chosen = pool[pool.length - 1];
      for (var i = 0; i < pool.length; i++) { x -= pool[i].g.weight || 1; if (x < 0) { chosen = pool[i]; break; } }
      skillUse[chosen.unit + '.' + chosen.g.skill] = (skillUse[chosen.unit + '.' + chosen.g.skill] || 0) + 1;
      genUse[chosen.g.id] = (genUse[chosen.g.id] || 0) + 1;
      items.push({ unit: chosen.unit, gen: chosen.g.id, seed: Math.floor(rng.next() * 4294967296) >>> 0, d: d });
    });
    return rng.shuffle(items);
  };

  /** 练一练：10 题同一难度 */
  MI.practiceRound = function (unitId, d, rng) {
    var ds = []; for (var i = 0; i < 10; i++) ds.push(d);
    return MI.buildRound([unitId], ds, rng);
  };

  /** 闯关测验：15 题混合难度（5 基础 + 6 提高 + 4 挑战），由易到难 */
  MI.quizRound = function (unitIds, rng) {
    rng = rng || MI.makeRng(MI.newSeed());
    var plan = [[1, 5], [2, 6], [3, 4]];
    var out = [];
    plan.forEach(function (p) {
      var ds = []; for (var i = 0; i < p[1]; i++) ds.push(p[0]);
      out = out.concat(MI.buildRound(unitIds, ds, rng));
    });
    return out;
  };

  /** 星星规则：≥60% 一星，≥80% 两星，100% 三星 */
  MI.starsFor = function (correct, total) {
    if (!total) return 0;
    var r = correct / total;
    if (correct === total) return 3;
    if (r >= 0.8) return 2;
    if (r >= 0.6) return 1;
    return 0;
  };
})(typeof window !== 'undefined' ? window : globalThis);

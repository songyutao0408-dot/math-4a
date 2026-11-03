/* 数学岛 · 本地存储与学习记录
 * 键名统一前缀 mi4a:。所有读写都包在 try/catch 里；存储不可用时退回内存，照样能做题（只是不保存）。 */
(function (root) {
  'use strict';
  var MI = root.MathIsland = root.MathIsland || {};
  var PREFIX = 'mi4a:';
  var memory = {};
  var available = (function () {
    try {
      var k = PREFIX + '__test';
      root.localStorage.setItem(k, '1');
      root.localStorage.removeItem(k);
      return true;
    } catch (e) { return false; }
  })();

  var store = {
    available: available,
    get: function (key, def) {
      var raw = null;
      try { raw = available ? root.localStorage.getItem(PREFIX + key) : memory[key]; } catch (e) { raw = memory[key]; }
      if (raw == null) return def;
      try { return JSON.parse(raw); } catch (e) { return def; }
    },
    set: function (key, val) {
      var raw = JSON.stringify(val);
      memory[key] = raw;
      try { if (available) root.localStorage.setItem(PREFIX + key, raw); } catch (e) { /* 存满或被禁用：只留在内存里 */ }
    },
    remove: function (key) {
      delete memory[key];
      try { if (available) root.localStorage.removeItem(PREFIX + key); } catch (e) { /* 忽略 */ }
    },
    /** 列出所有本应用的键（导出、清空用） */
    keys: function () {
      var out = [];
      try {
        if (available) {
          for (var i = 0; i < root.localStorage.length; i++) {
            var k = root.localStorage.key(i);
            if (k && k.indexOf(PREFIX) === 0) out.push(k.slice(PREFIX.length));
          }
          return out;
        }
      } catch (e) { /* 忽略 */ }
      return Object.keys(memory);
    }
  };

  // ---------------- 设置 ----------------
  var DEFAULT_SETTINGS = { sound: true, speech: false, font: 'normal' };
  function settings() {
    var s = store.get('settings', {});
    var out = {};
    for (var k in DEFAULT_SETTINGS) out[k] = (s && k in s) ? s[k] : DEFAULT_SETTINGS[k];
    return out;
  }
  function setSetting(k, v) { var s = settings(); s[k] = v; store.set('settings', s); }

  // ---------------- 进度（星星、知识卡、轮次） ----------------
  function progress() { return store.get('progress', { units: {} }); }
  function unitProgress(uid) {
    var p = progress();
    var u = p.units[uid] || {};
    return {
      bestStars: u.bestStars || 0, bestScore: u.bestScore || 0,
      quizCount: u.quizCount || 0, practiceCount: u.practiceCount || 0,
      cardsKnown: u.cardsKnown || {}
    };
  }
  function saveUnit(uid, fn) {
    var p = progress();
    var u = p.units[uid] || {};
    fn(u);
    p.units[uid] = u;
    store.set('progress', p);
  }
  function setCardKnown(uid, cardId, known) {
    saveUnit(uid, function (u) { u.cardsKnown = u.cardsKnown || {}; if (known) u.cardsKnown[cardId] = 1; else delete u.cardsKnown[cardId]; });
  }
  function recordQuiz(uid, correct, total, stars) {
    var isBest = false;
    saveUnit(uid, function (u) {
      u.quizCount = (u.quizCount || 0) + 1;
      var score = Math.round(correct / total * 100);
      if (score > (u.bestScore || 0)) u.bestScore = score;
      if (stars > (u.bestStars || 0)) { u.bestStars = stars; isBest = true; }
    });
    return isBest;
  }
  function recordPractice(uid) { saveUnit(uid, function (u) { u.practiceCount = (u.practiceCount || 0) + 1; }); }

  // ---------------- 答题统计 ----------------
  function stats() { return store.get('stats', { skills: {}, total: { a: 0, c: 0 }, bestStreak: 0 }); }
  /** 记录一次作答（只记第一次作答是否答对） */
  function recordAnswer(q, firstTryCorrect) {
    var s = stats();
    var key = q.unit + '.' + q.skill;
    var k = s.skills[key] || { a: 0, c: 0 };
    k.a++; if (firstTryCorrect) k.c++;
    k.last = Date.now();
    s.skills[key] = k;
    s.total = s.total || { a: 0, c: 0 };
    s.total.a++; if (firstTryCorrect) s.total.c++;
    store.set('stats', s);
    markStudyDay();
  }
  function recordStreak(n) {
    var s = stats();
    if (n > (s.bestStreak || 0)) { s.bestStreak = n; store.set('stats', s); }
  }
  function skillStat(uid, sid) { return stats().skills[uid + '.' + sid] || { a: 0, c: 0 }; }

  // ---------------- 学习天数 ----------------
  function markStudyDay() {
    var days = store.get('days', {});
    var k = MI.util.todayKey();
    days[k] = (days[k] || 0) + 1;
    store.set('days', days);
  }

  // ---------------- 错题本 ----------------
  // 每条：{ ref:{unit,gen,seed,d}, unit, skill, prompt, wrong: 次数, streak: 连续答对次数, at }
  function wrongBook() { return store.get('wrong', {}); }
  function addWrong(q) {
    var w = wrongBook();
    var item = w[q.id] || { ref: q.gen, unit: q.unit, skill: q.skill, prompt: q.prompt, wrong: 0 };
    item.wrong++; item.streak = 0; item.at = Date.now();
    w[q.id] = item;
    store.set('wrong', w);
  }
  /** 错题重练答对：连续答对 2 次自动移出，返回是否已移出 */
  function wrongRight(q) {
    var w = wrongBook();
    var item = w[q.id];
    if (!item) return false;
    item.streak = (item.streak || 0) + 1;
    var removed = item.streak >= 2;
    if (removed) delete w[q.id]; else w[q.id] = item;
    store.set('wrong', w);
    return removed;
  }

  // ---------------- 小岛完成度 ----------------
  /** 完成度 = 知识卡 40% + 练过的知识点 30% + 星星 30% */
  function completion(uid) {
    var unit = MI.units[uid];
    if (!unit) return 0;
    var up = unitProgress(uid);
    var cardsFrac = unit.cards.length ? Object.keys(up.cardsKnown).filter(function (id) {
      return unit.cards.some(function (c) { return c.id === id; });
    }).length / unit.cards.length : 0;
    var st = stats().skills;
    var practiced = unit.skills.filter(function (s) { var k = st[uid + '.' + s.id]; return k && k.c > 0; }).length;
    var skillFrac = unit.skills.length ? practiced / unit.skills.length : 0;
    return Math.round((cardsFrac * 0.4 + skillFrac * 0.3 + up.bestStars / 3 * 0.3) * 100);
  }

  MI.store = store;
  MI.progress = {
    settings: settings, setSetting: setSetting,
    unit: unitProgress, setCardKnown: setCardKnown, recordQuiz: recordQuiz, recordPractice: recordPractice,
    stats: stats, recordAnswer: recordAnswer, recordStreak: recordStreak, skillStat: skillStat,
    wrongBook: wrongBook, addWrong: addWrong, wrongRight: wrongRight,
    completion: completion
  };
})(typeof window !== 'undefined' ? window : globalThis);

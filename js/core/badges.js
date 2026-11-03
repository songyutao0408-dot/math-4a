/* 数学岛 · 徽章：定义和判定（只读学习记录，不碰界面）
 * 每个徽章：{ id, emoji, name, desc, progress() → [当前, 目标] }，当前 ≥ 目标就算得到。 */
(function (root) {
  'use strict';
  var MI = root.MathIsland = root.MathIsland || {};

  function P() { return MI.progress; }
  function stars(uid) { return P().unit(uid).bestStars; }
  function firstTryRight(keys) {
    var st = P().stats().skills, n = 0;
    keys.forEach(function (k) { n += (st[k] || { c: 0 }).c; });
    return n;
  }
  /** 最长连续学习天数（按日期） */
  function longestDays() {
    var days = Object.keys(MI.store.get('days', {})).sort();
    var best = 0, run = 0, prev = null;
    days.forEach(function (d) {
      var t = Date.parse(d + 'T00:00:00');
      run = prev != null && Math.round((t - prev) / 86400000) === 1 ? run + 1 : 1;
      best = Math.max(best, run);
      prev = t;
    });
    return best;
  }
  function totalStars() { var s = 0; MI.ISLANDS.forEach(function (i) { s += stars(i.id); }); return s; }
  function cardsKnown() {
    var n = 0;
    Object.keys(MI.units).forEach(function (uid) { n += Object.keys(P().unit(uid).cardsKnown).length; });
    return n;
  }

  var LIST = [
    { id: 'u1', emoji: '🔢', name: '大数小达人', desc: '“大数的认识”闯关得到 2 颗星', progress: function () { return [stars('u1'), 2]; } },
    { id: 'u2', emoji: '📐', name: '量角高手', desc: '量角、画角题一次答对 10 道', progress: function () { return [firstTryRight(['u2.measure', 'u2.draw']), 10]; } },
    { id: 'u3', emoji: '🧾', name: '竖式不粗心', desc: '竖式乘法一次答对 10 道', progress: function () { return [firstTryRight(['u3.vertical2', 'u3.vertical3']), 10]; } },
    { id: 'u4', emoji: '🧩', name: '模型小专家', desc: '“加法模型和乘法模型”闯关得到 2 颗星', progress: function () { return [stars('u4'), 2]; } },
    { id: 'u5', emoji: '🔷', name: '图形侦探', desc: '“平行四边形和梯形”闯关得到 2 颗星', progress: function () { return [stars('u5'), 2]; } },
    { id: 'u6', emoji: '📊', name: '统计小能手', desc: '“条形统计图”闯关得到 2 颗星', progress: function () { return [stars('u6'), 2]; } },
    { id: 'u7', emoji: '🧭', name: '寻宝小队长', desc: '“寻找宝藏”闯关得到 2 颗星', progress: function () { return [stars('u7'), 2]; } },
    { id: 'u8', emoji: '🐰', name: '鸡兔神算手', desc: '“鸡兔同笼”闯关得到 2 颗星', progress: function () { return [stars('u8'), 2]; } },
    { id: 'u9', emoji: '🏆', name: '期末通关王', desc: '“期末大挑战”闯关得到 2 颗星', progress: function () { return [stars('u9'), 2]; } },
    { id: 'streak5', emoji: '🔥', name: '连对 5 题', desc: '一口气连续答对 5 题', progress: function () { return [P().stats().bestStreak || 0, 5]; } },
    { id: 'streak10', emoji: '⚡', name: '连对 10 题', desc: '一口气连续答对 10 题', progress: function () { return [P().stats().bestStreak || 0, 10]; } },
    { id: 'days3', emoji: '📅', name: '连续学习 3 天', desc: '连续 3 天都来数学岛', progress: function () { return [longestDays(), 3]; } },
    { id: 'days7', emoji: '🌈', name: '坚持一周', desc: '连续 7 天都来数学岛', progress: function () { return [longestDays(), 7]; } },
    { id: 'daily3', emoji: '☀️', name: '每日一练 ×3', desc: '完成 3 次每日一练', progress: function () { return [MI.store.get('dailyCount', 0), 3]; } },
    { id: 'grad5', emoji: '🎓', name: '错题清零者', desc: '让 5 道错题从错题本“毕业”', progress: function () { return [P().stats().graduated || 0, 5]; } },
    { id: 'cards', emoji: '📖', name: '知识卡博士', desc: '一共看懂 30 张知识卡', progress: function () { return [cardsKnown(), 30]; } },
    { id: 'q100', emoji: '💯', name: '百题勇士', desc: '累计做 100 道题', progress: function () { return [(P().stats().total || { a: 0 }).a, 100]; } },
    { id: 'stars15', emoji: '⭐', name: '三星收藏家', desc: '所有小岛一共拿到 15 颗星', progress: function () { return [totalStars(), 15]; } },
    { id: 'blitz15', emoji: '⏱️', name: '口算闪电侠', desc: '60 秒口算挑战答对 15 道', progress: function () { return [MI.store.get('blitz', {}).u3 || 0, 15]; } }
  ];

  function earned(b) { var p = b.progress(); return p[0] >= p[1]; }

  /** 检查新得到的徽章：返回本次新得到的徽章列表，并记下来 */
  function check() {
    var got = MI.store.get('badges', {}), fresh = [];
    LIST.forEach(function (b) {
      if (!got[b.id] && earned(b)) { got[b.id] = MI.util.todayKey(); fresh.push(b); }
    });
    if (fresh.length) MI.store.set('badges', got);
    return fresh;
  }

  MI.badges = { list: LIST, earned: earned, check: check, got: function () { return MI.store.get('badges', {}); }, longestDays: longestDays };
})(typeof window !== 'undefined' ? window : globalThis);

/* 数学岛 · 启动：注册页面、应用设置、休息提醒 */
(function (root) {
  'use strict';
  var MI = root.MathIsland;
  var R = MI.router, P = MI.pages;

  R.add(/^\/$/, P.map);
  R.add(/^\/unit\/(u\d)(?:\/(cards|practice|quiz))?$/, function (app, m) { return P.unit(app, m[0], m[1]); });
  R.add(/^\/play\/(u\d)\/(practice|quiz)(?:\/(\d))?$/, function (app, m) { return P.play(app, m[0], m[1], m[2]); });
  R.add(/^\/blitz\/(u\d)$/, function (app, m) { return P.blitz(app, m[0]); });
  R.add(/^\/settings$/, P.settings);
  R.add(/^\/daily$/, P.soon('每日一练', '📅', '#/daily', '每天 10 道题，优先练错题和还不熟的知识点。这个功能正在制作中。'));
  R.add(/^\/wrong$/, P.soon('错题本', '📒', '#/wrong', '做错的题已经在悄悄记下来了，错题本页面正在制作中。'));
  R.add(/^\/badges$/, P.soon('奖励', '🏅', '#/badges', '“大数小达人”“连对 10 题”……徽章墙正在制作中。'));
  R.add(/^\/parent$/, P.soon('家长页', '👨‍👩‍👧', '#/settings', '学习情况统计、导出数据等功能正在制作中。'));

  MI.applySettings();

  // iOS / 微信里音频要在第一次触摸时解锁
  document.addEventListener('pointerdown', function once() {
    MI.sound.unlock();
    document.removeEventListener('pointerdown', once);
  });

  // 连续使用 25 分钟，温和地提醒休息
  var REST_MS = 25 * 60 * 1000;
  var active = 0, last = Date.now();
  setInterval(function () {
    var now = Date.now();
    if (!document.hidden) active += Math.min(now - last, 60000);
    last = now;
    if (active >= REST_MS && !document.querySelector('.modal-mask')) {
      active = 0;
      MI.ui.modal({
        emoji: '🌿', title: '休息一下吧',
        body: '已经学了 25 分钟啦！站起来伸个懒腰，喝口水，看看远处，眼睛会很开心。',
        buttons: [{ text: '好的，休息一下', primary: true }]
      });
    }
  }, 15000);

  R.start();
})(window);

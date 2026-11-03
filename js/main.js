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
  R.add(/^\/daily(?:\/(go))?$/, function (app, m) { return P.daily(app, m[0]); });
  R.add(/^\/wrong(?:\/(u\d))?$/, function (app, m) { return P.wrong(app, m[0]); });
  R.add(/^\/review(?:\/(u\d))?$/, function (app, m) { return P.review(app, m[0]); });
  R.add(/^\/review-one\/(.+)$/, function (app, m) { return P.review(app, null, m[0]); });
  R.add(/^\/badges$/, P.badges);
  R.add(/^\/parent$/, P.parent);

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

  // PWA：在 http(s) 下注册 Service Worker（本地直接打开文件时跳过）。作用域是 sw.js 所在目录，适配 /仓库名/ 子路径
  if (!window.MathIslandSingleFile && 'serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
    window.addEventListener('load', function () {
      try { navigator.serviceWorker.register('./sw.js', { scope: './' }).catch(function () { /* 离线功能可有可无 */ }); } catch (e) { /* 忽略 */ }
    });
  }
})(window);

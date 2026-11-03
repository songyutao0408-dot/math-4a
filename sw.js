/* 数学岛 · Service Worker：缓存全部资源，离线可用。
 * 作用域是 sw.js 所在目录（GitHub Pages 的 /仓库名/），所有路径都是相对路径。
 * 下面的 VERSION 和 ASSETS 由 `node scripts/bundle.js` 自动更新，不要手改。 */
var VERSION = 'mi4a-4a31c05e7c';
var ASSETS = [
  './',
  'index.html',
  'manifest.json',
  'css/style.css',
  'js/core/base.js',
  'js/core/numbers.js',
  'js/core/check.js',
  'js/core/registry.js',
  'js/core/arith.js',
  'js/core/storage.js',
  'js/core/sound.js',
  'js/core/speech.js',
  'js/core/ui.js',
  'js/core/keypad.js',
  'js/core/types.js',
  'js/core/engine.js',
  'js/core/router.js',
  'js/core/badges.js',
  'js/widgets/drag.js',
  'js/widgets/place-value.js',
  'js/widgets/big-number.js',
  'js/widgets/vertical-mul.js',
  'js/widgets/diagrams.js',
  'js/widgets/geometry.js',
  'js/widgets/charts.js',
  'js/widgets/treasure.js',
  'js/widgets/chick-rabbit.js',
  'js/units/u1-big-numbers.js',
  'js/units/u2-angles.js',
  'js/units/u3-multiply.js',
  'js/units/u4-models.js',
  'js/units/u5-quadrilaterals.js',
  'js/units/u6-bar-charts.js',
  'js/units/u7-treasure.js',
  'js/units/u8-chicken-rabbit.js',
  'js/units/u9-final.js',
  'js/pages/map.js',
  'js/pages/unit.js',
  'js/pages/settings.js',
  'js/pages/blitz.js',
  'js/pages/review.js',
  'js/pages/parent.js',
  'js/main.js',
  'icons/apple-touch-icon.png',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/icon-maskable-512.png'
];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(VERSION).then(function (c) { return c.addAll(ASSETS); }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k.indexOf('mi4a-') === 0 && k !== VERSION; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

// 先用缓存，没有再联网；联网拿到的同源资源顺便存进缓存
self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') return;
  var url = new URL(e.request.url);
  if (url.origin !== self.location.origin) return;
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then(function (hit) {
    if (hit) return hit;
    return fetch(e.request).then(function (res) {
      if (res && res.ok) { var copy = res.clone(); caches.open(VERSION).then(function (c) { c.put(e.request, copy); }); }
      return res;
    }).catch(function () {
      if (e.request.mode === 'navigate') return caches.match('./index.html');
    });
  }));
});

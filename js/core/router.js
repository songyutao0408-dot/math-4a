/* 数学岛 · 路由：用 #/ 哈希，本地直接打开 index.html 也能用 */
(function (root) {
  'use strict';
  var MI = root.MathIsland = root.MathIsland || {};
  var routes = [];
  var current = null, cleanup = null, guard = null, suppress = false;

  function add(pattern, handler) { routes.push({ re: pattern, fn: handler }); }

  function render(hash) {
    var path = hash.replace(/^#/, '') || '/';
    var app = document.getElementById('app');
    if (cleanup) { try { cleanup(); } catch (e) { /* 忽略 */ } cleanup = null; }
    MI.keypad.close();
    guard = null;
    app.innerHTML = '';
    for (var i = 0; i < routes.length; i++) {
      var m = path.match(routes[i].re);
      if (m) {
        var res = routes[i].fn(app, m.slice(1).map(function (x) { return x == null ? undefined : decodeURIComponent(x); }));
        cleanup = typeof res === 'function' ? res : null;
        try { root.scrollTo(0, 0); } catch (e) { /* 忽略 */ }
        var heading = app.querySelector('h1, h2');
        if (heading && heading.textContent) document.title = heading.textContent.trim() + ' · 数学岛';
        return;
      }
    }
    go('#/');
  }

  function onHash() {
    if (suppress) { suppress = false; return; }
    var target = location.hash || '#/';
    if (guard && target !== current) {
      var g = guard;
      suppress = true;
      location.hash = current;
      g(function () { guard = null; location.hash = target; });
      return;
    }
    current = target;
    render(target);
  }

  // “内存路由”：嵌在别的页面里（比如 claude.ai 的预览框）时，不改地址栏的 #，只在页面内部切换
  var memory = !!root.MathIslandMemoryRouter;

  function go(hash) {
    if (memory) {
      if (guard && hash !== current) { var g = guard; g(function () { guard = null; current = hash; render(hash); }); return; }
      current = hash; render(hash); return;
    }
    if (location.hash === hash) { onHash(); return; }
    location.hash = hash;
  }

  MI.router = {
    add: add,
    go: go,
    /** 重新渲染当前页（“再来一轮”） */
    reload: function () { guard = null; render(memory ? current : (location.hash || '#/')); },
    setGuard: function (fn) { guard = fn; },
    start: function () {
      if (memory) {
        // 拦截页面里所有 href="#/..." 的链接
        document.addEventListener('click', function (e) {
          var a = e.target.closest ? e.target.closest('a[href^="#/"]') : null;
          if (!a) return;
          e.preventDefault();
          go(a.getAttribute('href'));
        });
        current = '#/';
        render(current);
        return;
      }
      root.addEventListener('hashchange', onHash);
      onHash();
    },
    current: function () { return current; }
  };
})(typeof window !== 'undefined' ? window : globalThis);

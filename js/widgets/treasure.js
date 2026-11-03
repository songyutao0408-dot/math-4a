/* 数学岛 · 寻找宝藏：方格地图（上北下南、左西右东）
 * 图形 data.figure = { kind:'tmap', cols, rows, start:[x,y], treasure, rocks:[[x,y]...], route:[[x,y]...] }
 * 题型 walk：按指令点方向按钮移动小人。data.map 同上，data.diag 为真时有东北等斜方向；答案 'x,y' */
(function (root) {
  'use strict';
  var MI = root.MathIsland = root.MathIsland || {};
  MI.types = MI.types || {};
  var S = 44;

  var DIRS = { 东: [1, 0], 西: [-1, 0], 南: [0, 1], 北: [0, -1], 东北: [1, -1], 东南: [1, 1], 西北: [-1, -1], 西南: [-1, 1] };

  function svg(tag, a) { return MI.ui.svg(tag, a); }
  function emoji(x, y, ch, cls) {
    var t = svg('text', { x: x * S + S / 2, y: y * S + S / 2 + 1, class: 'tm-emoji ' + (cls || ''), 'text-anchor': 'middle', 'dominant-baseline': 'middle' });
    t.textContent = ch;
    return t;
  }
  /** 画地图，返回 { el, layer }（layer 用来画路线和小人） */
  function drawMap(m) {
    var W = m.cols * S, H = m.rows * S;
    var el = svg('svg', { viewBox: '-4 -4 ' + (W + 8) + ' ' + (H + 8), class: 'figure tmap', role: 'img', 'aria-label': '藏宝图' });
    el.appendChild(svg('rect', { x: 0, y: 0, width: W, height: H, rx: 10, class: 'tm-bg' }));
    for (var x = 1; x < m.cols; x++) el.appendChild(svg('line', { x1: x * S, y1: 0, x2: x * S, y2: H, class: 'tm-grid' }));
    for (var y = 1; y < m.rows; y++) el.appendChild(svg('line', { x1: 0, y1: y * S, x2: W, y2: y * S, class: 'tm-grid' }));
    (m.rocks || []).forEach(function (r) { el.appendChild(emoji(r[0], r[1], '🪨')); });
    if (m.treasure) el.appendChild(emoji(m.treasure[0], m.treasure[1], '💎'));
    var layer = svg('g', {});
    el.appendChild(layer);
    if (m.route) {
      var d = m.route.map(function (p, i) { return (i ? 'L' : 'M') + (p[0] * S + S / 2) + ' ' + (p[1] * S + S / 2); }).join(' ');
      layer.appendChild(svg('path', { d: d, class: 'tm-route' }));
    }
    if (m.start) el.appendChild(emoji(m.start[0], m.start[1], m.startEmoji || '🧒', 'tm-start'));
    // 指北针
    var c = svg('g', { class: 'tm-compass', transform: 'translate(' + (W - 22) + ' 24)' });
    c.appendChild(svg('circle', { r: 17, class: 'tm-compass-bg' }));
    c.appendChild(svg('path', { d: 'M0 -13 L5 2 L0 -1 L-5 2 Z', class: 'tm-needle' }));
    var n = svg('text', { x: 0, y: 11, 'text-anchor': 'middle', class: 'tm-n' }); n.textContent = '北';
    c.appendChild(n);
    el.appendChild(c);
    return { el: el, layer: layer };
  }

  MI.treasure = { DIRS: DIRS, drawMap: drawMap };
  if (MI.geo) MI.geo.figures.tmap = function (f) { return drawMap(f).el; };

  MI.types.walk = function (box, q, ctx) {
    var h = MI.ui.h, m = q.data.map;
    var base = drawMap({ cols: m.cols, rows: m.rows, rocks: m.rocks, treasure: null, start: null });
    var pos = m.start.slice(), path = [m.start.slice()], locked = false;
    var trail = svg('path', { class: 'tm-route walk' });
    var me = emoji(pos[0], pos[1], '🧒', 'tm-me');
    base.layer.appendChild(trail);
    base.el.appendChild(emoji(m.start[0], m.start[1], '🚩', 'tm-flag'));
    base.el.appendChild(me);
    function render() {
      trail.setAttribute('d', path.map(function (p, i) { return (i ? 'L' : 'M') + (p[0] * S + S / 2) + ' ' + (p[1] * S + S / 2); }).join(' '));
      me.setAttribute('x', pos[0] * S + S / 2); me.setAttribute('y', pos[1] * S + S / 2 + 1);
      steps.textContent = path.length > 1 ? '已经走了 ' + (path.length - 1) + ' 步' : '还没出发';
    }
    function go(name) {
      if (locked) return;
      var d = DIRS[name], nx = pos[0] + d[0], ny = pos[1] + d[1];
      if (nx < 0 || ny < 0 || nx >= m.cols || ny >= m.rows) { MI.ui.toast('再走就走出地图啦'); MI.sound.play('wrong'); return; }
      if ((m.rocks || []).some(function (r) { return r[0] === nx && r[1] === ny; })) { MI.ui.toast('这里有大石头，过不去'); MI.sound.play('wrong'); return; }
      MI.sound.play('tap');
      pos = [nx, ny]; path.push(pos.slice());
      render(); ctx.changed();
    }
    function reset() { if (locked) return; pos = m.start.slice(); path = [m.start.slice()]; render(); ctx.changed(); }
    var names = q.data.diag ? ['西北', '北', '东北', '西', '', '东', '西南', '南', '东南'] : ['', '北', '', '西', '', '东', '', '南', ''];
    var pad = h('div', { class: 'dpad' }, names.map(function (nm, i) {
      if (i === 4) return h('button', { type: 'button', class: 'btn btn-small dpad-reset', text: '↺ 重来', onclick: reset });
      if (!nm) return h('span', {});
      var arrow = { 北: '↑', 南: '↓', 东: '→', 西: '←', 东北: '↗', 东南: '↘', 西北: '↖', 西南: '↙' }[nm];
      return h('button', { type: 'button', class: 'btn dpad-btn', 'aria-label': '向' + nm + '走一格', onclick: function () { go(nm); } }, [h('span', { class: 'dpad-arrow', text: arrow }), h('span', { class: 'dpad-name', text: nm })]);
    }));
    var steps = h('p', { class: 'widget-tip center' });
    box.appendChild(h('div', { class: 'figure-wrap' }, base.el));
    box.appendChild(steps);
    box.appendChild(pad);
    render();
    return {
      value: function () { return path.length > 1 ? pos[0] + ',' + pos[1] : null; },
      incomplete: function () { return '先按方向按钮走一走'; },
      onWrong: function () {},
      reveal: function () {
        var t = q.answer.split(',').map(Number);
        base.el.appendChild(emoji(t[0], t[1], '💎', 'tm-target'));
        if (q.data.route) base.layer.appendChild(svg('path', { d: q.data.route.map(function (p, i) { return (i ? 'L' : 'M') + (p[0] * S + S / 2) + ' ' + (p[1] * S + S / 2); }).join(' '), class: 'tm-route answer' }));
      },
      lock: function () { locked = true; pad.querySelectorAll('button').forEach(function (b) { b.disabled = true; }); },
      destroy: function () {}
    };
  };
})(typeof window !== 'undefined' ? window : globalThis);

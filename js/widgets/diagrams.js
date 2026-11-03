/* 数学岛 · 线段图、时间轴、对比表（SVG 现场画）
 * data.diagram 的几种 kind：
 *   parts   { parts:[{value, label}], total:'一共 ? 人' }                   总量 = 部分 + 部分
 *   compare { bars:[{name, value, label}], diff:'少 380 本', total:'一共 ? 本' } 比多比少
 *   repeat  { count, unit:'128 元', countText:'15 个', total:'? 元' }      几个几（乘法）
 *   timeline{ start:分钟数, end:分钟数, startText, endText, label }        开始/结束时刻 */
(function (root) {
  'use strict';
  var MI = root.MathIsland = root.MathIsland || {};
  var W = 340;

  function svg(tag, a) { return MI.ui.svg(tag, a); }
  function text(x, y, s, cls, anchor) {
    var t = svg('text', { x: x, y: y, class: 'dg-text ' + (cls || ''), 'text-anchor': anchor || 'middle' });
    t.textContent = s;
    return t;
  }
  /** 大括号：from x1 到 x2，开口朝 dir（'up' 表示括号在线段上方、尖朝上） */
  function brace(x1, x2, y, dir) {
    var s = dir === 'up' ? -1 : 1, m = (x1 + x2) / 2, d = 7 * s;
    var p = 'M' + x1 + ' ' + y + ' q0 ' + d + ' 7 ' + d + ' L' + (m - 7) + ' ' + (y + d) + ' q7 0 7 ' + d +
      ' q0 ' + (-d) + ' 7 ' + (-d) + ' L' + (x2 - 7) + ' ' + (y + d) + ' q7 0 7 ' + (-d);
    return svg('path', { d: p, class: 'dg-brace' });
  }
  function seg(x1, x2, y, cls) {
    var g = svg('g', { class: 'dg-seg ' + (cls || '') });
    g.appendChild(svg('line', { x1: x1, y1: y, x2: x2, y2: y }));
    g.appendChild(svg('line', { x1: x1, y1: y - 7, x2: x1, y2: y + 7 }));
    g.appendChild(svg('line', { x1: x2, y1: y - 7, x2: x2, y2: y + 7 }));
    return g;
  }
  function wrap(el, h, label) {
    el.setAttribute('viewBox', '0 0 ' + W + ' ' + h);
    el.setAttribute('class', 'diagram');
    el.setAttribute('role', 'img');
    el.setAttribute('aria-label', label || '线段图');
    return MI.ui.h('div', { class: 'diagram-wrap' }, el);
  }

  var kinds = {
    parts: function (d) {
      var el = svg('svg', {}), x0 = 20, x1 = W - 20, y = 62;
      var total = d.parts.reduce(function (s, p) { return s + p.value; }, 0);
      var x = x0;
      d.parts.forEach(function (p, i) {
        var w = (x1 - x0) * p.value / total;
        el.appendChild(seg(x, x + w, y, 'c' + i));
        el.appendChild(text(x + w / 2, y + 30, p.label));
        x += w;
      });
      el.appendChild(brace(x0, x1, y - 12, 'up'));
      el.appendChild(text((x0 + x1) / 2, y - 26, d.total, 'dg-ask'));
      return wrap(el, 104, '线段图：' + d.total);
    },
    compare: function (d) {
      var el = svg('svg', {}), x0 = 70, xr = d.total ? W - 70 : W - 16;
      var max = Math.max.apply(null, d.bars.map(function (b) { return b.value; }));
      var ys = [34, 84];
      d.bars.forEach(function (b, i) {
        var w = (xr - x0) * Math.max(0.25, b.value / max);
        el.appendChild(text(x0 - 10, ys[i] + 6, b.name, 'dg-name', 'end'));
        el.appendChild(seg(x0, x0 + w, ys[i], 'c' + i));
        el.appendChild(text(x0 + w / 2, ys[i] - 12, b.label));
        b._end = x0 + w;
      });
      if (d.diff) {
        var a = d.bars[0]._end, b2 = d.bars[1]._end, lo = Math.min(a, b2), hi = Math.max(a, b2);
        el.appendChild(svg('line', { x1: lo, y1: ys[1] - 22, x2: lo, y2: ys[1] + 8, class: 'dg-dash' }));
        el.appendChild(svg('line', { x1: lo, y1: ys[1], x2: hi, y2: ys[1], class: 'dg-dash' }));
        el.appendChild(brace(lo, hi, ys[1] + 10, 'down'));
        el.appendChild(text((lo + hi) / 2, ys[1] + 36, d.diff, 'dg-ask'));
      }
      if (d.total) {
        var xb = Math.max(d.bars[0]._end, d.bars[1]._end) + 8;
        el.appendChild(svg('path', { d: 'M' + xb + ' ' + (ys[0] - 8) + ' q8 0 8 8 L' + (xb + 8) + ' ' + ((ys[0] + ys[1]) / 2 - 6) + ' q0 6 8 6 q-8 0 -8 6 L' + (xb + 8) + ' ' + (ys[1]) + ' q0 8 -8 8', class: 'dg-brace' }));
        el.appendChild(text(xb + 18, (ys[0] + ys[1]) / 2 + 6, d.total, 'dg-ask', 'start'));
      }
      return wrap(el, d.diff ? 132 : 108, '线段图');
    },
    repeat: function (d) {
      var el = svg('svg', {}), x0 = 20, x1 = W - 20, y = 62;
      var n = d.count, show = n <= 8 ? n : 7;
      var w = (x1 - x0) / show;
      for (var i = 0; i < show; i++) {
        var gap = n > 8 && i === show - 2;
        el.appendChild(seg(x0 + i * w, x0 + (i + 1) * w, y, gap ? 'dg-gap' : ''));
        if (gap) el.appendChild(text(x0 + (i + 0.5) * w, y + 6, '……', 'dg-dots'));
      }
      el.appendChild(text(x0 + w / 2, y - 14, d.unit));
      el.appendChild(brace(x0, x1, y + 12, 'down'));
      el.appendChild(text((x0 + x1) / 2, y + 40, d.countText));
      el.appendChild(text(W / 2, 18, d.total, 'dg-ask'));
      el.appendChild(svg('line', { x1: x0, y1: 26, x2: x1, y2: 26, class: 'dg-dash' }));
      return wrap(el, 112, '线段图');
    },
    timeline: function (d) {
      var el = svg('svg', {}), x0 = 30, x1 = W - 30, y = 56;
      var h0 = Math.floor(d.start / 60), h1 = Math.ceil(d.end / 60);
      var span = Math.max(1, h1 - h0);
      function X(min) { return x0 + (x1 - x0) * (min - h0 * 60) / (span * 60); }
      el.appendChild(svg('line', { x1: x0 - 10, y1: y, x2: x1 + 10, y2: y, class: 'dg-axis' }));
      for (var hh = h0; hh <= h1; hh++) {
        el.appendChild(svg('line', { x1: X(hh * 60), y1: y - 6, x2: X(hh * 60), y2: y + 6, class: 'dg-axis' }));
        if (span <= 12 || hh % 2 === 0) el.appendChild(text(X(hh * 60), y + 24, hh + '时', 'dg-small'));
      }
      [[d.start, d.startText, '出发'], [d.end, d.endText, '到达']].forEach(function (p) {
        el.appendChild(svg('circle', { cx: X(p[0]), cy: y, r: 7, class: 'dg-dot' }));
        el.appendChild(text(X(p[0]), y - 30, p[2] + ' ' + p[1], 'dg-name'));
      });
      el.appendChild(svg('line', { x1: X(d.start), y1: y + 34, x2: X(d.end), y2: y + 34, class: 'dg-arrow' }));
      el.appendChild(text((X(d.start) + X(d.end)) / 2, y + 54, d.label, 'dg-ask'));
      return wrap(el, 120, '时间轴');
    }
  };

  function render(d) {
    var fn = kinds[d.kind];
    if (!fn) throw new Error('没有这种图：' + d.kind);
    return fn(d);
  }

  /** 对比表：{ head:[...], rows:[[...], ...] } */
  function table(t) {
    var h = MI.ui.h;
    return h('div', { class: 'mi-table-wrap' }, h('table', { class: 'mi-table' }, [
      h('thead', {}, h('tr', {}, t.head.map(function (c) { return h('th', { text: c }); }))),
      h('tbody', {}, t.rows.map(function (r) { return h('tr', {}, r.map(function (c, i) { return h(i ? 'td' : 'th', { text: c, class: c === '?' ? 'ask' : null }); })); }))
    ]));
  }

  MI.diagrams = { render: render, table: table, kinds: kinds };
})(typeof window !== 'undefined' ? window : globalThis);

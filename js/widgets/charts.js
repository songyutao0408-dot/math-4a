/* 数学岛 · 条形统计图（SVG 动态生成）
 * 图形 data.figure = { kind:'bars', title, unit, cats:[...], series:[{name, values:[...]}], step, cells, orient:'v'|'h', showValues }
 *   复式条形统计图（两组数据）一定画图例。
 * 题型 barFill：拖动直条高度补全统计图。data.chart 同上，data.missing = [要补的直条序号]；答案 = 这些直条的数值 */
(function (root) {
  'use strict';
  var MI = root.MathIsland = root.MathIsland || {};
  MI.types = MI.types || {};

  function svg(tag, a) { return MI.ui.svg(tag, a); }
  function text(x, y, s, cls, anchor) {
    var t = svg('text', { x: x, y: y, class: 'c-text ' + (cls || ''), 'text-anchor': anchor || 'middle', 'dominant-baseline': 'middle' });
    t.textContent = s;
    return t;
  }

  /**
   * 画统计图。返回 { el, setBar(i, value), plot }，plot 用于把指针位置换算成数值。
   * opts.missing：这些直条先画成虚线框（等孩子拖）
   */
  function chart(c, opts) {
    opts = opts || {};
    var vert = c.orient !== 'h';
    var W = 340, H = vert ? 250 : 40 + c.cats.length * (c.series.length > 1 ? 44 : 34) + 50;
    var el = svg('svg', { viewBox: '0 0 ' + W + ' ' + H, class: 'figure chart', role: 'img', 'aria-label': c.title || '条形统计图' });
    var nS = c.series.length;
    var top = nS > 1 ? 56 : 36, left = vert ? 46 : 70, right = 14, bottom = vert ? 42 : 34;
    var pw = W - left - right, ph = H - top - bottom;
    el.appendChild(text(W / 2, 14, c.title || '', 'c-title'));
    if (nS > 1) {
      // 图例
      var lx = W - right - 150;
      c.series.forEach(function (s, i) {
        el.appendChild(svg('rect', { x: lx + i * 78, y: 30, width: 16, height: 12, rx: 2, class: 'c-bar s' + i }));
        el.appendChild(text(lx + i * 78 + 22, 37, s.name, 'c-legend', 'start'));
      });
      el.appendChild(text(left - 6, 37, '图例：', 'c-small', 'end')).setAttribute('x', lx - 6);
    }
    var cells = c.cells;
    var len = vert ? ph : pw;
    var cell = len / cells;
    // 网格和刻度
    for (var k = 0; k <= cells; k++) {
      if (vert) {
        var y = top + ph - k * cell;
        el.appendChild(svg('line', { x1: left, y1: y, x2: left + pw, y2: y, class: k ? 'c-grid' : 'c-axis' }));
        if (cells <= 10 || k % 2 === 0) el.appendChild(text(left - 6, y, String(k * c.step), 'c-tick', 'end'));
      } else {
        var x = left + k * cell;
        el.appendChild(svg('line', { x1: x, y1: top, x2: x, y2: top + ph, class: k ? 'c-grid' : 'c-axis' }));
        if (cells <= 8 || k % 2 === 0) el.appendChild(text(x, top + ph + 14, String(k * c.step), 'c-tick'));
      }
    }
    if (vert) {
      el.appendChild(svg('line', { x1: left, y1: top - 6, x2: left, y2: top + ph, class: 'c-axis' }));
      el.appendChild(text(left - 4, top - 14, c.unit || '', 'c-small', 'middle'));
    } else {
      el.appendChild(svg('line', { x1: left, y1: top + ph, x2: left + pw + 6, y2: top + ph, class: 'c-axis' }));
      el.appendChild(text(W - right, top + ph + 28, c.unit || '', 'c-small', 'end'));
    }
    var n = c.cats.length, slot = (vert ? pw : ph) / n;
    var bw = Math.min(vert ? 30 : 22, slot * 0.7 / nS);
    var bars = [];
    c.cats.forEach(function (name, i) {
      var center = (vert ? left : top) + slot * (i + 0.5);
      if (vert) el.appendChild(text(center, top + ph + 16, name, 'c-cat'));
      else el.appendChild(text(left - 8, center, name, 'c-cat', 'end'));
      c.series.forEach(function (s, j) {
        var off = (j - (nS - 1) / 2) * bw;
        var idx = j * n + i;
        var r = svg('rect', { class: 'c-bar s' + j, rx: 2 });
        var lab = text(0, 0, '', 'c-val');
        var miss = opts.missing && opts.missing.indexOf(idx) >= 0;
        if (miss) r.setAttribute('class', 'c-bar missing');
        el.appendChild(r); el.appendChild(lab);
        var b = { rect: r, label: lab, center: center + off, idx: idx };
        bars.push(b);
        setBar(b, miss ? 0 : s.values[i], !miss && c.showValues);
      });
    });
    function setBar(b, v, showVal) {
      var size = v / c.step * cell;
      if (vert) {
        b.rect.setAttribute('x', b.center - bw / 2); b.rect.setAttribute('width', bw);
        b.rect.setAttribute('y', top + ph - size); b.rect.setAttribute('height', Math.max(0, size));
        b.label.setAttribute('x', b.center); b.label.setAttribute('y', top + ph - size - 9);
      } else {
        b.rect.setAttribute('y', b.center - bw / 2); b.rect.setAttribute('height', bw);
        b.rect.setAttribute('x', left); b.rect.setAttribute('width', Math.max(0, size));
        b.label.setAttribute('x', left + size + 6); b.label.setAttribute('y', b.center);
        b.label.setAttribute('text-anchor', 'start');
      }
      b.label.textContent = showVal ? String(v) : '';
    }
    return {
      el: el, bars: bars,
      setBar: function (idx, v, showVal) { bars.forEach(function (b) { if (b.idx === idx) setBar(b, v, showVal); }); },
      /** 屏幕坐标 → 数值（按半格或整格吸附） */
      valueAt: function (sx, sy, snap) {
        var m = el.getScreenCTM(); if (!m) return 0;
        var p = el.createSVGPoint(); p.x = sx; p.y = sy;
        var q = p.matrixTransform(m.inverse());
        var cellsFrom0 = vert ? (top + ph - q.y) / cell : (q.x - left) / cell;
        var v = Math.round(cellsFrom0 / snap) * snap * c.step;
        return Math.max(0, Math.min(cells * c.step, v));
      },
      vert: vert
    };
  }

  MI.charts = { chart: chart };
  if (MI.geo) MI.geo.figures.bars = function (f) { return chart(f).el; };

  // ---------------- 题型：拖动直条高度补全统计图 ----------------
  MI.types.barFill = function (box, q, ctx) {
    var h = MI.ui.h, c = q.data.chart, miss = q.data.missing;
    var snap = q.data.snap || 1;
    var ch = chart(c, { missing: miss });
    var vals = miss.map(function () { return 0; }), touched = miss.map(function () { return false; });
    var active = 0, locked = false;
    function nameOf(i) { var idx = miss[i], n = c.cats.length; return (c.series.length > 1 ? c.series[Math.floor(idx / n)].name + '·' : '') + c.cats[idx % n]; }
    function show() {
      miss.forEach(function (idx, i) {
        ch.setBar(idx, vals[i], touched[i]);
        ch.bars.forEach(function (b) { if (b.idx === idx) { b.rect.setAttribute('class', 'c-bar ' + (touched[i] ? 'filled' : 'missing') + (i === active && !locked ? ' active' : '')); } });
      });
      btns.forEach(function (b, i) { b.classList.toggle('on', i === active); b.querySelector('.bf-val').textContent = touched[i] ? vals[i] : '?'; });
    }
    // 指针拖动：在图上按下/拖动，设置当前直条的高度；按在别的待补直条附近就切换过去
    var dragging = false;
    function pick(e) {
      if (miss.length > 1) {
        var m = ch.el.getScreenCTM(); var p = ch.el.createSVGPoint(); p.x = e.clientX; p.y = e.clientY;
        var qq = p.matrixTransform(m.inverse()), best = active, bd = Infinity;
        miss.forEach(function (idx, i) { ch.bars.forEach(function (b) { if (b.idx === idx) { var dd = Math.abs((ch.vert ? qq.x : qq.y) - b.center); if (dd < bd) { bd = dd; best = i; } } }); });
        if (bd < 30) active = best;
      }
    }
    function setFrom(e) {
      vals[active] = ch.valueAt(e.clientX, e.clientY, snap);
      touched[active] = true;
      show(); ctx.changed();
    }
    ch.el.addEventListener('pointerdown', function (e) { if (locked) return; dragging = true; try { ch.el.setPointerCapture(e.pointerId); } catch (er) { /* 忽略 */ } pick(e); setFrom(e); e.preventDefault(); });
    ch.el.addEventListener('pointermove', function (e) { if (dragging && !locked) { setFrom(e); e.preventDefault(); } });
    ch.el.addEventListener('pointerup', function () { dragging = false; MI.sound.play('tap'); });
    ch.el.style.touchAction = 'none';
    var step = c.step * snap;
    var btns = miss.map(function (idx, i) {
      return h('div', { class: 'bf-row' + (i === active ? ' on' : ''), onclick: function () { active = i; show(); } }, [
        h('span', { class: 'bf-name', text: nameOf(i) }),
        h('button', { type: 'button', class: 'btn btn-small', 'aria-label': '减少', text: '−', onclick: function (e) { e.stopPropagation(); if (locked) return; active = i; vals[i] = Math.max(0, vals[i] - step); touched[i] = true; show(); ctx.changed(); MI.sound.play('tap'); } }),
        h('b', { class: 'bf-val', text: '?' }),
        h('button', { type: 'button', class: 'btn btn-small', 'aria-label': '增加', text: '+', onclick: function (e) { e.stopPropagation(); if (locked) return; active = i; vals[i] = Math.min(c.cells * c.step, vals[i] + step); touched[i] = true; show(); ctx.changed(); MI.sound.play('tap'); } })
      ]);
    });
    box.appendChild(h('div', { class: 'figure-wrap' }, ch.el));
    box.appendChild(h('p', { class: 'widget-tip', text: '在图上按住往上拖（横着的图往右拖），直条就会变高；也可以用 − + 按钮。' }));
    box.appendChild(h('div', { class: 'bf-list' }, btns));
    show();
    return {
      value: function () { return touched.every(Boolean) ? vals.slice() : null; },
      incomplete: function () { return '每根虚线直条都要画好哦'; },
      onWrong: function () {},
      hintFor: function () {
        for (var i = 0; i < miss.length; i++) if (vals[i] !== q.answer[i]) return nameOf(i) + '画得不对：每格代表 ' + c.step + '，' + q.answer[i] + ' 应该画 ' + (q.answer[i] / c.step) + ' 格。';
        return null;
      },
      reveal: function () { vals = q.answer.slice(); touched = touched.map(function () { return true; }); locked = true; show(); },
      lock: function () { locked = true; show(); },
      destroy: function () {}
    };
  };
})(typeof window !== 'undefined' ? window : globalThis);

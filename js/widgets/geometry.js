/* 数学岛 · 几何互动组件（SVG）
 * 图形（data.figure，题目里只展示）：protractor 量角器读数、clock 钟面、wedges 三角尺拼角、
 *   split 平角/直角里的两个角、gridLines 方格纸上的两条直线、gridPoint 点到直线的格数
 * 题型：drawAngle 拖动射线画角、sort 拖进筐里分类、pick 在图上点出一条线段/边 */
(function (root) {
  'use strict';
  var MI = root.MathIsland = root.MathIsland || {};
  MI.types = MI.types || {};
  var RAD = Math.PI / 180;

  function svg(tag, a) { return MI.ui.svg(tag, a); }
  function text(x, y, s, cls, anchor) {
    var t = svg('text', { x: x, y: y, class: 'g-text ' + (cls || ''), 'text-anchor': anchor || 'middle', 'dominant-baseline': 'middle' });
    t.textContent = s;
    return t;
  }
  /** 数学角度 φ（逆时针，x 轴正方向为 0）→ 屏幕坐标 */
  function pt(cx, cy, r, phi) { return [cx + r * Math.cos(phi * RAD), cy - r * Math.sin(phi * RAD)]; }
  function line(a, b, cls) { return svg('line', { x1: a[0], y1: a[1], x2: b[0], y2: b[1], class: cls || 'g-line' }); }
  function arcPath(cx, cy, r, from, to) {
    var a = pt(cx, cy, r, from), b = pt(cx, cy, r, to), large = Math.abs(to - from) > 180 ? 1 : 0;
    return 'M' + a[0] + ' ' + a[1] + ' A' + r + ' ' + r + ' 0 ' + large + ' 0 ' + b[0] + ' ' + b[1];
  }
  function wrap(el, w, h, label, cls) {
    el.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
    el.setAttribute('class', 'figure ' + (cls || ''));
    el.setAttribute('role', 'img');
    el.setAttribute('aria-label', label || '图形');
    return el;
  }

  // ---------------- 量角器 ----------------
  /** 在 g 里画一个量角器：外圈 0° 在左边，内圈 0° 在右边 */
  function protractor(g, cx, cy, R) {
    g.appendChild(svg('path', { d: arcPath(cx, cy, R, 0, 180) + ' Z', class: 'pr-body' }));
    for (var d = 0; d <= 180; d++) {
      var len = d % 10 === 0 ? 12 : d % 5 === 0 ? 8 : 4;
      g.appendChild(line(pt(cx, cy, R, d), pt(cx, cy, R - len, d), 'pr-tick' + (d % 10 === 0 ? ' big' : '')));
      if (d % 10 === 0) {
        var o = pt(cx, cy, R - 21, d), i2 = pt(cx, cy, R - 45, d);
        g.appendChild(text(o[0], o[1], String(180 - d), 'pr-out'));
        g.appendChild(text(i2[0], i2[1], String(d), 'pr-in'));
      }
    }
    g.appendChild(svg('path', { d: arcPath(cx, cy, R - 52, 0, 180), class: 'pr-inner' }));
    g.appendChild(line([cx - R, cy], [cx + R, cy], 'pr-base'));
    g.appendChild(svg('circle', { cx: cx, cy: cy, r: 3.5, class: 'pr-center' }));
  }

  var figures = {
    /** { kind:'protractor', deg, base:'right'|'left' } 角叠放在量角器上 */
    protractor: function (f) {
      var W = 340, H = 196, cx = 170, cy = 178, R = 150;
      var el = svg('svg', {});
      protractor(el, cx, cy, R);
      var basePhi = f.base === 'left' ? 180 : 0;
      var other = f.base === 'left' ? 180 - f.deg : f.deg;
      el.appendChild(line([cx, cy], pt(cx, cy, R + 12, basePhi), 'g-ray'));
      el.appendChild(line([cx, cy], pt(cx, cy, R + 12, other), 'g-ray'));
      var lo = Math.min(basePhi, other), hi = Math.max(basePhi, other);
      el.appendChild(svg('path', { d: arcPath(cx, cy, 26, lo, hi), class: 'g-arc' }));
      var mid = pt(cx, cy, 40, (lo + hi) / 2);
      el.appendChild(text(mid[0], mid[1], '∠1', 'g-label'));
      return wrap(el, W, H, '量角器上的角');
    },
    /** { kind:'clock', hour } 整时的钟面 */
    clock: function (f) {
      var el = svg('svg', {}), c = 90, R = 80;
      el.appendChild(svg('circle', { cx: c, cy: c, r: R, class: 'ck-face' }));
      for (var i = 0; i < 60; i++) {
        var big = i % 5 === 0, a = 90 - i * 6;
        el.appendChild(line(pt(c, c, R - 3, a), pt(c, c, R - (big ? 13 : 7), a), big ? 'ck-tick big' : 'ck-tick'));
      }
      for (var n = 1; n <= 12; n++) { var p = pt(c, c, R - 25, 90 - n * 30); el.appendChild(text(p[0], p[1], String(n), 'ck-num')); }
      el.appendChild(line([c, c], pt(c, c, R - 40, 90 - f.hour * 30), 'ck-hour'));
      el.appendChild(line([c, c], pt(c, c, R - 16, 90), 'ck-min'));
      el.appendChild(svg('circle', { cx: c, cy: c, r: 5, class: 'pr-center' }));
      return wrap(el, 180, 180, f.hour + ' 时整的钟面', 'fig-small');
    },
    /** { kind:'wedges', parts:[{deg, label, cls}], mode:'sum'|'diff', ask } 三角尺拼角 */
    wedges: function (f) {
      var el = svg('svg', {}), cx = 40, cy = 170, R = 150;
      var a = f.parts[0].deg, b = f.parts[1].deg;
      function wedge(from, to, cls, r) {
        var p1 = pt(cx, cy, r, from), p2 = pt(cx, cy, r, to);
        el.appendChild(svg('polygon', { points: cx + ',' + cy + ' ' + p1.join(',') + ' ' + p2.join(','), class: 'tri ' + cls }));
      }
      if (f.mode === 'sum') {
        wedge(0, a, 'tri-a', R); wedge(a, a + b, 'tri-b', R * 0.92);
        lab(a / 2, f.parts[0].label); lab(a + b / 2, f.parts[1].label);
        el.appendChild(svg('path', { d: arcPath(cx, cy, 34, 0, a + b), class: 'g-arc ask' }));
        var q = pt(cx, cy, 50, (a + b) / 2 + 8); el.appendChild(text(q[0], q[1], f.ask, 'g-ask'));
      } else {
        var big = Math.max(a, b), small = Math.min(a, b);
        wedge(0, big, 'tri-b', R * 0.92); wedge(0, small, 'tri-a', R);
        lab(small / 2, f.parts[a < b ? 0 : 1].label);
        lab(small + (big - small) / 2 + 4, f.ask, 'g-ask', 0.8);
        var tb = pt(cx, cy, R * 0.78, big + 3); el.appendChild(text(tb[0], tb[1], '大的 ' + f.parts[a < b ? 1 : 0].label, 'g-small', 'start'));
      }
      function lab(phi, s, cls, k) { var p = pt(cx, cy, R * (k || 0.62), phi); el.appendChild(text(p[0], p[1], s, cls || 'g-label')); }
      el.appendChild(svg('circle', { cx: cx, cy: cy, r: 4, class: 'pr-center' }));
      return wrap(el, 300, 190, '三角尺拼角');
    },
    /** { kind:'split', total:180|90, a, labels:['∠1','∠2'], show:['60°','?'] } */
    split: function (f) {
      var el = svg('svg', {}), cx = 170, cy = 150, R = 120;
      if (f.total === 180) el.appendChild(line(pt(cx, cy, R + 20, 180), pt(cx, cy, R + 20, 0), 'g-ray'));
      else { el.appendChild(line([cx - 60, cy], pt(cx - 60, cy, R + 20, 0), 'g-ray')); el.appendChild(line([cx - 60, cy], pt(cx - 60, cy, R, 90), 'g-ray')); cx -= 60; }
      el.appendChild(line([cx, cy], pt(cx, cy, R + 10, f.a), 'g-ray'));
      if (f.total === 90) el.appendChild(svg('path', { d: 'M' + (cx + 14) + ' ' + cy + ' L' + (cx + 14) + ' ' + (cy - 14) + ' L' + cx + ' ' + (cy - 14), class: 'g-right' }));
      el.appendChild(svg('path', { d: arcPath(cx, cy, 30, 0, f.a), class: 'g-arc' }));
      el.appendChild(svg('path', { d: arcPath(cx, cy, 40, f.a, f.total), class: 'g-arc b' }));
      var p1 = pt(cx, cy, 62, f.a / 2), p2 = pt(cx, cy, 70, (f.a + f.total) / 2);
      el.appendChild(text(p1[0], p1[1], f.labels[0] + ' ' + f.show[0], f.show[0] === '?' ? 'g-ask' : 'g-label'));
      el.appendChild(text(p2[0], p2[1], f.labels[1] + ' ' + f.show[1], f.show[1] === '?' ? 'g-ask' : 'g-label'));
      el.appendChild(svg('circle', { cx: cx, cy: cy, r: 4, class: 'pr-center' }));
      return wrap(el, 340, 170, '角的计算');
    },
    /** { kind:'gridLines', cols, rows, lines:[[x1,y1,x2,y2],...] } 方格纸上的直线（坐标是格点） */
    gridLines: function (f) {
      var s = 30, el = svg('svg', {}), W = f.cols * s, H = f.rows * s;
      gridBg(el, f.cols, f.rows, s);
      f.lines.forEach(function (l, i) {
        var c = clip(l, f.cols, f.rows);
        el.appendChild(line([c[0] * s, c[1] * s], [c[2] * s, c[3] * s], 'g-ray c' + i));
        var tx = c[2] * s, ty = c[3] * s;
        el.appendChild(text(Math.min(W - 10, Math.max(10, tx)), Math.min(H - 10, Math.max(10, ty)), ['a', 'b'][i], 'g-name'));
      });
      return wrap(el, W, H, '方格纸上的两条直线', 'fig-grid');
    },
    /** { kind:'gridPoint', cols, rows, line:[x1,y1,x2,y2], point:[x,y] } */
    gridPoint: function (f) {
      var s = 30, el = svg('svg', {});
      gridBg(el, f.cols, f.rows, s);
      el.appendChild(line([f.line[0] * s, f.line[1] * s], [f.line[2] * s, f.line[3] * s], 'g-ray'));
      el.appendChild(svg('circle', { cx: f.point[0] * s, cy: f.point[1] * s, r: 6, class: 'g-point' }));
      el.appendChild(text(f.point[0] * s + 14, f.point[1] * s - 12, 'A', 'g-name'));
      return wrap(el, f.cols * s, f.rows * s, '方格纸上的点和直线', 'fig-grid');
    }
  };

  function gridBg(el, cols, rows, s) {
    for (var x = 0; x <= cols; x++) el.appendChild(line([x * s, 0], [x * s, rows * s], 'g-grid'));
    for (var y = 0; y <= rows; y++) el.appendChild(line([0, y * s], [cols * s, y * s], 'g-grid'));
  }
  /** 把过两个格点的直线延长到方格纸边缘 */
  function clip(l, W, H) {
    var x1 = l[0], y1 = l[1], dx = l[2] - l[0], dy = l[3] - l[1];
    var ts = [];
    if (dx) { ts.push((0 - x1) / dx, (W - x1) / dx); }
    if (dy) { ts.push((0 - y1) / dy, (H - y1) / dy); }
    var pts = ts.map(function (t) { return [x1 + t * dx, y1 + t * dy]; })
      .filter(function (p) { return p[0] >= -1e-9 && p[0] <= W + 1e-9 && p[1] >= -1e-9 && p[1] <= H + 1e-9; });
    pts.sort(function (a, b) { return a[0] - b[0] || a[1] - b[1]; });
    var a = pts[0], b = pts[pts.length - 1];
    return [a[0], a[1], b[0], b[1]];
  }

  function figure(f) {
    var fn = figures[f.kind];
    if (!fn) throw new Error('没有这种图形：' + f.kind);
    return MI.ui.h('div', { class: 'figure-wrap' }, fn(f));
  }

  // ---------------- 小图（分类用的缩略图） ----------------
  /** 角：{ t:'angle', deg, rot, l1, l2 }；四边形：{ t:'poly', pts:[[x,y],...] } */
  function thumb(spec, size) {
    var el = svg('svg', { viewBox: '0 0 100 100', class: 'thumb', 'aria-hidden': 'true' });
    if (spec.t === 'angle') {
      var deg = spec.deg, rot = spec.rot || 0;
      var c = deg >= 180 ? [50, 50] : centerFor(deg, rot);
      var l1 = spec.l1 || 40, l2 = spec.l2 || 40;
      el.appendChild(line(c, pt(c[0], c[1], l1, rot), 'g-ray thick'));
      if (deg < 360) el.appendChild(line(c, pt(c[0], c[1], l2, rot + deg), 'g-ray thick'));
      if (deg === 360) el.appendChild(svg('circle', { cx: c[0], cy: c[1], r: 16, class: 'g-arc thick' }));
      else el.appendChild(svg('path', { d: arcPath(c[0], c[1], 16, rot, rot + deg), class: 'g-arc thick' }));
      if (deg === 90) {
        var a1 = pt(c[0], c[1], 9, rot), a2 = pt(c[0], c[1], 9, rot + 90), a3 = [a1[0] + a2[0] - c[0], a1[1] + a2[1] - c[1]];
        el.appendChild(svg('path', { d: 'M' + a1.join(' ') + ' L' + a3.join(' ') + ' L' + a2.join(' '), class: 'g-right' }));
      }
      el.appendChild(svg('circle', { cx: c[0], cy: c[1], r: 3, class: 'pr-center' }));
    } else {
      el.appendChild(svg('polygon', { points: fitPoly(spec.pts, 100, 10).map(function (p) { return p.join(','); }).join(' '), class: 'g-poly' }));
    }
    if (size) el.setAttribute('width', size);
    return el;
  }
  /** 让角的两条边都尽量留在小图里：顶点放在和角的方向相反的一边 */
  function centerFor(deg, rot) {
    var mid = rot + deg / 2;
    var off = deg > 150 ? 6 : 18;
    var p = pt(50, 50, off, mid + 180);
    return [Math.max(12, Math.min(88, p[0])), Math.max(12, Math.min(88, p[1]))];
  }
  /** 把多边形缩放、平移进 size×size 的框里 */
  function fitPoly(pts, size, pad) {
    var xs = pts.map(function (p) { return p[0]; }), ys = pts.map(function (p) { return p[1]; });
    var minX = Math.min.apply(null, xs), maxX = Math.max.apply(null, xs), minY = Math.min.apply(null, ys), maxY = Math.max.apply(null, ys);
    var k = (size - 2 * pad) / Math.max(maxX - minX, maxY - minY);
    var ox = (size - (maxX - minX) * k) / 2, oy = (size - (maxY - minY) * k) / 2;
    return pts.map(function (p) { return [Math.round(((p[0] - minX) * k + ox) * 10) / 10, Math.round(((p[1] - minY) * k + oy) * 10) / 10]; });
  }

  // ---------------- 题型：拖动射线画角 ----------------
  /** data: { base:'right'|'left', tolerance }；答案是度数 */
  MI.types.drawAngle = function (box, q, ctx) {
    var h = MI.ui.h;
    var W = 340, H = 200, cx = 170, cy = 180, R = 150;
    var el = svg('svg', { viewBox: '0 0 ' + W + ' ' + H, class: 'figure draw-angle', role: 'application', 'aria-label': '拖动射线画角' });
    protractor(el, cx, cy, R);
    var basePhi = q.data.base === 'left' ? 180 : 0;
    el.appendChild(line([cx, cy], pt(cx, cy, R + 14, basePhi), 'g-ray'));
    var phi = basePhi === 0 ? 150 : 30; // 开始时射线放在一个“明显不对”的位置
    var ray = line([cx, cy], pt(cx, cy, R + 14, phi), 'g-ray free');
    var knob = svg('circle', { r: 16, class: 'knob' });
    var answerRay = null, moved = false, locked = false;
    el.appendChild(ray); el.appendChild(knob);
    function measured() { return Math.round(basePhi === 0 ? phi : 180 - phi); }
    function place() {
      var e = pt(cx, cy, R + 14, phi), k = pt(cx, cy, R - 4, phi);
      ray.setAttribute('x2', e[0]); ray.setAttribute('y2', e[1]);
      knob.setAttribute('cx', k[0]); knob.setAttribute('cy', k[1]);
    }
    function fromEvent(e) {
      var m = el.getScreenCTM();
      if (!m) return;
      var p = el.createSVGPoint(); p.x = e.clientX; p.y = e.clientY;
      var s = p.matrixTransform(m.inverse());
      var a = Math.atan2(cy - s.y, s.x - cx) / RAD;
      if (a < 0) a = s.x < cx ? 180 : 0;
      phi = Math.max(0, Math.min(180, Math.round(a)));
      moved = true;
      place();
      ctx.changed();
    }
    var dragging = false;
    el.addEventListener('pointerdown', function (e) { if (locked) return; dragging = true; try { el.setPointerCapture(e.pointerId); } catch (er) { /* 忽略 */ } fromEvent(e); e.preventDefault(); });
    el.addEventListener('pointermove', function (e) { if (dragging && !locked) { fromEvent(e); e.preventDefault(); } });
    el.addEventListener('pointerup', function () { dragging = false; });
    el.addEventListener('pointercancel', function () { dragging = false; });
    el.style.touchAction = 'none';
    // 微调按钮（手指不好拖时用）
    function nudge(dd) { if (locked) return; phi = Math.max(0, Math.min(180, phi + (basePhi === 0 ? dd : -dd))); moved = true; place(); ctx.changed(); MI.sound.play('tap'); }
    place();
    box.appendChild(h('div', { class: 'figure-wrap' }, el));
    box.appendChild(h('div', { class: 'nudge' }, [
      h('button', { type: 'button', class: 'btn btn-small', text: '− 1°', onclick: function () { nudge(-1); } }),
      h('span', { class: 'muted', text: '拖动圆点，或用按钮微调' }),
      h('button', { type: 'button', class: 'btn btn-small', text: '+ 1°', onclick: function () { nudge(1); } })
    ]));
    return {
      value: function () { return moved ? measured() : null; },
      incomplete: function () { return '先拖动圆点，把射线转到要画的度数'; },
      onWrong: function () {},
      reveal: function () {
        var target = basePhi === 0 ? q.answer : 180 - q.answer;
        answerRay = line([cx, cy], pt(cx, cy, R + 14, target), 'g-ray answer');
        el.appendChild(answerRay);
      },
      lock: function () { locked = true; },
      destroy: function () {}
    };
  };

  // ---------------- 题型：拖进筐里分类 ----------------
  /** data: { bins:['锐角',...], items:[spec,...] }；答案：每个小图应进的筐的序号 */
  MI.types.sort = function (box, q, ctx) {
    var h = MI.ui.h;
    var items = q.data.items, bins = q.data.bins;
    var where = items.map(function () { return -1; }), selected = -1, locked = false;
    var pool = h('div', { class: 'sort-pool' });
    var binEls = bins.map(function (name, bi) {
      var drop = h('div', { class: 'sort-drop' });
      var b = h('button', { type: 'button', class: 'sort-bin', 'data-bin': bi, onclick: function (e) { if (e.target.closest('.sort-item')) return; if (selected >= 0) put(selected, bi); } }, [h('span', { class: 'sort-name', text: name }), drop]);
      b._drop = drop;
      return b;
    });
    var itemEls = items.map(function (spec, i) {
      var it = h('button', { type: 'button', class: 'sort-item', 'aria-label': '第 ' + (i + 1) + ' 个图形' }, thumb(spec));
      MI.drag.attach(it, {
        target: '.sort-bin, .sort-pool',
        ghost: function () { var g = h('div', { class: 'sort-item' }, thumb(spec)); return g; },
        onDrop: function (t) { if (locked) return; if (t.classList.contains('sort-pool')) put(i, -1); else put(i, Number(t.getAttribute('data-bin'))); },
        onTap: function () {
          if (locked) return;
          if (where[i] >= 0) { put(i, -1); return; }
          MI.sound.play('tap');
          selected = selected === i ? -1 : i;
          itemEls.forEach(function (x, k) { x.classList.toggle('sel', k === selected); });
        }
      });
      return it;
    });
    function put(i, bi) {
      MI.sound.play('tap');
      where[i] = bi;
      selected = -1;
      render();
      ctx.changed();
    }
    function render() {
      itemEls.forEach(function (it, i) {
        it.classList.remove('sel', 'wrong');
        var host = where[i] >= 0 ? binEls[where[i]]._drop : pool;
        if (it.parentNode !== host) host.appendChild(it);
      });
      pool.classList.toggle('empty', where.every(function (w) { return w >= 0; }));
    }
    box.appendChild(h('p', { class: 'widget-tip', text: '把每个图形拖进对应的筐里（也可以先点图形，再点筐）。点筐里的图形可以拿出来。' }));
    box.appendChild(pool);
    box.appendChild(h('div', { class: 'sort-bins' + (bins.length > 3 ? ' many' : '') }, binEls));
    render();
    return {
      value: function () { return where.some(function (w) { return w < 0; }) ? null : where.slice(); },
      incomplete: function () { return '还有图形没放进筐里哦'; },
      onWrong: function () { itemEls.forEach(function (it, i) { if (where[i] !== q.answer[i]) it.classList.add('wrong'); }); },
      hintFor: function () {
        var i = where.findIndex ? where.findIndex(function (w, k) { return w !== q.answer[k]; }) : -1;
        return i >= 0 && q.data.why ? '标红的那个再看看：' + q.data.why[i] : null;
      },
      reveal: function () { where = q.answer.slice(); render(); itemEls.forEach(function (it) { it.classList.add('revealed'); }); },
      lock: function () { locked = true; },
      destroy: function () {}
    };
  };

  // ---------------- 题型：在图上点出一条线段/边 ----------------
  /** data: { shape:{ pts, segs:[{id, a:[x,y], b:[x,y], label}], dots:[{p, label}] }, w, h }；答案：id（或 id 数组，点中任意一个都对） */
  MI.types.pick = function (box, q, ctx) {
    var h = MI.ui.h, s = q.data.shape;
    var el = svg('svg', { viewBox: '0 0 ' + q.data.w + ' ' + q.data.h, class: 'figure pick-fig', role: 'group', 'aria-label': '点一点图形' });
    if (s.base) el.appendChild(line(s.base[0], s.base[1], 'g-ray'));
    var chosen = null, locked = false, segEls = {};
    s.segs.forEach(function (sg) {
      var g = svg('g', { class: 'pick-seg', tabindex: '0', role: 'button', 'aria-label': sg.label || sg.id });
      g.appendChild(line(sg.a, sg.b, 'pick-hit'));
      g.appendChild(line(sg.a, sg.b, 'pick-line'));
      if (sg.label) {
        var lt = sg.labelT || 0.5;
        var mx = sg.a[0] + (sg.b[0] - sg.a[0]) * lt, my = sg.a[1] + (sg.b[1] - sg.a[1]) * lt;
        var off = sg.labelOff || [10, -10];
        g.appendChild(text(mx + off[0], my + off[1], sg.label, 'g-label'));
      }
      function choose() {
        if (locked) return;
        MI.sound.play('tap');
        chosen = sg.id;
        Object.keys(segEls).forEach(function (k) { segEls[k].classList.toggle('sel', k === chosen); });
        ctx.changed();
      }
      g.addEventListener('click', choose);
      g.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); choose(); } });
      segEls[sg.id] = g;
      el.appendChild(g);
    });
    (s.dots || []).forEach(function (d) {
      el.appendChild(svg('circle', { cx: d.p[0], cy: d.p[1], r: 5, class: 'g-point' }));
      if (d.label) el.appendChild(text(d.p[0] + (d.off ? d.off[0] : 0), d.p[1] + (d.off ? d.off[1] : -14), d.label, 'g-name'));
    });
    box.appendChild(h('div', { class: 'figure-wrap' }, el));
    box.appendChild(h('p', { class: 'widget-tip', text: '直接点图上的线，选中的会变色。' }));
    var answers = Array.isArray(q.answer) ? q.answer : [q.answer];
    return {
      value: function () { return chosen; },
      incomplete: function () { return '先在图上点一条线哦'; },
      onWrong: function (v) { if (segEls[v]) segEls[v].classList.add('tried'); },
      reveal: function () { answers.forEach(function (a) { segEls[a].classList.add('correct'); }); },
      lock: function () { locked = true; },
      destroy: function () {}
    };
  };

  MI.geo = { figure: figure, figures: figures, thumb: thumb, fitPoly: fitPoly, clip: clip };
})(typeof window !== 'undefined' ? window : globalThis);

/* 数学岛 · 大数专用互动：分级线、四舍五入“先点看哪一位”、算盘 */
(function (root) {
  'use strict';
  var MI = root.MathIsland = root.MathIsland || {};
  MI.types = MI.types || {};

  /** 一排大号数字（分级线和四舍五入共用的外观） */
  function digitRow(digits) {
    var h = MI.ui.h;
    var row = h('div', { class: 'digit-row' + (digits.length > 10 ? ' tight' : '') });
    row.style.setProperty('--n', digits.length);
    return row;
  }

  // ---------------- 分级线：点数字之间的空隙 ----------------
  MI.types.split = function (box, q, ctx) {
    var h = MI.ui.h;
    var s = q.data.digits;
    var on = {}, locked = false;
    var row = digitRow(s);
    var gaps = [];
    s.split('').forEach(function (c, i) {
      row.appendChild(h('span', { class: 'dg', text: c }));
      if (i < s.length - 1) {
        var g = h('button', {
          type: 'button', class: 'gap', 'aria-label': '第 ' + (i + 1) + ' 个数字后面', 'aria-pressed': 'false',
          onclick: function () {
            if (locked) return;
            MI.sound.play('tap');
            on[i] = !on[i];
            g.classList.toggle('on', !!on[i]);
            g.setAttribute('aria-pressed', on[i] ? 'true' : 'false');
            g.classList.remove('wrong');
            ctx.changed();
          }
        });
        gaps.push(g);
        row.appendChild(g);
      }
    });
    box.appendChild(row);
    box.appendChild(h('p', { class: 'widget-tip', text: '点两个数字中间，就会画上一条分级线；再点一下可以擦掉。' }));
    function chosen() { return Object.keys(on).filter(function (k) { return on[k]; }).map(Number).sort(function (a, b) { return a - b; }); }
    return {
      value: function () { var c = chosen(); return c.length ? c : null; },
      onWrong: function () {
        gaps.forEach(function (g, i) { if (!!on[i] !== (q.answer.indexOf(i) >= 0)) g.classList.add('wrong'); });
      },
      reveal: function () {
        gaps.forEach(function (g, i) { var a = q.answer.indexOf(i) >= 0; on[i] = a; g.classList.toggle('on', a); g.classList.remove('wrong'); g.classList.add('revealed'); });
      },
      lock: function () { locked = true; gaps.forEach(function (g) { g.disabled = true; }); },
      destroy: function () {}
    };
  };

  // ---------------- 四舍五入：先点“看哪一位”，再填写 ----------------
  MI.types.round = function (box, q, ctx) {
    var h = MI.ui.h, N = MI.num;
    var s = q.data.n, look = q.data.look, unit = q.data.unit;
    var lookIdx = s.length - 1 - look;
    var unitIdx = s.length - 1 - (unit === '亿' ? 8 : 4);
    var row = digitRow(s);
    var step = 1, fill = null, locked = false;
    var tip = h('p', { class: 'widget-tip round-tip', text: '第 1 步：点一点，要看哪一位上的数？' });
    var fillBox = h('div', { class: 'round-fill' });
    var btns = s.split('').map(function (c, i) {
      var b = h('button', {
        type: 'button', class: 'dg dg-btn', text: c, 'aria-label': N.PLACE_NAMES[s.length - 1 - i] + '：' + c,
        onclick: function () { if (!locked && step === 1) pick(i, b); }
      });
      row.appendChild(b);
      if (i === unitIdx) b.classList.add('unit-place');
      return b;
    });
    function pick(i, b) {
      if (i === lookIdx) {
        MI.sound.play('correct');
        markLook();
        goStep2();
      } else {
        MI.sound.play('wrong');
        b.classList.add('shake');
        setTimeout(function () { b.classList.remove('shake'); }, 300);
        tip.textContent = '这是' + N.PLACE_NAMES[s.length - 1 - i] + '。' + q.hint;
        tip.classList.add('warn');
      }
    }
    function markLook() {
      btns.forEach(function (x, i) {
        x.disabled = true;
        if (i === lookIdx) x.classList.add('look');
        else if (i > lookIdx) x.classList.add('tail');
      });
    }
    function goStep2() {
      step = 2;
      var d = Number(s[lookIdx]);
      tip.classList.remove('warn');
      tip.textContent = '看' + N.PLACE_NAMES[look] + '：是 ' + d + '，' + (d >= 5 ? d + ' ≥ 5，要向' + unit + '位进一。' : d + ' < 5，尾数舍去。') + '第 2 步：写出近似数。';
      fill = MI.types.fill(fillBox, q, ctx);
    }
    box.appendChild(h('div', { class: 'round-legend' }, [h('span', { class: 'legend-unit', text: '下划线是' + unit + '位' })]));
    box.appendChild(row);
    box.appendChild(tip);
    box.appendChild(fillBox);
    return {
      value: function () { return fill ? fill.value() : null; },
      incomplete: function () { return step === 1 ? '先点出要看哪一位哦' : '先填上答案哦'; },
      onWrong: function (v) { if (fill) fill.onWrong(v); },
      reveal: function () { if (step === 1) { markLook(); goStep2(); } fill.reveal(); },
      lock: function () { locked = true; if (fill) fill.lock(); btns.forEach(function (b) { b.disabled = true; }); },
      destroy: function () { if (fill) fill.destroy(); }
    };
  };

  // ---------------- 算盘 ----------------
  MI.types.abacus = function (box, q, ctx) {
    var h = MI.ui.h, svg = MI.ui.svg, N = MI.num;
    var s = q.data.digits, n = s.length;
    var W = 300, H = 200, pad = 38, rodGap = (W - pad * 2) / (n - 1 || 1), beamY = 70;
    var el = svg('svg', { viewBox: '0 0 ' + W + ' ' + H, class: 'abacus', role: 'img', 'aria-label': '算盘' });
    el.appendChild(svg('rect', { x: 4, y: 4, width: W - 8, height: H - 8, rx: 12, class: 'ab-frame' }));
    for (var i = 0; i < n; i++) {
      var x = pad + i * rodGap;
      el.appendChild(svg('line', { x1: x, y1: 12, x2: x, y2: H - 12, class: 'ab-rod' }));
    }
    el.appendChild(svg('rect', { x: 8, y: beamY - 4, width: W - 16, height: 8, class: 'ab-beam' }));
    s.split('').forEach(function (c, i) {
      var v = Number(c), x = pad + i * rodGap;
      var upOn = v >= 5, low = v % 5;
      // 上珠：靠梁在 beamY-16，不靠梁在 24
      el.appendChild(bead(x, upOn ? beamY - 17 : 26, upOn));
      // 下珠 4 颗：靠梁的从梁往下排，其余排在底部
      for (var k = 0; k < 4; k++) {
        var on = k < low;
        var y = on ? beamY + 17 + k * 22 : H - 26 - (3 - k) * 22;
        el.appendChild(bead(x, y, on));
      }
      var t = svg('text', { x: x, y: H + 18, class: 'ab-label', 'text-anchor': 'middle' });
      t.textContent = N.PLACE_NAMES[n - 1 - i].replace('位', '');
      el.appendChild(t);
    });
    el.setAttribute('viewBox', '0 0 ' + W + ' ' + (H + 26));
    function bead(x, y, on) { return svg('ellipse', { cx: x, cy: y, rx: Math.min(22, rodGap / 2 - 3), ry: 10, class: 'ab-bead' + (on ? ' on' : '') }); }
    box.appendChild(h('div', { class: 'abacus-wrap' }, el));
    var fill = MI.types.fill(box, q, ctx);
    return fill;
  };
})(typeof window !== 'undefined' ? window : globalThis);

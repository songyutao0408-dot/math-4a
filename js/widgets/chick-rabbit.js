/* 数学岛 · 鸡兔同笼互动
 * chickTable：列表法互动表。孩子调整鸡的只数，表格自动算出兔数和总脚数，直到和实际吻合。答案 = 鸡的只数
 * drawLegs：画图法。先给每只画 2 只脚，再两只两只补上。答案 = 兔的只数 */
(function (root) {
  'use strict';
  var MI = root.MathIsland = root.MathIsland || {};
  MI.types = MI.types || {};

  MI.types.chickTable = function (box, q, ctx) {
    var h = MI.ui.h, D = q.data;
    var H = D.heads, L = D.legs, a = D.a || 2, b = D.b || 4, nA = D.nameA || '鸡', nB = D.nameB || '兔';
    var x = D.startA != null ? D.startA : Math.round(H / 2);
    var tried = [], locked = false;
    var tbody = h('tbody');
    var status = h('p', { class: 'ct-status', 'aria-live': 'polite' });
    var cur = h('b', { class: 'ct-cur' });
    function legsOf(k) { return k * a + (H - k) * b; }
    function render() {
      tbody.innerHTML = '';
      tried.forEach(function (k, i) {
        var l = legsOf(k), ok = l === L;
        tbody.appendChild(h('tr', { class: (i === tried.length - 1 ? 'now ' : '') + (ok ? 'ok' : '') }, [
          h('td', { text: k }), h('td', { text: H - k }), h('td', { text: l }),
          h('td', { class: 'ct-cmp', text: ok ? '✔ 正好' : l > L ? '多 ' + (l - L) : '少 ' + (L - l) })
        ]));
      });
      cur.textContent = x;
      var l2 = legsOf(x);
      status.textContent = l2 === L ? '脚数正好是 ' + L + ' 只！' + nA + ' ' + x + ' 只，' + nB + ' ' + (H - x) + ' 只。' :
        '现在一共 ' + l2 + ' 只脚，比实际' + (l2 > L ? '多 ' + (l2 - L) : '少 ' + (L - l2)) + ' 只。' + (l2 > L ? nA + '要多一些。' : nA + '要少一些。');
      status.classList.toggle('ok', l2 === L);
    }
    function setX(k) {
      if (locked) return;
      x = Math.max(0, Math.min(H, k));
      if (tried[tried.length - 1] !== x) tried.push(x);
      MI.sound.play(legsOf(x) === L ? 'correct' : 'tap');
      render(); ctx.changed();
    }
    var step = H > 20 ? 5 : 2;
    box.appendChild(h('div', { class: 'ct-ctrl' }, [
      h('span', { class: 'ct-label', text: nA + '的只数' }),
      h('button', { type: 'button', class: 'btn btn-small', text: '−' + step, onclick: function () { setX(x - step); } }),
      h('button', { type: 'button', class: 'btn btn-small', text: '−1', onclick: function () { setX(x - 1); } }),
      cur,
      h('button', { type: 'button', class: 'btn btn-small', text: '+1', onclick: function () { setX(x + 1); } }),
      h('button', { type: 'button', class: 'btn btn-small', text: '+' + step, onclick: function () { setX(x + step); } })
    ]));
    box.appendChild(status);
    box.appendChild(h('div', { class: 'mi-table-wrap' }, h('table', { class: 'mi-table ct-table' }, [
      h('thead', {}, h('tr', {}, [nA + '（只）', nB + '（只）', '脚（只）', '和 ' + L + ' 比'].map(function (t) { return h('th', { text: t }); }))),
      tbody
    ])));
    tried.push(x);
    render();
    return {
      value: function () { return x; },
      onWrong: function () {},
      hintFor: function () { var l = legsOf(x); return l === L ? null : '现在脚数是 ' + l + '，和 ' + L + ' 不一样，再调一调' + nA + '的只数。'; },
      reveal: function () { x = q.answer; tried.push(x); render(); },
      lock: function () { locked = true; box.querySelectorAll('.ct-ctrl button').forEach(function (b2) { b2.disabled = true; }); },
      destroy: function () {}
    };
  };

  MI.types.drawLegs = function (box, q, ctx) {
    var h = MI.ui.h, svg = MI.ui.svg, D = q.data;
    var H = D.heads, L = D.legs;
    var four = [], step = 0, locked = false;
    for (var i = 0; i < H; i++) four.push(false);
    var perRow = H <= 6 ? H : Math.ceil(H / 2), rows = Math.ceil(H / perRow);
    var W = 340, cw = W / perRow, rh = 96;
    var el = svg('svg', { viewBox: '0 0 ' + W + ' ' + rows * rh, class: 'figure legs-fig', role: 'group', 'aria-label': '画图法' });
    var animals = [];
    for (var k = 0; k < H; k++) {
      (function (k) {
        var cx = cw * (k % perRow + 0.5), cy = Math.floor(k / perRow) * rh + 30;
        var g = svg('g', { class: 'animal', role: 'button', tabindex: '0', 'aria-label': '第 ' + (k + 1) + ' 只' });
        g.appendChild(svg('rect', { x: cx - cw / 2 + 2, y: cy - 28, width: cw - 4, height: rh - 6, rx: 12, class: 'animal-hit' }));
        g.appendChild(svg('ellipse', { cx: cx, cy: cy + 10, rx: Math.min(20, cw / 2.6), ry: 14, class: 'animal-body' }));
        g.appendChild(svg('circle', { cx: cx, cy: cy - 10, r: 11, class: 'animal-head' }));
        var legs = svg('g', { class: 'legs' });
        g.appendChild(legs);
        g.addEventListener('click', function () { toggle(k); });
        g.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(k); } });
        el.appendChild(g);
        animals.push({ g: g, legs: legs, cx: cx, cy: cy });
      })(k);
    }
    function drawLegsOf(an, n) {
      an.legs.innerHTML = '';
      var xs = n === 4 ? [-13, -5, 5, 13] : [-6, 6];
      xs.slice(0, n).forEach(function (dx, j) {
        an.legs.appendChild(svg('line', { x1: an.cx + dx, y1: an.cy + 20, x2: an.cx + dx, y2: an.cy + 40, class: 'leg' + (n === 4 && (j === 0 || j === 3) ? ' added' : '') }));
      });
    }
    function total() { return step === 0 ? 0 : four.reduce(function (s, f) { return s + (f ? 4 : 2); }, 0); }
    function render() {
      animals.forEach(function (an, k) { drawLegsOf(an, step === 0 ? 0 : four[k] ? 4 : 2); an.g.classList.toggle('rabbit', four[k]); });
      var t = total();
      counter.textContent = step === 0 ? '共 ' + H + ' 个头，还没画脚' : '现在一共 ' + t + ' 只脚，实际有 ' + L + ' 只' + (t === L ? ' ✔' : t < L ? '，还差 ' + (L - t) + ' 只' : '，多了 ' + (t - L) + ' 只');
      counter.classList.toggle('ok', step && t === L);
      firstBtn.hidden = step !== 0;
      tip.textContent = step === 0 ? '第 1 步：先给每个头都画 2 只脚。' : '第 2 步：多出来的脚两只两只补上——点一只动物，给它再加 2 只脚（变成兔）；再点一下可以去掉。';
    }
    function toggle(k) {
      if (locked) return;
      if (step === 0) { MI.ui.toast('先给每只都画 2 只脚'); return; }
      four[k] = !four[k];
      MI.sound.play(total() === L ? 'correct' : 'tap');
      render(); ctx.changed();
    }
    var tip = h('p', { class: 'widget-tip' });
    var counter = h('p', { class: 'ct-status', 'aria-live': 'polite' });
    var firstBtn = h('button', { type: 'button', class: 'btn btn-primary btn-block', text: '每只先画 2 只脚', onclick: function () { if (locked) return; step = 1; MI.sound.play('tap'); render(); ctx.changed(); } });
    box.appendChild(tip);
    box.appendChild(h('div', { class: 'figure-wrap' }, el));
    box.appendChild(counter);
    box.appendChild(firstBtn);
    render();
    return {
      value: function () { return step === 0 ? null : four.filter(Boolean).length; },
      incomplete: function () { return '先给每只画 2 只脚'; },
      onWrong: function () {},
      hintFor: function () { var t = total(); return t === L ? null : '现在是 ' + t + ' 只脚，' + (t < L ? '还差 ' + (L - t) + ' 只，再补 ' + (L - t) / 2 + ' 只兔' : '多了，去掉几只兔的脚'); },
      reveal: function () { step = 1; four = four.map(function (f, k) { return k < q.answer; }); render(); },
      lock: function () { locked = true; firstBtn.disabled = true; },
      destroy: function () {}
    };
  };
})(typeof window !== 'undefined' ? window : globalThis);

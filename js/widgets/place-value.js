/* 数学岛 · 数位顺序表：把数字卡拖进数位格组成数（也可以先点卡片再点格子）
 * 题目 data.levels：显示几级（2 = 万级+个级，3 = 亿级+万级+个级） */
(function (root) {
  'use strict';
  var MI = root.MathIsland = root.MathIsland || {};
  MI.types = MI.types || {};

  MI.types.placeValue = function (box, q, ctx) {
    var h = MI.ui.h, N = MI.num;
    var levels = q.data.levels || 2;
    var cellsN = levels * 4;
    var vals = []; for (var i = 0; i < cellsN; i++) vals.push(''); // 下标 = 数位（0 是个位）
    var selected = null, locked = false;
    var slots = [];

    var table = h('div', { class: 'pv' });
    for (var lv = levels - 1; lv >= 0; lv--) {
      var row = h('div', { class: 'pv-row' });
      for (var pos = 3; pos >= 0; pos--) {
        var p = lv * 4 + pos;
        var slot = h('button', { type: 'button', class: 'pv-slot', 'data-p': p, 'aria-label': N.PLACE_NAMES[p] });
        (function (p, slot) {
          slot.addEventListener('click', function () {
            if (locked) return;
            if (selected != null) { put(p, selected); }
            else if (vals[p] !== '') { vals[p] = ''; render(); ctx.changed(); }
            else MI.ui.toast('先选一张数字卡，再点格子');
          });
        })(p, slot);
        slots[p] = slot;
        row.appendChild(h('div', { class: 'pv-cell' }, [h('div', { class: 'pv-name', text: N.PLACE_NAMES[p] }), slot]));
      }
      table.appendChild(h('div', { class: 'pv-level' }, [h('div', { class: 'pv-label', text: N.LEVEL_LABELS[lv] }), row]));
    }

    var cards = h('div', { class: 'pv-cards' });
    var cardEls = [];
    for (var d = 0; d <= 9; d++) {
      (function (d) {
        var c = h('button', { type: 'button', class: 'pv-card', text: String(d), 'aria-label': '数字卡 ' + d });
        MI.drag.attach(c, {
          target: '.pv-slot',
          ghost: function () { return h('div', { class: 'pv-card', text: String(d) }); },
          onDrop: function (t) { if (!locked) put(Number(t.getAttribute('data-p')), String(d)); },
          onTap: function () {
            if (locked) return;
            MI.sound.play('tap');
            selected = selected === String(d) ? null : String(d);
            cardEls.forEach(function (x, i) { x.classList.toggle('sel', String(i) === selected); });
          }
        });
        cards.appendChild(c);
        cardEls.push(c);
      })(d);
    }

    function put(p, d) {
      MI.sound.play('tap');
      vals[p] = d;
      render();
      ctx.changed();
    }
    function render() {
      slots.forEach(function (s, p) {
        s.textContent = vals[p];
        s.classList.toggle('filled', vals[p] !== '');
        s.classList.remove('wrong');
      });
    }

    box.appendChild(table);
    box.appendChild(h('p', { class: 'widget-tip', text: '拖动数字卡放进格子；也可以先点卡片，再点格子（选中的卡片可以连着放好几格）。没选卡片时，点格子里的数字可以拿走。' }));
    box.appendChild(cards);
    render();

    /** 读出格子里的数：最高的非空格子往下必须都填满 */
    function read() {
      var top = -1;
      for (var p = cellsN - 1; p >= 0; p--) if (vals[p] !== '') { top = p; break; }
      if (top < 0) return null;
      if (vals[top] === '0') return { wrong: '最高位不能是 0 哦。', mark: [top] };
      var gaps = [];
      for (var p2 = top; p2 >= 0; p2--) if (vals[p2] === '') gaps.push(p2);
      if (gaps.length) return { wrong: '中间空着的数位要写 0 占位哦。', mark: gaps };
      var s = '';
      for (var p3 = top; p3 >= 0; p3--) s += vals[p3];
      return s;
    }

    return {
      value: function () {
        var v = read();
        if (v && v.mark) { v.mark.forEach(function (p) { slots[p].classList.add('wrong'); }); }
        return v;
      },
      onWrong: function () {
        var ans = String(q.answer);
        for (var p = 0; p < cellsN; p++) {
          var want = p < ans.length ? ans[ans.length - 1 - p] : '';
          if (vals[p] !== want) slots[p].classList.add('wrong');
        }
      },
      reveal: function () {
        var ans = String(q.answer);
        for (var p = 0; p < cellsN; p++) vals[p] = p < ans.length ? ans[ans.length - 1 - p] : '';
        render();
        slots.forEach(function (s) { s.classList.add('revealed'); });
      },
      lock: function () { locked = true; cardEls.forEach(function (c) { c.disabled = true; }); },
      destroy: function () {}
    };
  };
})(typeof window !== 'undefined' ? window : globalThis);

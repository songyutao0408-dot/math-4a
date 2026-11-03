/* 数学岛 · 通用题型：选择、判断、多选、填空（配数字小键盘）、点选拼读
 * 每个题型：MI.types[type](容器, 题目, ctx) → 控制器
 *   value()      当前作答；没答完返回 null；返回 {wrong:'提示'} 表示明显错误
 *   onWrong(v)   答错后调整界面（比如把选错的选项变灰）
 *   reveal()     显示正确答案
 *   lock()       答题结束，禁止再操作
 *   destroy()    清理
 * ctx: { submit(), changed(), incomplete: '没答完时的提示' } */
(function (root) {
  'use strict';
  var MI = root.MathIsland = root.MathIsland || {};
  MI.types = MI.types || {};
  var h = function () { return MI.ui.h.apply(null, arguments); };

  // ---------------- 选择题 ----------------
  MI.types.choice = function (box, q, ctx) {
    var opts = q.data.options;
    var big = q.data.big || opts.every(function (o) { return String(o).length <= 2; });
    var wide = !big && opts.some(function (o) { return String(o).length > 9; });
    var list = h('div', { class: 'choices' + (big ? ' choices-big' : '') + (wide ? ' choices-wide' : ''), role: 'radiogroup' });
    var selected = null, locked = false;
    var btns = opts.map(function (o, i) {
      var b = h('button', {
        type: 'button', class: 'choice', role: 'radio', 'aria-checked': 'false',
        onclick: function () {
          if (locked || b.disabled) return;
          MI.sound.play('tap');
          selected = o;
          btns.forEach(function (x) { x.classList.remove('sel'); x.setAttribute('aria-checked', 'false'); });
          b.classList.add('sel'); b.setAttribute('aria-checked', 'true');
          ctx.changed();
        }
      }, [big ? null : h('span', { class: 'choice-tag', text: 'ABCDEF'[i] }), h('span', { class: 'choice-text', text: String(o) })]);
      list.appendChild(b);
      return b;
    });
    box.appendChild(list);
    return {
      value: function () { return selected; },
      onWrong: function (v) {
        btns.forEach(function (b, i) { if (opts[i] === v) { b.classList.remove('sel'); b.classList.add('tried'); b.disabled = true; } });
        selected = null;
      },
      reveal: function () { btns.forEach(function (b, i) { if (opts[i] === q.answer) b.classList.add('correct'); }); },
      lock: function () { locked = true; btns.forEach(function (b) { b.disabled = true; }); },
      destroy: function () {}
    };
  };

  // ---------------- 判断题 ----------------
  MI.types.judge = function (box, q, ctx) {
    var list = h('div', { class: 'choices choices-judge', role: 'radiogroup' });
    var selected = null, locked = false;
    var btns = [true, false].map(function (v) {
      var b = h('button', {
        type: 'button', class: 'choice judge-' + (v ? 'yes' : 'no'), role: 'radio', 'aria-checked': 'false',
        onclick: function () {
          if (locked || b.disabled) return;
          MI.sound.play('tap');
          selected = v;
          btns.forEach(function (x) { x.classList.remove('sel'); x.setAttribute('aria-checked', 'false'); });
          b.classList.add('sel'); b.setAttribute('aria-checked', 'true');
          ctx.changed();
        }
      }, [h('span', { class: 'judge-mark', text: v ? '✔' : '✘' }), h('span', { text: v ? '对' : '错' })]);
      list.appendChild(b);
      return b;
    });
    box.appendChild(list);
    return {
      value: function () { return selected; },
      onWrong: function (v) { btns.forEach(function (b, i) { if ([true, false][i] === v) { b.classList.remove('sel'); b.classList.add('tried'); } }); selected = null; },
      reveal: function () { btns[q.answer ? 0 : 1].classList.add('correct'); },
      lock: function () { locked = true; btns.forEach(function (b) { b.disabled = true; }); },
      destroy: function () {}
    };
  };

  // ---------------- 多选（□ 里能填几） ----------------
  MI.types.multi = function (box, q, ctx) {
    var opts = q.data.options;
    var sel = {}, locked = false;
    var grid = h('div', { class: 'multi-grid' });
    var btns = opts.map(function (o) {
      var b = h('button', {
        type: 'button', class: 'multi-btn', 'aria-pressed': 'false', text: String(o),
        onclick: function () {
          if (locked) return;
          MI.sound.play('tap');
          sel[o] = !sel[o];
          b.classList.toggle('sel', !!sel[o]);
          b.setAttribute('aria-pressed', sel[o] ? 'true' : 'false');
          ctx.changed();
        }
      });
      grid.appendChild(b);
      return b;
    });
    box.appendChild(h('p', { class: 'widget-tip', text: '可以选好几个，选好了点“确定”。' }));
    box.appendChild(grid);
    return {
      value: function () {
        var v = opts.filter(function (o) { return sel[o]; });
        return v.length ? v : null;
      },
      onWrong: function () {},
      reveal: function () {
        btns.forEach(function (b, i) {
          var inAns = q.answer.indexOf(opts[i]) >= 0;
          b.classList.toggle('correct', inAns);
          b.classList.toggle('miss', !inAns && !!sel[opts[i]]);
        });
      },
      lock: function () { locked = true; btns.forEach(function (b) { b.disabled = true; }); },
      destroy: function () {}
    };
  };

  // ---------------- 填空（自带数字小键盘） ----------------
  /** 模板里的 [] 表示一个空，\n 换行 */
  MI.types.fill = function (box, q, ctx, opt) {
    opt = opt || {};
    var tpl = q.data.template || '[]';
    var parts = tpl.split('[]');
    var line = h('div', { class: 'fill-line' + (parts.length === 2 && !parts[0].trim() && !parts[1].trim() ? ' fill-solo' : '') });
    var values = [], blanks = [], active = 0, locked = false;
    parts.forEach(function (txt, i) {
      txt.split('\n').forEach(function (seg, j) {
        if (j > 0) line.appendChild(h('span', { class: 'fill-br' }));
        if (seg) line.appendChild(h('span', { class: 'fill-text', text: seg }));
      });
      if (i < parts.length - 1) {
        var idx = blanks.length;
        var b = h('button', {
          type: 'button', class: 'blank', 'aria-label': '第 ' + (idx + 1) + ' 个空',
          onclick: function () { if (!locked) { focus(idx); } }
        });
        values.push('');
        blanks.push(b);
        line.appendChild(b);
      }
    });
    box.appendChild(line);

    function render() {
      blanks.forEach(function (b, i) {
        b.textContent = values[i] || '';
        b.classList.toggle('active', i === active && !locked);
        b.classList.toggle('empty', !values[i]);
      });
    }
    function focus(i) {
      active = i; render();
      try { blanks[i].scrollIntoView({ block: 'nearest', behavior: 'smooth' }); } catch (e) { /* 旧浏览器 */ }
    }
    function onKey(k) {
      if (locked) return;
      var v = values[active];
      blanks[active].classList.remove('wrong');
      if (k === '⌫') values[active] = v.slice(0, -1);
      else if (k === 'clear') values[active] = '';
      else if (k === 'ok') {
        var empty = values.indexOf('');
        if (empty < 0) { ctx.submit(); return; }
        if (values[active] && empty !== active) { focus(empty); return; }
        MI.ui.toast(blanks.length > 1 ? '还有空没填哦' : '先填上答案哦');
        focus(empty);
        return;
      } else if (v.length < 14) values[active] = v + k;
      render();
      ctx.changed();
    }
    var extras = q.data.keys || [];
    MI.keypad.open({ extras: extras, onKey: onKey });
    render();
    // 空格被键盘挡住时，往上滚一点，让它刚好露在键盘上面
    setTimeout(function () {
      var kp = document.getElementById('keypad');
      if (!kp || !blanks[0] || !blanks[0].isConnected) return;
      var over = blanks[active].getBoundingClientRect().bottom - kp.getBoundingClientRect().top + 16;
      if (over > 0) { try { root.scrollBy(0, over); } catch (e) { /* 忽略 */ } }
    }, 50);

    return {
      value: function () {
        if (values.some(function (v) { return !v; })) return null;
        return blanks.length === 1 ? values[0] : values.slice();
      },
      onWrong: function () {
        var ans = Array.isArray(q.answer) ? q.answer : [q.answer];
        blanks.forEach(function (b, i) {
          var o = { tolerance: q.data.tolerance, prefix: q.data.prefix, suffix: q.data.suffix };
          if (!MI.blankEqual(values[i], ans[i], o)) b.classList.add('wrong');
        });
        var firstWrong = blanks.findIndex ? blanks.findIndex(function (b) { return b.classList.contains('wrong'); }) : 0;
        focus(firstWrong >= 0 ? firstWrong : 0);
      },
      reveal: function () {
        var ans = Array.isArray(q.answer) ? q.answer : [q.answer];
        blanks.forEach(function (b, i) { values[i] = String(ans[i]); b.classList.remove('wrong'); b.classList.add('revealed'); });
        locked = true; render();
      },
      lock: function () { locked = true; render(); MI.keypad.close(); },
      destroy: function () { MI.keypad.close(); },
      usesKeypad: true
    };
  };

  // ---------------- 点选拼读 ----------------
  MI.types.reading = function (box, q, ctx) {
    var tiles = q.data.tiles;
    var picked = [], locked = false;
    var lineBox = h('div', { class: 'read-line', 'aria-live': 'polite' });
    var pool = h('div', { class: 'tile-pool' });
    var btns = tiles.map(function (t, i) {
      var b = h('button', {
        type: 'button', class: 'tile', text: t,
        onclick: function () {
          if (locked || b.disabled) return;
          MI.sound.play('tap');
          picked.push(i); b.disabled = true; b.classList.add('used');
          render(); ctx.changed();
        }
      });
      pool.appendChild(b);
      return b;
    });
    var tools = h('div', { class: 'read-tools' }, [
      h('button', { type: 'button', class: 'btn btn-small', text: '↩ 撤销', onclick: function () { if (locked || !picked.length) return; var i = picked.pop(); btns[i].disabled = false; btns[i].classList.remove('used'); render(); ctx.changed(); } }),
      h('button', { type: 'button', class: 'btn btn-small', text: '清空', onclick: function () { if (locked) return; picked.forEach(function (i) { btns[i].disabled = false; btns[i].classList.remove('used'); }); picked = []; render(); ctx.changed(); } })
    ]);
    function render() {
      lineBox.innerHTML = '';
      lineBox.classList.remove('wrong');
      if (!picked.length) lineBox.appendChild(h('span', { class: 'read-ph', text: '点下面的字块，读法会出现在这里' }));
      picked.forEach(function (i) {
        lineBox.appendChild(h('span', { class: 'read-chip', text: tiles[i] }));
      });
    }
    box.appendChild(lineBox);
    box.appendChild(tools);
    box.appendChild(pool);
    render();
    return {
      value: function () { return picked.length ? picked.map(function (i) { return tiles[i]; }).join('') : null; },
      onWrong: function () { lineBox.classList.add('wrong'); },
      reveal: function () {
        lineBox.innerHTML = '';
        lineBox.appendChild(h('span', { class: 'read-answer', text: q.answer }));
        lineBox.classList.add('revealed');
      },
      lock: function () { locked = true; btns.forEach(function (b) { b.disabled = true; }); },
      destroy: function () {}
    };
  };
})(typeof window !== 'undefined' ? window : globalThis);

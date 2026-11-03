/* 数学岛 · 竖式乘法网格：逐格填写部分积和最终积，有进位小格；“检查这一步”只高亮错的那一格并给提示
 * 题目 data：{ a, b }；答案：每一行的字符串（MI.mul.rowString），由 MI.mul.layout 计算 */
(function (root) {
  'use strict';
  var MI = root.MathIsland = root.MathIsland || {};
  MI.types = MI.types || {};

  var STEP_TEXT = {
    p1: function (row, L) { return '用第二个因数个位上的 ' + row.m + ' 去乘 ' + L.coreA + '。'; },
    p2: function (row, L) { return '用十位上的 ' + row.m + ' 去乘 ' + L.coreA + '，末位和十位对齐。'; },
    sum: function (row, L) { return '把两次乘得的积加起来' + (L.z ? '，再在末尾添 ' + L.z + ' 个 0' : '') + '。'; },
    final: function (row, L) { return '用 ' + row.m + ' 去乘 ' + L.coreA + (L.z ? '，再在末尾添 ' + L.z + ' 个 0' : '') + '。'; }
  };

  MI.types.vmul = function (box, q, ctx) {
    var h = MI.ui.h;
    var L = MI.mul.layout(q.data.a, q.data.b);
    var W = L.width, R = L.rows.length;
    var vals = [], carries = [], cells = [], carryCells = [], rowEls = [];
    var act = { r: 0, c: L.rows[0].start, carry: false };
    var stepR = 0, locked = false;

    var grid = h('div', { class: 'vm', style: { '--w': W } });
    function staticRow(text, end, sign) {
      var row = h('div', { class: 'vm-row vm-static' });
      for (var c = W - 1; c >= 0; c--) {
        var k = c - end, ch = k >= 0 && k < text.length ? text[text.length - 1 - k] : '';
        if (sign && c === end + text.length) ch = '×';
        row.appendChild(h('span', { class: 'vm-fixed' + (ch === '×' ? ' vm-sign' : ''), text: ch }));
      }
      return row;
    }
    grid.appendChild(staticRow(L.top.text, L.top.end));
    grid.appendChild(staticRow(L.bottom.text, L.bottom.end, true));
    grid.appendChild(h('div', { class: 'vm-line' }));
    L.rows.forEach(function (row, r) {
      if (row.kind === 'sum') grid.appendChild(h('div', { class: 'vm-line' }));
      vals.push([]); carries.push([]); cells.push([]); carryCells.push([]);
      var cr = h('div', { class: 'vm-row vm-carry-row' });
      var dr = h('div', { class: 'vm-row vm-input-row' });
      for (var c = W - 1; c >= 0; c--) {
        vals[r][c] = ''; carries[r][c] = '';
        (function (r, c) {
          var cc = h('button', { type: 'button', class: 'vm-carry', 'aria-label': '进位小格', onclick: function () { focus(r, c, true); } });
          var dc = h('button', { type: 'button', class: 'vm-cell', 'aria-label': '第 ' + (r + 1) + ' 行，从右数第 ' + (c + 1) + ' 格', onclick: function () { focus(r, c, false); } });
          carryCells[r][c] = cc; cells[r][c] = dc;
          cr.appendChild(cc); dr.appendChild(dc);
        })(r, c);
      }
      grid.appendChild(cr);
      grid.appendChild(dr);
      rowEls.push(dr);
    });

    var tip = h('p', { class: 'widget-tip vm-tip' });
    var checkBtn = h('button', { type: 'button', class: 'btn btn-small vm-check', text: '✔ 检查这一步', onclick: checkStep });
    // 提示和“检查这一步”放在竖式上面，不会被键盘挡住
    box.appendChild(h('div', { class: 'vm-tools' }, [tip, checkBtn]));
    box.appendChild(h('div', { class: 'vm-wrap' }, grid));
    box.appendChild(h('p', { class: 'widget-tip', text: '点格子再按数字，写完自动往左移。每格上面的小格可以记进位（不算分）。' }));

    function setTip(text, warn) { tip.textContent = text; tip.classList.toggle('warn', !!warn); }
    function stepTip() {
      if (stepR >= R) { setTip('都写好了，按“确定”交卷吧！'); return; }
      var row = L.rows[stepR];
      setTip('第 ' + (stepR + 1) + ' 步：' + STEP_TEXT[row.kind](row, L));
    }

    function render() {
      for (var r = 0; r < R; r++) for (var c = 0; c < W; c++) {
        var d = cells[r][c], k = carryCells[r][c];
        d.textContent = vals[r][c]; k.textContent = carries[r][c];
        d.classList.toggle('active', !locked && act.r === r && act.c === c && !act.carry);
        k.classList.toggle('active', !locked && act.r === r && act.c === c && act.carry);
      }
    }
    function focus(r, c, carry) {
      if (locked) return;
      act = { r: r, c: c, carry: !!carry };
      render();
    }
    /** 当前这一行被键盘挡住时，往上滚一点 */
    function reveal(r) {
      var kp = document.getElementById('keypad');
      if (!kp || kp.hidden) return;
      var over = rowEls[r].getBoundingClientRect().bottom - kp.getBoundingClientRect().top + 12;
      if (over > 0) { try { root.scrollBy({ top: over, behavior: MI.ui.reducedMotion() ? 'auto' : 'smooth' }); } catch (e) { root.scrollBy(0, over); } }
    }
    function clearMarks(r) {
      for (var c = 0; c < W; c++) cells[r][c].classList.remove('wrong');
    }
    function onKey(k) {
      if (locked) return;
      var r = act.r, c = act.c;
      clearMarks(r);
      if (k === 'ok') { ctx.submit(); return; }
      if (k === 'clear') { for (var i = 0; i < W; i++) { vals[r][i] = ''; carries[r][i] = ''; } act.c = L.rows[r].start; act.carry = false; render(); return; }
      if (k === '⌫') {
        if (act.carry) carries[r][c] = '';
        else if (vals[r][c] !== '') vals[r][c] = '';
        else if (c > 0) { act.c = c - 1; vals[r][c - 1] = ''; }
        render(); return;
      }
      if (!/^\d$/.test(k)) return;
      if (act.carry) { carries[r][c] = k; act.carry = false; }
      else {
        vals[r][c] = k;
        if (c + 1 < W) act.c = c + 1;
        reveal(r);
      }
      rowEls[r].classList.remove('ok');
      render();
    }

    function expected(r, c) { return L.rows[r].cols[c]; }
    function firstWrong(r) {
      for (var c = 0; c < W; c++) if (vals[r][c] !== expected(r, c)) return c;
      return -1;
    }
    function rowEmpty(r) { for (var c = 0; c < W; c++) if (vals[r][c] !== '') return false; return true; }

    function checkStep() {
      if (locked) return;
      var r = act.r;
      if (rowEmpty(r)) { MI.ui.toast('先把这一行写上吧'); return; }
      var c = firstWrong(r);
      if (c >= 0) {
        MI.sound.play('wrong');
        cells[r][c].classList.add('wrong');
        setTip('这一格再看看：' + MI.mul.cellHint(L, r, c), true);
        act = { r: r, c: c, carry: false };
        render();
        return;
      }
      MI.sound.play('correct');
      rowEls[r].classList.add('ok');
      if (r + 1 < R) {
        stepR = Math.max(stepR, r + 1);
        act = { r: r + 1, c: L.rows[r + 1].start, carry: false };
        stepTip();
        tip.textContent = '这一步全对！' + tip.textContent;
        setTimeout(function () { reveal(r + 1); }, 30);
      } else { stepR = R; setTip('全部写对了，按“确定”交卷吧！'); }
      render();
    }

    MI.keypad.open({ extras: [], onKey: onKey });
    stepTip();
    render();
    setTimeout(function () { reveal(0); }, 50);

    function value() {
      for (var r = 0; r < R; r++) if (rowEmpty(r)) return null;
      return vals.map(function (row) { return MI.mul.rowString(row); });
    }
    return {
      value: value,
      incomplete: function () { return '每一行都要写哦'; },
      hintFor: function () {
        for (var r = 0; r < R; r++) { var c = firstWrong(r); if (c >= 0) return '第 ' + (r + 1) + ' 行有一格不对：' + MI.mul.cellHint(L, r, c); }
        return null;
      },
      onWrong: function () {
        for (var r = 0; r < R; r++) { var c = firstWrong(r); if (c >= 0) { cells[r][c].classList.add('wrong'); act = { r: r, c: c, carry: false }; render(); return; } }
      },
      reveal: function () {
        for (var r = 0; r < R; r++) { for (var c = 0; c < W; c++) { vals[r][c] = expected(r, c); cells[r][c].classList.remove('wrong'); } rowEls[r].classList.add('ok'); }
        locked = true; render(); setTip('');
      },
      lock: function () { locked = true; render(); checkBtn.disabled = true; MI.keypad.close(); },
      destroy: function () { MI.keypad.close(); },
      usesKeypad: true
    };
  };
})(typeof window !== 'undefined' ? window : globalThis);

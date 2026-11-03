/* 数学岛 · 自带数字小键盘（不弹系统键盘，避免遮挡题目）
 * MI.keypad.open({ extras: ['≈','=','万','亿','°'], onKey: fn(key) })
 * key 为 '0'~'9'、'⌫'、'clear'、'ok' 或附加符号 */
(function (root) {
  'use strict';
  var MI = root.MathIsland = root.MathIsland || {};
  var el = null, handler = null;

  function build() {
    var h = MI.ui.h;
    el = h('div', { class: 'keypad', id: 'keypad', 'aria-label': '数字键盘', hidden: true });
    el.appendChild(h('div', { class: 'kp-extras' }));
    var grid = h('div', { class: 'kp-grid' });
    var layout = ['1', '2', '3', '⌫', '4', '5', '6', 'ok', '7', '8', '9', 'clear', '0'];
    layout.forEach(function (k) {
      var label = k === 'ok' ? '确定' : k === 'clear' ? '清空' : k;
      var cls = 'kp-key' + (k === 'ok' ? ' kp-ok' : k === '⌫' ? ' kp-del' : k === 'clear' ? ' kp-clear' : '') + (k === '0' ? ' kp-zero' : '');
      grid.appendChild(h('button', { type: 'button', class: cls, 'data-key': k, 'aria-label': k === '⌫' ? '退格' : label, text: label }));
    });
    el.appendChild(grid);
    // pointerdown 比 click 更跟手；同时阻止默认行为，避免页面失焦/双击放大
    el.addEventListener('pointerdown', function (e) {
      var b = e.target.closest ? e.target.closest('[data-key]') : null;
      if (!b) return;
      e.preventDefault();
      b.classList.add('pressed');
      setTimeout(function () { b.classList.remove('pressed'); }, 120);
      MI.sound.play('tap');
      if (handler) handler(b.getAttribute('data-key'));
    });
    // 键盘（电脑上）也能用
    document.addEventListener('keydown', function (e) {
      if (!handler || el.hidden) return;
      if (document.querySelector('.modal-mask')) return;
      var k = e.key;
      if (/^[0-9]$/.test(k)) handler(k);
      else if (k === 'Backspace') handler('⌫');
      else if (k === 'Enter') handler('ok');
      else return;
      e.preventDefault();
    });
    document.body.appendChild(el);
  }

  function open(opts) {
    if (!el) build();
    handler = opts.onKey;
    var ex = el.querySelector('.kp-extras');
    ex.innerHTML = '';
    (opts.extras || []).forEach(function (k) {
      ex.appendChild(MI.ui.h('button', { type: 'button', class: 'kp-key kp-sym', 'data-key': k, text: k }));
    });
    ex.hidden = !(opts.extras && opts.extras.length);
    el.hidden = false;
    document.body.classList.add('has-keypad');
    // 记下键盘高度，页面底部留出同样的空间，题目不会被挡住
    document.body.style.setProperty('--kp-h', el.offsetHeight + 'px');
  }

  function close() {
    if (!el) return;
    el.hidden = true;
    handler = null;
    document.body.classList.remove('has-keypad');
    document.body.style.setProperty('--kp-h', '0px');
  }

  MI.keypad = { open: open, close: close, isOpen: function () { return !!el && !el.hidden; } };
})(typeof window !== 'undefined' ? window : globalThis);

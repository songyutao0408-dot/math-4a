/* 数学岛 · 界面小工具：建元素、弹窗、轻提示、庆祝动画、鼓励语 */
(function (root) {
  'use strict';
  var MI = root.MathIsland = root.MathIsland || {};

  /** h('div', {class:'x', onclick: fn}, [children]) */
  function h(tag, props, children) {
    var el = document.createElement(tag);
    if (props) {
      for (var k in props) {
        var v = props[k];
        if (v == null || v === false) continue;
        if (k === 'class') el.className = v;
        else if (k === 'text') el.textContent = v;
        else if (k === 'html') el.innerHTML = v;
        else if (k === 'style' && typeof v === 'object') { for (var s in v) el.style.setProperty(s, v[s]); }
        else if (k.indexOf('on') === 0 && typeof v === 'function') el.addEventListener(k.slice(2), v);
        else el.setAttribute(k, v === true ? '' : v);
      }
    }
    append(el, children);
    return el;
  }
  function append(el, children) {
    if (children == null) return;
    if (!Array.isArray(children)) children = [children];
    children.forEach(function (c) {
      if (c == null || c === false) return;
      el.appendChild(typeof c === 'string' || typeof c === 'number' ? document.createTextNode(String(c)) : c);
    });
  }

  function svg(tag, attrs) {
    var el = document.createElementNS('http://www.w3.org/2000/svg', tag);
    for (var k in attrs || {}) el.setAttribute(k, attrs[k]);
    return el;
  }

  /** 轻提示 */
  var toastTimer = null;
  function toast(msg) {
    var t = document.getElementById('mi-toast');
    if (!t) { t = h('div', { id: 'mi-toast', class: 'toast', role: 'status', 'aria-live': 'polite' }); document.body.appendChild(t); }
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove('show'); }, 1800);
  }

  /** 弹窗：{title, body, emoji, buttons:[{text, primary, onClick}]} */
  function modal(opts) {
    var mask = h('div', { class: 'modal-mask' });
    var box = h('div', { class: 'modal', role: 'dialog', 'aria-modal': 'true' });
    function close() { mask.classList.add('closing'); setTimeout(function () { if (mask.parentNode) mask.parentNode.removeChild(mask); }, 160); }
    if (opts.emoji) box.appendChild(h('div', { class: 'modal-emoji', text: opts.emoji }));
    if (opts.title) box.appendChild(h('h2', { class: 'modal-title', text: opts.title }));
    if (opts.body) box.appendChild(typeof opts.body === 'string' ? h('p', { class: 'modal-body', text: opts.body }) : opts.body);
    var row = h('div', { class: 'modal-actions' });
    (opts.buttons || [{ text: '好的', primary: true }]).forEach(function (b) {
      row.appendChild(h('button', {
        class: 'btn ' + (b.primary ? 'btn-primary' : ''), type: 'button', text: b.text,
        onclick: function () { close(); if (b.onClick) b.onClick(); }
      }));
    });
    box.appendChild(row);
    mask.appendChild(box);
    document.body.appendChild(mask);
    var first = row.querySelector('.btn-primary') || row.querySelector('button');
    if (first) setTimeout(function () { first.focus(); }, 30);
    return { close: close };
  }

  function confirm(title, body, okText, onOk, cancelText) {
    return modal({
      title: title, body: body, emoji: '🤔',
      buttons: [{ text: cancelText || '再想想' }, { text: okText || '确定', primary: true, onClick: onOk }]
    });
  }

  /** 撒星星 */
  function celebrate(anchor, count) {
    if (reducedMotion()) return;
    var r = anchor ? anchor.getBoundingClientRect() : { left: innerWidth / 2, top: innerHeight / 2, width: 0, height: 0 };
    var cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    var layer = h('div', { class: 'burst', 'aria-hidden': 'true' });
    var chars = ['⭐', '✨', '🌟'];
    for (var i = 0; i < (count || 8); i++) {
      var a = (Math.PI * 2 * i) / (count || 8) + Math.random() * 0.5;
      var dist = 50 + Math.random() * 40;
      var s = h('span', { text: chars[i % 3] });
      s.style.left = cx + 'px'; s.style.top = cy + 'px';
      s.style.setProperty('--dx', Math.cos(a) * dist + 'px');
      s.style.setProperty('--dy', Math.sin(a) * dist + 'px');
      layer.appendChild(s);
    }
    document.body.appendChild(layer);
    setTimeout(function () { if (layer.parentNode) layer.parentNode.removeChild(layer); }, 700);
  }

  function reducedMotion() {
    try { return root.matchMedia && root.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; }
  }

  var PRAISE = ['太棒了！', '答对啦！', '真厉害！', '完全正确！', '你真细心！', '漂亮！', '就是这样！', '又对了！', '思路很清楚！', '好样的！'];
  var STREAK = { 3: '连对 3 题，手感来了！', 5: '连对 5 题，太稳了！', 10: '连对 10 题！你是数学小达人！' };
  var OOPS = ['差一点点～', '再想想看～', '没关系，再试一次！', '别急，慢慢来～'];
  var lastPraise = -1;
  function praise(streak) {
    if (STREAK[streak]) return STREAK[streak];
    var i;
    do { i = Math.floor(Math.random() * PRAISE.length); } while (i === lastPraise);
    lastPraise = i;
    return PRAISE[i];
  }
  function oops() { return OOPS[Math.floor(Math.random() * OOPS.length)]; }

  /** 星星显示 ★★☆ */
  function stars(n, total) {
    var wrap = h('span', { class: 'stars', 'aria-label': n + ' 颗星' });
    for (var i = 0; i < (total || 3); i++) wrap.appendChild(h('span', { class: i < n ? 'star on' : 'star', text: '★' }));
    return wrap;
  }

  MI.ui = {
    h: h, append: append, svg: svg, toast: toast, modal: modal, confirm: confirm,
    celebrate: celebrate, reducedMotion: reducedMotion, praise: praise, oops: oops, stars: stars
  };
})(typeof window !== 'undefined' ? window : globalThis);

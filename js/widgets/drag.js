/* 数学岛 · 拖拽小工具（Pointer Events，触屏和鼠标都能用）
 * MI.drag.attach(源元素, {
 *   ghost: () => 跟手移动的元素,
 *   target: '.可放下的元素选择器',
 *   onDrop: (目标元素) => {},
 *   onTap: () => {}            // 没怎么移动就松手，当作点击
 * }) */
(function (root) {
  'use strict';
  var MI = root.MathIsland = root.MathIsland || {};

  function attach(src, opts) {
    var startX = 0, startY = 0, dragging = false, ghost = null, pid = null, lastOver = null;

    function move(e) {
      if (e.pointerId !== pid) return;
      var dx = e.clientX - startX, dy = e.clientY - startY;
      if (!dragging && Math.abs(dx) + Math.abs(dy) > 8) {
        dragging = true;
        ghost = opts.ghost ? opts.ghost() : src.cloneNode(true);
        ghost.classList.add('drag-ghost');
        document.body.appendChild(ghost);
        src.classList.add('dragging');
      }
      if (dragging) {
        e.preventDefault();
        ghost.style.transform = 'translate(' + (e.clientX - 28) + 'px,' + (e.clientY - 34) + 'px)';
        var over = hit(e);
        if (over !== lastOver) {
          if (lastOver) lastOver.classList.remove('drop-over');
          if (over) over.classList.add('drop-over');
          lastOver = over;
        }
      }
    }
    function hit(e) {
      if (ghost) ghost.style.display = 'none';
      var el = document.elementFromPoint(e.clientX, e.clientY);
      if (ghost) ghost.style.display = '';
      return el && el.closest ? el.closest(opts.target) : null;
    }
    function up(e) {
      if (e.pointerId !== pid) return;
      cleanup();
      if (dragging) {
        var t = hit(e);
        if (ghost && ghost.parentNode) ghost.parentNode.removeChild(ghost);
        src.classList.remove('dragging');
        if (lastOver) lastOver.classList.remove('drop-over');
        if (t && opts.onDrop) opts.onDrop(t);
      } else if (e.type === 'pointerup' && opts.onTap) {
        opts.onTap();
      }
      dragging = false; ghost = null; lastOver = null; pid = null;
    }
    function cleanup() {
      document.removeEventListener('pointermove', move);
      document.removeEventListener('pointerup', up);
      document.removeEventListener('pointercancel', up);
    }
    src.addEventListener('pointerdown', function (e) {
      if (src.disabled || (e.button != null && e.button > 0)) return;
      pid = e.pointerId; startX = e.clientX; startY = e.clientY; dragging = false;
      document.addEventListener('pointermove', move, { passive: false });
      document.addEventListener('pointerup', up);
      document.addEventListener('pointercancel', up);
    });
    // 防止触屏上长按弹出菜单、拖动时页面滚动
    src.style.touchAction = 'none';
    src.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    // 键盘回车/空格触发的 click（detail 为 0）也当作点击
    src.addEventListener('click', function (e) { if (e.detail === 0 && opts.onTap) opts.onTap(); });
  }

  MI.drag = { attach: attach };
})(typeof window !== 'undefined' ? window : globalThis);

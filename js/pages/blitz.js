/* 数学岛 · 口算挑战（60 秒，可选，只用于口算乘法）
 * 平时做题都不计时；这里是单独的小游戏。题目来自单元里标了 data.blitz 的口算生成器。 */
(function (root) {
  'use strict';
  var MI = root.MathIsland = root.MathIsland || {};
  MI.pages = MI.pages || {};
  var SECONDS = 60;

  /** 收集能用于口算挑战的生成器（先试出一道题看是否标记了 blitz） */
  function blitzRefs(uid) {
    var u = MI.units[uid], out = [];
    Object.keys(u.generators).forEach(function (gid) {
      u.generators[gid].levels.forEach(function (d) {
        var q = MI.makeQuestion({ unit: uid, gen: gid, seed: 1, d: d });
        if (q.data.blitz) out.push({ gen: gid, d: d });
      });
    });
    return out;
  }

  MI.pages.blitz = function (app, uid) {
    var h = MI.ui.h, isl = MI.island(uid);
    if (!isl || !MI.units[uid]) { MI.router.go('#/'); return; }
    var refs = blitzRefs(uid);
    var page = h('div', { class: 'page play blitz' });
    page.style.setProperty('--theme', isl.color);
    page.style.setProperty('--theme-deep', MI.util.shade(isl.color, -0.25));
    page.style.setProperty('--tl-l', MI.util.shade(isl.color, 0.85));
    page.style.setProperty('--tl-d', MI.util.shade(isl.color, -0.68));
    document.body.style.setProperty('--theme', isl.color);
    document.body.style.setProperty('--theme-deep', MI.util.shade(isl.color, -0.25));
    var timerEl = h('span', { class: 'blitz-timer', text: SECONDS + '″' });
    var scoreEl = h('span', { class: 'blitz-score', text: '✔ 0' });
    var bar = h('div', { class: 'progress-fill', style: { width: '100%' } });
    page.appendChild(h('header', { class: 'play-top' }, [
      h('a', { href: '#/unit/' + uid + '/practice', class: 'icon-btn', 'aria-label': '离开', text: '✕' }),
      h('div', { class: 'progress' }, bar), timerEl, scoreEl
    ]));
    var main = h('main', { class: 'play-main' });
    page.appendChild(main);
    app.appendChild(page);

    var best = MI.store.get('blitz', {})[uid] || 0;
    var timer = null, ctrl = null, q = null, right = 0, total = 0, endAt = 0, running = false;

    function intro() {
      main.innerHTML = '';
      main.appendChild(h('section', { class: 'result' }, [
        h('div', { class: 'result-emoji', text: '⏱️' }),
        h('h2', { class: 'result-title', text: '口算挑战' }),
        h('p', { text: '60 秒内，能答对几道口算乘法？答错了不扣分，直接下一题。' }),
        h('p', { class: 'result-score' }, ['最好成绩：', h('b', { text: best }), ' 道']),
        h('div', { class: 'result-actions' }, [h('button', { type: 'button', class: 'btn btn-primary btn-block btn-lg', text: '开始！', onclick: start })])
      ]));
    }

    function start() {
      right = 0; total = 0; running = true;
      endAt = Date.now() + SECONDS * 1000;
      MI.router.setGuard(function (proceed) {
        if (!running) { proceed(); return; }
        MI.ui.modal({ emoji: '⏱️', title: '挑战还没结束', body: '现在离开，这次成绩不算哦。', buttons: [{ text: '先离开', onClick: proceed }, { text: '继续挑战', primary: true }] });
      });
      timer = setInterval(tick, 100);
      next();
    }
    function tick() {
      var left = Math.max(0, endAt - Date.now());
      timerEl.textContent = Math.ceil(left / 1000) + '″';
      bar.style.width = (left / (SECONDS * 1000) * 100) + '%';
      timerEl.classList.toggle('hurry', left < 10000);
      if (left <= 0) finish();
    }
    function next() {
      if (ctrl) ctrl.destroy();
      var r = refs[Math.floor(Math.random() * refs.length)];
      q = MI.makeQuestion({ unit: uid, gen: r.gen, seed: MI.newSeed(), d: r.d });
      main.innerHTML = '';
      var card = h('section', { class: 'q-card blitz-card' });
      var wbox = h('div', { class: 'q-widget' });
      card.appendChild(wbox);
      main.appendChild(card);
      ctrl = MI.types.fill(wbox, q, { submit: submit, changed: function () {} });
    }
    function submit() {
      if (!running) return;
      var v = ctrl.value();
      if (v == null) return;
      total++;
      var ok = MI.check(q, v);
      MI.progress.recordAnswer(q, ok);
      var card = main.querySelector('.q-card');
      if (ok) {
        right++;
        scoreEl.textContent = '✔ ' + right;
        MI.sound.play('correct');
        next();
      } else {
        MI.sound.play('wrong');
        ctrl.reveal();
        card.classList.add('blitz-wrong');
        setTimeout(function () { if (running) next(); }, 700);
      }
    }
    function finish() {
      running = false;
      clearInterval(timer); timer = null;
      if (ctrl) { ctrl.destroy(); ctrl = null; }
      MI.keypad.close();
      MI.router.setGuard(null);
      var rec = MI.store.get('blitz', {});
      var isBest = right > (rec[uid] || 0);
      if (isBest) { rec[uid] = right; MI.store.set('blitz', rec); best = right; }
      MI.sound.play('finish');
      main.innerHTML = '';
      main.appendChild(h('section', { class: 'result' }, [
        h('div', { class: 'result-emoji', text: right >= 15 ? '🚀' : right >= 8 ? '🎉' : '💪' }),
        h('h2', { class: 'result-title', text: '时间到！' }),
        h('p', { class: 'result-score' }, ['答对 ', h('b', { text: right }), ' 道（一共做了 ' + total + ' 道）']),
        isBest && right ? h('p', { class: 'result-best', text: '🎊 新纪录！' }) : h('p', { class: 'muted', text: '最好成绩：' + best + ' 道' }),
        h('div', { class: 'result-actions' }, [
          h('button', { type: 'button', class: 'btn btn-primary btn-block', text: '再挑战一次', onclick: start }),
          h('a', { href: '#/unit/' + uid + '/practice', class: 'btn btn-block', text: '回到小岛' })
        ])
      ]));
    }

    intro();
    return function cleanup() {
      running = false; if (timer) clearInterval(timer); if (ctrl) ctrl.destroy(); MI.keypad.close();
      document.body.style.removeProperty('--theme'); document.body.style.removeProperty('--theme-deep');
    };
  };
})(typeof window !== 'undefined' ? window : globalThis);

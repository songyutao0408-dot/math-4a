/* 数学岛 · 做题引擎：出题 → 作答 → 反馈 → 下一题
 * 反馈规则：答对给小动画和音效；第一次答错给一句提示，可以再试；
 * 第二次答错显示完整分步讲解，练习模式下再补一道同类题巩固。不扣分、不满屏红叉。 */
(function (root) {
  'use strict';
  var MI = root.MathIsland = root.MathIsland || {};

  var MODE_NAME = { practice: '练一练', quiz: '闯关测验', review: '重练错题', daily: '每日一练' };

  function formatAnswer(q) {
    if (q.answerText) return q.answerText;
    var a = q.answer;
    if (q.type === 'judge') return a ? '✔ 对' : '✘ 错';
    if (q.type === 'multi') return a.join('、');
    // 填空题：把答案填回模板里，读起来就是一句完整的话
    var tpl = q.data && q.data.template;
    if (tpl && tpl !== '[]') {
      var arr = Array.isArray(a) ? a : [a], i = 0;
      return tpl.replace(/\[\]/g, function () { return arr[i++]; }).replace(/\n/g, '，');
    }
    return Array.isArray(a) ? a.join('，') : String(a);
  }

  /**
   * opts: {
   *   mode, title, items:[{unit,gen,seed,d}], theme:'#hex',
   *   exitHref, again: () => 新的 items（再来一轮）, onFinish(result)
   * }
   */
  function run(app, opts) {
    var h = MI.ui.h;
    var items = opts.items.slice();
    var idx = 0, q = null, ctrl = null, attempts = 0, streak = 0, finished = false;
    var results = [];
    var consolidate = opts.mode === 'practice' || opts.mode === 'daily';

    var page = h('div', { class: 'page play' });
    if (opts.theme) { page.style.setProperty('--theme', opts.theme); page.style.setProperty('--theme-deep', MI.util.shade(opts.theme, -0.25)); page.style.setProperty('--tl-l', MI.util.shade(opts.theme, 0.85)); page.style.setProperty('--tl-d', MI.util.shade(opts.theme, -0.68)); }
    if (opts.theme) { document.body.style.setProperty('--theme', opts.theme); document.body.style.setProperty('--theme-deep', MI.util.shade(opts.theme, -0.25)); }
    var bar = h('div', { class: 'progress-fill' });
    var counter = h('span', { class: 'play-count' });
    var streakEl = h('span', { class: 'streak', 'aria-live': 'polite' });
    var top = h('header', { class: 'play-top' }, [
      h('button', { type: 'button', class: 'icon-btn', 'aria-label': '离开', text: '✕', onclick: function () { MI.router.go(opts.exitHref); } }),
      h('div', { class: 'progress', role: 'progressbar' }, bar),
      counter,
      streakEl
    ]);
    var main = h('main', { class: 'play-main' });
    var submitBtn = h('button', { type: 'button', class: 'btn btn-primary btn-block', text: '确定', onclick: submit });
    var foot = h('footer', { class: 'play-foot' }, submitBtn);
    var sheet = h('div', { class: 'sheet', role: 'status', 'aria-live': 'polite', hidden: true });
    page.appendChild(top); page.appendChild(main); page.appendChild(foot); page.appendChild(sheet);
    app.appendChild(page);

    MI.router.setGuard(function (proceed) {
      if (finished || !results.length) { proceed(); return; }
      MI.ui.modal({
        emoji: '🤔', title: '这一轮还没做完', body: '现在离开的话，这一轮的成绩不会保存哦。',
        buttons: [{ text: '先离开', onClick: proceed }, { text: '继续做题', primary: true }]
      });
    });

    function updateTop() {
      var total = items.length;
      bar.style.width = Math.round(idx / total * 100) + '%';
      counter.textContent = Math.min(idx + 1, total) + '/' + total;
      streakEl.textContent = streak >= 2 ? '🔥' + streak : '';
    }

    function show() {
      if (ctrl) { ctrl.destroy(); ctrl = null; }
      MI.keypad.close();
      hideSheet();
      var ref = items[idx];
      q = MI.makeQuestion(ref);
      attempts = 0;
      main.innerHTML = '';
      var meta = h('div', { class: 'q-meta' }, [
        ref.extra ? h('span', { class: 'chip chip-sun', text: '巩固一下' }) : null,
        h('span', { class: 'chip', text: MI.skillName(q.unit, q.skill) }),
        h('span', { class: 'chip chip-soft', text: MI.DIFFICULTY[q.difficulty] }),
        h('button', { type: 'button', class: 'hint-btn', text: '💡 提示', onclick: showHint })
      ]);
      var card = h('section', { class: 'q-card' }, [meta, h('p', { class: 'q-prompt', text: q.prompt })]);
      if (q.data.show) card.appendChild(h('div', { class: 'bignum' + (String(q.data.show).length > 14 ? ' long' : ''), text: q.data.show }));
      if (q.data.diagram && MI.diagrams) card.appendChild(MI.diagrams.render(q.data.diagram));
      if (q.data.figure && MI.geo) card.appendChild(MI.geo.figure(q.data.figure));
      if (q.data.table && MI.diagrams) card.appendChild(MI.diagrams.table(q.data.table));
      var wbox = h('div', { class: 'q-widget' });
      card.appendChild(wbox);
      main.appendChild(card);
      var mount = MI.types[q.type];
      ctrl = mount(wbox, q, { submit: submit, changed: function () {} });
      foot.hidden = !!ctrl.usesKeypad;
      submitBtn.disabled = false;
      updateTop();
      try { root.scrollTo(0, 0); } catch (e) { /* 忽略 */ }
      if (MI.speech && MI.speech.auto) MI.speech.auto(q);
    }

    function submit() {
      if (!ctrl || sheet.dataset.kind === 'ok' || sheet.dataset.kind === 'learn') return;
      var v = ctrl.value();
      if (v == null) { MI.ui.toast(ctrl.incomplete ? ctrl.incomplete() : '先完成作答哦'); return; }
      if (typeof v === 'object' && v.wrong) { wrong(v.wrong, v); return; }
      if (MI.check(q, v)) right(); else wrong(null, v);
    }

    function record(firstTry) {
      results.push({ id: q.id, unit: q.unit, skill: q.skill, firstTry: firstTry, extra: !!items[idx].extra });
      MI.progress.recordAnswer(q, firstTry);
      if (!firstTry) MI.progress.addWrong(q);
    }

    function right() {
      attempts++;
      if (attempts === 1) { record(true); streak++; MI.progress.recordStreak(streak); }
      ctrl.lock();
      MI.sound.play('correct');
      MI.ui.celebrate(main.querySelector('.q-card'), 8);
      var card = main.querySelector('.q-card');
      if (card) { card.classList.remove('pop'); void card.offsetWidth; card.classList.add('pop'); }
      var msg = attempts === 1 ? MI.ui.praise(streak) : '改对啦！知错就改，真棒！';
      var extra = null;
      if (opts.mode === 'review' && attempts === 1) {
        extra = MI.progress.wrongRight(q) ? '这道题已经从错题本“毕业”啦 🎓' : '再答对一次，它就能从错题本毕业啦！';
      }
      showSheet('ok', '✨ ' + msg, extra, [{ text: idx + 1 < items.length ? '下一题 →' : '看看成绩 →', primary: true, onClick: next }]);
      updateTop();
    }

    function wrong(hintOverride, v) {
      attempts++;
      if (attempts === 1) { record(false); streak = 0; }
      if (ctrl.onWrong && !(v && v.wrong)) ctrl.onWrong(v);
      MI.sound.play('wrong');
      updateTop();
      if (attempts === 1) {
        var hint = hintOverride || (ctrl.hintFor && ctrl.hintFor(v)) || q.hint;
        showSheet('oops', '🤔 ' + MI.ui.oops(), hint, [
          { text: '看讲解', onClick: learn },
          { text: '再试一次', primary: true, onClick: hideSheet }
        ]);
      } else {
        learn();
      }
    }

    /** 显示完整讲解 */
    function learn() {
      ctrl.reveal();
      ctrl.lock();
      MI.keypad.close();
      foot.hidden = true;
      var ex = h('section', { class: 'explain' }, [
        h('h3', { class: 'explain-title', text: '🧑‍🏫 一起看看' }),
        h('p', { class: 'explain-answer' }, ['正确答案：', h('b', { text: formatAnswer(q) })]),
        h('ol', { class: 'explain-steps' }, q.explanation.map(function (s) { return h('li', { text: s }); }))
      ]);
      main.appendChild(ex);
      var willAdd = consolidate && !items[idx].extra;
      if (willAdd) {
        var ref = items[idx];
        items.splice(idx + 1, 0, { unit: ref.unit, gen: ref.gen, seed: MI.newSeed(), d: ref.d, extra: true });
      }
      showSheet('learn', '没关系，看懂了就是学会了 👇', willAdd ? '看完讲解，再来一道同类题试试。' : null, [
        { text: '我明白了，继续 →', primary: true, onClick: next }
      ]);
      updateTop();
      setTimeout(function () { try { ex.scrollIntoView({ behavior: MI.ui.reducedMotion() ? 'auto' : 'smooth', block: 'start' }); } catch (e) { /* 忽略 */ } }, 60);
    }

    function showHint() {
      if (sheet.dataset.kind === 'ok' || sheet.dataset.kind === 'learn') return;
      showSheet('hint', '💡 提示', q.hint, [{ text: '知道了', primary: true, onClick: hideSheet }]);
    }

    function showSheet(kind, title, body, buttons) {
      sheet.innerHTML = '';
      sheet.dataset.kind = kind;
      sheet.className = 'sheet sheet-' + kind;
      sheet.appendChild(h('div', { class: 'sheet-title', text: title }));
      if (body) sheet.appendChild(h('p', { class: 'sheet-body', text: body }));
      var row = h('div', { class: 'sheet-actions' });
      buttons.forEach(function (b) {
        row.appendChild(h('button', { type: 'button', class: 'btn ' + (b.primary ? 'btn-primary' : 'btn-ghost'), text: b.text, onclick: b.onClick }));
      });
      sheet.appendChild(row);
      sheet.hidden = false;
      page.classList.add('sheet-open');
      var p = row.querySelector('.btn-primary');
      if (p) setTimeout(function () { try { p.focus({ preventScroll: true }); } catch (e) { /* 忽略 */ } }, 50);
    }
    function hideSheet() {
      sheet.hidden = true;
      sheet.dataset.kind = '';
      page.classList.remove('sheet-open');
    }

    function next() {
      idx++;
      if (idx >= items.length) finish(); else show();
    }

    function finish() {
      finished = true;
      if (ctrl) { ctrl.destroy(); ctrl = null; }
      MI.keypad.close();
      hideSheet();
      MI.router.setGuard(null);
      var mainR = results.filter(function (r) { return !r.extra; });
      var correct = mainR.filter(function (r) { return r.firstTry; }).length;
      var total = mainR.length;
      var stars = 0, best = false;
      if (opts.mode === 'quiz') { stars = MI.starsFor(correct, total); best = MI.progress.recordQuiz(opts.unit, correct, total, stars); }
      else if (opts.mode === 'practice') MI.progress.recordPractice(opts.unit);
      var weak = {};
      results.forEach(function (r) { if (!r.firstTry) weak[r.unit + '.' + r.skill] = MI.skillName(r.unit, r.skill); });
      var weakNames = Object.keys(weak).map(function (k) { return weak[k]; });
      if (opts.onFinish) opts.onFinish({ correct: correct, total: total, stars: stars });

      var rate = total ? correct / total : 0;
      var emoji = rate === 1 ? '🏆' : rate >= 0.8 ? '🎉' : rate >= 0.6 ? '😊' : '💪';
      var title = rate === 1 ? '全部一次答对！' : rate >= 0.8 ? '太棒了！' : rate >= 0.6 ? '做得不错！' : '坚持就是胜利！';
      main.innerHTML = '';
      foot.hidden = true;
      bar.style.width = '100%';
      counter.textContent = '';
      streakEl.textContent = '';
      var box = h('section', { class: 'result' }, [
        h('div', { class: 'result-emoji', text: emoji }),
        h('h2', { class: 'result-title', text: title }),
        opts.mode === 'quiz' ? h('div', { class: 'result-stars' }, starRow(stars)) : null,
        h('p', { class: 'result-score' }, ['一次答对 ', h('b', { text: correct }), ' / ' + total + ' 题']),
        best && stars > 0 ? h('p', { class: 'result-best', text: '🎊 新纪录！这座岛的星星更新啦' }) : null,
        h('p', { class: 'result-tip', text: weakNames.length ? '这几个知识点再练练会更棒：' + weakNames.join('、') : '每个知识点都掌握得很好，继续保持！' }),
        h('div', { class: 'result-actions' }, [
          opts.again ? h('button', { type: 'button', class: 'btn btn-primary btn-block', text: '再来一轮', onclick: function () { MI.router.reload(); } }) : null,
          h('button', { type: 'button', class: 'btn btn-block', text: '回到小岛', onclick: function () { MI.router.go(opts.exitHref); } })
        ])
      ]);
      main.appendChild(box);
      MI.sound.play('finish');
      if (opts.mode === 'quiz' && stars) {
        box.querySelectorAll('.result-stars .star.on').forEach(function (s, i) {
          setTimeout(function () { s.classList.add('pop'); MI.sound.play('star'); }, 300 + i * 260);
        });
      }
      if (rate >= 0.8) setTimeout(function () { MI.ui.celebrate(box.querySelector('.result-emoji'), 12); }, 120);
    }

    function starRow(n) {
      var out = [];
      for (var i = 0; i < 3; i++) out.push(h('span', { class: 'star big' + (i < n ? ' on' : ''), text: '★' }));
      return out;
    }

    // 测试用：查看当前题目
    MI.engine.current = function () { return q; };
    show();
    return function cleanup() {
      if (ctrl) ctrl.destroy();
      MI.keypad.close();
      document.body.style.removeProperty('--theme');
      document.body.style.removeProperty('--theme-deep');
    };
  }

  MI.engine = { run: run, formatAnswer: formatAnswer, MODE_NAME: MODE_NAME };
})(typeof window !== 'undefined' ? window : globalThis);

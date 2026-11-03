/* 数学岛 · 单元页：📖 知识卡 / ✏️ 练一练 / 🏆 闯关测验 */
(function (root) {
  'use strict';
  var MI = root.MathIsland = root.MathIsland || {};
  MI.pages = MI.pages || {};

  var TABS = [
    { id: 'cards', icon: '📖', text: '知识卡' },
    { id: 'practice', icon: '✏️', text: '练一练' },
    { id: 'quiz', icon: '🏆', text: '闯关测验' }
  ];

  function themed(el, isl) {
    el.style.setProperty('--theme', isl.color);
    el.style.setProperty('--theme-deep', MI.util.shade(isl.color, -0.28));
    el.style.setProperty('--tl-l', MI.util.shade(isl.color, 0.85));
    el.style.setProperty('--tl-d', MI.util.shade(isl.color, -0.68));
    return el;
  }

  MI.pages.unit = function (app, uid, tab) {
    var h = MI.ui.h;
    var isl = MI.island(uid);
    if (!isl) { MI.router.go('#/'); return; }
    var unit = MI.units[uid];
    tab = tab || 'cards';
    var page = themed(h('div', { class: 'page page-unit' }), isl);
    page.appendChild(h('header', { class: 'unit-head' }, [
      h('a', { href: '#/', class: 'icon-btn', 'aria-label': '回到地图', text: '←' }),
      h('div', { class: 'unit-title-wrap' }, [
        h('span', { class: 'unit-emoji', 'aria-hidden': 'true', text: isl.emoji }),
        h('h1', { class: 'unit-title', text: isl.title })
      ]),
      h('span', { class: 'unit-no', text: '第' + isl.no + '岛' })
    ]));

    if (!unit) {
      page.appendChild(h('section', { class: 'card soon' }, [
        h('div', { class: 'soon-emoji', text: '🚧' }),
        h('h2', { text: '这座小岛正在建设中' }),
        h('p', { text: '工程师正在搭桥铺路，很快就能来探险啦。先去别的小岛看看吧！' }),
        h('a', { href: '#/', class: 'btn btn-primary btn-block', text: '回到地图' })
      ]));
      app.appendChild(page);
      return;
    }

    page.appendChild(h('nav', { class: 'seg', role: 'tablist' }, TABS.map(function (t) {
      return h('a', { href: '#/unit/' + uid + '/' + t.id, role: 'tab', class: 'seg-btn' + (t.id === tab ? ' on' : ''), 'aria-selected': t.id === tab ? 'true' : 'false' }, [
        h('span', { 'aria-hidden': 'true', text: t.icon + ' ' }), t.text
      ]);
    })));
    var body = h('div', { class: 'unit-body' });
    page.appendChild(body);
    app.appendChild(page);
    if (tab === 'cards') return cardsView(body, unit);
    if (tab === 'practice') return practiceView(body, unit);
    return quizView(body, unit);
  };

  // ---------------- 知识卡：左右滑动翻卡 ----------------
  function cardsView(body, unit) {
    var h = MI.ui.h;
    var cards = unit.cards;
    var known = MI.progress.unit(unit.id).cardsKnown;
    var i = 0;
    try { i = Math.min(cards.length - 1, Number(sessionStorage.getItem('mi4a:card:' + unit.id)) || 0); } catch (e) { i = 0; }
    var counter = h('p', { class: 'cards-count' });
    var track = h('div', { class: 'cards-track' });
    var viewport = h('div', { class: 'cards-viewport' }, track);
    var dots = h('div', { class: 'dots', 'aria-hidden': 'true' });
    cards.forEach(function (c, k) {
      var knowBtn = h('button', { type: 'button', class: 'btn know-btn', onclick: function () {
        var now = !known[c.id];
        if (now) known[c.id] = 1; else delete known[c.id];
        MI.progress.setCardKnown(unit.id, c.id, now);
        MI.sound.play(now ? 'correct' : 'tap');
        if (now) MI.ui.celebrate(knowBtn, 6);
        update();
        if (now && k === i && i < cards.length - 1) setTimeout(function () { go(i + 1); }, 380);
      } });
      var card = h('article', { class: 'kcard', 'aria-roledescription': '知识卡', 'aria-label': (k + 1) + '/' + cards.length + ' ' + c.title }, [
        h('div', { class: 'kcard-head' }, [h('span', { class: 'kcard-emoji', 'aria-hidden': 'true', text: c.emoji || '📌' }), h('h2', { class: 'kcard-title', text: c.title })]),
        h('h3', { class: 'kcard-label', text: '要点' }),
        h('ul', { class: 'kcard-points' }, c.points.map(function (p) { return h('li', { text: p }); })),
        c.examples && c.examples.length ? h('h3', { class: 'kcard-label', text: '例子' }) : null,
        c.examples && c.examples.length ? h('ul', { class: 'kcard-examples' }, c.examples.map(function (p) { return h('li', { text: p }); })) : null,
        c.pitfall ? h('div', { class: 'kcard-pitfall' }, [h('b', { text: '⚠️ 易错提醒：' }), c.pitfall]) : null,
        knowBtn
      ]);
      // 每张卡放在一个正好一屏宽的“格子”里，卡片之间的间距在格子内部，翻页时正好移动一整屏
      var slide = h('div', { class: 'kslide' }, card);
      slide._know = knowBtn;
      slide._card = card;
      track.appendChild(slide);
      dots.appendChild(h('span', { class: 'dot' }));
    });
    var prev = h('button', { type: 'button', class: 'icon-btn nav-btn', 'aria-label': '上一张', text: '‹', onclick: function () { go(i - 1); } });
    var next = h('button', { type: 'button', class: 'icon-btn nav-btn', 'aria-label': '下一张', text: '›', onclick: function () { go(i + 1); } });
    body.appendChild(counter);
    body.appendChild(viewport);
    body.appendChild(h('div', { class: 'cards-nav' }, [prev, dots, next]));
    body.appendChild(h('p', { class: 'muted center', text: '左右滑动翻卡。看懂了就点“我懂了”。' }));

    function update() {
      track.style.transform = 'translateX(' + (-i * 100) + '%)';
      var n = Object.keys(known).filter(function (id) { return cards.some(function (c) { return c.id === id; }); }).length;
      counter.textContent = '第 ' + (i + 1) + ' / ' + cards.length + ' 张 · 已懂 ' + n + ' 张';
      Array.prototype.forEach.call(track.children, function (el, k) {
        var on = !!known[cards[k].id];
        el._know.textContent = on ? '✓ 我懂了' : '我懂了';
        el._know.classList.toggle('on', on);
        el._card.classList.toggle('known', on);
        el.setAttribute('aria-hidden', k === i ? 'false' : 'true');
      });
      Array.prototype.forEach.call(dots.children, function (d, k) {
        d.classList.toggle('on', k === i);
        d.classList.toggle('done', !!known[cards[k].id]);
      });
      prev.disabled = i === 0; next.disabled = i === cards.length - 1;
      try { sessionStorage.setItem('mi4a:card:' + unit.id, String(i)); } catch (e) { /* 忽略 */ }
    }
    function go(k) {
      i = MI.util.clamp(k, 0, cards.length - 1);
      track.classList.remove('dragging');
      update();
    }

    // 滑动
    var sx = 0, sy = 0, dx = 0, pid = null, horiz = null;
    viewport.addEventListener('pointerdown', function (e) {
      if (e.target.closest('button')) return;
      pid = e.pointerId; sx = e.clientX; sy = e.clientY; dx = 0; horiz = null;
    });
    viewport.addEventListener('pointermove', function (e) {
      if (e.pointerId !== pid) return;
      var mx = e.clientX - sx, my = e.clientY - sy;
      if (horiz === null && Math.abs(mx) + Math.abs(my) > 8) {
        horiz = Math.abs(mx) > Math.abs(my);
        if (horiz) { try { viewport.setPointerCapture(pid); } catch (er) { /* 忽略 */ } }
      }
      if (horiz) {
        dx = mx;
        track.classList.add('dragging');
        track.style.transform = 'translateX(calc(' + (-i * 100) + '% + ' + dx + 'px))';
      }
    });
    function end(e) {
      if (e.pointerId !== pid) return;
      pid = null;
      if (horiz) {
        if (dx < -50) go(i + 1); else if (dx > 50) go(i - 1); else go(i);
      }
    }
    viewport.addEventListener('pointerup', end);
    viewport.addEventListener('pointercancel', end);
    update();
  }

  // ---------------- 练一练：选难度 ----------------
  function practiceView(body, unit) {
    var h = MI.ui.h;
    var saved = MI.util.clamp(Number(MI.store.get('lastDiff', 1)) || 1, 1, 3);
    var desc = { 1: '先把基本功练扎实', 2: '加一点难度，动动脑', 3: '有陷阱哦，敢来挑战吗？' };
    var pick = h('div', { class: 'diff-pick', role: 'radiogroup', 'aria-label': '选择难度' });
    var chosen = saved;
    [1, 2, 3].forEach(function (d) {
      var b = h('button', {
        type: 'button', role: 'radio', class: 'diff' + (d === chosen ? ' on' : ''), 'aria-checked': d === chosen ? 'true' : 'false',
        onclick: function () {
          chosen = d;
          MI.sound.play('tap');
          Array.prototype.forEach.call(pick.children, function (x, k) { x.classList.toggle('on', k + 1 === d); x.setAttribute('aria-checked', k + 1 === d ? 'true' : 'false'); });
        }
      }, [h('span', { class: 'diff-name', text: ['', '🌱 ', '🌿 ', '🌳 '][d] + MI.DIFFICULTY[d] }), h('span', { class: 'diff-desc', text: desc[d] })]);
      pick.appendChild(b);
    });
    body.appendChild(h('section', { class: 'card' }, [
      h('h2', { class: 'card-title', text: '每轮 10 题，随机出题' }),
      h('p', { class: 'muted', text: '不计时，慢慢想。答错了有提示，还能再试一次。' }),
      pick,
      h('button', { type: 'button', class: 'btn btn-primary btn-block btn-lg', text: '开始练习 ✏️', onclick: function () {
        MI.store.set('lastDiff', chosen);
        MI.router.go('#/play/' + unit.id + '/practice/' + chosen);
      } })
    ]));
    (unit.extras || []).forEach(function (x) {
      body.appendChild(h('a', { href: x.href, class: 'card extra-card' }, [
        h('span', { class: 'extra-icon', 'aria-hidden': 'true', text: x.icon }),
        h('span', { class: 'extra-text' }, [h('b', { text: x.title }), h('span', { class: 'muted', text: x.desc })]),
        h('span', { class: 'muted', text: '›' })
      ]));
    });
    body.appendChild(skillList(unit));
  }

  function skillList(unit) {
    var h = MI.ui.h;
    return h('section', { class: 'card' }, [
      h('h2', { class: 'card-title', text: '我的知识点' }),
      h('ul', { class: 'skill-list' }, unit.skills.map(function (s) {
        var st = MI.progress.skillStat(unit.id, s.id);
        var pct = st.a ? Math.round(st.c / st.a * 100) : null;
        return h('li', { class: 'skill' }, [
          h('span', { class: 'skill-name', text: s.name }),
          h('span', { class: 'skill-bar' }, h('span', { class: 'skill-fill', style: { width: (pct || 0) + '%' } })),
          h('span', { class: 'skill-pct', text: pct == null ? '未练' : pct + '%' })
        ]);
      }))
    ]);
  }

  // ---------------- 闯关测验 ----------------
  function quizView(body, unit) {
    var h = MI.ui.h;
    var up = MI.progress.unit(unit.id);
    body.appendChild(h('section', { class: 'card quiz-card' }, [
      h('div', { class: 'quiz-best' }, [h('span', { class: 'muted', text: '最好成绩' }), MI.ui.stars(up.bestStars), up.quizCount ? h('span', { class: 'muted', text: '最高 ' + up.bestScore + ' 分 · 闯过 ' + up.quizCount + ' 次' }) : h('span', { class: 'muted', text: '还没闯过关' })]),
      h('h2', { class: 'card-title', text: '15 道题，由易到难' }),
      h('ul', { class: 'rules' }, [
        h('li', {}, ['一次答对 60% 以上：', MI.ui.stars(1)]),
        h('li', {}, ['一次答对 80% 以上：', MI.ui.stars(2)]),
        h('li', {}, ['全部一次答对：', MI.ui.stars(3)])
      ]),
      h('p', { class: 'muted', text: '答错了也能看提示、再试一次，只是不算“一次答对”。星星只保留最高纪录。' }),
      h('button', { type: 'button', class: 'btn btn-primary btn-block btn-lg', text: '开始闯关 🏆', onclick: function () { MI.router.go('#/play/' + unit.id + '/quiz'); } })
    ]));
  }

  // ---------------- 做题页 ----------------
  MI.pages.play = function (app, uid, mode, d) {
    var isl = MI.island(uid);
    if (!isl || !MI.units[uid]) { MI.router.go('#/'); return; }
    var pool = MI.unitPool(uid);
    var items = mode === 'quiz' ? MI.quizRound(pool) : MI.practiceRound(pool, MI.util.clamp(Number(d) || 1, 1, 3));
    return MI.engine.run(app, {
      mode: mode === 'quiz' ? 'quiz' : 'practice',
      unit: uid, items: items, theme: isl.color,
      exitHref: '#/unit/' + uid + '/' + (mode === 'quiz' ? 'quiz' : 'practice'),
      again: true
    });
  };
})(typeof window !== 'undefined' ? window : globalThis);

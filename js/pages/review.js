/* 数学岛 · 错题本 + 每日一练
 * 错题本：自动收集做错的题（保存出题参数，能原样重现），按单元筛选，可以“重练错题”，连续答对 2 次自动移出。
 * 每日一练：每天 10 题，优先错题和正确率最低的知识点。 */
(function (root) {
  'use strict';
  var MI = root.MathIsland = root.MathIsland || {};
  MI.pages = MI.pages || {};

  function wrongList(unitFilter) {
    var w = MI.progress.wrongBook();
    return Object.keys(w).map(function (id) { var it = w[id]; it.id = id; return it; })
      .filter(function (it) { return MI.units[it.unit] && (!unitFilter || it.unit === unitFilter); })
      .sort(function (a, b) { return (b.wrong - a.wrong) || (b.at - a.at); });
  }

  // ---------------- 错题本 ----------------
  MI.pages.wrong = function (app, filter) {
    var h = MI.ui.h;
    var all = wrongList(null), list = wrongList(filter || null);
    var page = h('div', { class: 'page page-plain' });
    page.appendChild(h('header', { class: 'plain-head' }, [h('h1', { text: '错题本' }), h('p', { class: 'muted', text: '做错的题会自动收进来。重练时连续答对 2 次，它就“毕业”离开错题本。' })]));
    // 按单元筛选
    var units = MI.ISLANDS.filter(function (i) { return all.some(function (it) { return it.unit === i.id; }); });
    if (units.length) {
      page.appendChild(h('div', { class: 'chips-row', role: 'tablist' }, [
        h('a', { href: '#/wrong', class: 'filter-chip' + (!filter ? ' on' : ''), text: '全部 ' + all.length })
      ].concat(units.map(function (i) {
        var n = all.filter(function (it) { return it.unit === i.id; }).length;
        return h('a', { href: '#/wrong/' + i.id, class: 'filter-chip' + (filter === i.id ? ' on' : ''), text: i.emoji + ' ' + i.title + ' ' + n });
      }))));
    }
    if (!list.length) {
      page.appendChild(h('section', { class: 'card soon' }, [h('div', { class: 'soon-emoji', text: '🌟' }), h('h2', { text: filter ? '这座岛没有错题' : '错题本是空的' }), h('p', { text: '太棒啦！去小岛上练一练吧。' })]));
    } else {
      page.appendChild(h('button', { type: 'button', class: 'btn btn-primary btn-block btn-lg', text: '重练错题（' + Math.min(list.length, 10) + ' 道）', onclick: function () { MI.router.go('#/review' + (filter ? '/' + filter : '')); } }));
      page.appendChild(h('ul', { class: 'wrong-list' }, list.map(function (it) {
        var isl = MI.island(it.unit);
        return h('li', { class: 'wrong-item' }, [
          h('div', { class: 'wrong-top' }, [
            h('span', { class: 'chip', style: { '--tl-l': MI.util.shade(isl.color, 0.85), '--tl-d': MI.util.shade(isl.color, -0.68) }, text: isl.emoji + ' ' + MI.skillName(it.unit, it.skill) }),
            h('span', { class: 'muted wrong-count', text: '错 ' + it.wrong + ' 次' + (it.streak ? ' · 已连对 ' + it.streak + ' 次' : '') })
          ]),
          h('p', { class: 'wrong-prompt', text: it.prompt }),
          h('a', { href: '#/review-one/' + encodeURIComponent(it.id), class: 'btn btn-small', text: '练这道' })
        ]);
      })));
    }
    page.appendChild(MI.pages.tabbar('#/wrong'));
    app.appendChild(page);
  };

  /** 重练错题（最多 10 道） */
  MI.pages.review = function (app, filter, oneId) {
    var list = wrongList(filter || null);
    if (oneId) list = list.filter(function (it) { return it.id === oneId; });
    if (!list.length) { MI.router.go('#/wrong'); return; }
    var items = list.slice(0, 10).map(function (it) { return { unit: it.ref.unit, gen: it.ref.gen, seed: it.ref.seed, d: it.ref.d }; });
    return MI.engine.run(app, { mode: 'review', unit: null, items: items, theme: '#7B68EE', exitHref: '#/wrong', again: true });
  };

  // ---------------- 每日一练 ----------------
  /** 今天的 10 道题：错题优先，再补正确率最低的知识点，还不够就从各岛随机抽 */
  MI.dailyPlan = function () {
    var today = MI.util.todayKey();
    var saved = MI.store.get('dailyPlan', null);
    if (saved && saved.date === today && saved.items && saved.items.length) return saved.items;
    var rng = MI.makeRng(MI.hashStr('daily#' + today));
    var items = [];
    wrongList(null).slice(0, 5).forEach(function (it) { items.push({ unit: it.ref.unit, gen: it.ref.gen, seed: it.ref.seed, d: it.ref.d }); });
    var st = MI.progress.stats().skills;
    var weak = Object.keys(st).map(function (k) { return { key: k, rate: st[k].c / Math.max(1, st[k].a), a: st[k].a }; })
      .filter(function (x) { var p = x.key.split('.'); return MI.units[p[0]] && x.rate < 0.85; })
      .sort(function (a, b) { return a.rate - b.rate; });
    weak.forEach(function (x) {
      if (items.length >= 8) return;
      var p = x.key.split('.'), d = x.rate < 0.5 ? 1 : 2;
      var gens = MI.generatorsFor(p[0], d).filter(function (g) { return g.skill === p[1]; });
      if (!gens.length) return;
      items.push({ unit: p[0], gen: rng.pick(gens).id, seed: Math.floor(rng.next() * 4294967296) >>> 0, d: d });
    });
    if (items.length < 10) {
      var ready = MI.ISLANDS.map(function (i) { return i.id; }).filter(function (id) { return MI.units[id] && !MI.units[id].mix; });
      var ds = []; for (var i = items.length; i < 10; i++) ds.push(rng.chance(0.6) ? 1 : 2);
      items = items.concat(MI.buildRound(ready, ds, rng));
    }
    items = items.slice(0, 10);
    MI.store.set('dailyPlan', { date: today, items: items });
    return items;
  };

  MI.pages.daily = function (app, go) {
    var h = MI.ui.h;
    var today = MI.util.todayKey();
    var done = MI.store.get('dailyDone', null);
    if (go === 'go') {
      return MI.engine.run(app, { mode: 'daily', unit: null, items: MI.dailyPlan(), theme: '#EE9B1C', exitHref: '#/daily' });
    }
    var plan = MI.dailyPlan();
    var nWrong = plan.filter(function (r) { return MI.progress.inWrongBook(r.unit + ':' + r.gen + ':' + r.d + ':' + r.seed); }).length;
    var page = h('div', { class: 'page page-plain' });
    page.appendChild(h('header', { class: 'plain-head' }, [h('h1', { text: '每日一练' }), h('p', { class: 'muted', text: today })]));
    var finished = done && done.date === today;
    page.appendChild(h('section', { class: 'card daily-card' }, [
      h('div', { class: 'soon-emoji', text: finished ? '🎉' : '☀️' }),
      h('h2', { text: finished ? '今天已经练完啦！' : '今天的 10 道题准备好了' }),
      finished ? h('p', { text: '一次答对 ' + done.correct + ' / ' + done.total + ' 题。明天再来，或者再练一遍也可以。' })
        : h('p', { text: (nWrong ? '里面有 ' + nWrong + ' 道是错题本里的题，' : '') + '其余是你还不太熟的知识点。不计时，慢慢做。' }),
      h('a', { href: '#/daily/go', class: 'btn btn-primary btn-block btn-lg', text: finished ? '再练一遍' : '开始今天的练习' })
    ]));
    // 最近 7 天
    var days = MI.store.get('days', {});
    var row = h('div', { class: 'week' });
    for (var i = 6; i >= 0; i--) {
      var d = new Date(); d.setDate(d.getDate() - i);
      var k = MI.util.todayKey(d), on = !!days[k];
      row.appendChild(h('div', { class: 'day' + (on ? ' on' : '') }, [h('span', { class: 'day-dot', text: on ? '✔' : '' }), h('span', { class: 'day-name', text: '日一二三四五六'[d.getDay()] })]));
    }
    page.appendChild(h('section', { class: 'card' }, [h('h2', { class: 'card-title', text: '最近 7 天' }), row]));
    page.appendChild(MI.pages.tabbar('#/daily'));
    app.appendChild(page);
  };
})(typeof window !== 'undefined' ? window : globalThis);

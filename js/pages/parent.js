/* 数学岛 · 奖励页（徽章墙）+ 家长页 */
(function (root) {
  'use strict';
  var MI = root.MathIsland = root.MathIsland || {};
  MI.pages = MI.pages || {};

  // ---------------- 奖励页 ----------------
  MI.pages.badges = function (app) {
    var h = MI.ui.h;
    MI.badges.check();
    var got = MI.badges.got();
    var n = MI.badges.list.filter(function (b) { return got[b.id]; }).length;
    var page = h('div', { class: 'page page-plain' });
    page.appendChild(h('header', { class: 'plain-head' }, [h('h1', { text: '奖励' }), h('p', { class: 'muted', text: '已经得到 ' + n + ' / ' + MI.badges.list.length + ' 枚徽章' })]));
    page.appendChild(h('div', { class: 'badge-grid' }, MI.badges.list.map(function (b) {
      var p = b.progress(), on = !!got[b.id];
      var pct = Math.min(100, Math.round(p[0] / p[1] * 100));
      return h('div', { class: 'badge' + (on ? ' on' : '') }, [
        h('div', { class: 'badge-emoji', 'aria-hidden': 'true', text: b.emoji }),
        h('div', { class: 'badge-name', text: b.name }),
        h('div', { class: 'badge-desc', text: b.desc }),
        on ? h('div', { class: 'badge-date', text: '✔ ' + got[b.id] }) : h('div', { class: 'badge-bar' }, h('span', { style: { width: pct + '%' } })),
        on ? null : h('div', { class: 'badge-prog', text: Math.min(p[0], p[1]) + ' / ' + p[1] })
      ]);
    })));
    page.appendChild(MI.pages.tabbar('#/badges'));
    app.appendChild(page);
  };

  // ---------------- 家长页 ----------------
  var unlocked = false; // 本次打开页面期间解锁一次就行

  MI.pages.parent = function (app) {
    var h = MI.ui.h;
    var page = h('div', { class: 'page page-plain' });
    page.appendChild(h('header', { class: 'plain-head' }, [
      h('a', { href: '#/settings', class: 'icon-btn', 'aria-label': '返回设置', text: '←' }),
      h('h1', { text: '家长页' })
    ]));
    app.appendChild(page);
    if (!unlocked) return gate(page);
    content(page);
    page.appendChild(MI.pages.tabbar('#/settings'));
  };

  /** 门槛：一道三位数乘两位数的笔算题 */
  function gate(page) {
    var h = MI.ui.h;
    var a = 100 + Math.floor(Math.random() * 900), b = 11 + Math.floor(Math.random() * 89);
    var q = { type: 'fill', data: { template: a + ' × ' + b + ' = []' }, answer: String(a * b) };
    var box = h('div', { class: 'q-widget' });
    page.appendChild(h('section', { class: 'card' }, [
      h('h2', { class: 'card-title', text: '请家长算一算' }),
      h('p', { class: 'muted', text: '答对这道笔算题就能看到学习情况。' }),
      box
    ]));
    var ctrl = MI.types.fill(box, q, {
      submit: function () {
        var v = ctrl.value();
        if (v != null && MI.check(q, v)) { unlocked = true; MI.keypad.close(); MI.router.reload(); }
        else { MI.ui.toast('不对哦，再算一算'); }
      },
      changed: function () {}
    });
    return function () { ctrl.destroy(); };
  }

  function pct(c, a) { return a ? Math.round(c / a * 100) + '%' : '—'; }

  function content(page) {
    var h = MI.ui.h;
    var st = MI.progress.stats(), sk = st.skills || {};
    var total = st.total || { a: 0, c: 0 };
    var days = MI.store.get('days', {});
    var last7 = 0;
    for (var i = 0; i < 7; i++) { var d = new Date(); d.setDate(d.getDate() - i); if (days[MI.util.todayKey(d)]) last7++; }

    page.appendChild(h('section', { class: 'card stat-row' }, [
      stat('累计做题', total.a + ' 道'),
      stat('一次答对率', pct(total.c, total.a)),
      stat('最近 7 天学习', last7 + ' 天'),
      stat('最长连对', (st.bestStreak || 0) + ' 题')
    ]));

    // 各单元 / 知识点正确率
    var units = h('section', { class: 'card' }, [h('h2', { class: 'card-title', text: '各单元、知识点正确率（一次答对）' })]);
    MI.ISLANDS.forEach(function (isl) {
      var u = MI.units[isl.id];
      if (!u || u.mix) return;
      var ua = 0, uc = 0;
      var rows = u.skills.map(function (s) {
        var x = sk[isl.id + '.' + s.id] || { a: 0, c: 0 };
        ua += x.a; uc += x.c;
        return h('tr', {}, [h('td', { text: s.name }), h('td', { text: x.a }), h('td', { class: x.a && x.c / x.a < 0.6 ? 'low' : '', text: pct(x.c, x.a) })]);
      });
      var up = MI.progress.unit(isl.id);
      units.appendChild(h('details', { class: 'unit-stat' }, [
        h('summary', {}, [h('span', { text: isl.emoji + ' ' + isl.title }), h('span', { class: 'muted', text: ua + ' 题 · ' + pct(uc, ua) + ' · ' + '★'.repeat(up.bestStars) + '☆'.repeat(3 - up.bestStars) })]),
        h('table', { class: 'mi-table' }, [h('thead', {}, h('tr', {}, [h('th', { text: '知识点' }), h('th', { text: '做题' }), h('th', { text: '正确率' })])), h('tbody', {}, rows)])
      ]));
    });
    page.appendChild(units);

    // 高频错题
    var w = MI.progress.wrongBook();
    var top = Object.keys(w).map(function (id) { return w[id]; }).sort(function (a, b) { return b.wrong - a.wrong; }).slice(0, 10);
    page.appendChild(h('section', { class: 'card' }, [
      h('h2', { class: 'card-title', text: '高频错题（错题本里共 ' + Object.keys(w).length + ' 道）' }),
      top.length ? h('ol', { class: 'top-wrong' }, top.map(function (it) {
        var isl = MI.island(it.unit) || { emoji: '', title: '' };
        return h('li', {}, [h('b', { text: '错 ' + it.wrong + ' 次 ' }), h('span', { class: 'muted', text: isl.emoji + ' ' + MI.skillName(it.unit, it.skill) + '：' }), it.prompt]);
      })) : h('p', { class: 'muted', text: '还没有错题。' })
    ]));

    // 数据
    page.appendChild(h('section', { class: 'card' }, [
      h('h2', { class: 'card-title', text: '数据' }),
      h('p', { class: 'muted', text: '学习记录只存在这台设备的浏览器里。换设备前可以先导出备份。' }),
      h('div', { class: 'btn-col' }, [
        h('button', { type: 'button', class: 'btn btn-block', text: '📤 导出数据（JSON）', onclick: exportData }),
        h('button', { type: 'button', class: 'btn btn-block danger', text: '🗑️ 清空全部数据', onclick: clearAll })
      ])
    ]));
  }

  function stat(label, val) {
    var h = MI.ui.h;
    return h('div', { class: 'stat' }, [h('div', { class: 'stat-val', text: val }), h('div', { class: 'stat-label', text: label })]);
  }

  function dump() {
    var out = { app: '数学岛', version: MI.version, exportedAt: new Date().toISOString(), data: {} };
    MI.store.keys().forEach(function (k) { out.data[k] = MI.store.get(k, null); });
    return JSON.stringify(out, null, 2);
  }

  function exportData() {
    var json = dump();
    var name = 'math-island-' + MI.util.todayKey() + '.json';
    try {
      var blob = new Blob([json], { type: 'application/json' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url; a.download = name;
      document.body.appendChild(a); a.click();
      setTimeout(function () { URL.revokeObjectURL(url); a.remove(); }, 1000);
    } catch (e) { /* 下面还会显示文本 */ }
    // 微信等浏览器可能不让下载，同时把内容显示出来，方便长按复制
    var ta = MI.ui.h('textarea', { class: 'export-text', readonly: true, rows: 8 });
    ta.value = json;
    MI.ui.modal({ emoji: '📤', title: '导出数据', body: MI.ui.h('div', {}, [MI.ui.h('p', { class: 'modal-body', text: '如果没有自动下载（比如在微信里），可以长按下面的文字全选复制保存。' }), ta]), buttons: [{ text: '好的', primary: true }] });
  }

  function clearAll() {
    MI.ui.confirm('清空全部数据？', '星星、错题本、徽章、做题记录都会被删除，不能恢复。', '清空', function () {
      MI.ui.confirm('真的要清空吗？', '再确认一次：删除后就找不回来了。', '确定清空', function () {
        MI.store.keys().forEach(function (k) { MI.store.remove(k); });
        try { sessionStorage.clear(); } catch (e) { /* 忽略 */ }
        unlocked = false;
        MI.ui.toast('已清空');
        MI.applySettings();
        MI.router.go('#/');
      }, '先不了');
    }, '先不了');
  }
})(typeof window !== 'undefined' ? window : globalThis);

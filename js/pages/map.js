/* 数学岛 · 首页“数学岛地图” + 底部导航 */
(function (root) {
  'use strict';
  var MI = root.MathIsland = root.MathIsland || {};
  MI.pages = MI.pages || {};

  var NAV = [
    { href: '#/', icon: '🏝️', text: '地图' },
    { href: '#/daily', icon: '📅', text: '每日一练' },
    { href: '#/wrong', icon: '📒', text: '错题本' },
    { href: '#/badges', icon: '🏅', text: '奖励' },
    { href: '#/settings', icon: '⚙️', text: '设置' }
  ];

  MI.pages.tabbar = function (active) {
    var h = MI.ui.h;
    return h('nav', { class: 'tabbar', 'aria-label': '主导航' }, NAV.map(function (n) {
      return h('a', { href: n.href, class: 'tab' + (n.href === active ? ' on' : ''), 'aria-current': n.href === active ? 'page' : null }, [
        h('span', { class: 'tab-icon', 'aria-hidden': 'true', text: n.icon }),
        h('span', { class: 'tab-text', text: n.text })
      ]);
    }));
  };

  // 岛屿在地图上的位置（左边距百分比），走成一条弯弯的小路
  var LEFTS = [6, 50, 12, 52, 6, 48, 14, 52, 27];
  var ROW = 128, TOP = 16;

  MI.pages.map = function (app) {
    var h = MI.ui.h, svg = MI.ui.svg;
    var page = h('div', { class: 'page page-map' });
    var totalStars = 0;
    MI.ISLANDS.forEach(function (isl) { totalStars += MI.progress.unit(isl.id).bestStars; });

    page.appendChild(h('header', { class: 'map-head' }, [
      h('div', {}, [
        h('h1', { class: 'map-title', text: '数学岛' }),
        h('p', { class: 'map-sub', text: '四年级上册 · 复习闯关' })
      ]),
      h('div', { class: 'star-total', 'aria-label': '一共 ' + totalStars + ' 颗星' }, [h('span', { class: 'star on', text: '★' }), ' ' + totalStars + ' / 27'])
    ]));
    page.appendChild(h('p', { class: 'map-greet', text: greet() }));

    var height = TOP * 2 + MI.ISLANDS.length * ROW;
    var map = h('div', { class: 'map', style: { height: height + 'px' } });
    // 小路
    var path = svg('svg', { class: 'map-path', viewBox: '0 0 100 ' + height, preserveAspectRatio: 'none', 'aria-hidden': 'true' });
    var d = '';
    MI.ISLANDS.forEach(function (isl, i) {
      var x = LEFTS[i] + 23, y = TOP + i * ROW + 52;
      if (i === 0) d += 'M' + x + ' ' + y;
      else {
        var py = TOP + (i - 1) * ROW + 52, px = LEFTS[i - 1] + 23;
        d += ' C' + px + ' ' + (py + ROW * 0.55) + ' ' + x + ' ' + (y - ROW * 0.55) + ' ' + x + ' ' + y;
      }
    });
    path.appendChild(svg('path', { d: d, class: 'map-trail', 'vector-effect': 'non-scaling-stroke' }));
    map.appendChild(path);
    // 一点点装饰
    [['⛵', 70, 0.55], ['🐚', 4, 2.6], ['🌴', 84, 4.45], ['🐠', 2, 6.5], ['☁️', 80, 7.6]].forEach(function (dc) {
      map.appendChild(h('span', { class: 'map-deco', 'aria-hidden': 'true', text: dc[0], style: { left: dc[1] + '%', top: (TOP + dc[2] * ROW) + 'px' } }));
    });

    MI.ISLANDS.forEach(function (isl, i) {
      var ready = !!MI.units[isl.id];
      var up = MI.progress.unit(isl.id);
      var pct = ready ? MI.progress.completion(isl.id) : 0;
      var btn = h('a', {
        href: '#/unit/' + isl.id, class: 'island' + (ready ? '' : ' building'),
        style: { left: LEFTS[i] + '%', top: (TOP + i * ROW) + 'px', '--c': isl.color, '--cd': MI.util.shade(isl.color, -0.28), '--cl': MI.util.shade(isl.color, 0.82) },
        'aria-label': '第' + isl.no + '岛 ' + isl.title + '，' + up.bestStars + ' 颗星，完成 ' + pct + '%'
      }, [
        h('span', { class: 'isle-blob' }, [
          h('span', { class: 'isle-no', text: String(isl.no) }),
          h('span', { class: 'isle-emoji', 'aria-hidden': 'true', text: isl.emoji })
        ]),
        h('span', { class: 'isle-name', text: isl.title }),
        h('span', { class: 'isle-info' }, [
          MI.ui.stars(up.bestStars),
          ready ? h('span', { class: 'isle-pct', text: pct + '%' }) : h('span', { class: 'isle-soon', text: '建设中' })
        ])
      ]);
      map.appendChild(btn);
    });
    page.appendChild(map);
    page.appendChild(MI.pages.tabbar('#/'));
    app.appendChild(page);
  };

  function greet() {
    var hr = new Date().getHours();
    var t = hr < 11 ? '早上好' : hr < 14 ? '中午好' : hr < 18 ? '下午好' : '晚上好';
    return t + '！今天想去哪座岛探险？';
  }
})(typeof window !== 'undefined' ? window : globalThis);

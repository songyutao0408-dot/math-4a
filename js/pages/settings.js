/* 数学岛 · 设置页 + 还没开放的页面 */
(function (root) {
  'use strict';
  var MI = root.MathIsland = root.MathIsland || {};
  MI.pages = MI.pages || {};

  function applySettings() {
    var s = MI.progress.settings();
    document.documentElement.setAttribute('data-font', s.font === 'large' ? 'large' : 'normal');
  }
  MI.applySettings = applySettings;

  function toggleRow(label, desc, key) {
    var h = MI.ui.h;
    var on = !!MI.progress.settings()[key];
    var sw = h('button', {
      type: 'button', role: 'switch', class: 'switch' + (on ? ' on' : ''), 'aria-checked': on ? 'true' : 'false', 'aria-label': label,
      onclick: function () {
        on = !on;
        MI.progress.setSetting(key, on);
        sw.classList.toggle('on', on);
        sw.setAttribute('aria-checked', on ? 'true' : 'false');
        if (key === 'sound' && on) MI.sound.play('correct');
      }
    }, h('span', { class: 'switch-knob' }));
    return h('div', { class: 'set-row' }, [h('div', { class: 'set-text' }, [h('div', { class: 'set-label', text: label }), desc ? h('div', { class: 'set-desc', text: desc }) : null]), sw]);
  }

  MI.pages.settings = function (app) {
    var h = MI.ui.h;
    var s = MI.progress.settings();
    var page = h('div', { class: 'page page-plain' });
    page.appendChild(h('header', { class: 'plain-head' }, [h('h1', { text: '设置' })]));

    var fontSeg = h('div', { class: 'seg seg-inline', role: 'radiogroup', 'aria-label': '字号' });
    [['normal', '标准'], ['large', '大']].forEach(function (f) {
      var b = h('button', {
        type: 'button', role: 'radio', class: 'seg-btn' + (s.font === f[0] ? ' on' : ''), 'aria-checked': s.font === f[0] ? 'true' : 'false', text: f[1],
        onclick: function () {
          MI.progress.setSetting('font', f[0]);
          applySettings();
          Array.prototype.forEach.call(fontSeg.children, function (x) { x.classList.toggle('on', x === b); x.setAttribute('aria-checked', x === b ? 'true' : 'false'); });
        }
      });
      fontSeg.appendChild(b);
    });

    page.appendChild(h('section', { class: 'card' }, [
      toggleRow('音效', '答对、答错时的小声音', 'sound'),
      MI.speech && MI.speech.supported ? toggleRow('读题', '出题时用浏览器自带的声音读一遍，也可以点题目上的 🔊', 'speech') : null,
      h('div', { class: 'set-row' }, [h('div', { class: 'set-text' }, [h('div', { class: 'set-label', text: '字号' }), h('div', { class: 'set-desc', text: '看不清可以调大' })]), fontSeg])
    ]));
    page.appendChild(h('section', { class: 'card' }, [
      h('a', { href: '#/parent', class: 'set-link' }, [h('span', { text: '👨‍👩‍👧 家长页' }), h('span', { class: 'muted', text: '›' })])
    ]));
    page.appendChild(h('section', { class: 'card about' }, [
      h('p', { class: 'muted', text: '数学岛 v' + MI.version + ' · 人教版（2026 秋）四年级上册' }),
      h('p', { class: 'muted', text: MI.store.available ? '学习记录只保存在这台设备的浏览器里，不联网、不收集任何数据。' : '⚠️ 当前浏览器不能保存进度（可能是无痕模式），可以正常做题，但关掉页面后记录会丢失。' })
    ]));
    page.appendChild(MI.pages.tabbar('#/settings'));
    app.appendChild(page);
  };

  /** 还没做好的页面 */
  MI.pages.soon = function (title, emoji, tab, text) {
    return function (app) {
      var h = MI.ui.h;
      var page = h('div', { class: 'page page-plain' });
      page.appendChild(h('header', { class: 'plain-head' }, [h('h1', { text: title })]));
      page.appendChild(h('section', { class: 'card soon' }, [
        h('div', { class: 'soon-emoji', text: emoji }),
        h('h2', { text: '马上就来' }),
        h('p', { text: text })
      ]));
      if (tab) page.appendChild(MI.pages.tabbar(tab));
      app.appendChild(page);
    };
  };
})(typeof window !== 'undefined' ? window : globalThis);

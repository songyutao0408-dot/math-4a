/* 数学岛 · 音效：Web Audio API 现场合成，不用音频文件 */
(function (root) {
  'use strict';
  var MI = root.MathIsland = root.MathIsland || {};
  var ctx = null;

  function ac() {
    if (!ctx) {
      var C = root.AudioContext || root.webkitAudioContext;
      if (!C) return null;
      try { ctx = new C(); } catch (e) { return null; }
    }
    if (ctx.state === 'suspended' && ctx.resume) { try { ctx.resume(); } catch (e) { /* 忽略 */ } }
    return ctx;
  }

  function tone(c, freq, start, dur, type, vol) {
    var o = c.createOscillator(), g = c.createGain();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(freq, c.currentTime + start);
    g.gain.setValueAtTime(0.0001, c.currentTime + start);
    g.gain.exponentialRampToValueAtTime(vol || 0.18, c.currentTime + start + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + start + dur);
    o.connect(g); g.connect(c.destination);
    o.start(c.currentTime + start);
    o.stop(c.currentTime + start + dur + 0.02);
  }

  var SOUNDS = {
    tap: function (c) { tone(c, 660, 0, 0.06, 'triangle', 0.08); },
    correct: function (c) { tone(c, 784, 0, 0.12, 'triangle'); tone(c, 1175, 0.09, 0.2, 'triangle'); },
    wrong: function (c) { tone(c, 330, 0, 0.16, 'sine', 0.12); tone(c, 294, 0.12, 0.2, 'sine', 0.1); },
    star: function (c) { [988, 1319, 1568].forEach(function (f, i) { tone(c, f, i * 0.08, 0.18, 'triangle', 0.14); }); },
    finish: function (c) { [523, 659, 784, 1047].forEach(function (f, i) { tone(c, f, i * 0.1, 0.25, 'triangle', 0.15); }); }
  };

  MI.sound = {
    play: function (name) {
      if (!MI.progress || !MI.progress.settings().sound) return;
      var c = ac();
      if (!c || !SOUNDS[name]) return;
      try { SOUNDS[name](c); } catch (e) { /* 忽略 */ }
    },
    /** iOS 需要在用户手势里先“解锁”音频 */
    unlock: function () { ac(); }
  };
})(typeof window !== 'undefined' ? window : globalThis);

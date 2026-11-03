/* 数学岛 · 读题：浏览器自带的 Web Speech API 朗读中文题目；不支持就隐藏这个功能 */
(function (root) {
  'use strict';
  var MI = root.MathIsland = root.MathIsland || {};
  var synth = root.speechSynthesis;
  var supported = !!(synth && root.SpeechSynthesisUtterance);

  /** 把题目里的符号换成读得出来的字 */
  function toSpeech(text) {
    return String(text)
      .replace(/\[\]/g, '括号')
      .replace(/（　）/g, '括号')
      .replace(/×/g, '乘').replace(/÷/g, '除以').replace(/≈/g, '约等于').replace(/=/g, '等于')
      .replace(/−/g, '减').replace(/\+/g, '加').replace(/>/g, '大于').replace(/</g, '小于')
      .replace(/□/g, '方框').replace(/○/g, '圆圈').replace(/°/g, '度').replace(/∠/g, '角')
      .replace(/｜/g, '，').replace(/\//g, '每')
      .replace(/[🧒💎🪨🚩✏️📊💡⭐]/g, '');
  }

  function zhVoice() {
    try {
      var vs = synth.getVoices() || [];
      for (var i = 0; i < vs.length; i++) if (/^zh(-|_)?(CN|Hans)?/i.test(vs[i].lang)) return vs[i];
    } catch (e) { /* 忽略 */ }
    return null;
  }

  function say(text) {
    if (!supported) return;
    try {
      synth.cancel();
      var u = new root.SpeechSynthesisUtterance(toSpeech(text));
      u.lang = 'zh-CN';
      var v = zhVoice();
      if (v) u.voice = v;
      u.rate = 0.9;
      synth.speak(u);
    } catch (e) { /* 忽略 */ }
  }

  function questionText(q) {
    var t = q.prompt;
    if (q.data && q.data.show) t += '。' + q.data.show;
    if (q.data && q.data.template && q.data.template !== '[]') t += '。' + q.data.template.replace(/\n/g, '，');
    return t;
  }

  MI.speech = {
    supported: supported,
    toSpeech: toSpeech,
    say: say,
    read: function (q) { say(questionText(q)); },
    stop: function () { try { if (supported) synth.cancel(); } catch (e) { /* 忽略 */ } },
    /** 打开“读题”时，每道题出来自动读一遍 */
    auto: function (q) { if (supported && MI.progress.settings().speech) say(questionText(q)); },
    enabled: function () { return supported && MI.progress.settings().speech; }
  };
})(typeof window !== 'undefined' ? window : globalThis);

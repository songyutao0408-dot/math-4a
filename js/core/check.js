/* 数学岛 · 答案判定（宽容：全角/半角、空格、千分位逗号、汉字读法规范化、角度容差） */
(function (root) {
  'use strict';
  var MI = root.MathIsland = root.MathIsland || {};

  var CN_BIG = { '壹': '一', '贰': '二', '叁': '三', '肆': '四', '伍': '五', '陆': '六', '柒': '七', '捌': '八', '玖': '九', '拾': '十', '佰': '百', '仟': '千', '〇': '零', '两': '二', '萬': '万', '億': '亿' };

  /** 填空答案规范化 */
  function normalizeFill(s) {
    s = String(s == null ? '' : s);
    // 全角数字 → 半角
    s = s.replace(/[０-９]/g, function (c) { return String.fromCharCode(c.charCodeAt(0) - 0xFF10 + 48); });
    s = s.replace(/＝/g, '=')
      .replace(/[≒～~]/g, '≈')
      .replace(/约等于|约/g, '≈')
      .replace(/度/g, '°')
      .replace(/＞/g, '>').replace(/＜/g, '<')
      .replace(/[萬]/g, '万').replace(/[億]/g, '亿')
      // 空格、千分位逗号、撇号
      .replace(/[\s   ,，、'’]/g, '');
    return s;
  }

  /** 汉字读法规范化 */
  function normalizeReading(s) {
    s = String(s == null ? '' : s).replace(/[\s ,，、。.·｜|]/g, '');
    s = s.replace(/[壹贰叁肆伍陆柒捌玖拾佰仟〇两萬億]/g, function (c) { return CN_BIG[c]; });
    // 开头的“一十”按“十”算（如“一十万”→“十万”）
    s = s.replace(/^一十/, '十');
    return s;
  }

  function isDigits(s) { return /^\d+$/.test(s); }

  /** 比较一个空 */
  function blankEqual(value, answer, opts) {
    opts = opts || {};
    var v = normalizeFill(value), a = normalizeFill(answer);
    if (!v) return false;
    if (opts.prefix) { var p = normalizeFill(opts.prefix); if (v.indexOf(p) === 0 && a.indexOf(p) !== 0) v = v.slice(p.length); }
    if (opts.suffix) { var sfx = normalizeFill(opts.suffix); if (v.slice(-sfx.length) === sfx && a.slice(-sfx.length) !== sfx) v = v.slice(0, -sfx.length); }
    if (v === a) return true;
    if (typeof opts.tolerance === 'number') {
      var nv = parseFloat(v.replace('°', '')), na = parseFloat(a.replace('°', ''));
      if (isFinite(nv) && isFinite(na)) return Math.abs(nv - na) <= opts.tolerance;
    }
    if (isDigits(v) && isDigits(a)) return Number(v) === Number(a);
    return false;
  }

  function sameSet(a, b) {
    if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false;
    var x = a.map(String).sort(), y = b.map(String).sort();
    for (var i = 0; i < x.length; i++) if (x[i] !== y[i]) return false;
    return true;
  }

  function toArr(x) { return Array.isArray(x) ? x : [x]; }

  var checkers = {
    choice: function (q, v) { return v === q.answer; },
    judge: function (q, v) { return v === q.answer; },
    multi: function (q, v) { return sameSet(v, q.answer); },
    fill: function (q, v) {
      var ans = toArr(q.answer), val = toArr(v);
      if (val.length !== ans.length) return false;
      var opts = q.data || {};
      for (var i = 0; i < ans.length; i++) {
        var o = { tolerance: opts.tolerance, prefix: opts.prefix, suffix: (opts.suffixes && opts.suffixes[i]) || opts.suffix };
        if (!blankEqual(val[i], ans[i], o)) return false;
      }
      return true;
    },
    reading: function (q, v) {
      var nv = normalizeReading(Array.isArray(v) ? v.join('') : v);
      return nv.length > 0 && nv === normalizeReading(q.answer);
    },
    placeValue: function (q, v) { return typeof v === 'string' && isDigits(v) && v === String(q.answer); },
    split: function (q, v) { return sameSet(v, q.answer); },
    /** 画角：允许误差（默认 ±2°） */
    drawAngle: function (q, v) {
      var tol = q.data && typeof q.data.tolerance === 'number' ? q.data.tolerance : 2;
      return typeof v === 'number' && Math.abs(v - q.answer) <= tol;
    },
    /** 分类：每个图形都进了对的筐 */
    sort: function (q, v) {
      if (!Array.isArray(v) || v.length !== q.answer.length) return false;
      for (var i = 0; i < v.length; i++) if (v[i] !== q.answer[i]) return false;
      return true;
    },
    /** 补统计图：每根直条的数值都对 */
    barFill: function (q, v) { return checkers.sort(q, v); },
    /** 在图上点：点中任意一个正确答案都算对 */
    pick: function (q, v) { return (Array.isArray(q.answer) ? q.answer : [q.answer]).indexOf(v) >= 0; },
    /** 竖式：每一行都要和答案一致（空格用 _ 表示） */
    vmul: function (q, v) {
      if (!Array.isArray(v) || v.length !== q.answer.length) return false;
      for (var i = 0; i < v.length; i++) if (v[i] !== q.answer[i]) return false;
      return true;
    }
  };
  // 复合题型沿用填空判定
  checkers.round = checkers.fill;
  checkers.abacus = checkers.fill;

  function check(q, value) {
    var fn = checkers[q.type] || checkers[q.check];
    if (!fn) throw new Error('没有这个题型的判定：' + q.type);
    try { return !!fn(q, value); } catch (e) { return false; }
  }

  MI.check = check;
  MI.checkers = checkers;
  MI.normalizeFill = normalizeFill;
  MI.normalizeReading = normalizeReading;
  MI.blankEqual = blankEqual;
})(typeof window !== 'undefined' ? window : globalThis);

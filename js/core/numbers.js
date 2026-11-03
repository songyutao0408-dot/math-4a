/* 数学岛 · 大数工具：读法、分级、近似数等（纯函数，可在 Node 中测试） */
(function (root) {
  'use strict';
  var MI = root.MathIsland = root.MathIsland || {};

  var DIGITS = '零一二三四五六七八九';
  var POS_UNITS = ['', '十', '百', '千'];
  var LEVEL_NAMES = ['', '万', '亿'];
  var LEVEL_LABELS = ['个级', '万级', '亿级'];
  /** 数位（从右往左第 p 位，p 从 0 开始） */
  var PLACE_NAMES = ['个位', '十位', '百位', '千位', '万位', '十万位', '百万位', '千万位', '亿位', '十亿位', '百亿位', '千亿位'];
  /** 计数单位 */
  var COUNT_UNITS = ['一', '十', '百', '千', '万', '十万', '百万', '千万', '亿', '十亿', '百亿', '千亿'];
  /** 计数单位的完整说法（“10 个一万是十万”“10 个十万是一百万”） */
  var UNIT_FULL = ['一', '十', '一百', '一千', '一万', '十万', '一百万', '一千万', '一亿', '十亿', '一百亿', '一千亿'];

  var MAX = 1e12;

  function assertRange(n) {
    if (typeof n !== 'number' || !isFinite(n) || Math.floor(n) !== n || n < 0 || n >= MAX) {
      throw new Error('数字超出范围（0 ≤ n < 1 万亿的整数）：' + n);
    }
  }

  function pow10(p) { return Math.pow(10, p); }

  /** 从右往左第 p 位上的数字 */
  function digitAt(n, p) { return Math.floor(n / pow10(p)) % 10; }

  /**
   * 按级读数，返回每一级的读法片段（从高级到低级）。
   * 规则：每级末尾的 0 不读；其他数位上一个 0 或连续几个 0 只读一个“零”；
   * 整级都是 0 时这一级不读（也不读“万”），这些 0 和后面的 0 一起只读一个“零”。
   */
  function readingSegments(n) {
    assertRange(n);
    if (n === 0) return [{ level: 0, digits: '0', text: '零' }];
    var len = String(n).length;
    var top = Math.floor((len - 1) / 4);
    var out = '';
    var pending = false; // 有待读的“零”
    var segs = [];
    for (var lv = top; lv >= 0; lv--) {
      var segText = '';
      var lvVal = Math.floor(n / Math.pow(10000, lv)) % 10000;
      var hiPos = lv === top ? (len - 1) % 4 : 3;
      for (var pos = hiPos; pos >= 0; pos--) {
        var d = digitAt(n, lv * 4 + pos);
        if (d === 0) {
          if (out.length) pending = true;
          continue;
        }
        var piece = '';
        if (pending) { piece += '零'; pending = false; }
        // 最高位是十位上的 1：读“十”而不是“一十”（如 15 → 十五，120000 → 十二万）
        var name = (d === 1 && pos === 1 && out.length === 0) ? '' : DIGITS[d];
        piece += name + POS_UNITS[pos];
        out += piece; segText += piece;
      }
      if (lv > 0 && lvVal > 0) {
        out += LEVEL_NAMES[lv]; segText += LEVEL_NAMES[lv];
        pending = false; // 这一级末尾的 0 不读
      }
      var s = String(lvVal);
      if (lv !== top) s = ('0000' + s).slice(-4);
      segs.push({ level: lv, digits: s, text: segText });
    }
    return segs;
  }

  /** 数字转中文读法（0 ≤ n < 1 万亿） */
  function toChineseReading(n) {
    return readingSegments(n).map(function (s) { return s.text; }).join('');
  }

  var CN_DIGIT = { '零': 0, '〇': 0, '一': 1, '二': 2, '两': 2, '三': 3, '四': 4, '五': 5, '六': 6, '七': 7, '八': 8, '九': 9 };
  var CN_POS = { '十': 10, '百': 100, '千': 1000 };

  function parseSection(str) {
    var total = 0, cur = -1;
    for (var i = 0; i < str.length; i++) {
      var ch = str[i];
      if (ch in CN_DIGIT) { cur = CN_DIGIT[ch]; }
      else if (ch in CN_POS) { total += (cur < 0 ? 1 : cur) * CN_POS[ch]; cur = -1; }
      else return NaN;
    }
    if (cur > 0) total += cur;
    return total;
  }

  /** 中文读法转数字（用于测试和宽容判定）；无法识别返回 NaN */
  function parseChineseReading(s) {
    s = String(s || '').replace(/\s+/g, '');
    if (!s) return NaN;
    var total = 0;
    var yi = s.lastIndexOf('亿');
    if (yi >= 0) {
      var hi = parseChineseReading(s.slice(0, yi));
      if (!(hi > 0)) return NaN;
      total += hi * 1e8; s = s.slice(yi + 1);
    }
    var wan = s.indexOf('万');
    if (wan >= 0) {
      var w = parseSection(s.slice(0, wan));
      if (!(w > 0)) return NaN;
      total += w * 1e4; s = s.slice(wan + 1);
    }
    if (s) {
      var rest = parseSection(s);
      if (isNaN(rest)) return NaN;
      total += rest;
    }
    return total;
  }

  /** 分级显示：302000500 → "3｜0200｜0500" */
  function splitLevelsText(n, sep) {
    var s = String(n);
    sep = sep || '｜';
    var parts = [];
    while (s.length > 4) { parts.unshift(s.slice(-4)); s = s.slice(0, -4); }
    parts.unshift(s);
    return parts.join(sep);
  }

  /** 四舍五入求近似数：返回以“万”或“亿”为单位的数值。approx(485600, '万') → 49 */
  function approx(n, unit) {
    assertRange(n);
    var u = unit === '亿' ? 1e8 : 1e4;
    return Math.floor((n + u / 2) / u);
  }

  function approxText(n, unit) { return approx(n, unit) + (unit === '亿' ? '亿' : '万'); }

  /** 求近似数时要“看”的那一位（数位下标）：万 → 千位(3)，亿 → 千万位(7) */
  function lookPlace(unit) { return unit === '亿' ? 7 : 3; }

  function unitValue(unit) { return unit === '亿' ? 1e8 : 1e4; }

  /** 读数时读出几个“零” */
  function zeroCount(n) {
    var m = toChineseReading(n).match(/零/g);
    return n === 0 ? 0 : (m ? m.length : 0);
  }

  /** 数位所在的级：0 个级，1 万级，2 亿级 */
  function levelOfPlace(p) { return Math.floor(p / 4); }

  MI.num = {
    DIGITS: DIGITS,
    POS_UNITS: POS_UNITS,
    LEVEL_NAMES: LEVEL_NAMES,
    LEVEL_LABELS: LEVEL_LABELS,
    PLACE_NAMES: PLACE_NAMES,
    COUNT_UNITS: COUNT_UNITS,
    UNIT_FULL: UNIT_FULL,
    digitAt: digitAt,
    pow10: pow10,
    readingSegments: readingSegments,
    toChineseReading: toChineseReading,
    parseChineseReading: parseChineseReading,
    splitLevelsText: splitLevelsText,
    approx: approx,
    approxText: approxText,
    lookPlace: lookPlace,
    unitValue: unitValue,
    zeroCount: zeroCount,
    levelOfPlace: levelOfPlace
  };
  // 需求里点名的两个函数，同时挂在顶层方便调用
  MI.toChineseReading = toChineseReading;
  MI.approx = approx;
})(typeof window !== 'undefined' ? window : globalThis);

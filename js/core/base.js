/* 数学岛 · 基础工具：命名空间、可复现随机数、小工具函数
 * 本文件不碰 DOM，Node 测试里也能直接 require。 */
(function (root) {
  'use strict';
  var MI = root.MathIsland = root.MathIsland || {};

  // ---------- 可复现随机数（mulberry32） ----------
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function hashStr(s) {
    var h = 2166136261;
    for (var i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  function makeRng(seed) {
    var next = mulberry32(seed >>> 0);
    var r = {
      seed: seed,
      next: next,
      /** [min, max] 闭区间整数 */
      int: function (min, max) { return min + Math.floor(next() * (max - min + 1)); },
      pick: function (arr) { return arr[Math.floor(next() * arr.length)]; },
      chance: function (p) { return next() < p; },
      shuffle: function (arr) {
        var a = arr.slice();
        for (var i = a.length - 1; i > 0; i--) {
          var j = Math.floor(next() * (i + 1));
          var t = a[i]; a[i] = a[j]; a[j] = t;
        }
        return a;
      },
      sample: function (arr, k) { return r.shuffle(arr).slice(0, k); }
    };
    return r;
  }

  function newSeed() { return Math.floor(Math.random() * 4294967296) >>> 0; }

  // ---------- 小工具 ----------
  var util = {
    range: function (a, b) { var out = []; for (var i = a; i <= b; i++) out.push(i); return out; },
    uniq: function (arr) {
      var seen = {}, out = [];
      arr.forEach(function (x) { var k = typeof x + ':' + String(x); if (!seen[k]) { seen[k] = 1; out.push(x); } });
      return out;
    },
    clamp: function (x, a, b) { return Math.max(a, Math.min(b, x)); },
    pad2: function (n) { return (n < 10 ? '0' : '') + n; },
    todayKey: function (d) {
      d = d || new Date();
      return d.getFullYear() + '-' + util.pad2(d.getMonth() + 1) + '-' + util.pad2(d.getDate());
    },
    /** 第一步、第二步……（讲解用） */
    stepName: function (i) {
      var cn = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];
      return '第' + (cn[i] || String(i + 1)) + '步';
    },
    /** 给讲解数组自动加“第一步：” */
    steps: function (list) {
      return list.map(function (s, i) { return util.stepName(i) + '：' + s; });
    },
    escapeHtml: function (s) {
      return String(s).replace(/[&<>"']/g, function (c) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
      });
    },
    /** 十六进制颜色调深/调浅，amt 为 -1~1 */
    shade: function (hex, amt) {
      var c = hex.replace('#', '');
      var n = parseInt(c, 16);
      var r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
      function f(x) { return Math.round(amt < 0 ? x * (1 + amt) : x + (255 - x) * amt); }
      var v = (f(r) << 16) | (f(g) << 8) | f(b);
      return '#' + ('000000' + v.toString(16)).slice(-6);
    }
  };

  MI.makeRng = makeRng;
  MI.newSeed = newSeed;
  MI.hashStr = hashStr;
  MI.util = util;
  MI.version = '1.0.0';
})(typeof window !== 'undefined' ? window : globalThis);

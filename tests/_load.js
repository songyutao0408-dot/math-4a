// 测试用：按 index.html 的顺序加载纯逻辑文件（不含 DOM 相关代码）
const path = require('path');
const files = [
  'js/core/base.js',
  'js/core/numbers.js',
  'js/core/check.js',
  'js/core/registry.js',
  'js/core/arith.js',
  'js/units/u1-big-numbers.js',
  'js/units/u2-angles.js',
  'js/units/u3-multiply.js',
  'js/units/u4-models.js',
  'js/units/u5-quadrilaterals.js',
  'js/units/u6-bar-charts.js',
  'js/units/u7-treasure.js',
  'js/units/u8-chicken-rabbit.js',
  'js/units/u9-final.js'
];
files.forEach((f) => require(path.join(__dirname, '..', f)));
module.exports = globalThis.MathIsland;

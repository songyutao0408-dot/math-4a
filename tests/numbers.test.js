const test = require('node:test');
const assert = require('node:assert/strict');
const MI = require('./_load.js');
const N = MI.num;

test('toChineseReading：需求里的用例', () => {
  const cases = {
    302000500: '三亿零二百万零五百',
    50060000: '五千零六万',
    10010010: '一千零一万零一十',
    101000: '十万一千',
    120000: '十二万',
    70000700: '七千万零七百',
    1000010000: '十亿零一万',
    2003000000: '二十亿零三百万',
    100000000: '一亿',
    10: '十',
    15: '十五',
    100010: '十万零一十'
  };
  for (const [n, r] of Object.entries(cases)) assert.equal(MI.toChineseReading(Number(n)), r, n);
});

test('toChineseReading：更多边界', () => {
  const cases = {
    0: '零', 1: '一', 100: '一百', 101: '一百零一', 1010: '一千零一十', 10000: '一万',
    300005000: '三亿零五千', 1000005000: '十亿零五千', 100100000: '一亿零一十万',
    40056000: '四千零五万六千', 88880000: '八千八百八十八万', 80888000: '八千零八十八万八千',
    999999999999: '九千九百九十九亿九千九百九十九万九千九百九十九',
    100000000000: '一千亿', 110000: '十一万', 1000000: '一百万', 20000000: '二千万'
  };
  for (const [n, r] of Object.entries(cases)) assert.equal(MI.toChineseReading(Number(n)), r, n);
});

test('toChineseReading：超出范围要报错', () => {
  assert.throws(() => MI.toChineseReading(1e12));
  assert.throws(() => MI.toChineseReading(-1));
  assert.throws(() => MI.toChineseReading(1.5));
});

test('toChineseReading：随机 2 万个数，读法能还原且符合规则', () => {
  const rng = MI.makeRng(12345);
  for (let i = 0; i < 20000; i++) {
    const len = rng.int(1, 12);
    let s = String(rng.int(1, 9));
    for (let j = 1; j < len; j++) s += rng.chance(0.5) ? '0' : String(rng.int(0, 9));
    const n = Number(s);
    const r = MI.toChineseReading(n);
    assert.equal(N.parseChineseReading(r), n, s + ' → ' + r);
    assert.ok(!/零零/.test(r), '连续两个零：' + r);
    assert.ok(!/零$/.test(r), '末尾读零：' + r);
    assert.ok(!/零[万亿]/.test(r), '零后面直接跟万/亿：' + r);
    assert.ok(!/^一十/.test(r), '开头读成一十：' + r);
    assert.ok(!/亿万/.test(r), '亿万连读：' + r);
  }
});

test('approx：四舍五入求近似数', () => {
  assert.equal(MI.approx(485600, '万'), 49);
  assert.equal(MI.approx(449999, '万'), 45);
  assert.equal(MI.approx(2346000000, '亿'), 23);
  assert.equal(MI.approx(54999, '万'), 5);
  assert.equal(MI.approx(45000, '万'), 5);
  assert.equal(MI.approx(44999, '万'), 4);
  assert.equal(MI.approx(495000, '万'), 50);
  assert.equal(MI.approx(9996000, '万'), 1000);
  assert.equal(MI.approx(250000000, '亿'), 3);
  assert.equal(N.approxText(485600, '万'), '49万');
});

test('splitLevelsText / zeroCount', () => {
  assert.equal(N.splitLevelsText(302000500), '3｜0200｜0500');
  assert.equal(N.splitLevelsText(1234), '1234');
  assert.equal(N.zeroCount(302000500), 2);
  assert.equal(N.zeroCount(88880000), 0);
  assert.equal(N.zeroCount(80888000), 1);
});

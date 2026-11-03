// 第②⑤单元：用独立方法验算图形题
const test = require('node:test');
const assert = require('node:assert/strict');
const MI = require('./_load.js');
const RUNS = Number(process.env.RUNS || 1000);
const each = (unit, gen, d, fn) => { for (let i = 0; i < RUNS; i++) fn(MI.makeQuestion({ unit, gen, seed: (i * 7919 + 13) >>> 0, d })); };
const kind = (deg) => deg < 90 ? 0 : deg === 90 ? 1 : deg < 180 ? 2 : deg === 180 ? 3 : 4;

test('角的分类：筐的答案和度数一致', () => {
  [1, 2, 3].forEach((d) => each('u2', 'sortAngles', d, (q) => {
    q.data.items.forEach((it, i) => {
      assert.equal(q.data.bins[q.answer[i]], ['锐角', '直角', '钝角', '平角', '周角'][kind(it.deg)]);
      assert.ok(it.deg > 0 && it.deg <= 360);
    });
  }));
});

test('量角器读数：度数在 0～180 之间，题目不是 90°的陷阱题外的特殊值', () => {
  [1, 2, 3].forEach((d) => each('u2', 'readProtractor', d, (q) => {
    const deg = q.data.figure.deg;
    assert.equal(String(deg), q.answer);
    assert.ok(deg > 0 && deg < 180 && deg % 5 === 0);
    if (d === 1) assert.equal(q.data.figure.base, 'right');
  }));
});

test('钟面：整时的夹角', () => {
  [1, 2].forEach((d) => each('u2', 'clock', d, (q) => {
    if (q.type !== 'fill') return;
    const h = q.data.figure.hour;
    assert.equal(Number(q.answer), Math.min(h, 12 - h) * 30);
  }));
});

test('三角尺：拼出的角是 15° 的倍数', () => {
  [1, 2].forEach((d) => each('u2', 'triangle', d, (q) => assert.equal(Number(q.answer) % 15, 0)));
});

function parallel(a, b, c, d) {
  const u = [b[0] - a[0], b[1] - a[1]], v = [d[0] - c[0], d[1] - c[1]];
  const cross = u[0] * v[1] - u[1] * v[0];
  return Math.abs(cross) / (Math.hypot(...u) * Math.hypot(...v)) < 0.01;
}
test('四边形分类：数一数平行的对边', () => {
  [1, 2, 3].forEach((d) => each('u5', 'sortQuads', d, (q) => {
    q.data.items.forEach((it, i) => {
      const p = it.pts;
      const n = (parallel(p[0], p[1], p[3], p[2]) ? 1 : 0) + (parallel(p[1], p[2], p[0], p[3]) ? 1 : 0);
      assert.equal(q.answer[i], n === 2 ? 0 : n === 1 ? 1 : 2, JSON.stringify(it));
    });
  }));
});

test('梯形：上底比下底短，两条底平行', () => {
  [1, 2, 3].forEach((d) => each('u5', 'trapParts', d, (q) => {
    const s = Object.fromEntries(q.data.shape.segs.map((x) => [x.id, x]));
    const len = (x) => Math.hypot(x.b[0] - x.a[0], x.b[1] - x.a[1]);
    assert.ok(len(s.top) < len(s.bottom));
    assert.ok(parallel(s.top.a, s.top.b, s.bottom.a, s.bottom.b));
    assert.ok(!parallel(s.leg1.a, s.leg1.b, s.leg2.a, s.leg2.b));
  }));
});

test('最短线段就是垂线', () => {
  [1, 2, 3].forEach((d) => each('u5', 'shortest', d, (q) => {
    const segs = q.data.shape.segs, base = q.data.shape.base;
    const L = (x) => Math.hypot(x.b[0] - x.a[0], x.b[1] - x.a[1]);
    const min = segs.reduce((m, x) => (L(x) < L(m) ? x : m));
    assert.equal(min.id, q.answer);
    const u = [base[1][0] - base[0][0], base[1][1] - base[0][1]], v = [min.b[0] - min.a[0], min.b[1] - min.a[1]];
    assert.ok(Math.abs(u[0] * v[0] + u[1] * v[1]) / (Math.hypot(...u) * Math.hypot(...v)) < 0.01);
  }));
});

test('方格纸上的两条直线：位置关系正确', () => {
  [1, 2, 3].forEach((d) => each('u5', 'position', d, (q) => {
    const [l1, l2] = q.data.figure.lines;
    const u = [l1[2] - l1[0], l1[3] - l1[1]], v = [l2[2] - l2[0], l2[3] - l2[1]];
    const cross = u[0] * v[1] - u[1] * v[0], dot = u[0] * v[0] + u[1] * v[1];
    const want = cross === 0 ? '互相平行' : dot === 0 ? '互相垂直' : '相交，但不垂直';
    assert.equal(q.answer, want);
    if (cross === 0) assert.ok((l2[0] - l1[0]) * u[1] - (l2[1] - l1[1]) * u[0] !== 0, '两条平行线不能重合');
  }));
});

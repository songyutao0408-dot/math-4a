// 第⑥⑦⑧⑨单元：用独立方法验算
const test = require('node:test');
const assert = require('node:assert/strict');
const MI = require('./_load.js');
const RUNS = Number(process.env.RUNS || 1000);
const each = (unit, gen, d, fn) => { for (let i = 0; i < RUNS; i++) fn(MI.makeQuestion({ unit, gen, seed: (i * 104729 + 3) >>> 0, d })); };

test('统计图：数据都是每格代表数的整格或半格，图画得下', () => {
  [1, 2, 3].forEach((d) => each('u6', 'readSingle', d, (q) => {
    const c = q.data.figure;
    c.series.forEach((s) => s.values.forEach((v) => {
      assert.ok(v > 0 && v <= c.cells * c.step);
      assert.equal((v * 2) % c.step, 0);
      if (d < 3) assert.equal(v % c.step, 0);
    }));
    if (q.type === 'fill' && /”是多少/.test(q.prompt)) {
      const cat = q.prompt.match(/“(.+?)”/)[1];
      assert.equal(String(c.series[0].values[c.cats.indexOf(cat)]), q.answer);
    }
  }));
  [1, 2, 3].forEach((d) => each('u6', 'fillBars', d, (q) => {
    const n = q.data.chart.cats.length;
    q.data.missing.forEach((idx, i) => assert.equal(q.answer[i], q.data.chart.series[Math.floor(idx / n)].values[idx % n]));
  }));
  [1, 2, 3].forEach((d) => each('u6', 'pickStep', d, (q) => {
    const max = Math.max(...q.data.table.rows[0].slice(1).map(Number));
    const s = Number(q.answer);
    assert.ok(max <= s * 10);
    const smaller = [1, 2, 5, 10, 20, 50, 100].filter((x) => x < s);
    smaller.forEach((x) => assert.ok(max > x * 10, '更小的每格也画得下：' + x));
  }));
});

test('复式统计图：相差最多只有一项', () => {
  [2, 3].forEach((d) => each('u6', 'readDouble', d, (q) => {
    const [A, B] = q.data.figure.series.map((s) => s.values);
    const diffs = A.map((a, i) => Math.abs(a - B[i]));
    assert.ok(!diffs.includes(0));
    assert.equal(diffs.filter((x) => x === Math.max(...diffs)).length, 1);
  }));
});

test('寻宝：按路线走一遍，终点就是答案', () => {
  [1, 2, 3].forEach((d) => each('u7', 'follow', d, (q) => {
    const legs = [...q.prompt.matchAll(/向(东北|东南|西北|西南|东|西|南|北)走 (\d) 格/g)].map((m) => ({ dir: m[1], n: Number(m[2]) }));
    const cells = MI.u7.walk(q.data.map.start, legs);
    assert.ok(cells);
    const end = cells[cells.length - 1];
    assert.equal(end.join(','), q.answer);
    cells.forEach((c) => assert.ok(!q.data.map.rocks.some((r) => r[0] === c[0] && r[1] === c[1]), '路线上不能有石头'));
  }));
  [2, 3].forEach((d) => each('u7', 'obstacle', d, (q) => {
    const f = q.data.figure;
    const ok = q.data.options.filter((o) => {
      const legs = [...o.matchAll(/向(东|西|南|北)走 (\d+) 格/g)].map((m) => ({ dir: m[1], n: Number(m[2]) }));
      const cells = MI.u7.walk(f.start, legs);
      if (!cells) return false;
      if (cells.some((c) => f.rocks.some((r) => r[0] === c[0] && r[1] === c[1]))) return false;
      return cells[cells.length - 1].join(',') === f.treasure.join(',');
    });
    assert.deepEqual(ok, [q.answer]);
  }));
});

test('鸡兔同笼：答案满足头数和脚数', () => {
  [1, 2].forEach((d) => each('u8', 'table', d, (q) => {
    const c = q.answer, r = q.data.heads - c;
    assert.ok(c > 0 && r > 0);
    assert.equal(2 * c + 4 * r, q.data.legs);
  }));
  [1, 2].forEach((d) => each('u8', 'draw', d, (q) => {
    const r = q.answer, c = q.data.heads - r;
    assert.equal(2 * c + 4 * r, q.data.legs);
  }));
  [2, 3].forEach((d) => each('u8', 'variant', d, (q) => {
    const nums = q.prompt.match(/\d+/g).map(Number);
    const [big, small] = q.answer.map(Number);
    assert.ok(big > 0 && small > 0);
    assert.ok(nums.includes(big + small), '总数对得上');
  }));
  each('u8', 'score', 3, (q) => {
    const [N, a, b, S] = q.prompt.match(/\d+/g).map(Number);
    const c = Number(q.answer);
    assert.equal(a * c - b * (N - c), S);
  });
});

test('期末大挑战：混合 8 座岛出题', () => {
  const rng = MI.makeRng(9);
  const quiz = MI.quizRound(MI.unitPool('u9'), rng);
  assert.equal(quiz.length, 15);
  assert.ok(new Set(quiz.map((x) => x.unit)).size >= 6, '15 道题至少来自 6 个单元');
});

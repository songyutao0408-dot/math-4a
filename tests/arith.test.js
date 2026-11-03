// 竖式乘法逐步分解：部分积、进位、对齐、末尾 0
const test = require('node:test');
const assert = require('node:assert/strict');
const MI = require('./_load.js');
const M = MI.mul;
const rows = (a, b) => M.layout(a, b).rows.map((r) => [r.kind, M.rowString(r.cols)]);

test('课本例题：24 × 13', () => {
  assert.deepEqual(rows(24, 13), [['p1', '_72'], ['p2', '24_'], ['sum', '312']]);
  const L = M.layout(24, 13);
  assert.equal(L.rows[0].m, 3);
  assert.equal(L.rows[1].m, 1);
});

test('145 × 12、305 × 24（中间有 0）、999 × 99', () => {
  assert.deepEqual(rows(145, 12), [['p1', '_290'], ['p2', '145_'], ['sum', '1740']]);
  assert.deepEqual(rows(305, 24), [['p1', '1220'], ['p2', '610_'], ['sum', '7320']]);
  assert.deepEqual(rows(999, 99), [['p1', '_8991'], ['p2', '8991_'], ['sum', '98901']]);
});

test('因数末尾有 0：0 前面的数对齐，0 写在后面', () => {
  const L = M.layout(450, 30);
  assert.deepEqual(rows(450, 30), [['final', '13500']]);
  assert.equal(L.z, 2);
  assert.equal(L.rows[0].core, '135');
  // 45 和 3 对齐：450 的最右一位在第 1 列，30 的最右一位也在第 1 列，积多出一列
  assert.equal(L.top.end, 1);
  assert.equal(L.bottom.end, 1);
  assert.deepEqual(rows(160, 25), [['p1', '_80_'], ['p2', '32__'], ['sum', '4000']]);
  assert.deepEqual(rows(250, 12), [['p1', '_50_'], ['p2', '25__'], ['sum', '3000']]);
  assert.deepEqual(rows(900, 90), [['final', '81000']]);
});

test('进位：每一步 m × d + 进位 = 乘积，写个位、进十位', () => {
  const r = M.partial(397, 6);
  assert.equal(r.value, 2382);
  assert.deepEqual(r.steps.map((s) => s.write), [2, 8, 3, 2]); // 个位 2、十位 8、百位 3，最后进位 2
  assert.deepEqual(r.steps.slice(0, 3).map((s) => s.carryOut), [4, 5, 2]);
  assert.ok(r.steps[3].final);
});

test('随机 5000 道：每一行、每一步都自洽', () => {
  const rng = MI.makeRng(2024);
  for (let i = 0; i < 5000; i++) {
    const a = rng.int(10, 999), b = rng.int(10, 99);
    const L = M.layout(a, b);
    // 最后一行就是积
    const last = L.rows[L.rows.length - 1];
    assert.equal(Number(last.value), a * b);
    assert.equal(M.rowString(last.cols).replace(/_/g, ''), String(a * b));
    L.rows.forEach((row, r) => {
      // 每一步的进位链
      if (row.kind !== 'sum') {
        let carry = 0;
        row.steps.forEach((s) => {
          if (s.final) { assert.equal(s.write, carry); return; }
          assert.equal(s.carryIn, carry);
          assert.equal(s.prod, s.m * s.d + carry);
          assert.equal(s.write, s.prod % 10);
          carry = s.carryOut;
        });
      }
      // 每一格都能给出提示
      for (let c = 0; c < L.width; c++) assert.equal(typeof M.cellHint(L, r, c), 'string');
    });
    if (L.rows.length === 3) {
      assert.equal(Number(L.rows[0].value) + Number(L.rows[1].value) * 10, Number(L.rows[2].core));
      // 第二个部分积的个位那一格必须空着
      assert.equal(L.rows[1].cols[L.rows[1].start - 1], '');
    }
  }
});

test('提示像老师说话', () => {
  const L = M.layout(24, 13);
  assert.match(M.cellHint(L, 0, 0), /用 3 乘 4 得 12，写 2 进 1/);
  assert.match(M.cellHint(L, 1, 0), /十位对齐/);
  assert.match(M.cellHint(M.layout(450, 30), 0, 0), /添上 2 个 0/);
});

test('鸡兔同笼求解', () => {
  assert.deepEqual(MI.chickRabbit(8, 26), { small: 3, big: 5 });       // 课本例题：鸡 3 兔 5
  assert.deepEqual(MI.chickRabbit(35, 94), { small: 23, big: 12 });    // 《孙子算经》：雉 23 兔 12
  assert.deepEqual(MI.chickRabbit(10, 52, 4, 6), { small: 4, big: 6 }); // 租船：小船 4 人、大船 6 人
  assert.equal(MI.chickRabbit(8, 27), null);   // 脚数是奇数，无解
  assert.equal(MI.chickRabbit(8, 40), null);   // 脚太多，兔比头还多
  assert.equal(MI.chickRabbit(8, 10), null);   // 脚太少
  const rng = MI.makeRng(7);
  for (let i = 0; i < 2000; i++) {
    const c = rng.int(0, 40), r = rng.int(0, 40);
    assert.deepEqual(MI.chickRabbit(c + r, 2 * c + 4 * r), { small: c, big: r });
  }
});

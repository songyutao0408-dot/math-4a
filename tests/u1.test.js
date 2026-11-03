// 第①单元：用独立的方法再验算一遍答案
const test = require('node:test');
const assert = require('node:assert/strict');
const MI = require('./_load.js');
const N = MI.num;
const RUNS = Number(process.env.RUNS || 1000);

function each(gen, d, fn) {
  for (let i = 0; i < RUNS; i++) fn(MI.makeQuestion({ unit: 'u1', gen, seed: (i * 40503 + 7) >>> 0, d }));
}
// 独立的“四舍五入”：用字符串做，不调用 approx
function roundByString(n, unit) {
  const s = String(n), cut = unit === '万' ? 4 : 8;
  const head = s.length > cut ? Number(s.slice(0, s.length - cut)) : 0;
  const look = Number(s[s.length - cut]);
  return look >= 5 ? head + 1 : head;
}

test('读数题：答案读法能还原成题目里的数', () => {
  [1, 2, 3].forEach((d) => each('readTiles', d, (q) => assert.equal(N.parseChineseReading(q.answer), Number(q.data.show))));
  [2, 3].forEach((d) => each('readChoice', d, (q) => {
    assert.equal(N.parseChineseReading(q.answer), Number(q.data.show));
    q.data.options.filter((o) => o !== q.answer).forEach((o) => assert.notEqual(o, MI.toChineseReading(Number(q.data.show))));
  }));
});

test('写数题：答案的读法就是题目给的读法', () => {
  [1, 2, 3].forEach((d) => each('writeNumber', d, (q) => {
    const r = q.prompt.replace(/^.*[：:]/, '');
    assert.equal(MI.toChineseReading(Number(q.answer)), r);
  }));
});

test('求近似数：和字符串算法结果一致', () => {
  [1, 2, 3].forEach((d) => each('roundDigit', d, (q) => {
    const n = Number(q.data.n), unit = q.data.unit;
    const k = roundByString(n, unit);
    assert.ok(n % N.unitValue(unit) !== 0, '整万/整亿数不该出近似数题');
    assert.ok(k >= 1);
    const ans = d === 1 ? String(k) : '≈' + k + unit;
    assert.equal(q.answer, ans);
  }));
});

test('近似数倒推：最大、最小正确', () => {
  [2, 3].forEach((d) => each('roundRange', d, (q) => {
    const unit = /亿/.test(q.prompt) ? '亿' : '万';
    const k = Number(q.prompt.match(/约是 (\d+)/)[1]);
    const [max, min] = q.answer.map(Number);
    assert.equal(roundByString(max, unit), k);
    assert.equal(roundByString(min, unit), k);
    assert.notEqual(roundByString(max + 1, unit), k);
    assert.notEqual(roundByString(min - 1, unit), k);
  }));
});

test('□ 题：逐个代入验证', () => {
  [2, 3].forEach((d) => each('roundBox', d, (q) => {
    const [A, rhs] = q.data.show.split(' ≈ ');
    const k = Number(rhs.replace('万', ''));
    q.data.options.forEach((x) => {
      const ok = roundByString(Number(A.replace('□', x)), '万') === k;
      assert.equal(q.answer.includes(x), ok, q.data.show + ' 填 ' + x);
    });
  }));
  [2, 3].forEach((d) => each('compareBox', d, (q) => {
    const [A, op, B] = q.data.show.split(' ');
    q.data.options.forEach((x) => {
      const a = Number(A.replace('□', x)), b = Number(B);
      const ok = op === '>' ? a > b : a < b;
      assert.equal(q.answer.includes(x), ok, q.data.show + ' 填 ' + x);
    });
  }));
});

test('比较大小：答案正确', () => {
  [1, 2, 3].forEach((d) => each('compare', d, (q) => {
    const [l, r] = q.data.show.split(' ○ ').map((t) => t.endsWith('万') ? Number(t.slice(0, -1)) * 1e4 : t.endsWith('亿') ? Number(t.slice(0, -1)) * 1e8 : Number(t));
    assert.equal(q.answer, l > r ? '>' : l < r ? '<' : '=');
  }));
});

test('分级：分级线位置正确', () => {
  [1, 2, 3].forEach((d) => each('splitLevels', d, (q) => {
    const s = q.data.digits;
    const joined = s.split('').map((c, i) => c + (q.answer.includes(i) ? '｜' : '')).join('');
    assert.equal(joined, N.splitLevelsText(Number(s)));
  }));
});

test('数的组成：按描述重新算一遍', () => {
  [1, 2, 3].forEach((d) => each('compose', d, (q) => {
    let n = 0;
    const re = /(\d) 个(千亿|百亿|十亿|亿|千万|百万|十万|万|千|百|十|一)/g;
    let m;
    while ((m = re.exec(q.prompt))) n += Number(m[1]) * Math.pow(10, N.COUNT_UNITS.indexOf(m[2]));
    assert.equal(String(n), q.answer);
  }));
});

test('数字卡组八位数：只有答案符合要求', () => {
  each('arrangeCards', 3, (q) => {
    const want = /一个零也不读/.test(q.prompt) ? 0 : /只读一个零/.test(q.prompt) ? 1 : 2;
    q.data.options.forEach((o) => {
      assert.equal(o.length, 8);
      assert.equal(N.zeroCount(Number(o)) === want, o === q.answer, o);
    });
  });
});

test('拼读字块：拆分后能拼回原读法', () => {
  ['三亿零二百万零五百', '十万一千', '一千零一万零一十', '十亿零一万'].forEach((r) => {
    assert.equal(MI.u1.tokenize(r).join(''), r);
  });
});

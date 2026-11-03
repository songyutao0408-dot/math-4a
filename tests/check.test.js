const test = require('node:test');
const assert = require('node:assert/strict');
const MI = require('./_load.js');

const fill = (answer, data) => ({ type: 'fill', answer, data: data || {} });

test('填空：全角、空格、千分位逗号都能识别', () => {
  const q = fill('302000500');
  assert.ok(MI.check(q, '302000500'));
  assert.ok(MI.check(q, '３０２０００５００'));
  assert.ok(MI.check(q, '302,000,500'));
  assert.ok(MI.check(q, ' 302 000 500 '));
  assert.ok(MI.check(q, '302，000，500'));
  assert.ok(!MI.check(q, '30200500'));
  assert.ok(!MI.check(q, ''));
});

test('填空：符号和单位', () => {
  const q = fill('≈49万', { prefix: '485600' });
  assert.ok(MI.check(q, '≈49万'));
  assert.ok(MI.check(q, '约49万'));
  assert.ok(MI.check(q, '485600≈49万'));
  assert.ok(!MI.check(q, '=49万'), '求近似数不能用等号');
  assert.ok(!MI.check(q, '49万'));
  const q2 = fill('36', { suffix: '万' });
  assert.ok(MI.check(q2, '36'));
  assert.ok(MI.check(q2, '36万'));
});

test('填空：多个空、角度容差', () => {
  assert.ok(MI.check(fill(['54999', '45000']), ['54999', '45,000']));
  assert.ok(!MI.check(fill(['54999', '45000']), ['45000', '54999']));
  const deg = fill('60', { tolerance: 2 });
  assert.ok(MI.check(deg, '61'));
  assert.ok(MI.check(deg, '58°'));
  assert.ok(MI.check(deg, '62度'));
  assert.ok(!MI.check(deg, '63'));
});

test('读法：规范化后比较', () => {
  const q = { type: 'reading', answer: '十万一千' };
  assert.ok(MI.check(q, '十万一千'));
  assert.ok(MI.check(q, '一十万一千'));
  assert.ok(MI.check(q, ['十', '万', '一千']));
  assert.ok(MI.check(q, '十万 一千'));
  assert.ok(!MI.check(q, '十万零一千'));
  const q2 = { type: 'reading', answer: '二十亿零三百万' };
  assert.ok(MI.check(q2, '两十亿零三百万'));
  assert.ok(MI.check(q2, '贰拾亿零叁佰万'));
});

test('多选、选择、判断', () => {
  assert.ok(MI.check({ type: 'multi', answer: ['7', '8', '9'] }, ['9', '7', '8']));
  assert.ok(!MI.check({ type: 'multi', answer: ['7', '8', '9'] }, ['7', '8']));
  assert.ok(MI.check({ type: 'choice', answer: '>' }, '>'));
  assert.ok(MI.check({ type: 'judge', answer: false }, false));
  assert.ok(!MI.check({ type: 'judge', answer: false }, true));
});

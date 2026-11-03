// 存储：Node 里没有 localStorage，正好测试“存储不可用时退回内存，照样能用”
const test = require('node:test');
const assert = require('node:assert/strict');
const MI = require('./_load.js');
require('../js/core/storage.js');

test('存储不可用时退回内存', () => {
  assert.equal(MI.store.available, false);
  MI.store.set('x', { a: 1 });
  assert.deepEqual(MI.store.get('x'), { a: 1 });
  assert.equal(MI.store.get('nope', 5), 5);
});

test('错题本：连续答对 2 次自动移出', () => {
  const q = MI.makeQuestion({ unit: 'u1', gen: 'readTiles', seed: 1, d: 1 });
  MI.progress.addWrong(q);
  assert.ok(MI.progress.wrongBook()[q.id]);
  assert.equal(MI.progress.wrongRight(q), false);
  MI.progress.addWrong(q); // 中间又错了，重新计数
  assert.equal(MI.progress.wrongRight(q), false);
  assert.equal(MI.progress.wrongRight(q), true);
  assert.equal(MI.progress.wrongBook()[q.id], undefined);
  // 错题能原样重现
  MI.progress.addWrong(q);
  const ref = MI.progress.wrongBook()[q.id].ref;
  assert.deepEqual(MI.makeQuestion(ref), q);
});

test('测验星星保留最高纪录', () => {
  assert.equal(MI.progress.recordQuiz('u1', 12, 15, 2), true);
  assert.equal(MI.progress.recordQuiz('u1', 9, 15, 1), false);
  assert.equal(MI.progress.unit('u1').bestStars, 2);
  assert.equal(MI.progress.unit('u1').quizCount, 2);
});

test('统计与完成度', () => {
  const q = MI.makeQuestion({ unit: 'u1', gen: 'compare', seed: 3, d: 1 });
  MI.progress.recordAnswer(q, true);
  MI.progress.recordAnswer(q, false);
  const st = MI.progress.skillStat('u1', 'compare');
  assert.deepEqual([st.a, st.c], [2, 1]);
  MI.progress.setCardKnown('u1', 'read', true);
  const c = MI.progress.completion('u1');
  assert.ok(c > 0 && c <= 100);
});

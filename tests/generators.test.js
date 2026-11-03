// 每个生成器、每个难度随机跑 1000 次：结构完整、答案自洽、无非法值、选项不重复
const test = require('node:test');
const assert = require('node:assert/strict');
const MI = require('./_load.js');

const RUNS = Number(process.env.RUNS || 1000);
const BAD_TEXT = /undefined|NaN|null|Infinity|\[object/;

function allText(q) {
  const parts = [q.prompt, q.hint].concat(q.explanation);
  const d = q.data || {};
  ['show', 'template'].forEach((k) => d[k] != null && parts.push(String(d[k])));
  (d.options || []).forEach((o) => parts.push(String(o)));
  (d.tiles || []).forEach((o) => parts.push(String(o)));
  return parts.join('\n');
}

function validate(q) {
  const where = q.id + ' ' + q.prompt;
  for (const k of ['id', 'unit', 'skill', 'type', 'difficulty', 'prompt', 'data', 'explanation', 'hint']) {
    assert.ok(q[k] !== undefined && q[k] !== null && q[k] !== '', '缺少 ' + k + '：' + where);
  }
  assert.ok(q.answer !== undefined && q.answer !== null, '缺少答案：' + where);
  assert.ok(Array.isArray(q.explanation) && q.explanation.length > 0, '没有讲解：' + where);
  q.explanation.forEach((s) => assert.equal(typeof s, 'string'));
  const text = allText(q);
  assert.ok(!BAD_TEXT.test(text), '出现非法文字：' + where + '\n' + text);
  assert.ok(!/(^|[^\d])-\d/.test(text), '出现负数：' + where + '\n' + text);
  assert.ok(!/\d\.\d/.test(text), '出现小数：' + where + '\n' + text);

  const opts = q.data.options;
  if (q.type === 'choice' || q.type === 'multi') {
    assert.ok(Array.isArray(opts) && opts.length >= 2, '选项太少：' + where);
    assert.equal(new Set(opts.map(String)).size, opts.length, '选项重复：' + where + ' ' + JSON.stringify(opts));
  }
  if (q.type === 'choice') assert.ok(opts.includes(q.answer), '正确答案不在选项里：' + where);
  if (q.type === 'multi') {
    assert.ok(q.answer.length > 0 && q.answer.length < opts.length, '多选答案数量不合理：' + where);
    q.answer.forEach((a) => assert.ok(opts.includes(a), '多选答案不在选项里：' + where));
  }
  if (q.type === 'judge') assert.equal(typeof q.answer, 'boolean');
  if (q.type === 'reading') {
    // 正确读法必须能用字块拼出来
    const pool = q.data.tiles.slice();
    MI.u1.tokenize(q.answer).forEach((t) => {
      const i = pool.indexOf(t);
      assert.ok(i >= 0, '字块拼不出正确读法：' + where);
      pool.splice(i, 1);
    });
  }
  if (q.type === 'fill' || q.type === 'round' || q.type === 'abacus') {
    const blanks = ((q.data.template || '[]').match(/\[\]/g) || []).length;
    const ans = Array.isArray(q.answer) ? q.answer : [q.answer];
    assert.equal(blanks, ans.length, '空的个数和答案个数不一致：' + where);
    ans.forEach((a) => assert.ok(String(a).length > 0 && String(a).length <= 14, '答案长度异常：' + where));
  }
  if (q.type === 'placeValue') {
    assert.ok(/^[1-9]\d*$/.test(q.answer), where);
    assert.ok(q.answer.length <= q.data.levels * 4, '数位顺序表放不下：' + where);
  }
  // 答案自洽：把正确答案交给判定函数，必须判对
  // 有几个正确答案的“点一点”题，每个都要判对
  const samples = q.type === 'pick' && Array.isArray(q.answer) ? q.answer : [q.answer];
  samples.forEach((a) => assert.ok(MI.check(q, a), '正确答案被判错：' + where));
}

Object.keys(MI.units).forEach((uid) => {
  const unit = MI.units[uid];
  Object.keys(unit.generators).forEach((gid) => {
    const g = unit.generators[gid];
    g.levels.forEach((d) => {
      test(`${uid}.${gid} 难度${d} × ${RUNS}`, () => {
        for (let i = 0; i < RUNS; i++) {
          const ref = { unit: uid, gen: gid, seed: (i * 2654435761) >>> 0, d };
          const q = MI.makeQuestion(ref);
          validate(q);
          // 同样的参数必须生成同样的题（错题本靠它重现）
          const q2 = MI.makeQuestion(ref);
          assert.deepEqual(q2, q, '同一个 seed 生成的题不一样：' + q.id);
        }
      });
    });
  });
});

test('组卷：练一练 10 题、测验 15 题，知识点尽量分散', () => {
  Object.keys(MI.units).forEach((uid) => {
    for (let k = 0; k < 50; k++) {
      const rng = MI.makeRng(k + 1);
      [1, 2, 3].forEach((d) => {
        const r = MI.practiceRound(uid, d, rng);
        assert.equal(r.length, 10);
        const skills = new Set(r.map((x) => MI.units[uid].generators[x.gen].skill));
        const avail = new Set(MI.generatorsFor(uid, d).map((g) => g.skill)).size;
        assert.ok(skills.size >= Math.min(5, avail), uid + ' 难度' + d + ' 练一练知识点太集中');
      });
      const quiz = MI.quizRound([uid], rng);
      assert.equal(quiz.length, 15);
      assert.deepEqual(quiz.map((x) => x.d), [1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2, 3, 3, 3, 3]);
    }
  });
});

test('星星规则', () => {
  assert.equal(MI.starsFor(15, 15), 3);
  assert.equal(MI.starsFor(12, 15), 2);
  assert.equal(MI.starsFor(9, 15), 1);
  assert.equal(MI.starsFor(8, 15), 0);
  assert.equal(MI.starsFor(14, 15), 2);
});

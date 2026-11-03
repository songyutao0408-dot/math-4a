/* 数学岛 · 乘法工具：竖式乘法逐步分解（部分积、进位、对齐）——纯函数，可在 Node 中测试 */
(function (root) {
  'use strict';
  var MI = root.MathIsland = root.MathIsland || {};

  /** 去掉末尾的 0：450 → {core:45, zeros:1} */
  function stripZeros(n) {
    var z = 0;
    while (n > 0 && n % 10 === 0) { n = n / 10; z++; }
    return { core: n, zeros: z };
  }

  /** 一位数 m 乘 a，逐位记录：{ d, m, carryIn, prod, write, carryOut }，从个位开始；最后的进位单独一步 */
  function partial(a, m) {
    var s = String(a), carry = 0, steps = [];
    for (var j = s.length - 1; j >= 0; j--) {
      var d = Number(s[j]), p = m * d + carry;
      steps.push({ d: d, m: m, carryIn: carry, prod: p, write: p % 10, carryOut: Math.floor(p / 10) });
      carry = Math.floor(p / 10);
    }
    if (carry) steps.push({ final: true, write: carry, carryIn: carry });
    return { value: a * m, steps: steps };
  }

  /**
   * 竖式乘法布局（人教版写法）：
   *  - 因数末尾有 0 时，把 0 前面的数对齐，0 写在后面；部分积不带这些 0，最后在积的末尾添 0
   *  - 第二个因数（去 0 后）是两位数：先用个位乘（部分积 1），再用十位乘（部分积 2，末位和十位对齐），最后相加
   *  - 第二个因数（去 0 后）是一位数：只有一行，直接写积
   * 列号从右往左，0 是最右边一列。
   * 返回 { a, b, product, z, width, top:{text,end}, bottom:{text,end}, rows:[...] }
   *   row: { kind:'p1'|'p2'|'sum'|'final', value:'数字串', start:最右一位所在列, m, steps, cols }
   *   cols[c] = 这一列应写的数字（字符），没有则为 ''
   */
  function mulLayout(a, b) {
    var A = stripZeros(a), B = stripZeros(b);
    var z = A.zeros + B.zeros;
    var bs = String(B.core);
    if (bs.length > 2) throw new Error('第二个因数最多两位：' + b);
    var rows = [];
    if (bs.length === 1) {
      var r = partial(A.core, Number(bs));
      rows.push({ kind: 'final', value: String(a * b), start: 0, core: String(r.value), m: Number(bs), steps: r.steps, zeros: z });
    } else {
      var r1 = partial(A.core, Number(bs[1])), r2 = partial(A.core, Number(bs[0]));
      rows.push({ kind: 'p1', value: String(r1.value), start: z, m: Number(bs[1]), steps: r1.steps });
      rows.push({ kind: 'p2', value: String(r2.value), start: z + 1, m: Number(bs[0]), steps: r2.steps });
      // 相加：逐列
      var p1 = String(r1.value), p2 = String(r2.value), carry = 0, sumSteps = [];
      var core = r1.value + r2.value * 10;
      var coreLen = String(core).length;
      for (var k = 0; k < coreLen; k++) {
        var d1 = k < p1.length ? Number(p1[p1.length - 1 - k]) : 0;
        var d2 = k >= 1 && k - 1 < p2.length ? Number(p2[p2.length - k]) : 0;
        var s = d1 + d2 + carry;
        sumSteps.push({ d1: d1, d2: d2, has2: k >= 1 && k - 1 < p2.length, has1: k < p1.length, carryIn: carry, sum: s, write: s % 10, carryOut: Math.floor(s / 10) });
        carry = Math.floor(s / 10);
      }
      rows.push({ kind: 'sum', value: String(a * b), start: 0, core: String(core), steps: sumSteps, zeros: z });
    }
    var top = { text: String(a), end: B.zeros };       // 第一个因数最右一位所在列
    var bottom = { text: String(b), end: A.zeros };    // 第二个因数最右一位所在列
    var width = Math.max(top.text.length + top.end, bottom.text.length + bottom.end + 1);
    rows.forEach(function (row) {
      width = Math.max(width, row.start + row.value.length - (row.kind === 'final' || row.kind === 'sum' ? 0 : 0));
    });
    rows.forEach(function (row) {
      row.cols = [];
      for (var c = 0; c < width; c++) row.cols.push('');
      var v = row.value;
      for (var i = 0; i < v.length; i++) row.cols[row.start + i] = v[v.length - 1 - i];
    });
    return { a: a, b: b, product: a * b, z: z, za: A.zeros, zb: B.zeros, coreA: A.core, coreB: B.core, width: width, top: top, bottom: bottom, rows: rows };
  }

  /** 把一行写成从左到右的字符串，空格用 _ 表示（判定用） */
  function rowString(cols) {
    var s = '';
    for (var c = cols.length - 1; c >= 0; c--) s += cols[c] === '' || cols[c] == null ? '_' : cols[c];
    return s;
  }

  /** 某一行某一列的提示（像老师说话） */
  function cellHint(L, rowIndex, col) {
    var row = L.rows[rowIndex];
    var k = col - row.start;
    if (row.kind === 'sum' || row.kind === 'final') {
      if (col < L.z) return '因数末尾一共有 ' + L.z + ' 个 0，积的末尾要添上 ' + L.z + ' 个 0。';
      k = col - L.z;
    }
    if (row.kind === 'p2' && k < 0) return '用第二个因数十位上的 ' + row.m + ' 去乘，得到的是几个十，末位要和十位对齐，个位这一格空着不写。';
    if (row.kind === 'p1' && k < 0) return '因数末尾的 0 先不管，把 0 前面的数对齐来乘，这一格空着，最后再在积的末尾添 0。';
    var st = row.steps[k];
    if (!st) return '这一格不用写，空着就好。';
    if (row.kind === 'sum') {
      var parts = [];
      if (st.has1) parts.push(st.d1);
      if (st.has2) parts.push(st.d2);
      if (st.carryIn) parts.push(st.carryIn + '（进位）');
      if (!parts.length) return '这一格不用写。';
      if (parts.length === 1) return '这一列只有 ' + parts[0] + '，直接写 ' + st.write + '。';
      return '这一列相加：' + parts.join(' + ') + ' = ' + st.sum + '，写 ' + st.write + (st.carryOut ? '，向前一位进 ' + st.carryOut : '') + '。';
    }
    if (st.final) return '最后还剩进位 ' + st.write + '，直接写在最前面。';
    var who = row.kind === 'p2' ? '用十位上的 ' + row.m : '用 ' + row.m;
    return who + ' 乘 ' + st.d + ' 得 ' + (st.m * st.d) + (st.carryIn ? '，再加上进位 ' + st.carryIn + ' 是 ' + st.prod : '') +
      '，写 ' + st.write + (st.carryOut ? ' 进 ' + st.carryOut : '') + '。';
  }

  /** 整道竖式的讲解步骤 */
  function mulExplain(L) {
    var U = MI.util, out = [];
    if (L.z) out.push('因数末尾有 0：先把 0 前面的数对齐，算 ' + L.coreA + ' × ' + L.coreB + '，最后在积的末尾添上 ' + L.z + ' 个 0');
    L.rows.forEach(function (row) {
      if (row.kind === 'p1') out.push('先用第二个因数个位上的 ' + row.m + ' 乘 ' + L.coreA + '，得 ' + row.value);
      else if (row.kind === 'p2') out.push('再用十位上的 ' + row.m + ' 乘 ' + L.coreA + '，得 ' + row.value + ' 个十，末位写在十位上');
      else if (row.kind === 'sum') out.push('把两次乘得的积加起来：' + L.rows[0].value + ' + ' + L.rows[1].value + '0 = ' + row.core + (L.z ? '，再添 ' + L.z + ' 个 0 → ' + row.value : ''));
      else out.push('用 ' + row.m + ' 乘 ' + L.coreA + '，得 ' + row.core + (L.z ? '，再添 ' + L.z + ' 个 0 → ' + row.value : ''));
    });
    out = U.steps(out);
    out.push('所以 ' + L.a + ' × ' + L.b + ' = ' + L.product);
    return out;
  }

  MI.mul = { stripZeros: stripZeros, partial: partial, layout: mulLayout, rowString: rowString, cellHint: cellHint, explain: mulExplain };
})(typeof window !== 'undefined' ? window : globalThis);

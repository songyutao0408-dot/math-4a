// 静态检查：零外部依赖、不用 ES module、不用较新的语法（照顾旧版微信内核）、键名前缀
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');

function walk(dir, out = []) {
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) walk(p, out); else out.push(p);
  }
  return out;
}
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const srcFiles = walk(path.join(ROOT, 'js')).concat(walk(path.join(ROOT, 'css')), [path.join(ROOT, 'index.html')]);

test('index.html 里的脚本都存在，并且全部引用了', () => {
  const scripts = [...html.matchAll(/<script src="([^"]+)"/g)].map((m) => m[1]);
  scripts.forEach((s) => assert.ok(fs.existsSync(path.join(ROOT, s)), '找不到 ' + s));
  const jsFiles = walk(path.join(ROOT, 'js')).map((p) => path.relative(ROOT, p).split(path.sep).join('/'));
  jsFiles.forEach((f) => assert.ok(scripts.includes(f), f + ' 没有在 index.html 里加载'));
  assert.ok(!/type="module"/.test(html), '不能用 ES module');
});

test('零外部依赖：没有 http(s) 链接、没有 import/export', () => {
  srcFiles.forEach((f) => {
    const code = fs.readFileSync(f, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
    assert.ok(!/https?:\/\/(?!www\.w3\.org)/.test(code), f + ' 引用了外部地址');
    if (f.endsWith('.js')) {
      assert.ok(!/^\s*(import|export)\s/m.test(code), f + ' 用了 import/export');
      assert.ok(!/\?\.|\?\?/.test(code), f + ' 用了 ?. 或 ??（旧版微信内核不支持）');
      assert.ok(!/\b(replaceAll|structuredClone)\b|\.at\(/.test(code), f + ' 用了较新的 API');
    }
  });
});

test('所有路径都是相对路径', () => {
  [...html.matchAll(/(?:src|href)="([^"]+)"/g)].forEach((m) => {
    assert.ok(!m[1].startsWith('/'), '绝对路径：' + m[1]);
  });
  assert.ok(fs.existsSync(path.join(ROOT, '.nojekyll')), '缺少 .nojekyll');
});

test('本地存储只通过 MI.store（统一 mi4a: 前缀、try/catch 保护）', () => {
  walk(path.join(ROOT, 'js')).forEach((f) => {
    if (f.endsWith('storage.js')) return;
    const code = fs.readFileSync(f, 'utf8');
    assert.ok(!/localStorage/.test(code), f + ' 直接用了 localStorage');
    (code.match(/sessionStorage\.\w+Item\('([^']+)/g) || []).forEach((m) => assert.ok(m.includes("'mi4a:"), f + ' sessionStorage 键名缺前缀'));
  });
});

test('打包：单文件版和 Service Worker 清单都是最新的（改了代码请运行 node scripts/bundle.js）', () => {
  const B = require('../scripts/bundle.js');
  const a = B.assets();
  a.list.filter((f) => f !== './').forEach((f) => assert.ok(fs.existsSync(path.join(ROOT, f)), '缺少文件 ' + f));
  const sw = fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8');
  assert.ok(sw.includes("var VERSION = '" + B.version(a.list) + "'"), 'sw.js 版本号过期');
  a.list.forEach((f) => assert.ok(sw.includes("'" + f + "'"), 'sw.js 缺少缓存文件 ' + f));
  const dist = fs.readFileSync(path.join(ROOT, 'dist', 'math-island.html'), 'utf8');
  assert.equal(dist, B.bundle(a), 'dist/math-island.html 过期');
  assert.ok(!/<script src=|<link rel="stylesheet"/.test(dist), '单文件版不能再引用外部文件');
  assert.ok(!/https?:\/\/(?!www\.w3\.org)/.test(dist.replace(/\/\*[\s\S]*?\*\//g, '')), '单文件版引用了外部地址');
});

test('manifest：相对路径，适配 /仓库名/ 子路径', () => {
  const m = JSON.parse(fs.readFileSync(path.join(ROOT, 'manifest.json'), 'utf8'));
  assert.equal(m.start_url, './');
  assert.equal(m.scope, './');
  m.icons.forEach((i) => { assert.ok(!i.src.startsWith('/')); assert.ok(fs.existsSync(path.join(ROOT, i.src))); });
});

#!/usr/bin/env node
/* 数学岛 · 打包脚本（Node，无依赖）
 * 1. 把所有 CSS、JS 内联成一个独立文件 dist/math-island.html，可以发到手机上用浏览器离线打开
 * 2. 更新 sw.js 里的缓存清单（ASSETS）和版本号（VERSION），保证 PWA 缓存的是最新文件
 * 用法：node scripts/bundle.js */
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const ROOT = path.join(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');

function assets() {
  const html = read('index.html');
  const scripts = [...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map((m) => m[1]);
  const styles = [...html.matchAll(/<link rel="stylesheet" href="([^"]+)">/g)].map((m) => m[1]);
  const icons = fs.readdirSync(path.join(ROOT, 'icons')).sort().map((f) => 'icons/' + f);
  return { html, scripts, styles, list: ['./', 'index.html', 'manifest.json'].concat(styles, scripts, icons) };
}

function version(list) {
  const h = crypto.createHash('sha1');
  list.filter((f) => f !== './').forEach((f) => h.update(f + '\n').update(fs.readFileSync(path.join(ROOT, f))));
  return 'mi4a-' + h.digest('hex').slice(0, 10);
}

function bundle(a, opts) {
  opts = opts || {};
  let out = a.html;
  // 单文件版不注册 Service Worker；嵌在别的页面里时用内存路由
  const flags = 'window.MathIslandSingleFile = true;' + (opts.memoryRouter ? ' window.MathIslandMemoryRouter = true;' : '');
  out = out.replace('<script src="' + a.scripts[0] + '"></script>', () => '<script>' + flags + '</script>\n  <script src="' + a.scripts[0] + '"></script>');
  // 单文件版不需要 manifest、图标和 Service Worker（本地文件打开时也不会注册）
  out = out.replace(/\s*<link rel="manifest"[^>]*>/, '').replace(/\s*<link rel="apple-touch-icon"[^>]*>/, '');
  a.styles.forEach((s) => {
    out = out.replace(`<link rel="stylesheet" href="${s}">`, () => '<style>\n' + read(s) + '\n</style>');
  });
  a.scripts.forEach((s) => {
    const code = read(s).replace(/<\/script/gi, '<\\/script');
    out = out.replace(`<script src="${s}"></script>`, () => '<script>/* ' + s + ' */\n' + code + '\n</script>');
  });
  out = out.replace('<title>', '<!-- 单文件离线版：由 scripts/bundle.js 生成，请不要手改 -->\n  <title>');
  return out;
}

/** 嵌入版：只要页面内容（外层的 <!doctype>/<html>/<head>/<body> 由宿主提供） */
function embedded(a) {
  const full = bundle(a, { memoryRouter: true });
  const head = full.slice(full.indexOf('<head>') + 6, full.indexOf('</head>'));
  const body = full.slice(full.indexOf('<body>') + 6, full.lastIndexOf('</body>'));
  return head.replace(/<title>[^<]*<\/title>/, '<title>数学岛</title>')
    .replace(/\s*<meta charset="utf-8">/, '')
    // 宿主已经给 :root 加了刘海的上下留白，这里不要重复
    + '\n<style>body { padding-top: 0; }</style>\n' + body;
}

function main() {
  const a = assets();
  const ai = process.argv.indexOf('--embedded');
  if (ai >= 0) {
    const out = process.argv[ai + 1];
    fs.writeFileSync(out, embedded(a));
    console.log('✔ 嵌入版 ' + out);
    return;
  }
  const v = version(a.list);
  // 更新 sw.js
  let sw = read('sw.js');
  sw = sw.replace(/var VERSION = '[^']*';/, `var VERSION = '${v}';`)
    .replace(/var ASSETS = \[[\s\S]*?\];/, 'var ASSETS = ' + JSON.stringify(a.list, null, 2).replace(/"/g, "'") + ';');
  fs.writeFileSync(path.join(ROOT, 'sw.js'), sw);
  // 单文件版
  fs.mkdirSync(path.join(ROOT, 'dist'), { recursive: true });
  const html = bundle(a);
  fs.writeFileSync(path.join(ROOT, 'dist', 'math-island.html'), html);
  console.log('✔ dist/math-island.html  ' + Math.round(html.length / 1024) + ' KB');
  console.log('✔ sw.js  ' + v + '，缓存 ' + a.list.length + ' 个文件');
}

if (require.main === module) main();
module.exports = { assets, version, bundle, embedded };

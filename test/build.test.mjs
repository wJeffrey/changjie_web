// npm test：构建一次并检查生成页面的结构与引用。
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { build, ROOT } from '../build.mjs';

const pages = Object.fromEntries(build().map((p) => [p.out, p.html]));
const data = (f) => JSON.parse(readFileSync(join(ROOT, 'src/data', f), 'utf8'));
const count = (s, re) => (s.match(re) || []).length;

test('生成首页和配置器', () => {
  assert.deepEqual(Object.keys(pages).sort(), ['configurator.html', 'index.html']);
});

test('没有遗留的模板标记或占位符', () => {
  for (const [name, html] of Object.entries(pages)) {
    assert.ok(!html.includes('{{'), `${name} 含有未渲染的 {{`);
    assert.ok(!/__LINES__|__SITE__/.test(html), `${name} 含有未替换的占位符`);
    assert.ok(!/>undefined<|"undefined"/.test(html), `${name} 含有 undefined`);
  }
});

test('首页产品数量与数据一致，且只有第一个面板显示', () => {
  const products = data('products.json'), html = pages['index.html'];
  assert.equal(count(html, /<button role="tab"/g), products.length);
  assert.equal(count(html, /<article class="prod-panel"/g), products.length);
  assert.equal(count(html, /<article class="prod-panel"[^>]* hidden>/g), products.length - 1);
  assert.equal(count(html, /<button role="tab"[^>]*aria-selected="true"/g), 1);
});

test('配置器内嵌的产品系列与数据一致', () => {
  const lines = data('lines.json'), html = pages['configurator.html'];
  for (const l of lines) assert.ok(html.includes(`"id": "${l.id}"`), `配置器缺少系列 ${l.id}`);
});

test('两页都带公司电话、页头导航和页脚', () => {
  const site = data('site.json');
  for (const [name, html] of Object.entries(pages)) {
    assert.ok(html.includes(site.phone), `${name} 缺少电话`);
    assert.ok(html.includes('class="header"') && html.includes('class="footer"'), `${name} 缺少页头或页脚`);
    assert.equal(count(html, /<nav class="nav"/g), 1);
  }
  assert.equal(count(pages['configurator.html'], /aria-current="page"/g), 1);
  assert.equal(count(pages['index.html'], /aria-current="page"/g), 0);
});

test('页面引用的本地文件都存在', () => {
  for (const [name, html] of Object.entries(pages)) {
    const refs = new Set([...html.matchAll(/(?:src|href)="([^"#?:]+\.[a-z0-9]+)(?:[?#][^"]*)?"/g)].map((m) => m[1]));
    for (const ref of refs) assert.ok(existsSync(join(ROOT, ref)), `${name} 引用了不存在的文件 ${ref}`);
  }
});

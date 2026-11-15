// 站点构建：把 src/ 下的模板、部件和数据渲染成仓库根目录的静态页面。
// 用法：npm run build（零依赖，仅用 Node 自带模块）
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const ROOT = dirname(fileURLToPath(import.meta.url));
const SRC = join(ROOT, 'src');
const read = (p) => readFileSync(join(SRC, p), 'utf8');
const json = (p) => JSON.parse(read(p));
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/* ---------- 迷你模板 ----------
   {{name.path}} 转义输出　{{{name}}} 原样输出　{{> partials/x.html}} 引入部件
   {{#each list}}…{{/each}}　{{#if cond}}…{{/if}}　循环内用 {{this}} 或直接写字段名 */
const TAG = '\\{\\{\\{\\s*([^}]+?)\\s*\\}\\}\\}|\\{\\{\\s*([#/>]?)\\s*([^}]*?)\\s*\\}\\}';

function parse(src, file) {
  const root = { type: 'root', children: [] };
  const stack = [root];
  const re = new RegExp(TAG, 'g');
  let last = 0, m;
  const top = () => stack[stack.length - 1];
  while ((m = re.exec(src))) {
    if (m.index > last) top().children.push({ type: 'text', value: src.slice(last, m.index) });
    last = re.lastIndex;
    if (m[1] !== undefined) top().children.push({ type: 'var', path: m[1], raw: true });
    else if (m[2] === '>') top().children.push(...parse(read(m[3]), m[3]).children);
    else if (m[2] === '#') {
      const [kind, path] = m[3].split(/\s+/);
      if (kind !== 'each' && kind !== 'if') throw new Error(`${file}: 未知标签 {{#${kind}}}`);
      const node = { type: kind, path, children: [] };
      top().children.push(node);
      stack.push(node);
    } else if (m[2] === '/') {
      if (stack.length < 2 || top().type !== m[3]) throw new Error(`${file}: {{/${m[3]}}} 没有对应的开始标签`);
      stack.pop();
    } else top().children.push({ type: 'var', path: m[3], raw: false });
  }
  if (stack.length !== 1) throw new Error(`${file}: {{#${top().type}}} 没有闭合`);
  if (last < src.length) root.children.push({ type: 'text', value: src.slice(last) });
  return root;
}

function lookup(path, scopes) {
  if (path === 'this') return scopes[0];
  const keys = path.split('.');
  for (const s of scopes) {
    if (s != null && typeof s === 'object' && keys[0] in s) return keys.reduce((o, k) => (o == null ? undefined : o[k]), s);
  }
  return undefined;
}

function render(nodes, scopes, file) {
  let out = '';
  for (const n of nodes) {
    if (n.type === 'text') out += n.value;
    else if (n.type === 'var') {
      const v = lookup(n.path, scopes);
      if (v === undefined || v === null) throw new Error(`${file}: 模板变量 {{${n.path}}} 没有值`);
      out += n.raw ? String(v) : esc(v);
    } else if (n.type === 'each') {
      const list = lookup(n.path, scopes);
      if (!Array.isArray(list)) throw new Error(`${file}: {{#each ${n.path}}} 不是数组`);
      for (const item of list) out += render(n.children, [item, ...scopes], file);
    } else if (n.type === 'if') {
      if (lookup(n.path, scopes)) out += render(n.children, scopes, file);
    }
  }
  return out;
}

const tpl = (file, data) => render(parse(read(file), file).children, [data], file);

/* ---------- 页面 ---------- */
export function build() {
  const site = json('data/site.json');
  const lines = json('data/lines.json');
  const products = json('data/products.json').map((p, i) => ({ ...p, selected: String(i === 0), rest: i > 0 }));

  // 一致性检查：首页指向配置器的链接必须对应一个存在的产品系列
  const ids = new Set(lines.map((l) => l.id));
  for (const p of products) for (const a of p.actions) {
    const m = /configurator\.html\?line=(\w+)/.exec(a.href);
    if (m && !ids.has(m[1])) throw new Error(`products.json: ${p.id} 链接到不存在的配置器系列 "${m[1]}"`);
  }

  const outputs = [];
  for (const name of site.pages) {
    const dir = `pages/${name}`;
    const meta = json(`${dir}/meta.json`);
    const out = `${name}.html`;
    const base = meta.isHome ? '' : 'index.html';
    const nav = site.nav.map((n) => ({
      label: n.label,
      href: n.anchor ? base + n.anchor : n.page,
      current: n.page === out,
    }));
    const data = { site, products, lines, meta, nav, base, home: meta.isHome ? '#top' : 'index.html', scripts: meta.scripts };
    data.content = tpl(`${dir}/page.html`, data);
    data.css = read(`${dir}/style.css`);
    data.js = read(`${dir}/client.js`)
      .replace('__LINES__', () => JSON.stringify(lines, null, 2).replace(/\n/g, '\n  '))
      .replace('__SITE__', () => JSON.stringify({
        name: site.name, phone: site.phone, email: site.email, address: site.address,
        domain: site.domain, contactPerson: site.contactPerson,
      }));
    const html = tpl('layout.html', data);
    writeFileSync(join(ROOT, out), html);
    outputs.push({ out, html });
  }
  return outputs;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  for (const { out, html } of build()) console.log(`已生成 ${out}（${(Buffer.byteLength(html) / 1024).toFixed(1)} KB）`);
}

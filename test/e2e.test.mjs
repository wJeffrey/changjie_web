// 端到端测试：启动生产服务器（需先 npm run build），用临时目录里的 SQLite 库跑一遍页面与接口。
// 没有构建产物时整组跳过，不影响 lib 的单元测试。
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const built = existsSync(join(root, '.next', 'BUILD_ID'));
const skip = built ? false : '没有构建产物，先运行 npm run build';

const port = 4300 + Math.floor(Math.random() * 500);
const base = `http://127.0.0.1:${port}`;
const dataDir = mkdtempSync(join(tmpdir(), 'cj-e2e-'));
const ADMIN = { user: 'e2e-admin', password: 'e2e-secret' };
const auth = 'Basic ' + Buffer.from(`${ADMIN.user}:${ADMIN.password}`).toString('base64');
let server;
let log = '';

const post = (path, body, headers = {}) =>
  fetch(base + path, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'user-agent': 'Mozilla/5.0 (e2e)', ...headers },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
const message = (over = {}) => ({ name: '测试客户', phone: '186 0000 0000', company: '测试公司', email: 'a@b.cn', content: '需要复合风管报价，请联系。', path: '/', ...over });
const db = () => new DatabaseSync(join(dataDir, 'site.sqlite'), { readOnly: true });
const count = (sql, ...args) => { const d = db(); try { return d.prepare(sql).get(...args).n; } finally { d.close(); } };

before(async () => {
  if (!built) return;
  server = spawn(process.execPath, ['server.mjs'], {
    cwd: root,
    env: {
      ...process.env, PORT: String(port), HOST: '127.0.0.1', DATA_DIR: dataDir, NODE_ENV: 'production',
      ADMIN_USER: ADMIN.user, ADMIN_PASSWORD: ADMIN.password, SMTP_PASS: '', TRUST_PROXY: '',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  server.stdout.on('data', (d) => { log += d; });
  server.stderr.on('data', (d) => { log += d; });
  for (let i = 0; i < 80; i++) {
    try { if ((await fetch(base + '/')).ok) return; } catch { /* 还没起来 */ }
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error('服务器没有在 20 秒内启动：\n' + log);
});

after(() => {
  server?.kill();
  rmSync(dataDir, { recursive: true, force: true });
});

test('首页、配置器、技术手册与静态资源可访问', { skip }, async () => {
  const home = await fetch(base + '/');
  assert.equal(home.status, 200);
  const html = await home.text();
  assert.match(html, /昌杰立盛/);
  assert.match(html, /186 9918 5812/);
  assert.match(html, /lang="zh-CN"/);

  const cfg = await fetch(base + '/configurator');
  assert.equal(cfg.status, 200);
  assert.match(await cfg.text(), /配置/);

  const manual = await fetch(base + '/manual.html');
  assert.equal(manual.status, 200);
  assert.match(manual.headers.get('content-type'), /text\/html/);

  const logo = await fetch(base + '/assets/img/logo.png');
  assert.equal(logo.status, 200);
  assert.match(logo.headers.get('content-type'), /image\/png/);

  assert.equal((await fetch(base + '/no-such-page')).status, 404);
});

test('首页引用的本站图片都存在', { skip }, async () => {
  const html = await (await fetch(base + '/')).text();
  const srcs = [...new Set([...html.matchAll(/(?:src|href)="(\/assets\/[^"]+)"/g)].map((m) => m[1]))];
  assert.ok(srcs.length > 3, '首页应当引用本站图片');
  for (const s of srcs) assert.equal((await fetch(base + s)).status, 200, s);
});

test('访问记录：正常访问入库，爬虫与后台路径不入库，伪造的 X-Forwarded-For 无效', { skip }, async () => {
  const r = await post('/api/visit', { path: '/configurator', referrer: 'https://example.com/' }, { 'x-forwarded-for': '8.8.8.8' });
  assert.equal(r.status, 204);
  assert.equal((await post('/api/visit', { path: '/' }, { 'user-agent': 'Googlebot/2.1' })).status, 204);
  assert.equal((await post('/api/visit', { path: '/admin' })).status, 204);
  assert.equal((await post('/api/visit', { path: 'javascript:alert(1)' })).status, 204);
  assert.equal((await post('/api/visit', 'not json')).status, 204);

  assert.equal(count('SELECT COUNT(*) AS n FROM visits'), 1);
  const d = db();
  const row = d.prepare('SELECT * FROM visits').get();
  d.close();
  assert.equal(row.path, '/configurator');
  assert.equal(row.referrer, 'https://example.com/');
  assert.equal(row.ip, '127.0.0.1', '应记录真实连接地址，而不是访客自带的请求头');
});

test('留言：校验不通过时返回 400 且不入库', { skip }, async () => {
  const bad = [
    ['not json', /格式不正确/],
    [message({ name: '' }), /姓名/],
    [message({ phone: 'abc' }), /电话/],
    [message({ email: 'not-an-email' }), /邮箱/],
    [message({ content: '短' }), /咨询内容/],
  ];
  for (const [body, re] of bad) {
    const r = await post('/api/messages', body);
    assert.equal(r.status, 400);
    const j = await r.json();
    assert.equal(j.ok, false);
    assert.match(j.error, re);
  }
  assert.equal(count('SELECT COUNT(*) AS n FROM messages'), 0);
});

test('留言：蜜罐字段被填写时装作成功但不入库', { skip }, async () => {
  const r = await post('/api/messages', message({ website: 'http://spam.example' }));
  assert.equal(r.status, 200);
  assert.equal((await r.json()).ok, true);
  assert.equal(count('SELECT COUNT(*) AS n FROM messages'), 0);
});

test('留言：正常提交入库，未配置 SMTP 时标记为 skipped', { skip }, async () => {
  const r = await post('/api/messages', message({ name: '<script>alert(1)</script>', content: '体育馆项目需要单面彩钢风管约 2000 平方米。' }));
  assert.equal(r.status, 200);
  assert.equal((await r.json()).ok, true);
  const d = db();
  const row = d.prepare('SELECT * FROM messages').get();
  d.close();
  assert.equal(row.phone, '186 0000 0000');
  assert.equal(row.company, '测试公司');
  assert.equal(row.source_path, '/');
  assert.equal(row.ip, '127.0.0.1');
  assert.equal(row.mail_status, 'skipped');
});

test('后台：没有或错误的账号返回 401，正确账号能看到留言且内容已转义', { skip }, async () => {
  const anon = await fetch(base + '/admin');
  assert.equal(anon.status, 401);
  assert.match(anon.headers.get('www-authenticate') || '', /Basic/);
  const wrong = await fetch(base + '/admin', { headers: { authorization: 'Basic ' + Buffer.from('e2e-admin:nope').toString('base64') } });
  assert.equal(wrong.status, 401);

  const ok = await fetch(base + '/admin', { headers: { authorization: auth } });
  assert.equal(ok.status, 200);
  const html = await ok.text();
  assert.match(html, /体育馆项目需要单面彩钢风管/);
  assert.match(html, /测试公司/);
  assert.ok(!html.includes('<script>alert(1)</script>'), '留言里的 HTML 必须转义后再显示');
  assert.match(html, /&lt;script&gt;/);
  assert.match(html, /\/configurator/);
});

test('留言：同一 IP 一小时内超过 5 条返回 429', { skip }, async () => {
  for (let i = 0; i < 4; i++) assert.equal((await post('/api/messages', message({ content: `第 ${i + 2} 条测试留言内容。` }))).status, 200);
  assert.equal(count('SELECT COUNT(*) AS n FROM messages'), 5);
  const r = await post('/api/messages', message());
  assert.equal(r.status, 429);
  assert.match((await r.json()).error, /频繁/);
  assert.equal(count('SELECT COUNT(*) AS n FROM messages'), 5);
});

test('服务器运行期间没有报错', { skip }, () => {
  const errors = log.split('\n').filter((l) => /error|失败|unhandled/i.test(l) && !/ExperimentalWarning/.test(l));
  assert.deepEqual(errors, []);
});

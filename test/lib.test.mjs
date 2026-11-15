// npm test：数据库、地区识别和访客 IP 提取的单元测试（使用临时目录里的 SQLite 文件）。
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

process.env.DATA_DIR = mkdtempSync(join(tmpdir(), 'cj-test-'));
const db = await import('../lib/db.js');
const { lookupRegion } = await import('../lib/geo.js');
const { clientIp, cut } = await import('../lib/request.js');

const headers = (h) => new Headers(h);

test('访客 IP 取 X-Forwarded-For 最右一项，并去掉 IPv4 映射前缀', () => {
  assert.equal(clientIp(headers({ 'x-forwarded-for': '1.1.1.1, 203.0.113.7' })), '203.0.113.7');
  assert.equal(clientIp(headers({ 'x-forwarded-for': '::ffff:127.0.0.1' })), '127.0.0.1');
  assert.equal(clientIp(headers({})), 'unknown');
});

test('cut 去空白并截断', () => {
  assert.equal(cut('  abc  ', 2), 'ab');
  assert.equal(cut(undefined, 5), '');
});

test('内网地址不查库，公网地址能识别到省市', () => {
  assert.equal(lookupRegion('127.0.0.1').isp, '内网');
  assert.equal(lookupRegion('192.168.1.8').isp, '内网');
  const r = lookupRegion('120.24.78.68');
  assert.equal(r.country, '中国');
  assert.equal(r.province, '广东省');
});

test('访问记录与留言写入后能在后台数据中读到', () => {
  const region = { country: '中国', province: '示例省', city: '示例市', isp: '示例运营商' };
  db.recordVisit({ ip: '203.0.113.7', region, path: '/', referrer: '', userAgent: 'test' });
  db.recordVisit({ ip: '203.0.113.7', region, path: '/configurator', referrer: '', userAgent: 'test' });
  const id = db.createMessage({ name: '张三', phone: '13800000000', company: '', email: '', content: '测试留言内容', sourcePath: '/', ip: '203.0.113.7', region, userAgent: 'test' });
  db.setMailStatus(id, 'failed', 'smtp error');
  const d = db.adminData();
  assert.equal(d.stats.visits, 2);
  assert.equal(d.stats.uniqueIps, 1);
  assert.equal(d.stats.messages, 1);
  assert.equal(d.messages[0].name, '张三');
  assert.equal(d.messages[0].mail_status, 'failed');
  assert.deepEqual({ ...d.regions[0] }, { region: '示例省', n: 2, ips: 1 });
});

test('软管在配置器、首页产品和控制器三处的规格一致', async () => {
  const { readFileSync } = await import('node:fs');
  const read = (f) => readFileSync(new URL('../' + f, import.meta.url), 'utf8');
  const lines = JSON.parse(read('data/lines.json'));
  const hose = lines.find((l) => l.id === 'hose');
  assert.equal(hose.hose, true);
  assert.equal(lines.filter((l) => l.hose).length, 1);
  assert.ok(lines.filter((l) => !l.hose).every((l) => Array.isArray(l.v) && l.v.length > 0), '风管系列都要有板厚或耐火极限选项');

  const ctrl = read('lib/client/configurator-controller.js');
  const diameters = JSON.parse(ctrl.match(/var HOSE_D = (\[[^\]]+\]);/)[1]);
  const colors = [...ctrl.match(/var HOSE_COLORS = \[(.+?)\];/)[1].matchAll(/n: '([^']+)'/g)].map((m) => m[1]);
  const product = JSON.parse(read('data/products.json')).find((p) => p.id === 'hose');
  const spec = (label) => product.specs.find((s) => s.label === label).value;
  assert.equal(spec('常用内径'), diameters.join('、') + ' mm');
  assert.equal(spec('外观颜色'), colors.join('、'));
  assert.ok(product.actions.some((a) => a.href === '/configurator?line=hose'));
});

test('“今日”按北京时间的 0 点划分', () => {
  // 北京时间 11 月 16 日 01:30，当天从 UTC 的 15 日 16:00 开始
  assert.equal(db.beijingDayStart(new Date('2026-11-15T17:30:00Z')), '2026-11-15T16:00:00.000Z');
  // 北京时间 11 月 15 日 18:00，当天从 UTC 的 14 日 16:00 开始
  assert.equal(db.beijingDayStart(new Date('2026-11-15T10:00:00Z')), '2026-11-14T16:00:00.000Z');
  // 刚写入的访问记录都算今天
  assert.equal(db.adminData().stats.visitsToday, 2);
});

test('按 IP 统计最近的留言数（用于限流）', () => {
  const past = new Date(Date.now() - 3600 * 1000).toISOString();
  const future = new Date(Date.now() + 60 * 1000).toISOString();
  assert.equal(db.countMessagesSince('203.0.113.7', past), 1);
  assert.equal(db.countMessagesSince('203.0.113.7', future), 0);
  assert.equal(db.countMessagesSince('198.51.100.1', past), 0);
});

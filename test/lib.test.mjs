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

test('按 IP 统计最近的留言数（用于限流）', () => {
  const past = new Date(Date.now() - 3600 * 1000).toISOString();
  const future = new Date(Date.now() + 60 * 1000).toISOString();
  assert.equal(db.countMessagesSince('203.0.113.7', past), 1);
  assert.equal(db.countMessagesSince('203.0.113.7', future), 0);
  assert.equal(db.countMessagesSince('198.51.100.1', past), 0);
});

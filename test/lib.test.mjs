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

test('手机号：只接受中国大陆 11 位手机号，统一成 11 位数字', async () => {
  const { normalizeMobile } = await import('../lib/antispam.js');
  for (const [input, want] of [
    ['18699185812', '18699185812'], ['186 9918 5812', '18699185812'], ['186-9918-5812', '18699185812'],
    ['+86 186 9918 5812', '18699185812'], ['0086 18699185812', '18699185812'], ['8618699185812', '18699185812'],
    ['(186) 9918 5812', '18699185812'], ['13300000000', '13300000000'], ['19900000000', '19900000000'],
  ]) assert.equal(normalizeMobile(input), want, input);
  for (const bad of ['', 'abc', '0991-1234567', '12345678901', '10086', '1869918581', '186991858120', '+1 186 9918 5812', '186a9918581'])
    assert.equal(normalizeMobile(bad), null, bad);
});

test('字数：不计空白，按字符计', async () => {
  const { textLength, sameCaptcha } = await import('../lib/antispam.js');
  assert.equal(textLength('体育馆 项目\n风管'), 7);
  assert.equal(textLength('   '), 0);
  assert.equal(textLength('𠮷野家'), 3, '生僻字（代理对）算一个字');
  assert.equal(sameCaptcha('K7PM', ' k7pm '), true);
  assert.equal(sameCaptcha('K7PM', 'K7PN'), false);
  assert.equal(sameCaptcha('K7PM', undefined), false);
});

test('提交间隔：FORM_MIN_SECONDS 留空或填错时用默认 3 秒', async () => {
  const { formMinMs } = await import('../lib/antispam.js');
  const old = process.env.FORM_MIN_SECONDS;
  try {
    for (const [v, want] of [[undefined, 3000], ['', 3000], ['  ', 3000], ['abc', 3000], ['-1', 3000], ['0', 0], ['5', 5000], ['1.5', 1500]]) {
      if (v === undefined) delete process.env.FORM_MIN_SECONDS; else process.env.FORM_MIN_SECONDS = v;
      assert.equal(formMinMs(), want, String(v));
    }
  } finally {
    if (old === undefined) delete process.env.FORM_MIN_SECONDS; else process.env.FORM_MIN_SECONDS = old;
  }
});

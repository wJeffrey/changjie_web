// 后台：查看访问记录与留言。HTTP Basic 认证，账号来自环境变量 ADMIN_USER / ADMIN_PASSWORD。
import { timingSafeEqual } from 'node:crypto';
import { adminData } from '@/lib/db';
import site from '@/data/site.json';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const same = (a, b) => { const x = Buffer.from(a), y = Buffer.from(b); return x.length === y.length && timingSafeEqual(x, y); };
const time = (iso) => new Date(iso).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai', hour12: false });
const region = (r) => [r.country, r.province, r.city, r.isp].filter(Boolean).join(' ') || '未知';
const MAIL = { sent: '已发送', skipped: '未配置邮箱', failed: '发送失败', pending: '处理中' };

function authorized(request) {
  const user = process.env.ADMIN_USER, pass = process.env.ADMIN_PASSWORD;
  const header = request.headers.get('authorization') || '';
  if (!header.startsWith('Basic ')) return false;
  const [u, ...rest] = Buffer.from(header.slice(6), 'base64').toString('utf8').split(':');
  return same(u, user) && same(rest.join(':'), pass);
}

export async function GET(request) {
  if (!process.env.ADMIN_USER || !process.env.ADMIN_PASSWORD) {
    return new Response('后台未启用：请在环境变量中设置 ADMIN_USER 和 ADMIN_PASSWORD。', { status: 404, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
  }
  if (!authorized(request)) {
    return new Response('需要登录', { status: 401, headers: { 'WWW-Authenticate': 'Basic realm="admin", charset="UTF-8"', 'Content-Type': 'text/plain; charset=utf-8' } });
  }
  const d = adminData();
  const table = (head, rows) => `<div class="scroll"><table><thead><tr>${head.map((h) => `<th>${h}</th>`).join('')}</tr></thead><tbody>${
    rows.length ? rows.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join('')}</tr>`).join('') : `<tr><td colspan="${head.length}" class="empty">暂无记录</td></tr>`}</tbody></table></div>`;

  const html = `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow"><title>后台 · ${esc(site.short)}</title>
<style>
body{margin:0;font:14px/1.6 "PingFang SC","Microsoft YaHei",sans-serif;color:#152233;background:#F3F5F7}
main{max-width:1280px;margin:0 auto;padding:28px 20px 60px}
h1{font-size:22px;color:#0B2545;margin:0 0 20px}h2{font-size:16px;color:#0B2545;margin:32px 0 10px}
.stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px}
.stats div{background:#fff;border:1px solid #D5DBE1;border-radius:6px;padding:14px 16px}
.stats b{display:block;font-size:26px;color:#0B2545;line-height:1.3}.stats span{color:#4A586A}
.scroll{overflow-x:auto;background:#fff;border:1px solid #D5DBE1;border-radius:6px}
table{border-collapse:collapse;width:100%;min-width:720px}
th,td{padding:8px 12px;border-bottom:1px solid #E4E9EE;text-align:left;vertical-align:top}
th{background:#0B2545;color:#fff;font-weight:500;white-space:nowrap}
td.empty{text-align:center;color:#8D99A6;padding:24px}.msg{white-space:pre-wrap;max-width:420px}.nowrap{white-space:nowrap}
</style></head><body><main>
<h1>${esc(site.name)} · 后台</h1>
<div class="stats">
<div><b>${d.stats.visits}</b><span>累计访问</span></div><div><b>${d.stats.visitsToday}</b><span>今日访问</span></div>
<div><b>${d.stats.uniqueIps}</b><span>独立 IP</span></div><div><b>${d.stats.messages}</b><span>留言</span></div></div>
<h2>留言咨询（最近 100 条）</h2>
${table(['时间', '姓名', '电话', '单位', '邮箱', '内容', '地区', 'IP', '邮件'], d.messages.map((m) => [
    `<span class="nowrap">${esc(time(m.created_at))}</span>`, esc(m.name), `<span class="nowrap">${esc(m.phone)}</span>`, esc(m.company), esc(m.email),
    `<div class="msg">${esc(m.content)}</div>`, esc(region(m)), esc(m.ip), esc(MAIL[m.mail_status] || m.mail_status) + (m.mail_error ? `<br><small>${esc(m.mail_error)}</small>` : '')]))}
<h2>访问地区分布</h2>
${table(['地区', '访问次数', '独立 IP'], d.regions.map((r) => [esc(r.region), r.n, r.ips]))}
<h2>访问记录（最近 200 条）</h2>
${table(['时间', '页面', '地区', 'IP', '来源', '浏览器'], d.visits.map((v) => [
    `<span class="nowrap">${esc(time(v.created_at))}</span>`, esc(v.path), esc(region(v)), esc(v.ip), esc(v.referrer), `<small>${esc(v.user_agent)}</small>`]))}
</main></body></html>`;
  return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' } });
}

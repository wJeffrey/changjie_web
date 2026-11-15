// 留言邮件通知。SMTP 账号从环境变量读取（见 .env.example），未配置时跳过发送。
import nodemailer from 'nodemailer';
import site from '@/data/site.json';

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export const mailConfigured = () => Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

export async function sendMessageMail(msg) {
  if (!mailConfigured()) return { status: 'skipped' };
  const port = Number(process.env.SMTP_PORT || 465);
  const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST, port, secure: port === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  const region = [msg.region.country, msg.region.province, msg.region.city, msg.region.isp].filter(Boolean).join(' ') || '未知';
  const rows = [
    ['姓名', msg.name], ['电话', msg.phone], ['单位', msg.company || '未填写'], ['邮箱', msg.email || '未填写'],
    ['留言内容', msg.content], ['来源页面', msg.sourcePath || '/'], ['IP', msg.ip], ['地区', region], ['时间', new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })],
  ];
  await transport.sendMail({
    from: `"${site.short}官网" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
    to: process.env.MAIL_TO || site.email,
    replyTo: msg.email || undefined,
    subject: `官网留言：${msg.name}（${msg.phone}）`,
    text: rows.map((r) => `${r[0]}：${r[1]}`).join('\n'),
    html: `<table cellpadding="8" style="border-collapse:collapse;font:14px/1.6 sans-serif">${rows.map((r) =>
      `<tr><td style="border:1px solid #D5DBE1;background:#F3F5F7;color:#0B2545;font-weight:bold;white-space:nowrap">${esc(r[0])}</td><td style="border:1px solid #D5DBE1;white-space:pre-wrap">${esc(r[1])}</td></tr>`).join('')}</table>`,
  });
  return { status: 'sent' };
}

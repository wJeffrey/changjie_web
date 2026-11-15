// 留言咨询：校验 → 存入 SQLite → 发邮件通知。
import { createMessage, setMailStatus, countMessagesSince } from '@/lib/db';
import { lookupRegion } from '@/lib/geo';
import { sendMessageMail } from '@/lib/mail';
import { clientIp, cut } from '@/lib/request';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const LIMIT_PER_HOUR = 5;
const fail = (status, error) => Response.json({ ok: false, error }, { status });

export async function POST(request) {
  let body;
  try { body = await request.json(); } catch { return fail(400, '提交内容格式不正确，请刷新页面后重试。'); }

  // 蜜罐字段：正常访客看不到也不会填写
  if (cut(body.website, 100)) return Response.json({ ok: true });

  const name = cut(body.name, 40), phone = cut(body.phone, 30), company = cut(body.company, 80);
  const email = cut(body.email, 100), content = cut(body.content, 2000);
  if (!name) return fail(400, '请填写您的姓名。');
  if (!/^[0-9+\-\s()]{6,20}$/.test(phone)) return fail(400, '请填写正确的联系电话。');
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail(400, '邮箱格式不正确，可以留空。');
  if (content.length < 5) return fail(400, '请填写咨询内容，至少 5 个字。');

  const ip = clientIp(request.headers);
  const region = lookupRegion(ip);
  let id;
  try {
    const since = new Date(Date.now() - 3600 * 1000).toISOString();
    if (countMessagesSince(ip, since) >= LIMIT_PER_HOUR) return fail(429, '提交过于频繁，请稍后再试，或直接拨打电话联系我们。');
    id = createMessage({
      name, phone, company, email, content, sourcePath: cut(body.path, 300),
      ip, region, userAgent: cut(request.headers.get('user-agent'), 400),
    });
  } catch (e) {
    console.error('保存留言失败：', e);
    return fail(500, '留言没有保存成功，请稍后重试，或直接拨打电话联系我们。');
  }

  // 邮件失败不影响留言：留言已入库，后台可见
  try {
    const r = await sendMessageMail({ name, phone, company, email, content, sourcePath: cut(body.path, 300), ip, region });
    setMailStatus(id, r.status);
  } catch (e) {
    console.error('发送留言邮件失败：', e);
    setMailStatus(id, 'failed', cut(e?.message, 300));
  }
  return Response.json({ ok: true });
}

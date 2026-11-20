// 留言咨询：校验 → 验证码 → 防刷 → 存入 SQLite → 发邮件通知。
import { createMessage, setMailStatus, countMessagesSince, countAllMessagesSince, hasSameMessageSince, takeCaptcha } from '@/lib/db';
import { lookupRegion } from '@/lib/geo';
import { sendMessageMail } from '@/lib/mail';
import { clientIp, cut } from '@/lib/request';
import { normalizeMobile, textLength, MIN_CONTENT, sameCaptcha, CAPTCHA_TTL_MS, formMinMs, LIMITS } from '@/lib/antispam';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// field：出错的字段，页面据此把焦点移过去；renew：验证码已作废，页面要换一张
const fail = (status, error, extra = {}) => Response.json({ ok: false, error, ...extra }, { status });

export async function POST(request) {
  // 首页的报价表单以 FormData 提交，项目情况字段叫 message；其余调用方发 JSON
  let body;
  try {
    const type = request.headers.get('content-type') || '';
    if (/multipart\/form-data|application\/x-www-form-urlencoded/.test(type)) {
      const f = Object.fromEntries(await request.formData());
      body = { ...f, content: f.content ?? f.message };
    } else {
      body = await request.json();
    }
  } catch { return fail(400, '提交内容格式不正确，请刷新页面后重试。'); }
  if (!body || typeof body !== 'object') return fail(400, '提交内容格式不正确，请刷新页面后重试。');

  // 蜜罐字段：正常访客看不到也不会填写
  if (cut(body.website, 100)) return Response.json({ ok: true });

  // 1. 字段校验（不消耗验证码）
  const name = cut(body.name, 40), company = cut(body.company, 80);
  const email = cut(body.email, 100), content = cut(body.content, 2000);
  const phone = normalizeMobile(cut(body.phone, 30));
  if (!name) return fail(400, '请填写您的姓名。', { field: 'name' });
  if (!phone) return fail(400, '请填写正确的 11 位手机号码。', { field: 'phone' });
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail(400, '邮箱格式不正确，可以留空。', { field: 'email' });
  if (textLength(content) < MIN_CONTENT) return fail(400, `请写下项目情况，至少 ${MIN_CONTENT} 个字。`, { field: 'content' });

  const ip = clientIp(request.headers);
  try {
    // 2. 验证码：每个只能校验一次，校验后无论对错都要换一张
    const cap = takeCaptcha(cut(body.captcha_id, 64));
    const age = cap ? Date.now() - Date.parse(cap.created_at) : Infinity;
    if (!cap || age > CAPTCHA_TTL_MS) return fail(400, '验证码已失效，请输入新的验证码。', { field: 'captcha', renew: true });
    if (!sameCaptcha(cap.answer, body.captcha)) return fail(400, '验证码不正确，请重新输入。', { field: 'captcha', renew: true });
    if (age < formMinMs()) return fail(400, '提交太快了，请稍等几秒再提交。', { field: 'captcha', renew: true });

    // 3. 防刷：同一 IP、全站的频率上限；重复提交只算一次
    const hourAgo = new Date(Date.now() - 3600 * 1000).toISOString();
    if (countMessagesSince(ip, hourAgo) >= LIMITS.messagesPerIpHour) return fail(429, '提交过于频繁，请稍后再试，或直接拨打电话联系我们。', { renew: true });
    if (countAllMessagesSince(hourAgo) >= LIMITS.messagesAllHour) return fail(429, '当前留言较多，请稍后再试，或直接拨打电话联系我们。', { renew: true });
    if (hasSameMessageSince(phone, content, new Date(Date.now() - 24 * 3600 * 1000).toISOString())) return Response.json({ ok: true });
  } catch (e) {
    console.error('校验留言失败：', e);
    return fail(500, '留言没有保存成功，请稍后重试，或直接拨打电话联系我们。', { renew: true });
  }

  const region = lookupRegion(ip);
  let id;
  try {
    id = createMessage({
      name, phone, company, email, content, sourcePath: cut(body.path, 300),
      ip, region, userAgent: cut(request.headers.get('user-agent'), 400),
    });
  } catch (e) {
    console.error('保存留言失败：', e);
    return fail(500, '留言没有保存成功，请稍后重试，或直接拨打电话联系我们。', { renew: true });
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

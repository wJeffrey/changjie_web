// 图形验证码：返回一张 SVG（字符绘制为路径，不是文本）和它的编号；答案只存在服务器的数据库里。
import { randomUUID } from 'node:crypto';
import svgCaptcha from 'svg-captcha';
import { createCaptcha, countCaptchasSince } from '@/lib/db';
import { CAPTCHA_CHARS, LIMITS } from '@/lib/antispam';
import { clientIp } from '@/lib/request';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const headers = { 'Cache-Control': 'no-store' };

export async function GET(request) {
  const ip = clientIp(request.headers);
  try {
    const since = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    if (countCaptchasSince(ip, since) >= LIMITS.captchasPerIp10Min) {
      return Response.json({ ok: false, error: '刷新验证码过于频繁，请过几分钟再试，或直接拨打电话联系我们。' }, { status: 429, headers });
    }
    const c = svgCaptcha.create({ size: 4, charPreset: CAPTCHA_CHARS, noise: 3, color: true, background: '#ffffff', width: 120, height: 44, fontSize: 46 });
    const id = randomUUID();
    createCaptcha({ id, answer: c.text.toUpperCase(), ip });
    return Response.json({ ok: true, id, image: 'data:image/svg+xml;base64,' + Buffer.from(c.data).toString('base64') }, { headers });
  } catch (e) {
    console.error('生成验证码失败：', e);
    return Response.json({ ok: false, error: '验证码加载失败，请刷新页面后重试。' }, { status: 500, headers });
  }
}

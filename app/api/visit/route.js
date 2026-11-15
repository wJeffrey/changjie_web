// 记录一次页面访问：IP、地区、路径、来源、浏览器标识。
import { recordVisit } from '@/lib/db';
import { lookupRegion } from '@/lib/geo';
import { clientIp, cut } from '@/lib/request';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BOT = /bot|spider|crawl|slurp|headless|lighthouse/i;

export async function POST(request) {
  let body = {};
  try { body = await request.json(); } catch { /* 空请求体按默认值处理 */ }
  const path = cut(body.path, 300);
  const userAgent = cut(request.headers.get('user-agent'), 400);
  if (!path.startsWith('/') || path.startsWith('/admin') || BOT.test(userAgent)) return new Response(null, { status: 204 });
  try {
    const ip = clientIp(request.headers);
    recordVisit({ ip, region: lookupRegion(ip), path, referrer: cut(body.referrer, 300), userAgent });
  } catch (e) {
    console.error('记录访问失败：', e);
  }
  return new Response(null, { status: 204 });
}

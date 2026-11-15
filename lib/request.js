// 从请求中取访客 IP：始终取 X-Forwarded-For 的最右一项。
// 这一项由 server.mjs（无代理时写入真实连接地址）或紧邻的反向代理写入，访客无法伪造；
// 更靠左的项可能来自访客自己发的请求头，不可信。
export function clientIp(headers) {
  const list = (headers.get('x-forwarded-for') || '').split(',').map((s) => s.trim()).filter(Boolean);
  return (list[list.length - 1] || 'unknown').replace(/^::ffff:/, '');
}

export const cut = (v, max) => String(v ?? '').trim().slice(0, max);

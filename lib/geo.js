// IP → 地区。使用 ip2region 自带的离线库在本机查询，不向第三方发送访客 IP。
import { IP2Region } from 'ip2region/node';

const EMPTY = { country: '', province: '', city: '', isp: '' };
const clean = (v) => (v && v !== '0' ? String(v) : '');

function isPrivate(ip) {
  return !ip || ip === 'unknown' || ip === '::1' || /^(127\.|10\.|192\.168\.|169\.254\.)/.test(ip) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(ip) || /^(fc|fd|fe80)/i.test(ip);
}

export function lookupRegion(ip) {
  if (isPrivate(ip)) return { ...EMPTY, isp: '内网' };
  try {
    globalThis.__cjGeo ??= new IP2Region();
    const r = globalThis.__cjGeo.lookup(ip);
    if (!r) return EMPTY;
    return {
      country: clean(r.country?.name),
      province: clean(r.subdivisions?.[0]?.name),
      city: clean(r.city?.name),
      isp: clean(r.isp),
    };
  } catch {
    return EMPTY;
  }
}

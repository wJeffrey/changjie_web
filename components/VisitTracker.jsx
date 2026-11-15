'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

// 每次进入一个页面，向服务器上报一次访问（IP 与地区由服务器端识别）。
export default function VisitTracker() {
  const pathname = usePathname();
  useEffect(() => {
    const body = JSON.stringify({ path: pathname + window.location.search, referrer: document.referrer });
    fetch('/api/visit', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, keepalive: true }).catch(() => {});
  }, [pathname]);
  return null;
}

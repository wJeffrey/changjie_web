'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import site from '@/data/site.json';

export default function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const isHome = pathname === '/';
  const nav = site.nav.map((n) => ({
    label: n.label,
    href: n.anchor ? (isHome ? n.anchor : '/' + n.anchor) : n.href,
    current: Boolean(n.href) && n.href === pathname,
  }));

  // 菜单打开时锁定页面滚动；按 Esc 或窗口变宽时关闭
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    if (!open) return undefined;
    const close = () => setOpen(false);
    const onKey = (e) => { if (e.key === 'Escape') close(); };
    const onResize = () => { if (window.innerWidth >= 1024) close(); };
    document.addEventListener('keydown', onKey);
    window.addEventListener('resize', onResize);
    return () => { document.removeEventListener('keydown', onKey); window.removeEventListener('resize', onResize); };
  }, [open]);

  return (
    <>
      <header className="header">
        <div className="container">
          <a className="brand" href={isHome ? '#top' : '/'} aria-label={`${site.short}首页`}>
            <img className="logo" src="/assets/img/logo.png" alt="" />
            <span className="brand-txt"><b>{site.short}</b><small>{site.tagline}</small></span>
          </a>
          <nav className="nav" aria-label="主导航">
            {nav.map((n) => (
              <a key={n.label} href={n.href} aria-current={n.current ? 'page' : undefined}>{n.label}</a>
            ))}
          </nav>
          <a className="header-tel" href={`tel:${site.tel}`}><small>咨询电话</small>{site.phone}</a>
          <button className="burger" aria-label={open ? '关闭菜单' : '打开菜单'} aria-expanded={open} aria-controls="navM" onClick={() => setOpen(!open)}><i /></button>
        </div>
      </header>
      <nav className={open ? 'nav-m open' : 'nav-m'} id="navM" aria-label="移动端导航" onClick={(e) => { if (e.target.closest('a')) setOpen(false); }}>
        {nav.map((n) => <a key={n.label} href={n.href}>{n.label}</a>)}
        <a className="btn btn-primary" href={`tel:${site.tel}`}>拨打 {site.phone}</a>
      </nav>
    </>
  );
}

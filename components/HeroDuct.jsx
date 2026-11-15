'use client';

import { useEffect, useRef } from 'react';

// 首屏三维风管：缓慢自转，用户拖动后停止。画布由 sections/Hero.jsx 渲染。
export default function HeroDuct() {
  const started = useRef(false);
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    import('@/lib/client/duct3d').then(({ default: Duct3D }) => {
      const canvas = document.getElementById('heroDuct');
      if (!canvas) return;
      const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const duct = new Duct3D(canvas, {
        w: 1050, h: 550, l: 1500, t: 25,
        outer: { color: '#E3E6E4', pattern: 'none' },
        inner: { color: '#d6dadb', pattern: 'none' },
        core: { color: '#c9825c' },
        labels: { w: 'W 1000', h: 'H 500', l: 'L 1500' },
        shadow: 'rgba(0,0,0,.5)',
        spin: still ? 0 : 0.22,
      });
      if (document.fonts?.ready) document.fonts.ready.then(() => duct.request());
    });
  }, []);
  return null;
}

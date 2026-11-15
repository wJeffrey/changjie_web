'use client';

import { useEffect, useRef } from 'react';
import ConfiguratorMarkup from '@/components/ConfiguratorMarkup';
import lines from '@/data/lines.json';
import site from '@/data/site.json';

// 配置器：标记由 React 渲染一次，之后交给控制器直接操作 DOM（三维画布、滑块、清单）。
// 本组件没有状态、不会重新渲染，所以控制器对 DOM 的修改不会被 React 覆盖。
export default function Configurator() {
  const started = useRef(false);
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    Promise.all([
      import('@/lib/client/duct3d'),
      import('@/lib/client/cjexport'),
      import('@/lib/client/configurator-controller'),
    ]).then(([duct, exp, ctrl]) => {
      ctrl.initConfigurator({
        Duct3D: duct.default,
        CJExport: exp.default,
        LINES: lines,
        SITE: { name: site.name, phone: site.phone, email: site.email, address: site.address, domain: site.domain, contactPerson: site.contactPerson },
      });
    });
  }, []);
  return <ConfiguratorMarkup />;
}

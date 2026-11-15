'use client';

import { useRef, useState } from 'react';
import products from '@/data/products.json';

export default function Products() {
  const [active, setActive] = useState(0);
  const tabs = useRef([]);

  function onKeyDown(e, i) {
    const step = (e.key === 'ArrowDown' || e.key === 'ArrowRight') ? 1 : (e.key === 'ArrowUp' || e.key === 'ArrowLeft') ? -1 : 0;
    if (!step) return;
    e.preventDefault();
    const next = (i + step + products.length) % products.length;
    setActive(next);
    tabs.current[next]?.focus();
  }

  return (
    <section className="sec" id="products">
      <div className="container">
        <div className="sec-head">
          <h2 className="h-sec">产品系列</h2>
          <p className="lede">保温送风、洁净工程、消声、排烟、耐火，每一类工况都有对应的板材和成品风管。点开一个系列查看参数，或直接带入配置器。</p>
        </div>
        <div className="prod">
          <div className="prod-tabs" role="tablist" aria-label="产品系列">
            {products.map((p, i) => (
              <button key={p.id} ref={(el) => { tabs.current[i] = el; }} role="tab" id={`t-${p.id}`} aria-controls={`p-${p.id}`}
                aria-selected={i === active} tabIndex={i === active ? 0 : -1}
                onClick={() => setActive(i)} onKeyDown={(e) => onKeyDown(e, i)}>
                {p.tab}<em>{p.badge}</em>
              </button>
            ))}
          </div>
          <div>
            {products.map((p, i) => (
              <article key={p.id} className="prod-panel" role="tabpanel" id={`p-${p.id}`} aria-labelledby={`t-${p.id}`} hidden={i !== active}>
                <figure><img src={p.img} alt={p.alt} loading="lazy" /></figure>
                <div className="prod-body">
                  <h3>{p.title}</h3>
                  <p>{p.desc}</p>
                  <dl className="spec">
                    {p.specs.map((s) => <div key={s.label}><dt>{s.label}</dt><dd>{s.value}</dd></div>)}
                  </dl>
                  <div className="prod-actions">
                    {p.actions.map((a) => <a key={a.href + a.label} className={`btn ${a.style}`} href={a.href}>{a.label}</a>)}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

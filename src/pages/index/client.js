(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };

  // 首屏三维风管：缓慢自转，用户拖动后停止
  var still = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var duct = new Duct3D($('heroDuct'), {
    w: 1050, h: 550, l: 1500, t: 25,
    outer: { color: '#E3E6E4', pattern: 'none' },
    inner: { color: '#d6dadb', pattern: 'none' },
    core: { color: '#c9825c' },
    labels: { w: 'W 1000', h: 'H 500', l: 'L 1500' },
    shadow: 'rgba(0,0,0,.5)',
    spin: still ? 0 : 0.22
  });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { duct.request(); });

  // 产品系列：标签切换
  var tabs = [].slice.call($('prodTabs').querySelectorAll('[role=tab]'));
  function select(tab, focus) {
    tabs.forEach(function (t) {
      var on = t === tab;
      t.setAttribute('aria-selected', on);
      t.tabIndex = on ? 0 : -1;
      $(t.getAttribute('aria-controls')).hidden = !on;
    });
    if (focus) tab.focus();
    if (tab.scrollIntoView && window.innerWidth < 1024) tab.scrollIntoView({ block: 'nearest', inline: 'center' });
  }
  tabs.forEach(function (t, i) {
    t.addEventListener('click', function () { select(t); });
    t.addEventListener('keydown', function (e) {
      var d = (e.key === 'ArrowDown' || e.key === 'ArrowRight') ? 1 : (e.key === 'ArrowUp' || e.key === 'ArrowLeft') ? -1 : 0;
      if (!d) return;
      e.preventDefault();
      select(tabs[(i + d + tabs.length) % tabs.length], true);
    });
  });

  // 移动端菜单
  var burger = $('burger'), navM = $('navM');
  function closeNav() { navM.classList.remove('open'); burger.setAttribute('aria-expanded', 'false'); document.body.style.overflow = ''; }
  burger.addEventListener('click', function () {
    var open = navM.classList.toggle('open');
    burger.setAttribute('aria-expanded', open);
    document.body.style.overflow = open ? 'hidden' : '';
  });
  navM.addEventListener('click', function (e) { if (e.target.closest('a')) closeNav(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeNav(); });
  window.addEventListener('resize', function () { if (window.innerWidth >= 1024) closeNav(); });

  $('year').textContent = new Date().getFullYear();
})();

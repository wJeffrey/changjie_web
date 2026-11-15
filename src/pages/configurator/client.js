(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };

  // 表面材质的渲染方式
  var FOIL = { color: '#cdd3d8', pattern: 'emboss' };
  var GALV = { color: '#bfc7ce', pattern: 'emboss' };
  var COLORS = [
    { n: '灰白', c: '#E3E6E4' }, { n: '银灰', c: '#B4BCC4' }, { n: '象牙', c: '#EAE3CF' },
    { n: '海蓝', c: '#2E5E8C' }, { n: '钢青', c: '#5C6F7F' }
  ];

  // 各系列数据取自《复合风管产品手册》技术参数表
  var LINES = __LINES__;

  var q = new URLSearchParams(location.search);
  var st = { line: 0, w: 1000, h: 500, l: 1500, v: 1, color: 0, speed: 8, dims: true, flanges: true };
  LINES.forEach(function (ln, i) { if (ln.id === q.get('line')) st.line = i; });
  if (LINES[st.line].v.length <= st.v) st.v = 0;

  var duct = new Duct3D($('cv'), {});

  function mat(kind) {
    var c = COLORS[st.color].c;
    if (kind === 'foil') return FOIL;
    if (kind === 'galv') return GALV;
    if (kind === 'steelIn') return { color: '#e1e4e3', pattern: 'none' };
    if (kind === 'embSteel') return { color: c, pattern: 'emboss' };
    return { color: c, pattern: 'none' };
  }
  function colorable(ln) { return ln.outer === 'steel' || ln.outer === 'embSteel'; }
  function fmt(n, d) { return n.toFixed(d).replace(/\.?0+$/, ''); }

  function buildLines() {
    $('lines').innerHTML = LINES.map(function (ln, i) {
      return '<button class="line" role="radio" data-i="' + i + '"><span>' + ln.name + '</span>' + (ln.cls !== '—' ? '<em>' + ln.cls + '</em>' : '') + '</button>';
    }).join('');
    $('colors').innerHTML = COLORS.map(function (c, i) {
      return '<button role="radio" data-i="' + i + '"><i style="background:' + c.c + '"></i>' + c.n + '</button>';
    }).join('');
  }

  function rows() {
    var ln = LINES[st.line], v = ln.v[st.v];
    var A = st.w * st.h / 1e6, Q = A * st.speed * 3600;
    var S = 2 * (st.w + st.h + 4 * v.t) * st.l / 1e6;
    var De = 2 * st.w * st.h / (st.w + st.h);
    var ratio = Math.max(st.w, st.h) / Math.min(st.w, st.h);
    var r = [
      ['产品系列', ln.name],
      ['内净尺寸 W×H×L', st.w + ' × ' + st.h + ' × ' + st.l + ' mm'],
      [ln.vt, v.l + (ln.unit ? ' ' + ln.unit : '') + (ln.id === 'pz' ? '（板厚 ' + v.t + ' mm）' : '')],
      ['外表面 / 内表面', ln.outerName + (colorable(ln) ? '（' + COLORS[st.color].n + '）' : '') + ' / ' + ln.innerName]
    ];
    if (ln.cls !== '—') r.push(['燃烧性能', ln.cls]);
    if (v.fire || ln.fire) r.push(['耐火极限', v.fire || ln.fire]);
    if (ln.lam !== '—') r.push(['导热系数', ln.lam]);
    if (ln.pres !== '—') r.push(['抗压强度', ln.pres]);
    r.push(['截面积', fmt(A, 3) + ' m²']);
    r.push(['当量直径', Math.round(De) + ' mm']);
    r.push(['风量（' + fmt(st.speed, 1) + ' m/s）', Math.round(Q).toLocaleString('en-US') + ' m³/h']);
    r.push(['外表面展开面积', fmt(S, 2) + ' m²']);
    r.push(['宽高比', fmt(ratio, 2) + ' : 1']);
    return r;
  }

  function update() {
    var ln = LINES[st.line], v = ln.v[st.v];
    // 选中状态
    [].forEach.call($('lines').children, function (b, i) { b.setAttribute('aria-checked', i === st.line); b.tabIndex = i === st.line ? 0 : -1; });
    $('varTitle').textContent = ln.vt;
    $('variants').innerHTML = ln.v.map(function (o, i) {
      return '<button role="radio" data-i="' + i + '" aria-checked="' + (i === st.v) + '">' + o.l + (ln.unit ? '<small>' + ln.unit + '</small>' : '') + '</button>';
    }).join('');
    $('varNote').textContent = ln.note;
    $('colorGroup').hidden = !colorable(ln);
    [].forEach.call($('colors').children, function (b, i) { b.setAttribute('aria-checked', i === st.color); });
    ['W', 'H', 'L', 'V'].forEach(function (k) {
      var val = k === 'V' ? st.speed : st[k.toLowerCase()];
      $('r' + k).value = val;
      if (document.activeElement !== $('n' + k)) $('n' + k).value = val;
    });
    var ratio = Math.max(st.w, st.h) / Math.min(st.w, st.h);
    $('warn').hidden = ratio <= 4;
    $('warn').textContent = '当前宽高比 ' + fmt(ratio, 2) + ' : 1。矩形风管长短边之比不宜大于 4 : 1，建议调整截面。';
    $('tbName').textContent = ln.name + ' · ' + v.l + (ln.unit ? ' ' + ln.unit : '');
    $('tbSize').textContent = st.w + ' × ' + st.h + ' × ' + st.l;
    $('sheet').innerHTML = rows().map(function (r) {
      return '<tr><th scope="row">' + r[0] + '</th><td>' + r[1] + '</td></tr>';
    }).join('');
    duct.set({
      w: st.w + 2 * v.t, h: st.h + 2 * v.t, l: st.l, t: v.t,
      outer: mat(ln.outer), inner: mat(ln.inner), core: { color: ln.core },
      dims: st.dims, flanges: st.flanges,
      labels: { w: 'W ' + st.w, h: 'H ' + st.h, l: 'L ' + st.l }
    });
  }

  function clamp(el, val) {
    var mn = +el.min, mx = +el.max, s = +el.step || 1;
    if (isNaN(val)) return null;
    return Math.max(mn, Math.min(mx, Math.round(val / s) * s));
  }
  [['W', 'w'], ['H', 'h'], ['L', 'l'], ['V', 'speed']].forEach(function (p) {
    $('r' + p[0]).addEventListener('input', function () { st[p[1]] = +this.value; update(); });
    $('n' + p[0]).addEventListener('input', function () {
      var val = +this.value;
      if (this.value !== '' && val >= +this.min && val <= +this.max) { st[p[1]] = val; update(); }
    });
    $('n' + p[0]).addEventListener('change', function () {
      var c = clamp(this, +this.value);
      if (c != null) st[p[1]] = c;
      this.value = st[p[1]]; update();
    });
  });

  function pick(box, fn) {
    box.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      fn(+b.dataset.i); update();
    });
  }
  pick($('lines'), function (i) { st.line = i; st.v = Math.min(1, LINES[i].v.length - 1); });
  pick($('variants'), function (i) { st.v = i; });
  pick($('colors'), function (i) { st.color = i; });

  var VIEWS = { iso: [-0.72, 0.42], end: [0, 0.06], side: [-1.5708, 0.06] };
  [].forEach.call(document.querySelectorAll('[data-view]'), function (b) {
    b.addEventListener('click', function () { var v = VIEWS[b.dataset.view]; duct.set({ yaw: v[0], pitch: v[1] }); });
  });
  $('tDims').addEventListener('click', function () { st.dims = !st.dims; this.setAttribute('aria-pressed', st.dims); update(); });
  $('tFl').addEventListener('click', function () { st.flanges = !st.flanges; this.setAttribute('aria-pressed', st.flanges); update(); });

  $('copy').addEventListener('click', function () {
    var btn = this;
    var text = COMPANY + ' 风管配置清单\n' + rows().map(function (r) { return r[0] + '：' + r[1]; }).join('\n') + '\n联系电话：' + SITE.phone;
    function done(ok) { btn.textContent = ok ? '已复制，可粘贴发送' : '复制失败，请手动选择清单'; setTimeout(function () { btn.textContent = '复制配置清单'; }, 2400); }
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(function () { done(true); }, function () { done(false); });
    else {
      var ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta); ta.select();
      var ok = false; try { ok = document.execCommand('copy'); } catch (e) {}
      document.body.removeChild(ta); done(ok);
    }
  });

  // 下载 Excel / Word 清单：带公司署名与联系方式
  var SITE = __SITE__;
  var COMPANY = SITE.name;
  var CONTACT = [
    ['公司', SITE.name],
    ['联系人', SITE.contactPerson],
    ['联系电话', SITE.phone],
    ['电子邮箱', SITE.email],
    ['地址', SITE.address],
    ['网址', SITE.domain]
  ];
  function exportData() {
    var d = new Date(), p = function (n) { return (n < 10 ? '0' : '') + n; };
    return {
      title: '风管配置清单', company: COMPANY,
      date: d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()),
      rows: rows(), contact: CONTACT,
      note: '说明：性能数据取自各系列产品技术参数表；板厚、颜色为常用选项，最终规格以技术确认和合同为准。'
    };
  }
  function fileName(ext) { return '昌杰立盛-风管配置清单-' + st.w + 'x' + st.h + 'x' + st.l + ext; }
  function snapshot() {
    try {
      duct.draw();
      var cv = $('cv'), b64 = cv.toDataURL('image/png').split(',')[1], bin = atob(b64), u = new Uint8Array(bin.length);
      for (var i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
      return { png: u, w: cv.width, h: cv.height };
    } catch (e) { return null; }
  }
  function flash(btn, label) {
    var old = btn.textContent; btn.textContent = label;
    setTimeout(function () { btn.textContent = old; }, 2200);
  }
  $('dlXlsx').addEventListener('click', function () {
    try { CJExport.save(CJExport.xlsx(exportData()), fileName('.xlsx'), CJExport.XLSX_MIME); flash(this, '已生成 Excel 文件'); }
    catch (e) { flash(this, '生成失败，请改用复制清单'); }
  });
  $('dlDocx').addEventListener('click', function () {
    try { CJExport.save(CJExport.docx(exportData(), snapshot()), fileName('.docx'), CJExport.DOCX_MIME); flash(this, '已生成 Word 文件'); }
    catch (e) { flash(this, '生成失败，请改用复制清单'); }
  });

  // 移动端菜单
  var burger = $('burger'), navM = $('navM');
  burger.addEventListener('click', function () {
    var open = navM.classList.toggle('open');
    burger.setAttribute('aria-expanded', open); document.body.style.overflow = open ? 'hidden' : '';
  });

  $('year').textContent = new Date().getFullYear();
  buildLines();
  update();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { duct.request(); });
})();

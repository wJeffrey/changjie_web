// 配置器控制逻辑：由原页面内联脚本迁移而来，直接操作 ConfiguratorMarkup 渲染出的 DOM。
// 仅在浏览器端由 components/Configurator.jsx 调用一次。
export function initConfigurator({ Duct3D, Hose3D, CJExport, LINES, SITE }) {
  var $ = function (id) { return document.getElementById(id); };

  // 表面材质的渲染方式
  var FOIL = { color: '#cdd3d8', pattern: 'emboss' };
  var GALV = { color: '#bfc7ce', pattern: 'emboss' };
  var COLORS = [
    { n: '灰白', c: '#E3E6E4' }, { n: '银灰', c: '#B4BCC4' }, { n: '象牙', c: '#EAE3CF' },
    { n: '海蓝', c: '#2E5E8C' }, { n: '钢青', c: '#5C6F7F' }
  ];

  // 各系列数据取自《复合风管产品手册》技术参数表
  // 软管规格取自手册「铝箔伸缩通风软管」规格参数表
  var HOSE_D = [76, 80, 89, 110];
  var HOSE_BEND = [0, 45, 90];
  var HOSE_COLORS = [{ n: '灰色', c: '#8f959b' }, { n: '白色', c: '#e6e8ea' }, { n: '黑色', c: '#2c2f34' }];

  var q = new URLSearchParams(location.search);
  var st = { line: 0, w: 1000, h: 500, l: 1500, v: 1, color: 0, speed: 8, dims: true, flanges: true, hd: 3, bend: 1, hcolor: 0, qty: 10 };
  LINES.forEach(function (ln, i) { if (ln.id === q.get('line')) st.line = i; });
  if (LINES[st.line].hose) st.l = 3000;
  else if (LINES[st.line].v.length <= st.v) st.v = 0;
  var colorMode = '';

  var duct = new Duct3D($('cv'), {});
  var hose = new Hose3D($('cvHose'), {});

  function mat(kind) {
    var c = COLORS[st.color].c;
    if (kind === 'foil') return FOIL;
    if (kind === 'galv') return GALV;
    if (kind === 'steelIn') return { color: '#e1e4e3', pattern: 'none' };
    if (kind === 'embSteel') return { color: c, pattern: 'emboss' };
    return { color: c, pattern: 'none' };
  }
  function colorable(ln) { return ln.hose || ln.outer === 'steel' || ln.outer === 'embSteel'; }
  function fmt(n, d) { return n.toFixed(d).replace(/\.?0+$/, ''); }

  function buildLines() {
    $('lines').innerHTML = LINES.map(function (ln, i) {
      return '<button class="line" role="radio" data-i="' + i + '"><span>' + ln.name + '</span>' + (ln.cls !== '—' ? '<em>' + ln.cls + '</em>' : '') + '</button>';
    }).join('');
    $('hoseD').innerHTML = HOSE_D.map(function (d, i) { return '<button role="radio" data-i="' + i + '">Ø' + d + '</button>'; }).join('');
    $('hoseBend').innerHTML = HOSE_BEND.map(function (b, i) { return '<button role="radio" data-i="' + i + '">' + (b ? b + '°' : '直管') + '</button>'; }).join('');
  }
  // 颜色色板按产品类型重建：彩钢色 / 软管外观色
  function buildColors(isHose) {
    var mode = isHose ? 'hose' : 'steel';
    if (mode === colorMode) return;
    colorMode = mode;
    $('colors').innerHTML = (isHose ? HOSE_COLORS : COLORS).map(function (c, i) {
      return '<button role="radio" data-i="' + i + '"><i style="background:' + c.c + '"></i>' + c.n + '</button>';
    }).join('');
    $('colH').innerHTML = isHose ? '外观颜色<span>PVC 外膜</span>' : '外表面颜色<span>彩钢板</span>';
    $('colNote').textContent = isHose ? '屏幕颜色仅作示意，实际以实物为准。' : '屏幕颜色仅作示意，实际以彩钢板色卡和样板为准。';
  }
  function hoseRows() {
    var d = HOSE_D[st.hd], A = Math.PI * d * d / 4 / 1e6;
    return [
      ['产品', '铝箔伸缩通风软管'],
      ['内径', 'Ø' + d + ' mm'],
      ['单根伸展长度', st.l + ' mm'],
      ['外观颜色', HOSE_COLORS[st.hcolor].n],
      ['管壁结构', 'PVC 膜 + 铝箔复合，双层加厚，螺旋骨架支撑'],
      ['数量', st.qty + ' 根'],
      ['合计长度', fmt(st.qty * st.l / 1000, 1) + ' m'],
      ['截面积', fmt(A, 4) + ' m²'],
      ['风量（' + fmt(st.speed, 1) + ' m/s）', Math.round(A * st.speed * 3600).toLocaleString('en-US') + ' m³/h']
    ];
  }
  function updateHose(ln) {
    var d = HOSE_D[st.hd];
    [].forEach.call($('hoseD').children, function (b, i) { b.setAttribute('aria-checked', i === st.hd); });
    [].forEach.call($('hoseBend').children, function (b, i) { b.setAttribute('aria-checked', i === st.bend); });
    [].forEach.call($('colors').children, function (b, i) { b.setAttribute('aria-checked', i === st.hcolor); });
    $('warn').hidden = true;
    $('colorGroup').hidden = false;
    $('tbName').textContent = ln.name + ' · Ø' + d;
    $('tbLabel').textContent = '内径 × 伸展长度（mm）';
    $('tbSize').textContent = 'Ø' + d + ' × ' + st.l;
    $('sheet').innerHTML = hoseRows().map(function (r) { return '<tr><th scope="row">' + r[0] + '</th><td>' + r[1] + '</td></tr>'; }).join('');
    hose.resize();
    hose.set({ d: d, l: st.l, bend: HOSE_BEND[st.bend], color: HOSE_COLORS[st.hcolor].c, dims: st.dims });
  }

  function rows() {
    if (LINES[st.line].hose) return hoseRows();
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
    var ln = LINES[st.line], isHose = !!ln.hose;
    // 选中状态
    [].forEach.call($('lines').children, function (b, i) { b.setAttribute('aria-checked', i === st.line); b.tabIndex = i === st.line ? 0 : -1; });
    // 按产品类型切换控件与画布
    $('rowW').hidden = $('rowH').hidden = $('varGroup').hidden = $('tFl').hidden = $('cv').hidden = isHose;
    $('hoseGroup').hidden = $('cvHose').hidden = !isHose;
    $('rL').max = $('nL').max = isHose ? 6000 : 4000;
    if (!isHose && st.l > 4000) st.l = 4000;
    buildColors(isHose);
    ['W', 'H', 'L', 'V', 'Q'].forEach(function (k) {
      var val = k === 'V' ? st.speed : k === 'Q' ? st.qty : st[k.toLowerCase()];
      $('r' + k).value = val;
      if (document.activeElement !== $('n' + k)) $('n' + k).value = val;
    });
    if (isHose) { updateHose(ln); return; }
    $('tbLabel').textContent = '内净尺寸 W×H×L（mm）';
    var v = ln.v[st.v];
    $('varTitle').textContent = ln.vt;
    $('variants').innerHTML = ln.v.map(function (o, i) {
      return '<button role="radio" data-i="' + i + '" aria-checked="' + (i === st.v) + '">' + o.l + (ln.unit ? '<small>' + ln.unit + '</small>' : '') + '</button>';
    }).join('');
    $('varNote').textContent = ln.note;
    $('colorGroup').hidden = !colorable(ln);
    [].forEach.call($('colors').children, function (b, i) { b.setAttribute('aria-checked', i === st.color); });
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
  [['W', 'w'], ['H', 'h'], ['L', 'l'], ['V', 'speed'], ['Q', 'qty']].forEach(function (p) {
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
  pick($('lines'), function (i) {
    var was = LINES[st.line].hose, now = LINES[i].hose;
    st.line = i;
    if (now) { if (!was) st.l = 3000; }
    else { st.v = Math.min(1, LINES[i].v.length - 1); if (was) st.l = 1500; }
  });
  pick($('variants'), function (i) { st.v = i; });
  pick($('colors'), function (i) { if (LINES[st.line].hose) st.hcolor = i; else st.color = i; });
  pick($('hoseD'), function (i) { st.hd = i; });
  pick($('hoseBend'), function (i) { st.bend = i; });

  var VIEWS = { iso: [-0.72, 0.42], end: [0, 0.06], side: [-1.5708, 0.06] };
  [].forEach.call(document.querySelectorAll('[data-view]'), function (b) {
    b.addEventListener('click', function () { var v = VIEWS[b.dataset.view]; (LINES[st.line].hose ? hose : duct).set({ yaw: v[0], pitch: v[1] }); });
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
      title: LINES[st.line].hose ? '软管配置清单' : '风管配置清单', company: COMPANY,
      date: d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()),
      rows: rows(), contact: CONTACT,
      note: '说明：性能数据取自各系列产品技术参数表；板厚、颜色为常用选项，最终规格以技术确认和合同为准。'
    };
  }
  function fileName(ext) {
    if (LINES[st.line].hose) return '昌杰立盛-软管配置清单-D' + HOSE_D[st.hd] + 'x' + st.l + ext;
    return '昌杰立盛-风管配置清单-' + st.w + 'x' + st.h + 'x' + st.l + ext;
  }
  function snapshot() {
    try {
      var isHose = LINES[st.line].hose;
      (isHose ? hose : duct).draw();
      var cv = $(isHose ? 'cvHose' : 'cv'), b64 = cv.toDataURL('image/png').split(',')[1], bin = atob(b64), u = new Uint8Array(bin.length);
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

  buildLines();
  update();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { duct.request(); });
}

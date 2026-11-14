/* Duct3D：矩形复合风管的轻量 3D 渲染器（Canvas 2D，无依赖）。
   用法：var d = new Duct3D(canvas, {w:1000,h:500,l:1500,t:25,...}); d.set({w:1200});
   长度单位均为 mm。 */
(function (global) {
  'use strict';

  var DEFAULTS = {
    w: 1000, h: 500, l: 1500, t: 25,
    outer: { color: '#dfe3e6', pattern: 'none' },
    inner: { color: '#cfd5da', pattern: 'emboss' },
    core: { color: '#c9825c' },
    flange: { color: '#aeb7bf' },
    flanges: true,
    dims: true,
    dimColor: '#E2581F',
    labelColor: '#0B2545',
    labelBg: 'rgba(255,255,255,.92)',
    shadow: 'rgba(11,37,69,.22)',
    yaw: -0.72, pitch: 0.42,
    spin: 0,
    interactive: true
  };

  function hexToRgb(h) {
    h = h.replace('#', '');
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    var n = parseInt(h, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  function shade(hex, k) {
    var c = hexToRgb(hex), o = [];
    for (var i = 0; i < 3; i++) {
      var v = k <= 1 ? c[i] * k : c[i] + (255 - c[i]) * (k - 1);
      o.push(Math.max(0, Math.min(255, Math.round(v))));
    }
    return 'rgb(' + o[0] + ',' + o[1] + ',' + o[2] + ')';
  }

  var patternCache = {};
  function makePattern(ctx, kind) {
    if (patternCache[kind]) return patternCache[kind];
    var c = document.createElement('canvas'), g;
    if (kind === 'emboss') {
      c.width = c.height = 24; g = c.getContext('2d');
      g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = 1.2;
      g.beginPath(); g.moveTo(0, 12); g.lineTo(12, 0); g.moveTo(12, 24); g.lineTo(24, 12); g.stroke();
      g.strokeStyle = 'rgba(0,0,0,.28)';
      g.beginPath(); g.moveTo(12, 0); g.lineTo(24, 12); g.moveTo(0, 12); g.lineTo(12, 24); g.stroke();
    } else if (kind === 'fiber') {
      c.width = c.height = 32; g = c.getContext('2d');
      for (var i = 0; i < 60; i++) {
        g.fillStyle = i % 2 ? 'rgba(0,0,0,.14)' : 'rgba(255,255,255,.4)';
        g.fillRect((i * 37) % 32, (i * 53) % 32, 1 + (i % 3), 1);
      }
    } else return null;
    return (patternCache[kind] = ctx.createPattern(c, 'repeat'));
  }

  function Duct3D(canvas, opts) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.o = {};
    for (var k in DEFAULTS) this.o[k] = DEFAULTS[k];
    this.yaw = DEFAULTS.yaw; this.pitch = DEFAULTS.pitch;
    this._raf = 0; this._drag = null; this._last = 0;
    this.set(opts || {});
    this._bind();
    this.resize();
  }

  Duct3D.prototype.set = function (opts) {
    for (var k in opts) this.o[k] = opts[k];
    if (opts.yaw != null) this.yaw = opts.yaw;
    if (opts.pitch != null) this.pitch = opts.pitch;
    this._build();
    this.request();
    return this;
  };

  Duct3D.prototype.resize = function () {
    var c = this.canvas, r = c.getBoundingClientRect();
    var dpr = Math.min(global.devicePixelRatio || 1, 2);
    this.cw = Math.max(50, r.width); this.ch = Math.max(50, r.height);
    c.width = Math.round(this.cw * dpr); c.height = Math.round(this.ch * dpr);
    this.dpr = dpr;
    this.request();
  };

  Duct3D.prototype._bind = function () {
    var self = this, c = this.canvas;
    if (global.ResizeObserver) new ResizeObserver(function () { self.resize(); }).observe(c);
    else global.addEventListener('resize', function () { self.resize(); });
    if (!this.o.interactive) return;
    c.style.touchAction = 'pan-y';
    c.style.cursor = 'grab';
    c.addEventListener('pointerdown', function (e) {
      self._drag = { x: e.clientX, y: e.clientY, yaw: self.yaw, pitch: self.pitch };
      self._userMoved = true;
      c.style.cursor = 'grabbing';
      if (c.setPointerCapture) c.setPointerCapture(e.pointerId);
    });
    c.addEventListener('pointermove', function (e) {
      var d = self._drag; if (!d) return;
      self.yaw = d.yaw + (e.clientX - d.x) * 0.008;
      self.pitch = Math.max(-0.25, Math.min(1.25, d.pitch + (e.clientY - d.y) * 0.006));
      self.request();
    });
    function up() { self._drag = null; c.style.cursor = 'grab'; }
    c.addEventListener('pointerup', up);
    c.addEventListener('pointercancel', up);
    c.addEventListener('keydown', function (e) {
      var s = 0.12;
      if (e.key === 'ArrowLeft') self.yaw -= s; else if (e.key === 'ArrowRight') self.yaw += s;
      else if (e.key === 'ArrowUp') self.pitch = Math.min(1.25, self.pitch + s);
      else if (e.key === 'ArrowDown') self.pitch = Math.max(-0.25, self.pitch - s);
      else return;
      self._userMoved = true; e.preventDefault(); self.request();
    });
  };

  Duct3D.prototype.request = function () {
    var self = this;
    if (this._raf) return;
    this._raf = global.requestAnimationFrame(function (ts) {
      self._raf = 0;
      var o = self.o;
      if (o.spin && !self._drag && !self._userMoved) {
        var dt = self._last ? Math.min(64, ts - self._last) : 16;
        self.yaw += o.spin * dt / 1000;
        self._last = ts;
        self.draw();
        self.request();
      } else { self._last = 0; self.draw(); }
    });
  };

  /* ---------- 几何 ---------- */
  Duct3D.prototype._build = function () {
    var o = this.o, W = o.w / 2, H = o.h / 2, L = o.l / 2, t = Math.min(o.t, o.w / 2 - 1, o.h / 2 - 1);
    var q = this.quads = [];
    function quad(p, n, mat, ul, vl) { q.push({ p: p, n: n, m: mat, ul: ul, vl: vl }); }
    // 轴对齐长方体，m: [+x,-x,+y,-y,+z,-z] 六个面的材质，null 表示不生成
    function box(x0, y0, z0, x1, y1, z1, m) {
      var dx = x1 - x0, dy = y1 - y0, dz = z1 - z0;
      if (m[0]) quad([[x1, y0, z0], [x1, y0, z1], [x1, y1, z1], [x1, y1, z0]], [1, 0, 0], m[0], dz, dy);
      if (m[1]) quad([[x0, y0, z1], [x0, y0, z0], [x0, y1, z0], [x0, y1, z1]], [-1, 0, 0], m[1], dz, dy);
      if (m[2]) quad([[x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1]], [0, 1, 0], m[2], dx, dz);
      if (m[3]) quad([[x0, y0, z1], [x1, y0, z1], [x1, y0, z0], [x0, y0, z0]], [0, -1, 0], m[3], dx, dz);
      if (m[4]) quad([[x1, y0, z1], [x0, y0, z1], [x0, y1, z1], [x1, y1, z1]], [0, 0, 1], m[4], dx, dy);
      if (m[5]) quad([[x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0]], [0, 0, -1], m[5], dx, dy);
    }
    var seg = Math.max(2, Math.min(14, Math.round(o.l / (Math.max(o.w, o.h) * 0.45))));
    for (var i = 0; i < seg; i++) {
      var z0 = -L + (2 * L) * i / seg, z1 = -L + (2 * L) * (i + 1) / seg;
      var zf = i === seg - 1 ? 'core' : null, zb = i === 0 ? 'core' : null;
      box(-W, H - t, z0, W, H, z1, ['outer', 'outer', 'outer', 'inner', zf, zb]);      // 顶板
      box(-W, -H, z0, W, -H + t, z1, ['outer', 'outer', 'inner', 'outer', zf, zb]);    // 底板
      box(-W, -H + t, z0, -W + t, H - t, z1, ['inner', 'outer', null, null, zf, zb]);  // 左板
      box(W - t, -H + t, z0, W, H - t, z1, ['outer', 'inner', null, null, zf, zb]);    // 右板
    }
    if (o.flanges) {
      var fw = Math.max(18, Math.min(40, Math.min(o.w, o.h) * 0.06)), fd = fw, e = 1, F = 'flange';
      [-1, 1].forEach(function (s) {
        var za = s > 0 ? L - fd : -L, zb2 = s > 0 ? L : -L + fd;
        box(-W - fw, H + e, za, W + fw, H + fw, zb2, [F, F, F, null, F, F]);
        box(-W - fw, -H - fw, za, W + fw, -H - e, zb2, [F, F, null, F, F, F]);
        box(-W - fw, -H - e, za, -W - e, H + e, zb2, [null, F, null, null, F, F]);
        box(W + e, -H - e, za, W + fw, H + e, zb2, [F, null, null, null, F, F]);
      });
      this.fw = fw;
    } else this.fw = 0;
    this.R = 0.5 * Math.sqrt(Math.pow(o.w + 2 * this.fw, 2) + Math.pow(o.h + 2 * this.fw, 2) + o.l * o.l);
  };

  /* ---------- 投影 ---------- */
  Duct3D.prototype._xf = function () {
    var cy = Math.cos(this.yaw), sy = Math.sin(this.yaw), cp = Math.cos(this.pitch), sp = Math.sin(this.pitch);
    var D = this.R * 4.2;
    var s = Math.min(this.cw, this.ch) * (this.o.dims ? 0.43 : 0.5) / this.R;
    var cx = this.cw / 2, cyy = this.ch / 2;
    return {
      D: D,
      rot: function (v) {
        var x = v[0] * cy + v[2] * sy, z = -v[0] * sy + v[2] * cy, y = v[1];
        return [x, y * cp + z * sp, -y * sp + z * cp];   // pitch>0 为俯视
      },
      proj: function (r) {
        var k = D / (D + r[2]);
        return [cx + r[0] * s * k, cyy - r[1] * s * k];
      }
    };
  };

  Duct3D.prototype.draw = function () {
    var ctx = this.ctx, o = this.o, xf = this._xf(), i, j;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.clearRect(0, 0, this.cw, this.ch);
    var P = function (v) { return xf.proj(xf.rot(v)); };

    // 地面投影
    var W = o.w / 2 + this.fw, H = o.h / 2 + this.fw, L = o.l / 2, gy = -H - Math.max(o.h * 0.08, 30);
    var g = [[-W, gy, -L], [W, gy, -L], [W, gy, L], [-W, gy, L]].map(P);
    ctx.save();
    ctx.shadowColor = o.shadow; ctx.shadowBlur = 38; ctx.shadowOffsetY = 12;
    ctx.fillStyle = o.shadow; ctx.globalAlpha = 0.55;
    ctx.beginPath(); ctx.moveTo(g[0][0], g[0][1]);
    for (i = 1; i < 4; i++) ctx.lineTo(g[i][0], g[i][1]);
    ctx.closePath(); ctx.fill();
    ctx.restore();

    var lx = -0.42, ly = 0.78, lz = -0.46, list = [];
    for (i = 0; i < this.quads.length; i++) {
      var qd = this.quads[i], n = xf.rot(qd.n), r = qd.p.map(xf.rot);
      var cxm = (r[0][0] + r[2][0]) / 2, cym = (r[0][1] + r[2][1]) / 2, czm = (r[0][2] + r[2][2]) / 2;
      // 背面剔除：观察点在 (0,0,-D)
      if (n[0] * cxm + n[1] * cym + n[2] * (czm + xf.D) >= 0) continue;
      list.push({ q: qd, r: r, z: czm, n: n });
    }
    list.sort(function (a, b) { return b.z - a.z; });

    for (i = 0; i < list.length; i++) {
      var it = list[i], kind = it.q.m, m = o[kind] || o.outer, pts = it.r.map(xf.proj);
      var lit = Math.max(0, it.n[0] * lx + it.n[1] * ly + it.n[2] * lz);
      var k = 0.7 + 0.42 * lit;
      if (kind === 'inner') k *= 0.86;
      ctx.beginPath();
      ctx.moveTo(pts[0][0], pts[0][1]);
      for (j = 1; j < 4; j++) ctx.lineTo(pts[j][0], pts[j][1]);
      ctx.closePath();
      var col = shade(m.color, k);
      ctx.fillStyle = col; ctx.strokeStyle = col; ctx.lineWidth = 0.8; ctx.lineJoin = 'round';
      ctx.fill(); ctx.stroke();
      var pk = kind === 'core' ? (m.pattern || 'fiber') : m.pattern;
      var pat = pk && pk !== 'none' ? makePattern(ctx, pk) : null;
      if (pat) {
        var mm = kind === 'core' ? 1.2 : 3.2;
        ctx.save(); ctx.clip();
        ctx.transform((pts[1][0] - pts[0][0]) / it.q.ul * mm, (pts[1][1] - pts[0][1]) / it.q.ul * mm,
                      (pts[3][0] - pts[0][0]) / it.q.vl * mm, (pts[3][1] - pts[0][1]) / it.q.vl * mm, pts[0][0], pts[0][1]);
        ctx.globalAlpha = kind === 'core' ? 0.5 : 0.42;
        ctx.fillStyle = pat;
        ctx.fillRect(0, 0, it.q.ul / mm, it.q.vl / mm);
        ctx.restore();
      }
      if (kind === 'core') { ctx.strokeStyle = shade(o.outer.color, 0.72); ctx.lineWidth = 1.4; ctx.stroke(); }
      else if (kind === 'flange') { ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 0.6; ctx.stroke(); }
    }
    if (o.dims) this._dims(xf);
  };

  /* ---------- 尺寸标注 ---------- */
  Duct3D.prototype._dims = function (xf) {
    var ctx = this.ctx, o = this.o, W = o.w / 2, H = o.h / 2, L = o.l / 2;
    var off = Math.max(o.w, o.h, o.l) * 0.07 + this.fw;
    var P = function (v) { return xf.proj(xf.rot(v)); };
    var zn = xf.rot([0, 0, 1])[2] < 0 ? L : -L;   // 靠近观察者的端面
    var xn = xf.rot([1, 0, 0])[2] < 0 ? 1 : -1;   // 靠近观察者的侧面
    function dim(a, b, ea, eb, text) {
      var pa = P(a), pb = P(b), qa = P(ea), qb = P(eb);
      ctx.strokeStyle = o.dimColor; ctx.fillStyle = o.dimColor; ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(qa[0], qa[1]); ctx.lineTo(pa[0], pa[1]);
      ctx.moveTo(qb[0], qb[1]); ctx.lineTo(pb[0], pb[1]);
      ctx.globalAlpha = 0.55; ctx.stroke(); ctx.globalAlpha = 1;
      ctx.beginPath(); ctx.moveTo(pa[0], pa[1]); ctx.lineTo(pb[0], pb[1]); ctx.stroke();
      [pa, pb].forEach(function (p) { ctx.beginPath(); ctx.arc(p[0], p[1], 2.2, 0, 6.2832); ctx.fill(); });
      var mx = (pa[0] + pb[0]) / 2, my = (pa[1] + pb[1]) / 2;
      ctx.font = '600 13px "Barlow Condensed","DIN Alternate","Noto Sans SC",sans-serif';
      var tw = ctx.measureText(text).width + 12;
      ctx.fillStyle = o.labelBg;
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(mx - tw / 2, my - 10, tw, 20, 3); else ctx.rect(mx - tw / 2, my - 10, tw, 20);
      ctx.fill();
      ctx.fillStyle = o.labelColor; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(text, mx, my + 0.5);
    }
    var lb = o.labels || {};   // 可覆盖标注文字（如按内净尺寸标注）
    dim([-W, H + off, zn], [W, H + off, zn], [-W, H, zn], [W, H, zn], lb.w || 'W ' + o.w);
    dim([-xn * (W + off), -H, zn], [-xn * (W + off), H, zn], [-xn * W, -H, zn], [-xn * W, H, zn], lb.h || 'H ' + o.h);
    dim([xn * W, -H - off, -L], [xn * W, -H - off, L], [xn * W, -H, -L], [xn * W, -H, L], lb.l || 'L ' + o.l);
  };

  global.Duct3D = Duct3D;
})(window);

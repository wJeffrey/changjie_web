/* Hose3D：铝箔伸缩通风软管的轻量 3D 渲染器（Canvas 2D，无依赖）。
   用法：var h = new Hose3D(canvas, {d:110, l:3000, bend:45, color:'#8f959b'}); h.set({d:89});
   d 内径、l 伸展长度，单位 mm；bend 弯曲角度，单位度。 */
(function (global) {
  'use strict';

  var DEFAULTS = {
    d: 110, l: 3000, bend: 45,
    color: '#8f959b', foil: '#c9d0d6',
    dims: true, dimColor: '#E2581F', labelColor: '#0B2545', labelBg: 'rgba(255,255,255,.92)',
    shadow: 'rgba(11,37,69,.2)',
    yaw: -1.05, pitch: 0.62
  };

  function rgb(h) { var n = parseInt(h.replace('#', ''), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
  function shade(hex, k) {
    var c = rgb(hex), o = [];
    for (var i = 0; i < 3; i++) o.push(Math.max(0, Math.min(255, Math.round(k <= 1 ? c[i] * k : c[i] + (255 - c[i]) * (k - 1)))));
    return 'rgb(' + o.join(',') + ')';
  }

  function Hose3D(canvas, opts) {
    this.canvas = canvas; this.ctx = canvas.getContext('2d');
    this.o = {}; for (var k in DEFAULTS) this.o[k] = DEFAULTS[k];
    this.yaw = DEFAULTS.yaw; this.pitch = DEFAULTS.pitch; this._raf = 0; this._drag = null;
    this.set(opts || {}); this._bind(); this.resize();
  }

  Hose3D.prototype.set = function (opts) {
    for (var k in opts) this.o[k] = opts[k];
    if (opts.yaw != null) this.yaw = opts.yaw;
    if (opts.pitch != null) this.pitch = opts.pitch;
    this._build(); this.request(); return this;
  };

  Hose3D.prototype.resize = function () {
    var c = this.canvas, r = c.getBoundingClientRect(), dpr = Math.min(global.devicePixelRatio || 1, 2);
    if (r.width < 2) return;                       // 画布隐藏时不处理
    this.cw = r.width; this.ch = Math.max(50, r.height);
    c.width = Math.round(this.cw * dpr); c.height = Math.round(this.ch * dpr); this.dpr = dpr;
    this.request();
  };

  Hose3D.prototype._bind = function () {
    var self = this, c = this.canvas;
    if (global.ResizeObserver) new ResizeObserver(function () { self.resize(); }).observe(c);
    else global.addEventListener('resize', function () { self.resize(); });
    c.style.touchAction = 'pan-y'; c.style.cursor = 'grab';
    c.addEventListener('pointerdown', function (e) {
      self._drag = { x: e.clientX, y: e.clientY, yaw: self.yaw, pitch: self.pitch };
      c.style.cursor = 'grabbing'; if (c.setPointerCapture) c.setPointerCapture(e.pointerId);
    });
    c.addEventListener('pointermove', function (e) {
      var d = self._drag; if (!d) return;
      self.yaw = d.yaw + (e.clientX - d.x) * 0.008;
      self.pitch = Math.max(-0.2, Math.min(1.3, d.pitch + (e.clientY - d.y) * 0.006));
      self.request();
    });
    function up() { self._drag = null; c.style.cursor = 'grab'; }
    c.addEventListener('pointerup', up); c.addEventListener('pointercancel', up);
    c.addEventListener('keydown', function (e) {
      var s = 0.12;
      if (e.key === 'ArrowLeft') self.yaw -= s; else if (e.key === 'ArrowRight') self.yaw += s;
      else if (e.key === 'ArrowUp') self.pitch = Math.min(1.3, self.pitch + s);
      else if (e.key === 'ArrowDown') self.pitch = Math.max(-0.2, self.pitch - s);
      else return;
      e.preventDefault(); self.request();
    });
  };

  Hose3D.prototype.request = function () {
    var self = this; if (this._raf || !this.cw) return;
    this._raf = global.requestAnimationFrame(function () { self._raf = 0; self.draw(); });
  };

  /* 中心线：直段 + 圆弧 + 直段，位于 XZ 平面；沿线每个螺距取一个截面环 */
  Hose3D.prototype._build = function () {
    var o = this.o, L = o.l, D = o.d, th = (o.bend || 0) * Math.PI / 180;
    var Rb = th > 0.01 ? Math.min(Math.max(D * 2.2, L * 0.18), L * 0.62 / th) : 0;
    var arc = Rb * th, s1 = (L - arc) / 2;
    var pitch = Math.max(D * 0.15, L / 520), n = Math.max(8, Math.round(L / pitch));
    var rings = this.rings = [], minX = 1e9, maxX = -1e9, minZ = 1e9, maxZ = -1e9;
    for (var i = 0; i <= n; i++) {
      var s = L * i / n, p, t;
      if (s <= s1 || !Rb) { p = [0, 0, s]; t = [0, 0, 1]; }
      else if (s <= s1 + arc) { var a = (s - s1) / Rb; p = [Rb * (1 - Math.cos(a)), 0, s1 + Rb * Math.sin(a)]; t = [Math.sin(a), 0, Math.cos(a)]; }
      else { var e = s - s1 - arc; p = [Rb * (1 - Math.cos(th)) + e * Math.sin(th), 0, s1 + Rb * Math.sin(th) + e * Math.cos(th)]; t = [Math.sin(th), 0, Math.cos(th)]; }
      rings.push({ p: p, t: t, rib: i % 2 === 0, end: i === 0 ? -1 : i === n ? 1 : 0 });
      minX = Math.min(minX, p[0]); maxX = Math.max(maxX, p[0]); minZ = Math.min(minZ, p[2]); maxZ = Math.max(maxZ, p[2]);
    }
    var cx = (minX + maxX) / 2, cz = (minZ + maxZ) / 2;
    rings.forEach(function (r) { r.p = [r.p[0] - cx, 0, r.p[2] - cz]; });
    this.R = 0.5 * Math.sqrt(Math.pow(maxX - minX + D, 2) + Math.pow(maxZ - minZ + D, 2) + D * D);
  };

  Hose3D.prototype.draw = function () {
    if (!this.cw) return;
    var ctx = this.ctx, o = this.o, self = this, i, j;
    var cy = Math.cos(this.yaw), sy = Math.sin(this.yaw), cp = Math.cos(this.pitch), sp = Math.sin(this.pitch);
    var Dc = this.R * 4.2, sc = Math.min(this.cw * 0.42, this.ch * 0.62) / this.R, ox = this.cw / 2, oy = this.ch / 2;
    function rot(v) { var x = v[0] * cy + v[2] * sy, z = -v[0] * sy + v[2] * cy; return [x, v[1] * cp + z * sp, -v[1] * sp + z * cp]; }
    function proj(r) { var k = Dc / (Dc + r[2]); return [ox + r[0] * sc * k, oy - r[1] * sc * k]; }
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.clearRect(0, 0, this.cw, this.ch);

    var R0 = o.d / 2, N = 28, list = this.rings.map(function (r) {
      var c = rot(r.p), t = rot(r.t);
      return { r: r, c: c, t: t, z: c[2] };
    });

    // 地面投影
    ctx.save(); ctx.strokeStyle = o.shadow; ctx.lineWidth = Math.max(4, o.d * sc * 0.9); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.globalAlpha = 0.5; ctx.shadowColor = o.shadow; ctx.shadowBlur = 26;
    ctx.beginPath();
    this.rings.forEach(function (r, k) { var q = proj(rot([r.p[0], -R0 * 1.5, r.p[2]])); if (k) ctx.lineTo(q[0], q[1]); else ctx.moveTo(q[0], q[1]); });
    ctx.stroke(); ctx.restore();

    list.sort(function (a, b) { return b.z - a.z; });
    function ring(it, rad) {
      var p = it.r.p, t = it.r.t, v = [t[2], 0, -t[0]], pts = [];   // v = t × up
      for (j = 0; j < N; j++) {
        var a = j / N * 6.2832, c = Math.cos(a) * rad, s = Math.sin(a) * rad;
        pts.push(proj(rot([p[0] + s * v[0], p[1] + c, p[2] + s * v[2]])));
      }
      ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
      for (j = 1; j < N; j++) ctx.lineTo(pts[j][0], pts[j][1]);
      ctx.closePath();
      return [pts[0], pts[N / 2]];                                    // 顶点与底点（用于明暗渐变）
    }
    for (i = 0; i < list.length; i++) {
      var it = list[i], rad = R0 * (it.r.rib ? 1.09 : 1.0);
      var tb = ring(it, rad), g = ctx.createLinearGradient(tb[0][0], tb[0][1], tb[1][0], tb[1][1]);
      var k = it.r.rib ? 1.0 : 0.8;
      g.addColorStop(0, shade(o.color, 1.32 * k > 1 ? 1 + (1.32 * k - 1) : 1.32 * k));
      g.addColorStop(0.35, shade(o.color, k));
      g.addColorStop(1, shade(o.color, 0.5 * k));
      ctx.fillStyle = g; ctx.fill();
      ctx.strokeStyle = shade(o.color, it.r.rib ? 0.62 : 0.5); ctx.lineWidth = 0.6; ctx.stroke();
      // 朝向观察者的端口：露出铝箔内衬
      if (it.r.end && it.t[2] * it.r.end < 0) {
        var ib = ring(it, R0 * 0.93), gi = ctx.createLinearGradient(ib[0][0], ib[0][1], ib[1][0], ib[1][1]);
        gi.addColorStop(0, shade(o.foil, 0.45)); gi.addColorStop(0.6, shade(o.foil, 0.8)); gi.addColorStop(1, shade(o.foil, 1.15));
        ctx.fillStyle = gi; ctx.fill();
      }
    }

    if (o.dims) {
      var a0 = this.rings[0], a1 = this.rings[this.rings.length - 1];
      var near = rot(a0.p)[2] < rot(a1.p)[2] ? a0 : a1, mid = this.rings[this.rings.length >> 1];
      label(proj(rot([near.p[0], R0 * 2.1, near.p[2]])), 'Ø ' + o.d);
      label(proj(rot([mid.p[0], -R0 * 2.6, mid.p[2]])), 'L ' + o.l);
    }
    function label(pt, text) {
      ctx.font = '600 13px "Barlow Condensed","DIN Alternate","Noto Sans SC",sans-serif';
      var tw = ctx.measureText(text).width + 12;
      ctx.fillStyle = o.labelBg; ctx.strokeStyle = o.dimColor; ctx.lineWidth = 1;
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(pt[0] - tw / 2, pt[1] - 10, tw, 20, 3); else ctx.rect(pt[0] - tw / 2, pt[1] - 10, tw, 20);
      ctx.fill(); ctx.stroke();
      ctx.fillStyle = o.labelColor; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(text, pt[0], pt[1] + 0.5);
    }
    void self;
  };

  global.Hose3D = Hose3D;
})(window);

export default window.Hose3D;

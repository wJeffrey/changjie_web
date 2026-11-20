import site from '@/data/site.json';

export default function Hero() {
  return (
    <>
<section className="hero">
  <div className="container">
    <div className="hero-grid">
      <div>
        <p className="hero-slogan">崇尚自然，科技创造洁净</p>
        <h1>乌鲁木齐中央空调与风管工程</h1>
        <p className="sub">销售美的、格力、大金等品牌空调，五家渠自有工厂生产 8 个系列复合风管，从机组安装、风管制作到洁净新风一体交付。</p>
        <div className="hero-cta">
          <a className="btn btn-primary" href="/configurator">配置一段风管</a>
          <a className="btn btn-ghost" href="#business">查看主营业务</a>
        </div>
      </div>
      <div className="hero-stage">
        <canvas id="heroDuct" tabIndex="0" role="img" aria-label="双面彩钢酚醛复合风管的三维模型，可拖动旋转"></canvas>
        <div className="hero-cap">
          <span>双面彩钢酚醛复合风管，可拖动旋转</span>
          <a href="/configurator?line=s2">换尺寸、材质和颜色</a>
        </div>
      </div>
    </div>
    <div className="titlebar">
      <div><small>产品系列</small><b>8<span>个</span></b></div>
      <div><small>耐火极限最高</small><b>3<span>小时</span></b></div>
      <div><small>导热系数</small><b>0.022–0.033<span>W/(m·K)</span></b></div>
      <div><small>公司成立</small><b>2019<span>年，乌鲁木齐</span></b></div>
    </div>
  </div>
</section>
    </>
  );
}

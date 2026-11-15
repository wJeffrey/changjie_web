import site from '@/data/site.json';

export default function Hero() {
  return (
    <>
<section className="hero">
  <div className="container">
    <div className="hero-grid">
      <div>
        <p className="hero-slogan">崇尚自然，科技创造洁净</p>
        <h1>中央空调通风与防排烟复合风管</h1>
        <p className="sub">昌杰立盛在乌鲁木齐生产复合风管板材和成品风管，并承接通风、防排烟系统的安装。从酚醛保温风管到耐火极限 3 小时的排烟风管，共八个系列。</p>
        <div className="hero-cta">
          <a className="btn btn-primary" href="/configurator">配置一段风管</a>
          <a className="btn btn-ghost" href="#products">查看产品系列</a>
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

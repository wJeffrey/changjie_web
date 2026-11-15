import site from '@/data/site.json';

export default function Services() {
  return (
    <>
<section className="sec" id="services" style={{ paddingTop: '0' }}>
  <div className="container">
    <div className="sec-head">
      <h2 className="h-sec">生产与工程服务</h2>
      <p className="lede">板材下料、成型和法兰加工以机械化生产为主，尺寸一致，工期更短。工程上从设计、生产、安装到调试和售后都可以交给我们。</p>
    </div>
    <div className="svc-grid">
      <div className="svc-photos">
        <figure><img src="/assets/img/site/fab-cnc.jpg" alt="数控设备加工风管板材" loading="lazy" /><figcaption>数控下料</figcaption></figure>
        <figure><img src="/assets/img/site/fab-router.jpg" alt="板材开槽成型设备" loading="lazy" /><figcaption>开槽成型</figcaption></figure>
      </div>
      <ul className="svc-list">
        <li><h3>中央空调安装</h3><p>商业综合体、医院、酒店和办公楼的中央空调系统设计、施工与调试。</p></li>
        <li><h3>风管生产制造</h3><p>从原材料到包装全程控制，复合风管板材和成品风管批量稳定供货。</p></li>
        <li><h3>防排烟系统</h3><p>穿越防火分区、走廊吊顶等场景的防烟排烟风管整体方案。</p></li>
        <li><h3>防火封堵</h3><p>管线穿越楼板、防火墙处的封堵处理。</p></li>
        <li><h3>铁皮风管包覆</h3><p>既有镀锌钢板风管的防火升级改造，干法施工，可拆卸维护。</p></li>
        <li><h3>定制方案</h3><p>地铁、医院、数据中心等有特殊要求的项目，请直接联系工程师。</p></li>
      </ul>
    </div>
  </div>
</section>
    </>
  );
}

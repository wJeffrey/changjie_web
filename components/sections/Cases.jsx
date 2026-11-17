import site from '@/data/site.json';

export default function Cases() {
  return (
    <>
<section className="sec" id="cases">
  <div className="container">
    <div className="sec-head">
      <h2 className="h-sec">工程案例</h2>
      <p className="lede">以下照片均为项目现场实拍。具体产品型号、工程规模和验收指标以项目档案为准。</p>
    </div>

    <article className="case-lead">
      <div className="shots">
        <img src="/assets/img/site/c-pool-0.jpg" alt="党校游泳馆风管主干线及场馆空间" loading="lazy" />
        <img src="/assets/img/site/c-pool-1.jpg" alt="党校游泳馆风管转弯连接与吊装结构" loading="lazy" />
        <img src="/assets/img/site/c-pool-2.jpg" alt="党校游泳馆送风系统施工现场" loading="lazy" />
      </div>
      <div className="txt">
        <span className="case-tag">公共场馆通风工程</span>
        <h3>乌鲁木齐市党校游泳馆</h3>
        <p>大空间场馆内的矩形风管主干线、转弯连接、支吊架和末端送风口，由昌杰立盛结合现场结构与空间条件完成加工和安装配套。</p>
      </div>
    </article>

    <div className="cases">
      <article className="case">
        <div className="pair"><img src="/assets/img/site/c-xtipc-0.jpg" alt="中国科学院新疆理化技术研究所外景" loading="lazy" /><img src="/assets/img/site/c-xtipc-1.jpg" alt="实验室内的风管安装" loading="lazy" /></div>
        <div className="txt"><h3>中国科学院新疆理化研究所实验室</h3><address>乌鲁木齐市新市区科学一街 341 号</address></div>
      </article>
      <article className="case">
        <div className="pair"><img src="/assets/img/site/c-jinrong-0.jpg" alt="金融大厦外景" loading="lazy" /><img src="/assets/img/site/c-jinrong-1.jpg" alt="金融大厦室内风管安装" loading="lazy" /></div>
        <div className="txt"><h3>金融大厦</h3><address>乌鲁木齐市水磨沟区东环路与昆仑路交口</address></div>
      </article>
      <article className="case">
        <div className="pair"><img src="/assets/img/site/c-chengjian-0.jpg" alt="城建大厦外景" loading="lazy" /><img src="/assets/img/site/c-chengjian-1.jpg" alt="城建大厦通风风管安装" loading="lazy" /></div>
        <div className="txt"><h3>城建大厦通风项目</h3><address>乌鲁木齐市长春路</address></div>
      </article>
      <article className="case">
        <div className="pair"><img src="/assets/img/site/c-yongli-0.jpg" alt="永利大厦外景" loading="lazy" /><img src="/assets/img/site/c-yongli-1.jpg" alt="永利大厦通风风管安装" loading="lazy" /></div>
        <div className="txt"><h3>永利大厦通风项目</h3><address>乌鲁木齐市沙依巴克区高铁纬五路</address></div>
      </article>
    </div>

    <div className="site-gallery">
      <h3>施工实景</h3>
      <p>近期项目现场实拍：风管主干线、分支、变径、吊装与机组连接。</p>
      <div className="gallery">
        <figure><img src="/assets/img/site/g-01.jpg" alt="体育馆看台上方的风管主干线" loading="lazy" /><figcaption>体育馆看台上方的风管主干线</figcaption></figure>
        <figure><img src="/assets/img/site/g-02.jpg" alt="体育馆风管安装施工中" loading="lazy" /><figcaption>体育馆风管安装施工中</figcaption></figure>
        <figure><img src="/assets/img/site/g-03.jpg" alt="地下空间的风管主干线" loading="lazy" /><figcaption>地下空间的风管主干线</figcaption></figure>
        <figure><img src="/assets/img/site/g-04.jpg" alt="风管三通分支与吊装" loading="lazy" /><figcaption>风管三通分支与吊装</figcaption></figure>
        <figure><img src="/assets/img/site/g-05.jpg" alt="风管分支与送风口" loading="lazy" /><figcaption>风管分支与送风口</figcaption></figure>
        <figure><img src="/assets/img/site/g-06.jpg" alt="主风管变径与交叉" loading="lazy" /><figcaption>主风管变径与交叉</figcaption></figure>
        <figure><img src="/assets/img/site/g-07.jpg" alt="工业厂房内的长距离风管" loading="lazy" /><figcaption>工业厂房内的长距离风管</figcaption></figure>
        <figure><img src="/assets/img/site/g-08.jpg" alt="屋面空调机组与风管连接" loading="lazy" /><figcaption>屋面空调机组与风管连接</figcaption></figure>
      </div>
    </div>

    <div className="record">
      <div>
        <h3>部分业绩</h3>
        <table className="tbl">
          <thead><tr><th scope="col">项目名称</th><th scope="col">应用产品</th></tr></thead>
          <tbody>
            <tr><td>第九师白杨市迎宾馆</td><td>单面彩钢</td></tr>
            <tr><td>中建八局算力中心</td><td>镁质复合风管</td></tr>
            <tr><td>新疆国际会展中心</td><td>单面酚醛板</td></tr>
            <tr><td>新疆国际双子大厦</td><td>单面酚醛板</td></tr>
            <tr><td>盛达广场</td><td>单面酚醛板</td></tr>
          </tbody>
        </table>
      </div>
      <div>
        <h3>更多合作项目</h3>
        <ul className="more">
          <li>红光山隆瑞广场</li><li>克拉玛依华谊购物中心</li><li>伊宁瑞阳皇冠酒店</li>
        </ul>
      </div>
    </div>
  </div>
</section>
    </>
  );
}

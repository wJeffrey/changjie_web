import site from '@/data/site.json';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <span className="footer-logo"><img src="/assets/img/logo.png" alt={`${site.short}标志`} /></span>
            <p style={{ color: '#fff', fontWeight: 500, marginBottom: 6 }}>{site.name}</p>
            <p>中央空调通风系统、防排烟系统用复合风管的研发、生产与安装。</p>
          </div>
          <div>
            <h4>产品</h4>
            <ul>
              <li><a href="/#products">酚醛复合风管</a></li>
              <li><a href="/#products">防排烟风管</a></li>
              <li><a href="/#products">玻纤复合风管</a></li>
              <li><a href="/#products">耐火风管</a></li>
            </ul>
          </div>
          <div>
            <h4>工具与资料</h4>
            <ul>
              <li><a href="/configurator">选型配置器</a></li>
              <li><a href="/manual.html">产品与技术手册</a></li>
              <li><a href="/#cases">工程案例</a></li>
              <li><a href="/#message">在线留言</a></li>
            </ul>
          </div>
          <div>
            <h4>联系</h4>
            <ul>
              <li><a href={`tel:${site.tel}`}>{site.phone}</a></li>
              <li><a href={`mailto:${site.email}`}>{site.email}</a></li>
              <li>{site.addressShort}</li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} {site.name}</span>
          <span>统一社会信用代码 {site.creditCode}</span>
          <span>本站会记录访问的 IP 地址、所在地区和访问页面，用于统计与安全。</span>
        </div>
      </div>
    </footer>
  );
}

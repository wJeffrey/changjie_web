import Script from 'next/script';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import VisitTracker from '@/components/VisitTracker';
import site from '@/data/site.json';
import './site.css';

export const metadata = {
  metadataBase: new URL(`https://${site.domain}`),
  icons: { icon: '/assets/img/favicon.png', apple: '/assets/img/favicon.png' },
};

export const viewport = { themeColor: '#0B2545' };

export default function RootLayout({ children }) {
  return (
    <html lang="zh-CN">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@500;600&family=Noto+Sans+SC:wght@400;500;700&family=Noto+Serif+SC:wght@600;700;900&display=swap" />
      </head>
      <body id="top">
        <a className="skip" href="#main">跳到主要内容</a>
        <Header />
        {children}
        <Footer />
        <VisitTracker />
        {/* 百度统计 */}
        <Script id="baidu-tongji" strategy="afterInteractive">
          {`var _hmt = _hmt || [];(function(){var hm=document.createElement("script");hm.src="https://hm.baidu.com/hm.js?${site.baiduId}";var s=document.getElementsByTagName("script")[0];s.parentNode.insertBefore(hm,s);})();`}
        </Script>
      </body>
    </html>
  );
}

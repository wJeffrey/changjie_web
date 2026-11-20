import Script from 'next/script';
import VisitTracker from '@/components/VisitTracker';
import site from '@/data/site.json';

export const metadata = {
  metadataBase: new URL(`https://${site.domain}`),
  icons: { icon: '/assets/img/favicon.png', apple: '/assets/img/favicon.png' },
};

export const viewport = { themeColor: '#0B2545' };

// The data-* attributes on <html> are the home page's design-kit settings (assets/kit/system.css reads them);
// the configurator does not load the kit, so they do nothing there. The kit's inline scripts add classes to
// <html> before React hydrates, hence suppressHydrationWarning.
export default function RootLayout({ children }) {
  return (
    <html lang="zh-CN" data-type="product" data-radius="sharp" data-buttons="arrow" data-motion="" suppressHydrationWarning>
      <body>
        {children}
        <VisitTracker />
        {/* 百度统计 */}
        <Script id="baidu-tongji" strategy="afterInteractive">
          {`var _hmt = _hmt || [];(function(){var hm=document.createElement("script");hm.src="https://hm.baidu.com/hm.js?${site.baiduId}";var s=document.getElementsByTagName("script")[0];s.parentNode.insertBefore(hm,s);})();`}
        </Script>
      </body>
    </html>
  );
}

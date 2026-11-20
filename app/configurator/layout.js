import Header from '@/components/Header';
import Footer from '@/components/Footer';
import '../site.css';

// The configurator keeps the site chrome (header, footer, site.css and its fonts); the home page has its own,
// from the design kit.
export default function ConfiguratorLayout({ children }) {
  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link rel="stylesheet" precedence="fonts" href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@500;600&family=Noto+Sans+SC:wght@400;500;700&family=Noto+Serif+SC:wght@600;700;900&display=swap" />
      <a className="skip" href="#main">跳到主要内容</a>
      <Header />
      {children}
      <Footer />
    </>
  );
}

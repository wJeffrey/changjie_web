import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import fonts from '@/components/home/fonts.json';

// The home page is the static site's index.html on the design kit (public/assets/kit). Its markup lives in
// components/home/markup.html and goes in as HTML, not JSX: the kit's scripts change these elements
// (motion, moments, the form, the mobile nav), and React must not reconcile them. The page CSS is
// public/assets/home.css. When the heading, statement or footer-lede text changes, regenerate the Noto Serif SC
// text= list in fonts.json, or the new characters fall back to the system serif.
const markup = readFileSync(join(process.cwd(), 'components/home/markup.html'), 'utf8');

const title = '昌杰立盛：乌鲁木齐中央空调、复合风管与洁净新风工程';

export const metadata = {
  title,
  description: '新疆昌杰立盛销售美的、格力、大金等品牌空调，自有工厂生产八个系列复合风管，承接空调安装、风管制作与洁净新风系统的一体化工程。',
  keywords: '乌鲁木齐中央空调,中央空调安装,洁净新风,复合风管,防排烟风管,彩钢酚醛风管,铝箔酚醛风管,玻纤复合风管,耐火风管,新疆昌杰立盛,乌鲁木齐风管厂家',
  alternates: { canonical: '/' },
  openGraph: { type: 'website', title, description: '品牌空调销售与安装、复合风管制造、洁净新风，一家公司一体交付。' },
  other: { 'site-kind': 'other', 'page-type': 'product' },
};

export const viewport = { themeColor: '#f4f5f6' };

const KIT_CSS = ['/assets/kit/system.css', '/assets/kit/ui/cards.css', '/assets/kit/motion/motion.css', '/assets/kit/layout/layout.css', '/assets/home.css'];
// quote.js (ours, not the kit's) loads the captcha and sends the quote form after the kit has checked its fields
const KIT_JS = ['/assets/kit/system.js', '/assets/kit/motion/motion.js', '/assets/kit/layout/layout.js', '/assets/quote.js'];
const ENTER = "document.documentElement.classList.add('m-enter');setTimeout(function(){document.documentElement.classList.add('m-enter-done')},700);"
  + "document.documentElement.classList.add('mo-js');setTimeout(function(){document.documentElement.classList.add('mo-safe')},2500);";

export default function HomePage() {
  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      {fonts.map((href) => <link key={href} rel="stylesheet" precedence="fonts" href={href} />)}
      {KIT_CSS.map((href) => <link key={href} rel="stylesheet" precedence="kit" href={href} />)}
      <script dangerouslySetInnerHTML={{ __html: ENTER }} />
      <div style={{ display: 'contents' }} dangerouslySetInnerHTML={{ __html: markup }} />
      {KIT_JS.map((src) => <script key={src} type="module" src={src} />)}
    </>
  );
}

import Hero from '@/components/sections/Hero';
import HeroDuct from '@/components/HeroDuct';
import Business from '@/components/sections/Business';
import Products from '@/components/Products';
import System from '@/components/sections/System';
import ConfiguratorCta from '@/components/sections/ConfiguratorCta';
import Cases from '@/components/sections/Cases';
import Services from '@/components/sections/Services';
import About from '@/components/sections/About';
import Contact from '@/components/sections/Contact';
import ContactForm from '@/components/ContactForm';
import './home.css';

export const metadata = {
  title: '新疆昌杰立盛环境工程技术有限公司 · 中央空调、复合风管与洁净新风工程',
  description: '新疆昌杰立盛环境工程技术有限公司位于乌鲁木齐，销售美的、格力、大金等品牌空调，生产铝箔酚醛、彩钢酚醛、玻纤、防排烟及无机漂珠硅晶等复合风管板材与成品风管，并承接空调安装、风管制作与洁净新风系统的一体化工程。科技创造洁净。',
  keywords: '乌鲁木齐中央空调,中央空调安装,洁净新风,复合风管,防排烟风管,彩钢酚醛风管,铝箔酚醛风管,玻纤复合风管,耐火风管,漂珠硅晶风管,新疆昌杰立盛,乌鲁木齐风管厂家',
};

export default function HomePage() {
  return (
    <main id="main">
      <Hero />
      <HeroDuct />
      <Business />
      <Products />
      <System />
      <ConfiguratorCta />
      <Cases />
      <Services />
      <About />
      <Contact />
      <ContactForm />
    </main>
  );
}

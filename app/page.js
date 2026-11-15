import Hero from '@/components/sections/Hero';
import HeroDuct from '@/components/HeroDuct';
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
  title: '新疆昌杰立盛环境工程技术有限公司 · 复合风管与防排烟系统',
  description: '新疆昌杰立盛环境工程技术有限公司位于乌鲁木齐，生产铝箔酚醛、彩钢酚醛、玻纤、防排烟及无机漂珠硅晶等复合风管板材与成品风管，并承接中央空调通风和防排烟系统安装。科技创造洁净。',
  keywords: '复合风管,防排烟风管,彩钢酚醛风管,铝箔酚醛风管,玻纤复合风管,耐火风管,漂珠硅晶风管,新疆昌杰立盛,乌鲁木齐风管厂家',
};

export default function HomePage() {
  return (
    <main id="main">
      <Hero />
      <HeroDuct />
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

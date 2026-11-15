import Configurator from '@/components/Configurator';
import './configurator.css';

export const metadata = {
  title: '风管选型配置器 | 新疆昌杰立盛环境工程技术有限公司',
  description: '在线配置复合风管：选择产品系列、截面尺寸、长度、板厚与外表面颜色，实时查看三维效果并生成配置清单。',
};

export default function ConfiguratorPage() {
  return <Configurator />;
}

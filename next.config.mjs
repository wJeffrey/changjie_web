/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  outputFileTracingRoot: import.meta.dirname,
  // 这两个包在运行时读取自带的数据文件 / 使用 Node 网络模块，不参与打包
  serverExternalPackages: ['ip2region', 'nodemailer'],
  async redirects() {
    return [
      { source: '/index.html', destination: '/', permanent: true },
      { source: '/configurator.html', destination: '/configurator', permanent: true },
    ];
  },
};

export default nextConfig;

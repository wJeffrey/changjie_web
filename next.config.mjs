/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  outputFileTracingRoot: import.meta.dirname,
  // 这些包在运行时读取自带的数据文件（ip2region 的库、svg-captcha 的字体）/ 使用 Node 网络模块，不参与打包
  serverExternalPackages: ['ip2region', 'nodemailer', 'svg-captcha'],
  async redirects() {
    return [
      { source: '/index.html', destination: '/', permanent: true },
      { source: '/configurator.html', destination: '/configurator', permanent: true },
    ];
  },
};

export default nextConfig;

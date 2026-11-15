// 启动脚本：npm start（生产）/ npm run dev（开发）。
// 在把请求交给 Next.js 之前先确定访客 IP 的来源：
//   没有反向代理（默认）：用真实连接地址覆盖 X-Forwarded-For，访客无法伪造；
//   有反向代理（TRUST_PROXY=1）：保留代理写入的 X-Forwarded-For，lib/request.js 取最右一项。
import { createServer } from 'node:http';
import next from 'next';

const dev = process.argv.includes('--dev');
const port = Number(process.env.PORT) || 4173;
const hostname = process.env.HOST || '0.0.0.0';

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();
await app.prepare();

createServer((req, res) => {
  if (process.env.TRUST_PROXY !== '1') req.headers['x-forwarded-for'] = req.socket.remoteAddress || '';
  handle(req, res);
}).listen(port, hostname, () => {
  console.log(`昌杰立盛官网已启动：http://localhost:${port}（${dev ? '开发' : '生产'}模式）`);
});

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

const server = createServer((req, res) => {
  if (process.env.TRUST_PROXY !== '1') req.headers['x-forwarded-for'] = req.socket.remoteAddress || '';
  handle(req, res);
});

// 端口被占用等启动失败必须以非零状态退出，否则进程管理器会当作正常结束而不重启
server.on('error', (err) => {
  console.error(err.code === 'EADDRINUSE' ? `启动失败：端口 ${port} 已被占用，请换一个 PORT。` : `启动失败：${err.message}`);
  process.exit(1);
});

server.listen(port, hostname, () => {
  console.log(`昌杰立盛官网已启动：http://localhost:${port}（${dev ? '开发' : '生产'}模式）`);
});

// 进程管理器或 Ctrl+C 发来停止信号时，先停止接收新连接再退出
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(0), 3000).unref();
  });
}

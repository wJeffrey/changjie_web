// 本地预览：npm run dev → http://localhost:4173，src/ 有改动时自动重新构建。
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { watch } from 'node:fs';
import { extname, join, normalize } from 'node:path';
import { build, ROOT } from '../build.mjs';

const PORT = Number(process.env.PORT) || 4173;
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.ico': 'image/x-icon',
};

function rebuild() {
  try { build(); console.log(new Date().toLocaleTimeString(), '已构建'); }
  catch (e) { console.error('构建失败：', e.message); }
}
rebuild();

let timer;
watch(join(ROOT, 'src'), { recursive: true }, () => { clearTimeout(timer); timer = setTimeout(rebuild, 120); });

createServer(async (req, res) => {
  let path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (path.endsWith('/')) path += 'index.html';
  const file = normalize(join(ROOT, path));
  if (!file.startsWith(ROOT)) { res.writeHead(403).end(); return; }
  try {
    const body = await readFile(file);
    res.writeHead(200, { 'Content-Type': TYPES[extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(body);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('404 未找到');
  }
}).listen(PORT, '127.0.0.1', () => console.log(`预览地址 http://localhost:${PORT}`));

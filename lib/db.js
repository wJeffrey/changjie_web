// SQLite 存储：访问记录与留言。使用 Node 内置的 node:sqlite（SQLite 3），无需原生扩展。
import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

const SCHEMA = `
PRAGMA journal_mode = WAL;
PRAGMA busy_timeout = 3000;
CREATE TABLE IF NOT EXISTS visits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at TEXT NOT NULL,
  ip TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT '',
  province TEXT NOT NULL DEFAULT '',
  city TEXT NOT NULL DEFAULT '',
  isp TEXT NOT NULL DEFAULT '',
  path TEXT NOT NULL,
  referrer TEXT NOT NULL DEFAULT '',
  user_agent TEXT NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS visits_created ON visits (created_at);
CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at TEXT NOT NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  company TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL,
  source_path TEXT NOT NULL DEFAULT '',
  ip TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT '',
  province TEXT NOT NULL DEFAULT '',
  city TEXT NOT NULL DEFAULT '',
  isp TEXT NOT NULL DEFAULT '',
  user_agent TEXT NOT NULL DEFAULT '',
  mail_status TEXT NOT NULL DEFAULT 'pending',
  mail_error TEXT
);
CREATE INDEX IF NOT EXISTS messages_created ON messages (created_at);
CREATE INDEX IF NOT EXISTS messages_ip ON messages (ip, created_at);
CREATE TABLE IF NOT EXISTS captchas (
  id TEXT PRIMARY KEY,
  answer TEXT NOT NULL,
  ip TEXT NOT NULL,
  created_at TEXT NOT NULL,
  used_at TEXT
);
CREATE INDEX IF NOT EXISTS captchas_ip ON captchas (ip, created_at);
`;

// 开发模式下模块会热重载，把连接挂在 globalThis 上避免重复打开
export function getDb() {
  if (!globalThis.__cjDb) {
    const dir = process.env.DATA_DIR || join(process.cwd(), 'data');
    mkdirSync(dir, { recursive: true });
    const db = new DatabaseSync(join(dir, 'site.sqlite'));
    db.exec(SCHEMA);
    globalThis.__cjDb = db;
  }
  return globalThis.__cjDb;
}

const now = () => new Date().toISOString();

export function recordVisit({ ip, region, path, referrer, userAgent }) {
  getDb().prepare(
    'INSERT INTO visits (created_at, ip, country, province, city, isp, path, referrer, user_agent) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(now(), ip, region.country, region.province, region.city, region.isp, path, referrer, userAgent);
}

export function createMessage({ name, phone, company, email, content, sourcePath, ip, region, userAgent }) {
  const r = getDb().prepare(
    `INSERT INTO messages (created_at, name, phone, company, email, content, source_path, ip, country, province, city, isp, user_agent)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(now(), name, phone, company, email, content, sourcePath, ip, region.country, region.province, region.city, region.isp, userAgent);
  return Number(r.lastInsertRowid);
}

export function setMailStatus(id, status, error = null) {
  getDb().prepare('UPDATE messages SET mail_status = ?, mail_error = ? WHERE id = ?').run(status, error, id);
}

export function countMessagesSince(ip, sinceIso) {
  return getDb().prepare('SELECT COUNT(*) AS n FROM messages WHERE ip = ? AND created_at >= ?').get(ip, sinceIso).n;
}

export function countAllMessagesSince(sinceIso) {
  return getDb().prepare('SELECT COUNT(*) AS n FROM messages WHERE created_at >= ?').get(sinceIso).n;
}

// 同一手机号、同样内容的留言（重复提交）
export function hasSameMessageSince(phone, content, sinceIso) {
  return Boolean(getDb().prepare('SELECT 1 FROM messages WHERE phone = ? AND content = ? AND created_at >= ? LIMIT 1').get(phone, content, sinceIso));
}

// 验证码：每个只能用一次。用过的不删，留到一小时后清理，用于统计每个 IP 获取验证码的次数。
export function createCaptcha({ id, answer, ip }) {
  const db = getDb();
  db.prepare('DELETE FROM captchas WHERE created_at < ?').run(new Date(Date.now() - 3600 * 1000).toISOString());
  db.prepare('INSERT INTO captchas (id, answer, ip, created_at) VALUES (?, ?, ?, ?)').run(id, answer, ip, now());
}

export function countCaptchasSince(ip, sinceIso) {
  return getDb().prepare('SELECT COUNT(*) AS n FROM captchas WHERE ip = ? AND created_at >= ?').get(ip, sinceIso).n;
}

// 取出并作废一个验证码：无论对错只能校验一次。不存在或已用过时返回 undefined。
export function takeCaptcha(id) {
  return getDb().prepare('UPDATE captchas SET used_at = ? WHERE id = ? AND used_at IS NULL RETURNING answer, created_at').get(now(), id);
}

// 北京时间当天 0 点对应的 UTC 时刻。库里存的是 UTC 的 ISO 时间，按 UTC 日期统计“今日”会晚 8 小时才换日。
export function beijingDayStart(at = new Date()) {
  const day = new Date(at.getTime() + 8 * 3600 * 1000).toISOString().slice(0, 10);
  return new Date(`${day}T00:00:00+08:00`).toISOString();
}

export function adminData() {
  const db = getDb();
  const today = beijingDayStart();
  return {
    stats: {
      visits: db.prepare('SELECT COUNT(*) AS n FROM visits').get().n,
      visitsToday: db.prepare('SELECT COUNT(*) AS n FROM visits WHERE created_at >= ?').get(today).n,
      uniqueIps: db.prepare('SELECT COUNT(DISTINCT ip) AS n FROM visits').get().n,
      messages: db.prepare('SELECT COUNT(*) AS n FROM messages').get().n,
    },
    regions: db.prepare(
      `SELECT CASE WHEN province != '' THEN province WHEN country != '' THEN country ELSE '未知' END AS region,
              COUNT(*) AS n, COUNT(DISTINCT ip) AS ips
       FROM visits GROUP BY region ORDER BY n DESC LIMIT 12`
    ).all(),
    messages: db.prepare('SELECT * FROM messages ORDER BY id DESC LIMIT 100').all(),
    visits: db.prepare('SELECT * FROM visits ORDER BY id DESC LIMIT 200').all(),
  };
}

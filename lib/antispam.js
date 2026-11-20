// 留言表单的校验与防刷规则（纯函数，便于单元测试）。

// 中国大陆手机号：去掉空格、横线、括号和 +86 / 0086 / 86 前缀后，为 1[3-9] 开头的 11 位数字。
// 合格时返回 11 位号码，否则返回 null。
export function normalizeMobile(value) {
  const s = String(value ?? '').replace(/[\s\-()（）]/g, '').replace(/^(?:\+86|0086|86)(?=1\d{10}$)/, '');
  return /^1[3-9]\d{9}$/.test(s) ? s : null;
}

// 字数：不计空白，按字符（而不是 UTF-16 码元）计。
export const textLength = (value) => [...String(value ?? '').replace(/\s/g, '')].length;

export const MIN_CONTENT = 20;

// 验证码：去掉容易看混的 0 O 1 I L，大小写不敏感
export const CAPTCHA_CHARS = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
export const CAPTCHA_TTL_MS = 10 * 60 * 1000;
export const sameCaptcha = (answer, input) => String(input ?? '').trim().toUpperCase() === answer;

// 从拿到验证码到提交至少要隔几秒：脚本瞬间提交，正常人填表要更久。测试里用环境变量调小。
// 留空或填错时用默认的 3 秒（.env.example 里这一项是空的，复制过去不能把防护关掉）。
export const formMinMs = () => {
  const v = String(process.env.FORM_MIN_SECONDS ?? '').trim();
  const n = v === '' ? NaN : Number(v);
  return (Number.isFinite(n) && n >= 0 ? n : 3) * 1000;
};

export const LIMITS = {
  messagesPerIpHour: 5, // 同一 IP 每小时最多留言数
  messagesAllHour: 30, // 全站每小时最多留言数，防止换 IP 刷爆邮箱
  captchasPerIp10Min: 30, // 同一 IP 每 10 分钟最多获取验证码数，防止暴力猜验证码
};

// 首页报价表单：加载图形验证码，并在设计套件（system.js）检查完字段后提交到 /api/messages，
// 把服务器给的具体原因（验证码不对、手机号不对……）写进状态行。不改设计套件本身。
const form = document.querySelector('form[data-quote]');
if (form) {
  const status = form.querySelector('[data-form-status]');
  const img = form.querySelector('[data-captcha-img]');
  const idInput = form.querySelector('[data-captcha-id]');
  const code = form.querySelector('#f-captcha');
  const button = form.querySelector('[type="submit"]');
  const FIELDS = { name: '#f-name', phone: '#f-phone', content: '#f-msg', captcha: '#f-captcha' };
  const say = (text) => { if (status) status.textContent = text || ''; };

  let loading = null;
  const renew = () => (loading ??= (async () => {
    try {
      const res = await fetch('/api/captcha', { cache: 'no-store', headers: { Accept: 'application/json' } });
      const j = await res.json();
      if (!res.ok || !j.ok) throw new Error(j.error);
      img.src = j.image;
      idInput.value = j.id;
      code.value = '';
    } catch (e) {
      say(e.message || '验证码加载失败，请刷新页面后重试。');
    } finally {
      loading = null;
    }
  })());

  // 表单快进入视野或有人开始填写时才取验证码，不为每次浏览都生成一张
  let started = false;
  const start = () => { if (!started) { started = true; renew(); } };
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => { if (entries.some((e) => e.isIntersecting)) { io.disconnect(); start(); } }, { rootMargin: '400px' });
    io.observe(form);
  } else start();
  form.addEventListener('focusin', start);
  form.querySelector('[data-captcha-refresh]').addEventListener('click', () => { renew(); code.focus(); });

  // 设计套件先在表单上检查字段，有错时 preventDefault；这里在 document 上（更晚）接手发送
  document.addEventListener('submit', async (e) => {
    if (e.target !== form || e.defaultPrevented) return;
    e.preventDefault();
    if (!idInput.value) { await renew(); say('请输入验证码后再提交。'); code.focus(); return; }
    const wait = setTimeout(() => say(form.dataset.sending), 300);
    button.disabled = true; button.setAttribute('aria-busy', 'true');
    try {
      const res = await fetch(form.action, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } });
      const j = await res.json().catch(() => ({}));
      clearTimeout(wait);
      if (res.ok && j.ok) {
        form.reset();
        say(form.dataset.sent);
        renew();
        return;
      }
      say(j.error || form.dataset.failed);
      if (j.renew) renew();
      const field = j.field && form.querySelector(FIELDS[j.field]);
      if (field) field.focus();
    } catch {
      clearTimeout(wait);
      say(form.dataset.failed);
    } finally {
      button.disabled = false; button.removeAttribute('aria-busy');
    }
  });
}

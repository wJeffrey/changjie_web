'use client';

import { useState } from 'react';
import site from '@/data/site.json';

const EMPTY = { name: '', phone: '', company: '', email: '', content: '', website: '' };

export default function ContactForm() {
  const [form, setForm] = useState(EMPTY);
  const [state, setState] = useState({ status: 'idle', error: '' });
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setState({ status: 'sending', error: '' });
    try {
      const res = await fetch('/api/messages', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, path: window.location.pathname }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) { setState({ status: 'error', error: data.error || '提交失败，请稍后重试。' }); return; }
      setForm(EMPTY);
      setState({ status: 'done', error: '' });
    } catch {
      setState({ status: 'error', error: `网络连接失败，留言没有发出。请重试，或拨打 ${site.phone}。` });
    }
  }

  return (
    <section className="sec msg" id="message">
      <div className="container msg-grid">
        <div>
          <h2 className="h-sec">在线留言</h2>
          <p className="lede">写下项目情况和想了解的产品，我们收到后会按您留的电话联系您。</p>
        </div>
        {state.status === 'done' ? (
          <div className="msg-done" role="status">
            <h3>留言已收到</h3>
            <p>我们会尽快按您留的电话联系您。着急的话可以直接拨打 <a href={`tel:${site.tel}`}>{site.phone}</a>。</p>
            <button className="btn btn-line" onClick={() => setState({ status: 'idle', error: '' })}>再写一条</button>
          </div>
        ) : (
          <form className="msg-form" onSubmit={submit}>
            <label>姓名<input value={form.name} onChange={set('name')} required maxLength={40} autoComplete="name" /></label>
            <label>联系电话<input value={form.phone} onChange={set('phone')} required maxLength={30} type="tel" inputMode="tel" autoComplete="tel" /></label>
            <label>单位<span>选填</span><input value={form.company} onChange={set('company')} maxLength={80} autoComplete="organization" /></label>
            <label>邮箱<span>选填</span><input value={form.email} onChange={set('email')} maxLength={100} type="email" autoComplete="email" /></label>
            <label className="wide">咨询内容<textarea value={form.content} onChange={set('content')} required minLength={5} maxLength={2000} rows={5}
              placeholder="例如：建筑类型、系统形式（空调送风 / 防排烟）、大致工程量、需要的耐火极限" /></label>
            {/* 蜜罐字段：对访客隐藏，用于拦截自动提交 */}
            <input className="hp" tabIndex={-1} autoComplete="off" aria-hidden="true" value={form.website} onChange={set('website')} name="website" />
            {state.status === 'error' && <p className="msg-error wide" role="alert">{state.error}</p>}
            <div className="wide msg-actions">
              <button className="btn btn-primary" type="submit" disabled={state.status === 'sending'}>{state.status === 'sending' ? '正在提交…' : '提交留言'}</button>
              <small>提交即表示同意我们为回复咨询而保存您填写的联系方式，并记录提交时的 IP 地址与所在地区。</small>
            </div>
          </form>
        )}
      </div>
    </section>
  );
}

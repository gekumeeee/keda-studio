'use client';

import { useState } from 'react';
import { UI } from '@/lib/i18n';

export default function ContactForm({ contactEmail, lang = 'en' }) {
  const t = UI[lang].contact;
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [status, setStatus] = useState('idle'); // idle | sending | sent | error

  function update(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) return;
    setStatus('sending');
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error('failed');
      setForm({ name: '', email: '', message: '' });
      setStatus('sent');
      setTimeout(() => setStatus('idle'), 5000);
    } catch {
      setStatus('error');
    }
  }

  return (
    <form className="contact-form reveal in" onSubmit={handleSubmit}>
      <div className="contact-grid">
        <div className="field">
          <label htmlFor="cfName">{t.name}</label>
          <input id="cfName" value={form.name} onChange={update('name')} required />
        </div>
        <div className="field">
          <label htmlFor="cfEmail">{t.email}</label>
          <input id="cfEmail" type="email" value={form.email} onChange={update('email')} required />
        </div>
      </div>
      <div className="field">
        <label htmlFor="cfMessage">{t.message}</label>
        <textarea id="cfMessage" value={form.message} onChange={update('message')} required />
      </div>
      <button type="submit" className="send-btn" disabled={status === 'sending'}>
        {status === 'sending' ? t.sending : t.send}
      </button>
      <div className={`contact-success ${status === 'sent' ? 'show' : ''}`}>{t.success}</div>
      <div className={`contact-error ${status === 'error' ? 'show' : ''}`}>{t.error}</div>
      {contactEmail && <div className="contact-email">{t.emailNote} {contactEmail}</div>}
    </form>
  );
}

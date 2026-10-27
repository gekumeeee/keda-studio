'use client';

import { useState } from 'react';
import { UI } from '@/lib/i18n';
import { ArrowIcon } from './site/Icons';

export default function ContactForm({ lang = 'en' }) {
  const t = UI[lang].contact;
  const [form, setForm] = useState({ name: '', email: '', phone: '', contactMethod: 'whatsapp', message: '', website: '' });
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
      setForm({ name: '', email: '', phone: '', contactMethod: 'whatsapp', message: '', website: '' });
      setStatus('sent');
      setTimeout(() => setStatus('idle'), 5000);
    } catch {
      setStatus('error');
    }
  }

  return (
    <form className="c-form rv" onSubmit={handleSubmit} style={{ '--d': '.08s' }}>
      {/* Honeypot: bots fill every field they find, people never see this
          one. Hidden with CSS rather than type="hidden" (which bots skip),
          and taken out of the tab order and the accessibility tree so a
          keyboard or screen-reader visitor can't land on it by accident and
          get their enquiry silently dropped. Submissions arriving with it
          filled are discarded server-side — see lib/spamGuard.js. */}
      <div className="hp-field" aria-hidden="true">
        <label htmlFor="cfWebsite">Website</label>
        <input id="cfWebsite" name="website" value={form.website} onChange={update('website')} tabIndex={-1} autoComplete="off" />
      </div>
      <div className="c-grid">
        <div className="c-fld">
          <label htmlFor="cfName">{t.name}</label>
          <input id="cfName" value={form.name} onChange={update('name')} autoComplete="name" required />
        </div>
        <div className="c-fld">
          <label htmlFor="cfEmail">{t.email}</label>
          <input id="cfEmail" type="email" dir="ltr" value={form.email} onChange={update('email')} autoComplete="email" required />
        </div>
      </div>
      <div className="c-grid">
        <div className="c-fld">
          <label htmlFor="cfMethod">{t.contactMethodLabel}</label>
          <select id="cfMethod" value={form.contactMethod} onChange={update('contactMethod')}>
            <option value="whatsapp">{t.methodWhatsapp}</option>
            <option value="email">{t.methodEmail}</option>
            <option value="call">{t.methodCall}</option>
          </select>
        </div>
        <div className="c-fld">
          <label htmlFor="cfPhone">{t.phone}</label>
          <input id="cfPhone" type="tel" dir="ltr" value={form.phone} onChange={update('phone')} autoComplete="tel" />
        </div>
      </div>
      <div className="c-fld">
        <label htmlFor="cfMessage">{t.message}</label>
        <textarea id="cfMessage" value={form.message} onChange={update('message')} required />
      </div>
      <button type="submit" className="btn btn-acid c-send" disabled={status === 'sending'}>
        <span>{status === 'sending' ? t.sending : t.send.replace(/\s*[→←]\s*$/, '')}</span>
        <ArrowIcon />
      </button>
      <div className={`c-note ok${status === 'sent' ? ' show' : ''}`} role="status">{status === 'sent' ? t.success : ''}</div>
      <div className={`c-note err${status === 'error' ? ' show' : ''}`} role="alert">{status === 'error' ? t.error : ''}</div>
    </form>
  );
}

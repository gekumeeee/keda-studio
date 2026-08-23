'use client';

import { useState } from 'react';
import Field from './Field';
import { METRIC_KEYS, changePct, formatPct, deliveryRows, monthLabelAr, reportFileName } from '@/lib/reportMath';

const METRIC_LABELS = { reach: 'Reach', engagement: 'Engagement', newFollowers: 'New followers', messages: 'Messages', ytViews: 'YouTube views' };

function ChangeBadge({ current, previous }) {
  const pct = changePct(current, previous);
  if (pct === null) {
    return <span className="field-hint-inline">أول شهر — خط الأساس</span>;
  }
  return <span className="field-hint-inline" style={{ color: pct >= 0 ? 'var(--green)' : 'var(--red)' }}>{formatPct(pct)} من الشهر اللي فات ({previous})</span>;
}

// The monthly data-entry screen for one (client, month) report: metrics with
// a live change-% against last month, delivered counts against the client's
// package, analysis text, next-month plan, and the 3 top-posts slots.
// One local `form` object mirrors the Report shape; Save PUTs the whole
// editable slice in one request rather than one field at a time.
export default function ReportMonthEntry({ client, report, previousReport, onBack, onSaved }) {
  const [form, setForm] = useState(() => ({
    reach: report.reach ?? '', engagement: report.engagement ?? '', newFollowers: report.newFollowers ?? '',
    messages: report.messages ?? '', ytViews: report.ytViews ?? '',
    deliveredCounts: { ...(report.deliveredCounts || {}) },
    summaryText: report.summaryText || '', worked: report.worked || '', didntWork: report.didntWork || '', needsDecision: report.needsDecision || '',
    pillars: report.nextMonthPlan?.pillars?.length ? [...report.nextMonthPlan.pillars] : [''],
    events: report.nextMonthPlan?.events?.length ? [...report.nextMonthPlan.events] : [''],
    topPosts: report.topPosts?.length === 3 ? report.topPosts.map((p) => ({ ...p })) : [
      { postUrl: '', imageUrl: '', reach: '', engagement: '', whyItWorked: '' },
      { postUrl: '', imageUrl: '', reach: '', engagement: '', whyItWorked: '' },
      { postUrl: '', imageUrl: '', reach: '', engagement: '', whyItWorked: '' },
    ],
  }));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState('');

  function set(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
    setSaved(false);
  }
  function setDelivered(type, value) {
    setForm((f) => ({ ...f, deliveredCounts: { ...f.deliveredCounts, [type]: value } }));
    setSaved(false);
  }
  function setListItem(key, i, value) {
    setForm((f) => ({ ...f, [key]: f[key].map((v, idx) => (idx === i ? value : v)) }));
    setSaved(false);
  }
  function addListItem(key) {
    setForm((f) => ({ ...f, [key]: [...f[key], ''] }));
  }
  function removeListItem(key, i) {
    setForm((f) => ({ ...f, [key]: f[key].filter((_, idx) => idx !== i) }));
  }
  function setTopPost(i, key, value) {
    setForm((f) => ({ ...f, topPosts: f.topPosts.map((p, idx) => (idx === i ? { ...p, [key]: value } : p)) }));
    setSaved(false);
  }

  async function save(e) {
    e?.preventDefault();
    setSaving(true);
    const res = await fetch(`/api/reports/${report.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        reach: form.reach, engagement: form.engagement, newFollowers: form.newFollowers, messages: form.messages, ytViews: form.ytViews,
        deliveredCounts: form.deliveredCounts,
        summaryText: form.summaryText, worked: form.worked, didntWork: form.didntWork, needsDecision: form.needsDecision,
        nextMonthPlan: { pillars: form.pillars.filter((p) => p.trim()), events: form.events.filter((e2) => e2.trim()) },
        topPosts: form.topPosts,
      }),
    });
    setSaving(false);
    if (res.ok) {
      setSaved(true);
      onSaved(await res.json());
    }
  }

  async function exportPdf() {
    setExporting(true);
    setExportError('');
    await save();
    const res = await fetch(`/api/reports/${report.id}/export`, { method: 'POST' });
    setExporting(false);
    if (!res.ok) {
      setExportError('Could not generate the PDF — check the server log.');
      return;
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = reportFileName(client.name, report.month);
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  const packageTypes = Object.keys(client.packageJson || {});
  const rows = deliveryRows(client.packageJson, form.deliveredCounts);

  return (
    <section className="tab-panel active">
      <div className="client-detail-head">
        <button type="button" className="btn-secondary" onClick={onBack}>← Back to {client.name}</button>
        <h2 className="client-detail-name">{monthLabelAr(report.month)}</h2>
      </div>

      <form onSubmit={save}>
        <div className="panel">
          <div className="panel-head"><h3>Metrics</h3></div>
          <div className="field-row">
            {METRIC_KEYS.map((key) => (
              <Field key={key} label={METRIC_LABELS[key]} hint={<ChangeBadge current={form[key]} previous={previousReport?.[key]} />}>
                <input className="neutral-input" inputMode="numeric" value={form[key]} onChange={(e) => set(key, e.target.value)} placeholder="0" />
              </Field>
            ))}
          </div>
        </div>

        <div className="panel">
          <div className="panel-head"><h3>Delivered this month</h3></div>
          {packageTypes.length === 0 ? (
            <div className="empty">This client has no package types set — add some from Edit Client first.</div>
          ) : (
            <>
              <div className="field-row">
                {packageTypes.map((type) => (
                  <Field key={type} label={type} hint={`agreed: ${client.packageJson[type]}`}>
                    <input className="neutral-input" inputMode="numeric" value={form.deliveredCounts[type] ?? ''} onChange={(e) => setDelivered(type, e.target.value)} placeholder="0" />
                  </Field>
                ))}
              </div>
              <table>
                <thead><tr><th>Type</th><th>Agreed</th><th>Delivered</th><th>Status</th></tr></thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.type}>
                      <td>{r.type}</td><td>{r.agreed}</td><td>{r.delivered}</td>
                      <td style={{ color: r.diff === 0 ? 'var(--green)' : r.diff < 0 ? 'var(--red)' : 'var(--gold)' }}>{r.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>

        <div className="panel">
          <div className="panel-head"><h3>Analysis</h3></div>
          <Field label="Executive summary" hint="2 plain-Arabic sentences for page 2"><textarea value={form.summaryText} onChange={(e) => set('summaryText', e.target.value)} dir="rtl" /></Field>
          <Field label="اللي اشتغل"><textarea value={form.worked} onChange={(e) => set('worked', e.target.value)} dir="rtl" /></Field>
          <Field label="اللي مأداش"><textarea value={form.didntWork} onChange={(e) => set('didntWork', e.target.value)} dir="rtl" /></Field>
          <Field label="يحتاج قرار منك"><textarea value={form.needsDecision} onChange={(e) => set('needsDecision', e.target.value)} dir="rtl" /></Field>
        </div>

        <div className="panel">
          <div className="panel-head"><h3>Next month</h3></div>
          <label className="repeat-label">Content pillars</label>
          {form.pillars.map((p, i) => (
            <div className="repeat-item" key={i}>
              <input value={p} dir="rtl" onChange={(e) => setListItem('pillars', i, e.target.value)} placeholder="محور محتوى" />
              <button type="button" className="repeat-remove" onClick={() => removeListItem('pillars', i)} disabled={form.pillars.length <= 1}>✕</button>
            </div>
          ))}
          <button type="button" className="repeat-add" onClick={() => addListItem('pillars')}>+ Add pillar</button>

          <label className="repeat-label" style={{ marginTop: 16 }}>Key dates</label>
          {form.events.map((ev, i) => (
            <div className="repeat-item" key={i}>
              <input value={ev} dir="rtl" onChange={(e) => setListItem('events', i, e.target.value)} placeholder="مناسبة أو تاريخ مهم" />
              <button type="button" className="repeat-remove" onClick={() => removeListItem('events', i)} disabled={form.events.length <= 1}>✕</button>
            </div>
          ))}
          <button type="button" className="repeat-add" onClick={() => addListItem('events')}>+ Add date</button>
        </div>

        <div className="panel">
          <div className="panel-head"><h3>Top 3 posts</h3></div>
          {form.topPosts.map((p, i) => (
            <div className="sub-block" key={i}>
              <div className="sub-block-title">Post {i + 1}</div>
              <div className="field-row">
                <Field label="Post link (optional)"><input className="neutral-input" value={p.postUrl} onChange={(e) => setTopPost(i, 'postUrl', e.target.value)} placeholder="https://…" /></Field>
                <Field label="Screenshot image URL"><input className="neutral-input" value={p.imageUrl} onChange={(e) => setTopPost(i, 'imageUrl', e.target.value)} placeholder="https://…" /></Field>
              </div>
              <div className="field-row">
                <Field label="Reach"><input className="neutral-input" inputMode="numeric" value={p.reach} onChange={(e) => setTopPost(i, 'reach', e.target.value)} /></Field>
                <Field label="Engagement"><input className="neutral-input" inputMode="numeric" value={p.engagement} onChange={(e) => setTopPost(i, 'engagement', e.target.value)} /></Field>
              </div>
              <Field label="ليه نجح"><input value={p.whyItWorked} dir="rtl" onChange={(e) => setTopPost(i, 'whyItWorked', e.target.value)} /></Field>
            </div>
          ))}
        </div>

        <div className="settings-actions">
          <button type="submit" className="save-btn" disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
          <span className={`saved-note ${saved ? 'show' : ''}`}>Saved</span>
          <a className="btn-secondary" style={{ flex: 'none', display: 'inline-block', textDecoration: 'none', textAlign: 'center' }} href={`/report-template/${report.id}`} target="_blank" rel="noreferrer">Preview report</a>
          <button type="button" className="btn-primary" style={{ flex: 'none' }} onClick={exportPdf} disabled={exporting}>{exporting ? 'Exporting…' : 'Export PDF'}</button>
        </div>
        {exportError ? <div className="fetch-title-error">{exportError}</div> : null}
      </form>
    </section>
  );
}

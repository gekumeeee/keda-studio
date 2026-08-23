'use client';

import { useState } from 'react';
import Field from './Field';

function packageToRows(pkg) {
  const entries = Object.entries(pkg || {});
  return entries.length ? entries.map(([type, count]) => ({ type, count: String(count) })) : [{ type: '', count: '' }];
}
function rowsToPackage(rows) {
  const out = {};
  for (const r of rows) {
    const type = r.type.trim();
    const count = Number(r.count);
    if (type && Number.isFinite(count)) out[type] = count;
  }
  return out;
}

function emptyForm() {
  return {
    name: '', logoUrl: '', primaryColor: '#2F3A44', secondaryColor: '#8791A0',
    fbPageId: '', igId: '', ytChannelId: '',
    packageRows: [{ type: '', count: '' }],
    price: '', renewalDate: '', isActive: true,
  };
}

export default function ReportClientForm({ client, onClose, onSaved }) {
  const [form, setForm] = useState(() =>
    client
      ? {
          name: client.name, logoUrl: client.logoUrl || '',
          primaryColor: client.primaryColor || '#2F3A44', secondaryColor: client.secondaryColor || '#8791A0',
          fbPageId: client.fbPageId || '', igId: client.igId || '', ytChannelId: client.ytChannelId || '',
          packageRows: packageToRows(client.packageJson),
          price: client.price || '', renewalDate: client.renewalDate || '', isActive: client.isActive !== false,
        }
      : emptyForm()
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function set(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }
  function updateRow(i, key, value) {
    setForm((f) => ({ ...f, packageRows: f.packageRows.map((r, idx) => (idx === i ? { ...r, [key]: value } : r)) }));
  }
  function addRow() {
    setForm((f) => ({ ...f, packageRows: [...f.packageRows, { type: '', count: '' }] }));
  }
  function removeRow(i) {
    setForm((f) => ({ ...f, packageRows: f.packageRows.filter((_, idx) => idx !== i) }));
  }

  async function save(e) {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    setError('');
    const body = {
      name: form.name, logoUrl: form.logoUrl, primaryColor: form.primaryColor, secondaryColor: form.secondaryColor,
      fbPageId: form.fbPageId, igId: form.igId, ytChannelId: form.ytChannelId,
      packageJson: rowsToPackage(form.packageRows),
      price: form.price, renewalDate: form.renewalDate, isActive: form.isActive,
    };
    const res = await fetch(client ? `/api/report-clients/${client.id}` : '/api/report-clients', {
      method: client ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    setSaving(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error || 'Could not save client');
      return;
    }
    onSaved(await res.json());
  }

  return (
    <div className="modal-overlay open">
      <div className="modal-box modal-box-wide">
        <h3>{client ? 'Edit Report Client' : 'Add Report Client'}</h3>
        <form onSubmit={save}>
          <div className="field-row">
            <Field label="Client name">
              <input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. Uni Steel" />
            </Field>
            <Field label="Logo image URL (optional)">
              <input value={form.logoUrl} onChange={(e) => set('logoUrl', e.target.value)} placeholder="https://…" />
            </Field>
          </div>
          {form.logoUrl ? <div className="logo-preview"><img src={form.logoUrl} alt="logo preview" /></div> : null}

          <div className="field-row">
            <Field label="Primary brand color" hint="used across the report's pages">
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input type="color" value={form.primaryColor} onChange={(e) => set('primaryColor', e.target.value)} style={{ width: 44, padding: 4, flex: 'none' }} />
                <input className="neutral-input" value={form.primaryColor} onChange={(e) => set('primaryColor', e.target.value)} />
              </div>
            </Field>
            <Field label="Secondary brand color">
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input type="color" value={form.secondaryColor} onChange={(e) => set('secondaryColor', e.target.value)} style={{ width: 44, padding: 4, flex: 'none' }} />
                <input className="neutral-input" value={form.secondaryColor} onChange={(e) => set('secondaryColor', e.target.value)} />
              </div>
            </Field>
          </div>

          <div className="field-row">
            <Field label="Monthly price">
              <input className="neutral-input" value={form.price} onChange={(e) => set('price', e.target.value)} placeholder="e.g. 15000 LE" />
            </Field>
            <Field label="Renewal date">
              <input type="date" className="neutral-input" value={form.renewalDate} onChange={(e) => set('renewalDate', e.target.value)} />
            </Field>
          </div>

          <label className="repeat-label">Package — deliverable type &amp; monthly count</label>
          {form.packageRows.map((r, i) => (
            <div className="repeat-item" key={i}>
              <input value={r.type} onChange={(e) => updateRow(i, 'type', e.target.value)} placeholder="e.g. designs, reels, thumbnails" />
              <input className="neutral-input" style={{ flex: 'none', width: 90 }} value={r.count} onChange={(e) => updateRow(i, 'count', e.target.value)} placeholder="Qty" />
              <button type="button" className="repeat-remove" onClick={() => removeRow(i)} disabled={form.packageRows.length <= 1}>✕</button>
            </div>
          ))}
          <button type="button" className="repeat-add" onClick={addRow}>+ Add deliverable type</button>

          <label className="repeat-label" style={{ marginTop: 16 }}>Platform IDs (optional — used later for automatic import)</label>
          <div className="field-row">
            <Field label="Facebook Page ID"><input className="neutral-input" value={form.fbPageId} onChange={(e) => set('fbPageId', e.target.value)} /></Field>
            <Field label="Instagram ID"><input className="neutral-input" value={form.igId} onChange={(e) => set('igId', e.target.value)} /></Field>
          </div>
          <Field label="YouTube Channel ID"><input className="neutral-input" value={form.ytChannelId} onChange={(e) => set('ytChannelId', e.target.value)} /></Field>

          <label className="permission-check" style={{ marginTop: 8 }}>
            <input type="checkbox" checked={form.isActive} onChange={(e) => set('isActive', e.target.checked)} />
            Active retainer
          </label>

          {error ? <div className="fetch-title-error">{error}</div> : null}

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save client'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

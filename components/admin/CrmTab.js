'use client';

import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { LEAD_STAGES, OPEN_STAGES, LEAD_SOURCES, LEAD_SERVICES, stageOf, sourceLabel } from '@/lib/leads';

// The CRM: everyone who might become a client, in a pipeline of stages from
// "New" to "Won"/"Lost". Contact-form messages arrive in "New" on their own
// (app/api/messages); anyone else is added by hand. Cards are dragged between
// columns (or moved with the stage picker on a phone); a card opens a panel
// with the details, a timeline of notes and the follow-up date. Winning a
// lead turns it into a client record and opens that client's profile.
// Loads and saves its own data, like the Reports tab.

const EMPTY = { name: '', company: '', email: '', phone: '', source: 'whatsapp', service: '', value: '', currency: 'LE', followUp: '', note: '' };
const today = () => new Date().toISOString().slice(0, 10);
const fmt = (n) => Number(n || 0).toLocaleString('en-US');
function fmtWhen(iso) {
  const d = new Date(iso);
  if (isNaN(d)) return '';
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}
function fmtDay(key) {
  if (!key) return '';
  const d = new Date(`${key}T00:00:00`);
  const diff = Math.round((d - new Date(`${today()}T00:00:00`)) / 864e5);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff === -1) return 'Yesterday';
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}
function waNumber(phone) {
  const digits = String(phone).replace(/[^0-9]/g, '');
  if (digits.startsWith('00')) return digits.slice(2);
  if (digits.startsWith('0')) return `20${digits.slice(1)}`;
  return digits;
}

async function send(url, method, body, what) {
  try {
    const res = await fetch(url, { method, headers: body === undefined ? undefined : { 'Content-Type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body) });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      alert(`${what} failed — ${res.status === 401 ? 'you’ve been signed out. Sign in again and retry' : data.error || 'try again'}.`);
      return null;
    }
    return data;
  } catch {
    alert(`${what} failed — check your connection and try again.`);
    return null;
  }
}

export default function CrmTab({ newSignal = 0, query = '', canClients, canMessages, onClientCreated, onOpenClient }) {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [modal, setModal] = useState(null); // the new-lead form, or null
  const [openId, setOpenId] = useState(null);
  const [draft, setDraft] = useState(null); // the open lead's editable copy
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState('');
  const [dragId, setDragId] = useState(null);
  const [overStage, setOverStage] = useState(null);
  const [showClosed, setShowClosed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/leads')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((data) => { if (!cancelled) { setLeads(Array.isArray(data) ? data : []); setLoading(false); } })
      .catch(() => { if (!cancelled) { setLoadError('The pipeline couldn’t be loaded — refresh to try again.'); setLoading(false); } });
    return () => { cancelled = true; };
  }, []);

  // the top bar's "+ New lead" button: each press bumps newSignal, and the
  // form opens on the render that sees a new value
  const [seenSignal, setSeenSignal] = useState(newSignal);
  if (newSignal !== seenSignal) {
    setSeenSignal(newSignal);
    setModal({ ...EMPTY });
  }

  const open = leads.find((l) => l.id === openId) || null;
  useEffect(() => {
    if (!open) return undefined;
    function onKey(e) { if (e.key === 'Escape') closePanel(); }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });
  useEffect(() => {
    if (!modal) return undefined;
    function onKey(e) { if (e.key === 'Escape') setModal(null); }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [modal]);

  function openPanel(lead) {
    setOpenId(lead.id);
    setDraft({ ...lead, value: lead.value || '' });
    setNote('');
  }
  function closePanel() {
    setOpenId(null);
    setDraft(null);
  }
  const replace = (lead) => setLeads((prev) => prev.map((l) => (l.id === lead.id ? lead : l)));

  const q = query.trim().toLowerCase();
  const visible = useMemo(
    () => leads.filter((l) => !q || [l.name, l.company, l.email, l.phone, l.service].some((f) => String(f || '').toLowerCase().includes(q))),
    [leads, q]
  );
  const byStage = (key) => visible.filter((l) => l.stage === key).sort((a, b) => (b.updated || '').localeCompare(a.updated || ''));
  const columns = showClosed ? LEAD_STAGES : LEAD_STAGES.filter((s) => s.key !== 'lost');

  // the numbers across the top
  const openLeads = leads.filter((l) => OPEN_STAGES.includes(l.stage));
  const pipelineValue = openLeads.reduce((s, l) => s + (l.value || 0), 0);
  const month = today().slice(0, 7);
  const wonThisMonth = leads.filter((l) => l.stage === 'won' && (l.updated || '').startsWith(month));
  const closed = leads.filter((l) => l.stage === 'won' || l.stage === 'lost');
  const winRate = closed.length ? Math.round((leads.filter((l) => l.stage === 'won').length / closed.length) * 100) : null;
  const due = openLeads.filter((l) => l.followUp && l.followUp <= today()).sort((a, b) => a.followUp.localeCompare(b.followUp));
  const currency = leads.find((l) => l.currency)?.currency || 'LE';

  async function moveTo(lead, stage) {
    if (!lead || lead.stage === stage) return;
    if (stage === 'won') return win(lead);
    const prev = leads;
    replace({ ...lead, stage }); // straight away; the server's copy (with the timeline entry) follows
    const saved = await send(`/api/leads/${lead.id}`, 'PUT', { stage }, 'Moving the lead');
    if (!saved) return setLeads(prev);
    replace(saved);
    if (openId === saved.id) setDraft((d) => ({ ...d, stage: saved.stage }));
  }

  async function win(lead) {
    if (!canClients) {
      alert('Winning a lead adds it as a client, which needs the Clients permission. Ask the owner, or move it to Won from an account that has it.');
      return;
    }
    if (!confirm(`Mark "${lead.company || lead.name}" as won and add them as a client?`)) return;
    setBusy('win');
    const res = await send(`/api/leads/${lead.id}/win`, 'POST', {}, 'Winning the lead');
    setBusy('');
    if (!res) return;
    replace(res.lead);
    onClientCreated?.(res.client);
    if (openId === lead.id) setDraft((d) => ({ ...d, stage: 'won', clientId: res.client.id }));
  }

  async function saveDetails() {
    setBusy('save');
    const saved = await send(`/api/leads/${draft.id}`, 'PUT', { ...draft, note }, 'Saving the lead');
    setBusy('');
    if (!saved) return;
    replace(saved);
    setDraft({ ...saved, value: saved.value || '' });
    setNote('');
  }

  async function addNote() {
    if (!note.trim()) return;
    setBusy('note');
    const saved = await send(`/api/leads/${draft.id}`, 'PUT', { note }, 'Adding the note');
    setBusy('');
    if (!saved) return;
    replace(saved);
    setNote('');
  }

  async function remove(lead) {
    if (!confirm(`Delete "${lead.company || lead.name}" from the pipeline? This cannot be undone.`)) return;
    if (!(await send(`/api/leads/${lead.id}`, 'DELETE', undefined, 'Deleting the lead'))) return;
    setLeads((prev) => prev.filter((l) => l.id !== lead.id));
    closePanel();
  }

  async function create(e) {
    e.preventDefault();
    setBusy('create');
    const saved = await send('/api/leads', 'POST', modal, 'Adding the lead');
    setBusy('');
    if (!saved) return;
    setLeads((prev) => [saved, ...prev]);
    setModal(null);
  }

  async function importMessages() {
    setBusy('import');
    const res = await send('/api/leads/import', 'POST', {}, 'Importing messages');
    setBusy('');
    if (!res) return;
    setLeads(res.leads);
    alert(res.added ? `${res.added} message${res.added === 1 ? '' : 's'} added to the pipeline.` : 'Every message is already in the pipeline.');
  }

  if (loading) return <section className="tab-panel active"><div className="panel"><div className="empty">Loading the pipeline…</div></div></section>;
  if (loadError) return <section className="tab-panel active"><div className="panel"><div className="empty">{loadError}</div></div></section>;

  return (
    <section className="tab-panel active crm">
      <div className="crm-stats">
        <div className="crm-stat" style={{ '--c': 'var(--violet)', '--sc': 'var(--paper)' }}>
          <span className="lb">Open leads</span><span className="v">{openLeads.length}</span>
          <span className="dl">In the pipeline now</span>
        </div>
        <div className="crm-stat" style={{ '--c': 'var(--aqua)' }}>
          <span className="lb">Pipeline value</span><span className="v">{fmt(pipelineValue)}<small> {currency}</small></span>
          <span className="dl">Expected from open leads</span>
        </div>
        <div className="crm-stat" style={{ '--c': 'var(--acid)' }}>
          <span className="lb">Won this month</span><span className="v">{wonThisMonth.length}</span>
          <span className="dl">{fmt(wonThisMonth.reduce((s, l) => s + (l.value || 0), 0))} {currency}</span>
        </div>
        <div className="crm-stat" style={{ '--c': 'var(--magenta)' }}>
          <span className="lb">Win rate</span><span className="v">{winRate === null ? '—' : `${winRate}%`}</span>
          <span className="dl">{closed.length ? `Of ${closed.length} closed` : 'Nothing closed yet'}</span>
        </div>
      </div>

      {due.length ? (
        <div className="crm-due">
          <b>Follow up</b>
          {due.map((l) => (
            <button type="button" key={l.id} onClick={() => openPanel(l)} className={l.followUp < today() ? 'is-late' : ''}>
              {l.company || l.name}<small>{fmtDay(l.followUp)}</small>
            </button>
          ))}
        </div>
      ) : null}

      <div className="crm-bar">
        <span className="crm-hint">Drag a card to move it along. Every message from the website lands in “New” on its own.</span>
        <div className="crm-bar-r">
          {canMessages ? (
            <button type="button" className="panel-head-link" onClick={importMessages} disabled={busy === 'import'}>
              {busy === 'import' ? 'Importing…' : 'Import messages'}
            </button>
          ) : null}
          <button type="button" className="panel-head-link" aria-pressed={showClosed} onClick={() => setShowClosed((v) => !v)}>
            {showClosed ? 'Hide lost' : `Show lost (${leads.filter((l) => l.stage === 'lost').length})`}
          </button>
        </div>
      </div>

      <div className="crm-board" style={{ '--cols': columns.length }}>
        {columns.map((st) => {
          const items = byStage(st.key);
          const total = items.reduce((s, l) => s + (l.value || 0), 0);
          return (
            <div
              key={st.key}
              className={`crm-col${overStage === st.key ? ' is-over' : ''}`}
              style={{ '--c': st.color }}
              onDragOver={(e) => { if (dragId) { e.preventDefault(); setOverStage(st.key); } }}
              onDragLeave={() => setOverStage((s) => (s === st.key ? null : s))}
              onDrop={(e) => { e.preventDefault(); setOverStage(null); const lead = leads.find((l) => l.id === dragId); setDragId(null); moveTo(lead, st.key); }}
            >
              <header>
                <i />
                <b>{st.label}</b>
                <span>{items.length}</span>
                {total ? <small>{fmt(total)} {currency}</small> : null}
              </header>
              <div className="crm-cards">
                {items.length === 0 ? <div className="crm-empty">{dragId ? 'Drop here' : 'Nothing here'}</div> : null}
                {items.map((l) => (
                  <article
                    key={l.id}
                    className={`crm-card${dragId === l.id ? ' is-drag' : ''}`}
                    draggable
                    onDragStart={(e) => { setDragId(l.id); e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', l.id); }}
                    onDragEnd={() => { setDragId(null); setOverStage(null); }}
                  >
                    <button type="button" className="crm-card-open" onClick={() => openPanel(l)} aria-label={`Open ${l.company || l.name}`}>
                      <span className="crm-card-name" dir="auto">{l.company || l.name}</span>
                      {l.company && l.name ? <span className="crm-card-sub" dir="auto">{l.name}</span> : null}
                      <span className="crm-card-meta">
                        {l.service ? <em>{l.service}</em> : null}
                        <em className="src">{sourceLabel(l.source)}</em>
                        {l.value ? <b>{fmt(l.value)} {l.currency}</b> : null}
                      </span>
                      {l.followUp && OPEN_STAGES.includes(l.stage) ? (
                        <span className={`crm-card-due${l.followUp < today() ? ' is-late' : l.followUp === today() ? ' is-today' : ''}`}>⏱ {fmtDay(l.followUp)}</span>
                      ) : null}
                    </button>
                    <select className="crm-card-move" value={l.stage} onChange={(e) => moveTo(l, e.target.value)} aria-label="Move to stage">
                      {LEAD_STAGES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
                    </select>
                  </article>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* the open lead — drawn at the dashboard's root: the tab's entrance
          animation gives this section a transform, which would otherwise
          pin these fixed layers to the section instead of the screen */}
      {open && draft ? createPortal(
        <>
          <button type="button" className="crm-scrim" aria-label="Close" onClick={closePanel} />
          <aside className="crm-panel" role="dialog" aria-modal="true" aria-label={draft.company || draft.name}>
            <div className="crm-panel-head" style={{ '--c': stageOf(open.stage).color }}>
              <div>
                <span className="crm-stage-pill">{stageOf(open.stage).label}</span>
                <h2 className="d" dir="auto">{open.company || open.name}</h2>
                {open.company && open.name ? <p dir="auto">{open.name}</p> : null}
              </div>
              <button type="button" className="crm-x" onClick={closePanel} aria-label="Close">✕</button>
            </div>

            <div className="crm-quick">
              {open.phone ? <a href={`https://wa.me/${waNumber(open.phone)}`} target="_blank" rel="noreferrer">WhatsApp</a> : null}
              {open.phone ? <a href={`tel:${open.phone}`}>Call</a> : null}
              {open.email ? <a href={`mailto:${open.email}`}>Email</a> : null}
              {open.clientId && onOpenClient ? <button type="button" onClick={() => onOpenClient(open.clientId)}>Client profile →</button> : null}
            </div>

            <div className="crm-stages" role="group" aria-label="Stage">
              {LEAD_STAGES.map((s) => (
                <button type="button" key={s.key} style={{ '--c': s.color }} className={open.stage === s.key ? 'is-on' : ''} onClick={() => moveTo(open, s.key)} disabled={busy === 'win'}>
                  {s.label}
                </button>
              ))}
            </div>

            <div className="crm-form">
              <label><span>Name</span><input dir="auto" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /></label>
              <label><span>Company / brand</span><input dir="auto" value={draft.company} onChange={(e) => setDraft({ ...draft, company: e.target.value })} /></label>
              <label><span>Phone</span><input dir="ltr" value={draft.phone} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} /></label>
              <label><span>Email</span><input dir="ltr" type="email" value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })} /></label>
              <label><span>Service</span>
                <select value={draft.service} onChange={(e) => setDraft({ ...draft, service: e.target.value })}>
                  <option value="">—</option>
                  {LEAD_SERVICES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </label>
              <label><span>Source</span>
                <select value={draft.source} onChange={(e) => setDraft({ ...draft, source: e.target.value })}>
                  {LEAD_SOURCES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
                </select>
              </label>
              <label><span>Expected value</span><input inputMode="numeric" value={draft.value} onChange={(e) => setDraft({ ...draft, value: e.target.value })} placeholder="0" /></label>
              <label><span>Follow up on</span><input type="date" value={draft.followUp} onChange={(e) => setDraft({ ...draft, followUp: e.target.value })} /></label>
            </div>
            <div className="crm-panel-actions">
              <button type="button" className="danger-btn" onClick={() => remove(open)}>Delete</button>
              <button type="button" className="add-btn" onClick={saveDetails} disabled={busy === 'save'}>{busy === 'save' ? 'Saving…' : 'Save details'}</button>
            </div>

            <div className="crm-timeline">
              <h3>Timeline</h3>
              <div className="crm-note-add">
                <textarea dir="auto" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add a note — a call, what they asked for, the next step…" rows={3} />
                <button type="button" className="add-btn" onClick={addNote} disabled={!note.trim() || busy === 'note'}>{busy === 'note' ? 'Adding…' : 'Add note'}</button>
              </div>
              <ol>
                {[...(open.notes || [])].reverse().map((n) => (
                  <li key={n.id || n.at} className={`is-${n.kind}`}>
                    <i />
                    <div>
                      <p dir="auto">{n.text}</p>
                      <small>{fmtWhen(n.at)}{n.by ? ` · ${n.by}` : ''}</small>
                    </div>
                  </li>
                ))}
                <li className="is-system"><i /><div><p>Added to the pipeline</p><small>{fmtWhen(open.created)}</small></div></li>
              </ol>
            </div>
          </aside>
        </>,
        document.getElementById('dashboard') || document.body
      ) : null}

      {/* new lead */}
      {modal ? createPortal(
        <div className="modal-overlay open" onClick={(e) => { if (e.target === e.currentTarget) setModal(null); }}>
          <form className="modal-box modal-box-wide" onSubmit={create}>
            <h3>New lead</h3>
            <div className="crm-form">
              <label><span>Name</span><input dir="auto" value={modal.name} onChange={(e) => setModal({ ...modal, name: e.target.value })} autoFocus /></label>
              <label><span>Company / brand</span><input dir="auto" value={modal.company} onChange={(e) => setModal({ ...modal, company: e.target.value })} /></label>
              <label><span>Phone</span><input dir="ltr" value={modal.phone} onChange={(e) => setModal({ ...modal, phone: e.target.value })} /></label>
              <label><span>Email</span><input dir="ltr" type="email" value={modal.email} onChange={(e) => setModal({ ...modal, email: e.target.value })} /></label>
              <label><span>Service</span>
                <select value={modal.service} onChange={(e) => setModal({ ...modal, service: e.target.value })}>
                  <option value="">—</option>
                  {LEAD_SERVICES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </label>
              <label><span>Source</span>
                <select value={modal.source} onChange={(e) => setModal({ ...modal, source: e.target.value })}>
                  {LEAD_SOURCES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
                </select>
              </label>
              <label><span>Expected value</span><input inputMode="numeric" value={modal.value} onChange={(e) => setModal({ ...modal, value: e.target.value })} placeholder="0" /></label>
              <label><span>Follow up on</span><input type="date" value={modal.followUp} onChange={(e) => setModal({ ...modal, followUp: e.target.value })} /></label>
              <label className="w"><span>First note</span><textarea dir="auto" rows={3} value={modal.note} onChange={(e) => setModal({ ...modal, note: e.target.value })} placeholder="How they found you, what they need…" /></label>
            </div>
            <div className="modal-actions">
              <button type="button" className="btn-secondary" onClick={() => setModal(null)}>Cancel</button>
              <button type="submit" className="btn-primary" disabled={busy === 'create' || (!modal.name.trim() && !modal.company.trim())}>{busy === 'create' ? 'Adding…' : 'Add lead'}</button>
            </div>
          </form>
        </div>,
        document.getElementById('dashboard') || document.body
      ) : null}
    </section>
  );
}

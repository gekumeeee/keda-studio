'use client';

import { useEffect, useState } from 'react';
import { formatAmount, invoiceTotals, contractTotal } from '@/lib/invoiceMath';
import { statusOf } from '@/lib/contentPosts';
import { stageOf, sourceLabel } from '@/lib/leads';

// One client, everything about them in one place: what they've paid and
// still owe, their work on the site, invoices and contracts, the posts
// planned for them, how they came in (the CRM lead and its timeline) and
// private notes. The lists come from the admin page, which already holds
// them; the lead and the reports are fetched here, only when the person
// may see them.

const INVOICE_LABELS = { draft: 'Draft', sent: 'Sent', paid: 'Paid', overdue: 'Overdue' };
const today = () => new Date().toISOString().slice(0, 10);
function fmtDate(iso) {
  const d = new Date(iso);
  if (isNaN(d)) return '—';
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}
function invoiceStatus(inv) {
  if (inv.status === 'paid') return 'paid';
  if (inv.status === 'sent' && inv.dueDate && new Date(inv.dueDate) < new Date(new Date().toDateString())) return 'overdue';
  return inv.status || 'draft';
}
function isActive(c) {
  const t = today();
  return (!c.startDate || c.startDate <= t) && (!c.endDate || c.endDate >= t);
}

export default function ClientProfile({
  client, projects, invoices, contracts, posts, permissions,
  onBack, onEditClient, onEditProject, onNewProject, onEditInvoice, onNewInvoice, onEditContract, onNewContract, onSaveNotes, onOpenCrm,
}) {
  const [leads, setLeads] = useState([]);
  const [reports, setReports] = useState([]);
  const [notes, setNotes] = useState(client.notes || '');
  const [savingNotes, setSavingNotes] = useState(false);
  const [notesSaved, setNotesSaved] = useState(false);
  const [section, setSection] = useState('work');

  useEffect(() => {
    let cancelled = false;
    if (permissions.crm) {
      fetch('/api/leads').then((r) => (r.ok ? r.json() : [])).then((all) => { if (!cancelled) setLeads(Array.isArray(all) ? all.filter((l) => l.clientId === client.id) : []); }).catch(() => {});
    }
    if (permissions.reports) {
      // report clients are their own records, matched to this client by name
      Promise.all([fetch('/api/report-clients').then((r) => (r.ok ? r.json() : [])), fetch('/api/reports').then((r) => (r.ok ? r.json() : []))])
        .then(([rc, rs]) => {
          if (cancelled) return;
          const ids = new Set((Array.isArray(rc) ? rc : []).filter((x) => (x.name || '').trim().toLowerCase() === client.name.trim().toLowerCase()).map((x) => x.id));
          setReports((Array.isArray(rs) ? rs : []).filter((r) => ids.has(r.clientId)));
        })
        .catch(() => {});
    }
    return () => { cancelled = true; };
  }, [client.id, client.name, permissions.crm, permissions.reports]);

  const work = projects.filter((p) => p.clientId === client.id);
  const inv = invoices.filter((i) => i.clientId === client.id);
  const con = contracts.filter((c) => c.clientId === client.id);
  const planned = posts.filter((p) => p.clientId === client.id && p.date && p.date >= today()).sort((a, b) => a.date.localeCompare(b.date));
  const billed = inv.reduce((s, i) => s + invoiceTotals(i).total, 0);
  const paid = inv.filter((i) => i.status === 'paid').reduce((s, i) => s + invoiceTotals(i).total, 0);
  const overdue = inv.filter((i) => invoiceStatus(i) === 'overdue');
  const currency = inv[0]?.currency || con[0]?.currency || 'LE';
  const activeContract = con.find(isActive);
  const lead = leads[0] || null;

  // everything that happened with this client, newest first
  const events = [
    ...inv.map((i) => ({ at: i.paidDate || i.updated || i.issueDate, text: `Invoice ${i.projectName || ''} — ${INVOICE_LABELS[invoiceStatus(i)]}`, c: 'var(--acid)' })),
    ...con.map((c) => ({ at: c.updated || c.startDate, text: `Contract ${c.title || ''}`, c: 'var(--tangerine)' })),
    ...work.map((p) => ({ at: p.updated, text: `Project ${p.title || ''} ${p.status === 'live' ? 'is live' : 'saved as draft'}`, c: 'var(--aqua)' })),
    ...leads.flatMap((l) => (l.notes || []).map((n) => ({ at: n.at, text: n.text, c: n.kind === 'stage' ? 'var(--violet)' : 'var(--fg)' }))),
    ...(client.added ? [{ at: client.added, text: 'Added as a client', c: 'var(--magenta)' }] : []),
  ].filter((e) => e.at && !isNaN(new Date(e.at))).sort((a, b) => new Date(b.at) - new Date(a.at)).slice(0, 40);

  async function saveNotes() {
    setSavingNotes(true);
    const ok = await onSaveNotes(notes);
    setSavingNotes(false);
    if (ok) { setNotesSaved(true); setTimeout(() => setNotesSaved(false), 2500); }
  }

  const tabs = [
    ['work', `Work ${work.length}`],
    permissions.invoices ? ['invoices', `Invoices ${inv.length}`] : null,
    permissions.contracts ? ['contracts', `Contracts ${con.length}`] : null,
    permissions.content ? ['posts', `Planned posts ${planned.length}`] : null,
    permissions.reports ? ['reports', `Reports ${reports.length}`] : null,
    ['activity', 'Activity'],
  ].filter(Boolean);

  return (
    <section className="tab-panel active cprof">
      <button type="button" className="folder-back" onClick={onBack}>← All clients</button>

      <div className="cprof-head">
        <div className="cprof-logo">{client.logo ? <img src={client.logo} alt="" /> : <span>{client.name.trim().charAt(0)}</span>}</div>
        <div className="cprof-id">
          <h2 className="d" dir="auto">{client.name}</h2>
          <div className="cprof-tags">
            {activeContract ? <span className="cprof-tag is-on">Active contract</span> : <span className="cprof-tag">No active contract</span>}
            {lead ? <span className="cprof-tag" style={{ '--c': stageOf(lead.stage).color }}>Came from {sourceLabel(lead.source)}</span> : null}
            <span className="cprof-tag">Client since {fmtDate(client.added)}</span>
          </div>
        </div>
        <div className="cprof-actions">
          {permissions.invoices ? <button type="button" className="add-btn" onClick={onNewInvoice}>+ Invoice</button> : null}
          {permissions.contracts ? <button type="button" className="panel-head-link" onClick={onNewContract}>+ Contract</button> : null}
          {permissions.projects ? <button type="button" className="panel-head-link" onClick={onNewProject}>+ Project</button> : null}
          <button type="button" className="panel-head-link" onClick={onEditClient}>Edit</button>
        </div>
      </div>

      <div className="cprof-stats">
        {permissions.invoices ? (
          <>
            <div className="cprof-stat" style={{ '--c': 'var(--violet)', '--sc': 'var(--paper)' }}><span>Total billed</span><b>{formatAmount(billed)} <small>{currency}</small></b></div>
            <div className="cprof-stat" style={{ '--c': 'var(--acid)' }}><span>Paid</span><b>{formatAmount(paid)} <small>{currency}</small></b></div>
            <div className="cprof-stat" style={{ '--c': overdue.length ? 'var(--magenta)' : 'var(--aqua)' }}>
              <span>{overdue.length ? `Owed · ${overdue.length} overdue` : 'Still owed'}</span><b>{formatAmount(billed - paid)} <small>{currency}</small></b>
            </div>
          </>
        ) : null}
        <div className="cprof-stat" style={{ '--c': 'var(--tangerine)' }}><span>Work on the site</span><b>{work.filter((p) => p.status === 'live').length} <small>live of {work.length}</small></b></div>
      </div>

      <div className="cprof-grid">
        <div className="panel cprof-main">
          <div className="cprof-tabs" role="tablist">
            {tabs.map(([k, l]) => (
              <button type="button" role="tab" key={k} aria-selected={section === k} className={section === k ? 'is-on' : ''} onClick={() => setSection(k)}>{l}</button>
            ))}
          </div>

          {section === 'work' ? (
            work.length === 0 ? <div className="empty">No projects linked to this client yet.</div> : (
              <div className="cprof-work">
                {work.map((p) => (
                  <button type="button" key={p.id} className="cprof-piece" onClick={() => onEditProject(p)} title={p.title}>
                    {p.image ? <img src={p.image} alt="" loading="lazy" /> : <span className="cprof-piece-empty">{p.video ? '▶' : '—'}</span>}
                    <span className={`cprof-piece-st is-${p.status}`}>{p.status === 'live' ? 'Live' : 'Draft'}</span>
                  </button>
                ))}
              </div>
            )
          ) : null}

          {section === 'invoices' ? (
            inv.length === 0 ? <div className="empty">No invoices for this client yet.</div> : (
              <div className="cprof-list">
                {inv.map((i) => {
                  const st = invoiceStatus(i);
                  return (
                    <button type="button" key={i.id} className="cprof-row" onClick={() => onEditInvoice(i)}>
                      <span className="t"><b>{i.projectName || 'Invoice'}</b><small>{i.dueDate ? `Due ${fmtDate(i.dueDate)}` : fmtDate(i.updated)}</small></span>
                      <span className="n">{formatAmount(invoiceTotals(i).total)} <small>{i.currency}</small></span>
                      <span className={`inv-status ${st}`}>{INVOICE_LABELS[st]}</span>
                    </button>
                  );
                })}
              </div>
            )
          ) : null}

          {section === 'contracts' ? (
            con.length === 0 ? <div className="empty">No contracts for this client yet.</div> : (
              <div className="cprof-list">
                {con.map((c) => {
                  const total = contractTotal(c);
                  return (
                    <button type="button" key={c.id} className="cprof-row" onClick={() => onEditContract(c)}>
                      <span className="t"><b>{c.title || 'Contract'}</b><small>{c.startDate ? fmtDate(c.startDate) : '—'} → {c.endDate ? fmtDate(c.endDate) : 'open'}</small></span>
                      <span className="n">{total ? <>{formatAmount(total)} <small>{c.currency}</small></> : '—'}</span>
                      <span className={`cprof-mini${isActive(c) ? ' is-on' : ''}`}>{isActive(c) ? 'Active' : 'Ended'}</span>
                    </button>
                  );
                })}
              </div>
            )
          ) : null}

          {section === 'posts' ? (
            planned.length === 0 ? <div className="empty">Nothing planned for this client. <a href="/admin/content" target="_blank" rel="noopener">Open the content plan ↗</a></div> : (
              <div className="cprof-list">
                {planned.map((p) => (
                  <a key={p.id} className="cprof-row" href="/admin/content" target="_blank" rel="noopener">
                    <span className="t"><b dir="auto">{p.headline || p.caption?.split('\n')[0] || 'Untitled post'}</b><small>{fmtDate(p.date)}{p.time ? ` · ${p.time}` : ''}</small></span>
                    <span className={`brief-status-pill is-${p.status}`}>{statusOf(p.status).label}</span>
                  </a>
                ))}
              </div>
            )
          ) : null}

          {section === 'reports' ? (
            reports.length === 0 ? <div className="empty">No monthly reports under this name. Report clients are matched by their name.</div> : (
              <div className="cprof-list">
                {reports.map((r) => (
                  <a key={r.id} className="cprof-row" href={`/report-template/${r.id}`} target="_blank" rel="noopener">
                    <span className="t"><b>{r.month}</b><small>Monthly report</small></span>
                    <span className="cprof-mini">Preview ↗</span>
                  </a>
                ))}
              </div>
            )
          ) : null}

          {section === 'activity' ? (
            events.length === 0 ? <div className="empty">Nothing recorded for this client yet.</div> : (
              <ol className="cprof-events">
                {events.map((e, i) => (
                  <li key={i} style={{ '--c': e.c }}><i /><div><p dir="auto">{e.text}</p><small>{fmtDate(e.at)}</small></div></li>
                ))}
              </ol>
            )
          ) : null}
        </div>

        <div className="cprof-side">
          <div className="panel">
            <div className="panel-head"><h3>Notes</h3>{notesSaved ? <span className="saved-note">Saved ✓</span> : null}</div>
            <textarea className="cprof-notes" dir="auto" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Preferences, who to talk to, what they liked… only the admin sees this." rows={7} />
            <button type="button" className="add-btn" onClick={saveNotes} disabled={savingNotes || notes === (client.notes || '')}>{savingNotes ? 'Saving…' : 'Save notes'}</button>
          </div>
          {permissions.crm ? (
            <div className="panel">
              <div className="panel-head"><h3>How they came in</h3></div>
              {lead ? (
                <div className="cprof-lead">
                  <span className="crm-stage-pill" style={{ '--c': stageOf(lead.stage).color }}>{stageOf(lead.stage).label}</span>
                  <p>{sourceLabel(lead.source)}{lead.service ? ` · ${lead.service}` : ''}</p>
                  {lead.phone ? <p dir="ltr">{lead.phone}</p> : null}
                  {lead.email ? <p dir="ltr">{lead.email}</p> : null}
                  <button type="button" className="panel-head-link" onClick={onOpenCrm}>Open in CRM →</button>
                </div>
              ) : <div className="empty" style={{ padding: '12px 0' }}>Not from a CRM lead.</div>}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

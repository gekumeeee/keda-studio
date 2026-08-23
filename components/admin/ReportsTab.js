'use client';

import { useEffect, useState } from 'react';
import Field from './Field';
import ReportClientForm from './ReportClientForm';
import ReportMonthEntry from './ReportMonthEntry';
import { renewalAlert, monthLabelAr, prevMonthKey } from '@/lib/reportMath';

function fmtDate(iso) {
  const d = new Date(iso);
  if (isNaN(d)) return '—';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function currentMonthKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

// Orchestrates three views (client list → client's months → one month's entry
// screen) as plain local state, not routes — same "one big client component"
// convention as app/admin/page.js's other tabs, just kept in its own file so
// that file doesn't grow past its own size guidance.
export default function ReportsTab() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [clientModalOpen, setClientModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState(null);

  const [selectedClientId, setSelectedClientId] = useState(null);
  const [clientReports, setClientReports] = useState([]);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [selectedReportId, setSelectedReportId] = useState(null);

  const [newMonthValue, setNewMonthValue] = useState(currentMonthKey());
  const [creatingMonth, setCreatingMonth] = useState(false);
  const [monthError, setMonthError] = useState('');

  useEffect(() => {
    loadClients();
  }, []);

  async function loadClients() {
    setLoading(true);
    const res = await fetch('/api/report-clients');
    setClients(res.ok ? await res.json() : []);
    setLoading(false);
  }

  async function loadClientReports(clientId) {
    setReportsLoading(true);
    const res = await fetch(`/api/reports?clientId=${clientId}`);
    setClientReports(res.ok ? await res.json() : []);
    setReportsLoading(false);
  }

  function openClient(id) {
    setSelectedClientId(id);
    setSelectedReportId(null);
    setMonthError('');
    loadClientReports(id);
  }

  function openClientModal(client) {
    setEditingClient(client);
    setClientModalOpen(true);
  }

  async function handleClientSaved() {
    setClientModalOpen(false);
    await loadClients();
  }

  async function deleteClient(id) {
    if (!confirm('Remove this client? Its saved monthly reports stay on file but become unreachable from here.')) return;
    await fetch(`/api/report-clients/${id}`, { method: 'DELETE' });
    setClients((prev) => prev.filter((c) => c.id !== id));
  }

  async function createMonth(clientId) {
    setMonthError('');
    if (clientReports.some((r) => r.month === newMonthValue)) {
      setMonthError('A report for this month already exists — open it from the list below.');
      return;
    }
    setCreatingMonth(true);
    const res = await fetch('/api/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId, month: newMonthValue }),
    });
    setCreatingMonth(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setMonthError(d.error || 'Could not create report');
      return;
    }
    const created = await res.json();
    setClientReports((prev) => [created, ...prev]);
    setSelectedReportId(created.id);
  }

  async function deleteReport(id) {
    if (!confirm('Delete this month’s report? This can’t be undone.')) return;
    await fetch(`/api/reports/${id}`, { method: 'DELETE' });
    setClientReports((prev) => prev.filter((r) => r.id !== id));
  }

  const selectedClient = clients.find((c) => c.id === selectedClientId) || null;
  const selectedReport = clientReports.find((r) => r.id === selectedReportId) || null;

  // ---- month-entry view ----
  if (selectedClient && selectedReport) {
    const previousReport = clientReports.find((r) => r.month === prevMonthKey(selectedReport.month)) || null;
    return (
      <ReportMonthEntry
        client={selectedClient}
        report={selectedReport}
        previousReport={previousReport}
        onBack={() => setSelectedReportId(null)}
        onSaved={(updated) => setClientReports((list) => list.map((r) => (r.id === updated.id ? updated : r)))}
      />
    );
  }

  // ---- client detail: its months ----
  if (selectedClient) {
    return (
      <section className="tab-panel active">
        <div className="client-detail-head">
          <button type="button" className="btn-secondary" onClick={() => setSelectedClientId(null)}>← Back to clients</button>
          <h2 className="client-detail-name">{selectedClient.name}</h2>
        </div>

        <div className="panel">
          <div className="panel-head"><h3>Start a new month</h3></div>
          <div className="field-row" style={{ alignItems: 'end' }}>
            <Field label="Month">
              <input type="month" className="neutral-input" value={newMonthValue} onChange={(e) => setNewMonthValue(e.target.value)} />
            </Field>
            <button type="button" className="btn-primary" style={{ flex: 'none' }} onClick={() => createMonth(selectedClient.id)} disabled={creatingMonth}>
              {creatingMonth ? 'Creating…' : '+ New month'}
            </button>
          </div>
          {monthError ? <div className="fetch-title-error">{monthError}</div> : null}
        </div>

        <div className="panel">
          <div className="panel-head"><h3>Monthly reports</h3></div>
          {reportsLoading ? (
            <div className="empty">Loading…</div>
          ) : clientReports.length === 0 ? (
            <div className="empty">No monthly reports yet — pick a month above to start one.</div>
          ) : (
            <table>
              <thead><tr><th>Month</th><th>Reach</th><th>Status</th><th>Updated</th><th></th></tr></thead>
              <tbody>
                {clientReports.map((r) => (
                  <tr key={r.id}>
                    <td>{monthLabelAr(r.month)}</td>
                    <td>{r.reach || '—'}</td>
                    <td><span className={`status ${r.status === 'sent' ? 'live' : 'draft'}`}>{r.status}</span></td>
                    <td>{fmtDate(r.updated)}</td>
                    <td>
                      <div className="row-actions">
                        <span onClick={() => setSelectedReportId(r.id)}>Open</span>
                        <span className="danger" onClick={() => deleteReport(r.id)}>Delete</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    );
  }

  // ---- client list ----
  return (
    <section className="tab-panel active">
      <div className="panel">
        <div className="panel-head">
          <h3>Report Clients</h3>
          <button type="button" className="add-btn" onClick={() => openClientModal(null)}>+ Add Client</button>
        </div>
        <table>
          <thead><tr><th>Logo</th><th>Name</th><th>Package</th><th>Renewal</th><th></th></tr></thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5}><div className="empty">Loading…</div></td></tr>
            ) : clients.length === 0 ? (
              <tr><td colSpan={5}><div className="empty">No report clients yet — add one to start their first monthly report.</div></td></tr>
            ) : (
              clients.map((c) => {
                const alert = renewalAlert(c.renewalDate);
                return (
                  <tr key={c.id}>
                    <td>{c.logoUrl ? <img src={c.logoUrl} alt={c.name} className="client-logo-thumb" /> : <span className="no-logo">—</span>}</td>
                    <td>{c.name}{!c.isActive ? <span className="panel-tag" style={{ marginInlineStart: 8 }}>Inactive</span> : null}</td>
                    <td style={{ color: 'var(--text-dim)', fontSize: 12 }}>
                      {Object.entries(c.packageJson || {}).map(([k, v]) => `${k} ×${v}`).join(', ') || '—'}
                    </td>
                    <td>
                      {c.renewalDate ? fmtDate(c.renewalDate) : '—'}
                      {alert ? <span className="inv-status overdue" style={{ marginInlineStart: 8 }}>Renewal soon</span> : null}
                    </td>
                    <td>
                      <div className="row-actions">
                        <span onClick={() => openClient(c.id)}>View</span>
                        <span onClick={() => openClientModal(c)}>Edit</span>
                        <span className="danger" onClick={() => deleteClient(c.id)}>Delete</span>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {clientModalOpen ? (
        <ReportClientForm client={editingClient} onClose={() => setClientModalOpen(false)} onSaved={handleClientSaved} />
      ) : null}
    </section>
  );
}

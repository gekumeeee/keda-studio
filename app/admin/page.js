'use client';

import { useEffect, useState } from 'react';
import { WORD_COLORS, mergeSettings } from '@/lib/defaults';
import PortfolioVideo from '@/components/PortfolioVideo';
import { formatAmount, invoiceTotals, contractTotal } from '@/lib/invoiceMath';

const CATEGORIES = ['Branding', 'Video', 'Social Media', 'Motion', 'Campaigns'];
const METHOD_LABELS = { whatsapp: 'WhatsApp', email: 'Email', call: 'Phone call' };
const TAB_TITLES = {
  overview: 'Overview',
  projects: 'Projects',
  clients: 'Clients',
  messages: 'Messages',
  invoices: 'Invoices',
  plans: 'Plans',
  contracts: 'Contracts',
  settings: 'Site Content',
  users: 'Users',
  account: 'My Account',
};
const TAB_SUB = {
  overview: 'A quick look at your site at a glance.',
  projects: 'Case studies shown in the hero gallery and portfolio.',
  clients: 'Client names shown in the “Selected Clients” bar.',
  messages: 'Messages sent from your contact form.',
  invoices: 'Branded invoices you can send to clients as a PDF.',
  plans: 'Reusable pricing plans you can send to clients as a PDF. Pick one, edit, or create a new one.',
  contracts: 'Agreements for clients or team members — deliverables, total and terms — saved and exportable as a PDF.',
  settings: 'Edit every piece of text on your homepage, in both languages.',
  users: 'Add people to the admin and control exactly what each of them can see and edit.',
  account: 'Change your own username and password.',
};
const TAB_ICONS = { overview: '◎', projects: '▤', clients: '❏', messages: '✉', invoices: '▥', plans: '¤', contracts: '§', settings: '✎', users: '☺', account: '⚿' };
// Every tab except 'overview' is gated by a matching permission key. 'overview'
// has no key here — it's always shown to any logged-in user. 'users' isn't
// permission-based at all (owner-only, checked separately from `permissions`).
const TAB_GROUPS = [
  { label: 'Manage', tabs: ['overview', 'projects', 'clients', 'messages'] },
  { label: 'Documents', tabs: ['invoices', 'plans', 'contracts'] },
  { label: 'Configure', tabs: ['settings'] },
];
const PERMISSION_LABELS = { projects: 'Projects', clients: 'Clients', messages: 'Messages', invoices: 'Invoices', plans: 'Plans', contracts: 'Contracts', settings: 'Site Content' };
const PERMISSIONS = Object.keys(PERMISSION_LABELS);
const EMPTY_PERMISSIONS = Object.fromEntries(PERMISSIONS.map((p) => [p, false]));
const EMPTY_USER = { username: '', password: '', permissions: { ...EMPTY_PERMISSIONS } };
const EMPTY_INVOICE = { clientName: '', projectName: '', currency: 'LE', discount: '', sections: [{ title: '', price: '', items: [''] }] };
const EMPTY_PLAN = { name: '', description: '', price: '', currency: 'LE', cycle: '', items: [''] };
const EMPTY_CONTRACT = { title: '', partyType: 'client', partyName: '', role: '', startDate: '', endDate: '', currency: 'LE', items: [{ label: '', quantity: '', amount: '' }], terms: '', notes: '' };

// Preloaded example plans shown in the empty state — one click adds them all
// as real plans the user can then edit or delete. Not auto-inserted; the user
// has to opt in from the empty-state prompt.
const EXAMPLE_PLANS = [
  {
    name: 'Social Media Management',
    description: 'Facebook · Instagram · YouTube',
    price: '6,000',
    currency: 'LE',
    cycle: 'month',
    items: [
      'Full page management across Facebook, Instagram, and YouTube',
      'Monthly content plan tailored to your brand',
      'Post design and creative production',
      'Copywriting, captions, and hashtags',
      'Scheduling and community engagement',
      'Monthly performance report',
    ],
  },
  {
    name: 'Brand Identity Package',
    description: 'A complete brand system, ready to roll out.',
    price: '12,000',
    currency: 'LE',
    cycle: '',
    items: [
      'Logo design and variations',
      'Brand color palette',
      'Typography system',
      'Brand guidelines document',
      'Source files (AI, SVG, PDF, PNG)',
    ],
  },
  {
    name: 'Logo Animation',
    description: 'Motion version of your logo for video intros and reels.',
    price: '1,500',
    currency: 'LE',
    cycle: '',
    items: [
      'Landscape version (16:9)',
      'Portrait version (9:16)',
      'MP4 exports',
      'Transparent background',
    ],
  },
];

function fmtDate(iso) {
  const d = new Date(iso);
  if (isNaN(d)) return '—';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// Stable field wrapper (module-level so inputs never lose focus on re-render).
function Field({ label, hint, children }) {
  return (
    <div className="field">
      <label>{label}{hint ? <span className="field-hint-inline">{hint}</span> : null}</label>
      {children}
    </div>
  );
}

export default function AdminPage() {
  // 'checking' | 'needsSetup' | 'loggedOut' | 'loggedIn'
  const [authStatus, setAuthStatus] = useState('checking');
  const [currentUser, setCurrentUser] = useState(null);
  const [permissions, setPermissions] = useState(EMPTY_PERMISSIONS);
  const [authUsername, setAuthUsername] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authPasswordConfirm, setAuthPasswordConfirm] = useState('');
  const [authError, setAuthError] = useState('');
  const [authBusy, setAuthBusy] = useState(false);

  const [users, setUsers] = useState([]);
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState(null);
  const [userForm, setUserForm] = useState(EMPTY_USER);
  const [userFormError, setUserFormError] = useState('');

  const [accountUsername, setAccountUsername] = useState('');
  const [accountPassword, setAccountPassword] = useState('');
  const [accountSaved, setAccountSaved] = useState(false);
  const [accountError, setAccountError] = useState('');

  const [tab, setTab] = useState('overview');
  const [projects, setProjects] = useState([]);
  const [clients, setClients] = useState([]);
  const [messages, setMessages] = useState([]);
  const [settingsForm, setSettingsForm] = useState(() => mergeSettings({}));
  const [settingsSaved, setSettingsSaved] = useState(false);
  const [editLang, setEditLang] = useState('en');

  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState(null);
  const [projectForm, setProjectForm] = useState({ title: '', category: 'Branding', client: '', work: '', image: '', video: '', status: 'live' });

  const [clientModalOpen, setClientModalOpen] = useState(false);
  const [editingClientId, setEditingClientId] = useState(null);
  const [clientForm, setClientForm] = useState({ name: '', logo: '' });

  const [invoices, setInvoices] = useState([]);
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const [editingInvoiceId, setEditingInvoiceId] = useState(null);
  const [invoiceForm, setInvoiceForm] = useState(EMPTY_INVOICE);
  const [downloadingInvoiceId, setDownloadingInvoiceId] = useState(null);

  const [plans, setPlans] = useState([]);
  const [planModalOpen, setPlanModalOpen] = useState(false);
  const [editingPlanId, setEditingPlanId] = useState(null);
  const [planForm, setPlanForm] = useState(EMPTY_PLAN);
  const [downloadingPlanId, setDownloadingPlanId] = useState(null);
  const [seedingPlans, setSeedingPlans] = useState(false);

  const [contracts, setContracts] = useState([]);
  const [contractModalOpen, setContractModalOpen] = useState(false);
  const [editingContractId, setEditingContractId] = useState(null);
  const [contractForm, setContractForm] = useState(EMPTY_CONTRACT);
  const [downloadingContractId, setDownloadingContractId] = useState(null);

  useEffect(() => {
    checkSession();
  }, []);

  async function fetchJsonSafe(url, fallback) {
    try {
      const res = await fetch(url);
      if (!res.ok) return fallback;
      return await res.json();
    } catch {
      return fallback;
    }
  }

  async function checkSession() {
    const res = await fetch('/api/auth/me');
    const data = await res.json();
    if (data.needsSetup) {
      setAuthStatus('needsSetup');
      return;
    }
    if (!data.user) {
      setAuthStatus('loggedOut');
      return;
    }
    setCurrentUser(data.user);
    setPermissions(data.permissions);
    setAccountUsername(data.user.username);
    setAuthStatus('loggedIn');
    await loadAll(data.permissions);
    if (data.user.role === 'owner') await loadUsers();
  }

  async function loadAll(perms) {
    const [p, c, m, s, inv, pl, con] = await Promise.all([
      perms.projects ? fetchJsonSafe('/api/projects', []) : Promise.resolve([]),
      perms.clients ? fetchJsonSafe('/api/clients', []) : Promise.resolve([]),
      perms.messages ? fetchJsonSafe('/api/messages', []) : Promise.resolve([]),
      perms.settings ? fetchJsonSafe('/api/settings', {}) : Promise.resolve({}),
      perms.invoices ? fetchJsonSafe('/api/invoices', []) : Promise.resolve([]),
      perms.plans ? fetchJsonSafe('/api/plans', []) : Promise.resolve([]),
      perms.contracts ? fetchJsonSafe('/api/contracts', []) : Promise.resolve([]),
    ]);
    setProjects(p);
    setClients(c);
    setMessages(m);
    setSettingsForm(mergeSettings(s));
    setInvoices(inv);
    setPlans(Array.isArray(pl) ? pl : []);
    setContracts(Array.isArray(con) ? con : []);
  }

  async function loadUsers() {
    const list = await fetchJsonSafe('/api/users', []);
    setUsers(Array.isArray(list) ? list : []);
  }

  // ---- settings field setters ----
  const locVal = (key) => settingsForm[key]?.[editLang] ?? '';
  function setNeutral(key) {
    return (e) => setSettingsForm((f) => ({ ...f, [key]: e.target.value }));
  }
  function setLoc(key) {
    return (e) => setSettingsForm((f) => ({ ...f, [key]: { ...f[key], [editLang]: e.target.value } }));
  }
  function updateWordText(idx, value) {
    setSettingsForm((f) => ({
      ...f,
      heroWords: f.heroWords.map((w, i) => (i === idx ? { ...w, text: { ...w.text, [editLang]: value } } : w)),
    }));
  }
  function updateWordColor(idx, value) {
    setSettingsForm((f) => ({ ...f, heroWords: f.heroWords.map((w, i) => (i === idx ? { ...w, color: value } : w)) }));
  }
  function addWord() {
    setSettingsForm((f) => ({ ...f, heroWords: [...f.heroWords, { text: { en: '', ar: '' }, color: 'var(--orange-soft)' }] }));
  }
  function removeWord(idx) {
    setSettingsForm((f) => ({ ...f, heroWords: f.heroWords.filter((_, i) => i !== idx) }));
  }
  function updateService(idx, field, value) {
    setSettingsForm((f) => ({
      ...f,
      services: f.services.map((s, i) => (i === idx ? { ...s, [field]: { ...s[field], [editLang]: value } } : s)),
    }));
  }
  function updateServiceNeutral(idx, field, value) {
    setSettingsForm((f) => ({
      ...f,
      services: f.services.map((s, i) => (i === idx ? { ...s, [field]: value } : s)),
    }));
  }
  function addService() {
    setSettingsForm((f) => ({ ...f, services: [...f.services, { title: { en: '', ar: '' }, desc: { en: '', ar: '' }, stat: '', image: '' }] }));
  }
  function removeService(idx) {
    setSettingsForm((f) => ({ ...f, services: f.services.filter((_, i) => i !== idx) }));
  }
  function updateImpact(idx, field, value) {
    setSettingsForm((f) => ({
      ...f,
      impact: f.impact.map((it, i) => (i === idx ? { ...it, [field]: { ...it[field], [editLang]: value } } : it)),
    }));
  }
  function updateImpactNeutral(idx, field, value) {
    setSettingsForm((f) => ({
      ...f,
      impact: f.impact.map((it, i) => (i === idx ? { ...it, [field]: value } : it)),
    }));
  }
  function addImpact() {
    setSettingsForm((f) => ({ ...f, impact: [...f.impact, { value: '', color: 'var(--green)', label: { en: '', ar: '' }, sub: { en: '', ar: '' } }] }));
  }
  function removeImpact(idx) {
    setSettingsForm((f) => ({ ...f, impact: f.impact.filter((_, i) => i !== idx) }));
  }

  function resetAuthForm() {
    setAuthUsername('');
    setAuthPassword('');
    setAuthPasswordConfirm('');
    setAuthError('');
  }

  async function doSetup(e) {
    e.preventDefault();
    setAuthError('');
    if (authPassword !== authPasswordConfirm) {
      setAuthError("Passwords don't match");
      return;
    }
    setAuthBusy(true);
    try {
      const res = await fetch('/api/auth/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: authUsername, password: authPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAuthError(data.error || 'Something went wrong');
        return;
      }
      resetAuthForm();
      await checkSession();
    } finally {
      setAuthBusy(false);
    }
  }

  async function doLogin(e) {
    e.preventDefault();
    setAuthError('');
    setAuthBusy(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: authUsername, password: authPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAuthError(data.error || 'Something went wrong');
        return;
      }
      resetAuthForm();
      await checkSession();
    } finally {
      setAuthBusy(false);
    }
  }

  async function doLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    setAuthStatus('loggedOut');
    setCurrentUser(null);
    setPermissions(EMPTY_PERMISSIONS);
    setTab('overview');
    resetAuthForm();
  }

  // ---- users (owner managing other people's access) ----
  function openUserModal(user) {
    if (user) {
      setEditingUserId(user.id);
      setUserForm({ username: user.username, password: '', permissions: { ...EMPTY_PERMISSIONS, ...(user.permissions || {}) } });
    } else {
      setEditingUserId(null);
      setUserForm(EMPTY_USER);
    }
    setUserFormError('');
    setUserModalOpen(true);
  }
  function toggleUserPermission(key) {
    setUserForm((f) => ({ ...f, permissions: { ...f.permissions, [key]: !f.permissions[key] } }));
  }
  async function saveUser(e) {
    e.preventDefault();
    setUserFormError('');
    if (!editingUserId && userForm.password.length < 8) {
      setUserFormError('Password must be at least 8 characters');
      return;
    }
    const payload = { username: userForm.username, permissions: userForm.permissions };
    if (userForm.password) payload.password = userForm.password;
    const res = await fetch(editingUserId ? `/api/users/${editingUserId}` : '/api/users', {
      method: editingUserId ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      setUserFormError(data.error || 'Something went wrong');
      return;
    }
    if (editingUserId) {
      setUsers((prev) => prev.map((u) => (u.id === editingUserId ? data : u)));
    } else {
      setUsers((prev) => [...prev, data]);
    }
    setUserModalOpen(false);
  }
  async function deleteUser(id) {
    if (!confirm('Remove this person from the admin? They will lose access immediately.')) return;
    await fetch(`/api/users/${id}`, { method: 'DELETE' });
    setUsers((prev) => prev.filter((u) => u.id !== id));
  }

  // ---- my account (any logged-in user changing their own credentials) ----
  async function saveAccount(e) {
    e.preventDefault();
    setAccountError('');
    if (accountPassword && accountPassword.length < 8) {
      setAccountError('Password must be at least 8 characters');
      return;
    }
    const payload = { username: accountUsername };
    if (accountPassword) payload.password = accountPassword;
    const res = await fetch(`/api/users/${currentUser.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      setAccountError(data.error || 'Something went wrong');
      return;
    }
    setCurrentUser(data);
    setAccountUsername(data.username);
    setAccountPassword('');
    setAccountSaved(true);
    setTimeout(() => setAccountSaved(false), 3500);
  }

  function openProjectModal(project) {
    if (project) {
      setEditingProjectId(project.id);
      setProjectForm({
        title: project.title,
        category: project.category,
        client: project.client,
        work: project.work,
        image: project.image || '',
        video: project.video || '',
        status: project.status,
      });
    } else {
      setEditingProjectId(null);
      setProjectForm({ title: '', category: 'Branding', client: '', work: '', image: '', video: '', status: 'live' });
    }
    setProjectModalOpen(true);
  }

  async function saveProject(e) {
    e.preventDefault();
    if (!projectForm.title.trim()) return;
    if (editingProjectId) {
      const res = await fetch(`/api/projects/${editingProjectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(projectForm),
      });
      const updated = await res.json();
      setProjects((prev) => prev.map((p) => (p.id === editingProjectId ? updated : p)));
    } else {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(projectForm),
      });
      const created = await res.json();
      setProjects((prev) => [created, ...prev]);
    }
    setProjectModalOpen(false);
  }

  async function deleteProject(id) {
    if (!confirm('Delete this project? This cannot be undone.')) return;
    await fetch(`/api/projects/${id}`, { method: 'DELETE' });
    setProjects((prev) => prev.filter((p) => p.id !== id));
  }

  // Move a project up or down in the list. The array order is what decides the
  // order on the /portfolio page, so this sets which project shows first.
  function moveProject(index, dir) {
    const target = index + dir;
    if (target < 0 || target >= projects.length) return;
    const next = [...projects];
    [next[index], next[target]] = [next[target], next[index]];
    setProjects(next);
    fetch('/api/projects/reorder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: next.map((p) => p.id) }),
    });
  }

  function openClientModal(client) {
    if (client) {
      setEditingClientId(client.id);
      setClientForm({ name: client.name, logo: client.logo || '' });
    } else {
      setEditingClientId(null);
      setClientForm({ name: '', logo: '' });
    }
    setClientModalOpen(true);
  }

  async function saveClient(e) {
    e.preventDefault();
    if (!clientForm.name.trim()) return;
    if (editingClientId) {
      const res = await fetch(`/api/clients/${editingClientId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(clientForm),
      });
      const updated = await res.json();
      setClients((prev) => prev.map((c) => (c.id === editingClientId ? updated : c)));
    } else {
      const res = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(clientForm),
      });
      const created = await res.json();
      setClients((prev) => [created, ...prev]);
    }
    setClientModalOpen(false);
  }

  async function deleteClient(id) {
    if (!confirm('Remove this client?')) return;
    await fetch(`/api/clients/${id}`, { method: 'DELETE' });
    setClients((prev) => prev.filter((c) => c.id !== id));
  }

  async function deleteMessage(id) {
    if (!confirm('Delete this message?')) return;
    await fetch(`/api/messages/${id}`, { method: 'DELETE' });
    setMessages((prev) => prev.filter((m) => m.id !== id));
  }

  async function saveSettings(e) {
    e.preventDefault();
    const res = await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settingsForm),
    });
    const updated = await res.json();
    setSettingsForm(mergeSettings(updated));
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 3500);
  }

  // ---- invoices ----
  function openInvoiceModal(invoice) {
    if (invoice) {
      setEditingInvoiceId(invoice.id);
      setInvoiceForm({
        clientName: invoice.clientName || '',
        projectName: invoice.projectName || '',
        currency: invoice.currency || 'LE',
        discount: invoice.discount || '',
        sections: invoice.sections?.length ? invoice.sections : [{ title: '', price: '', items: [''] }],
      });
    } else {
      setEditingInvoiceId(null);
      setInvoiceForm(EMPTY_INVOICE);
    }
    setInvoiceModalOpen(true);
  }
  function updateInvoiceSection(idx, field, value) {
    setInvoiceForm((f) => ({ ...f, sections: f.sections.map((s, i) => (i === idx ? { ...s, [field]: value } : s)) }));
  }
  function updateInvoiceSectionItems(idx, text) {
    setInvoiceForm((f) => ({ ...f, sections: f.sections.map((s, i) => (i === idx ? { ...s, items: text.split('\n') } : s)) }));
  }
  function addInvoiceSection() {
    setInvoiceForm((f) => ({ ...f, sections: [...f.sections, { title: '', price: '', items: [''] }] }));
  }
  function removeInvoiceSection(idx) {
    setInvoiceForm((f) => ({ ...f, sections: f.sections.filter((_, i) => i !== idx) }));
  }
  async function saveInvoice(e) {
    e.preventDefault();
    if (!invoiceForm.projectName.trim()) return;
    const payload = { ...invoiceForm, sections: invoiceForm.sections.map((s) => ({ ...s, items: s.items.filter((i) => i.trim()) })) };
    if (editingInvoiceId) {
      const res = await fetch(`/api/invoices/${editingInvoiceId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const updated = await res.json();
      setInvoices((prev) => prev.map((i) => (i.id === editingInvoiceId ? updated : i)));
    } else {
      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const created = await res.json();
      setInvoices((prev) => [created, ...prev]);
    }
    setInvoiceModalOpen(false);
  }
  async function deleteInvoice(id) {
    if (!confirm('Delete this invoice? This cannot be undone.')) return;
    await fetch(`/api/invoices/${id}`, { method: 'DELETE' });
    setInvoices((prev) => prev.filter((i) => i.id !== id));
  }
  async function downloadInvoice(invoice) {
    setDownloadingInvoiceId(invoice.id);
    try {
      const { downloadInvoicePdf } = await import('@/lib/pdfTemplates');
      await downloadInvoicePdf(invoice);
    } finally {
      setDownloadingInvoiceId(null);
    }
  }

  // ---- plans ----
  function openPlanModal(plan) {
    if (plan) {
      setEditingPlanId(plan.id);
      setPlanForm({
        name: plan.name || '',
        description: plan.description || '',
        price: plan.price || '',
        currency: plan.currency || 'LE',
        cycle: plan.cycle || '',
        items: plan.items?.length ? plan.items : [''],
      });
    } else {
      setEditingPlanId(null);
      setPlanForm(EMPTY_PLAN);
    }
    setPlanModalOpen(true);
  }
  function updatePlanItems(text) {
    setPlanForm((f) => ({ ...f, items: text.split('\n') }));
  }
  async function savePlan(e) {
    e.preventDefault();
    if (!planForm.name.trim()) return;
    const payload = { ...planForm, items: planForm.items.filter((i) => i.trim()) };
    if (editingPlanId) {
      const res = await fetch(`/api/plans/${editingPlanId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const updated = await res.json();
      setPlans((prev) => prev.map((p) => (p.id === editingPlanId ? updated : p)));
    } else {
      const res = await fetch('/api/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const created = await res.json();
      setPlans((prev) => [created, ...prev]);
    }
    setPlanModalOpen(false);
  }
  async function deletePlan(id) {
    if (!confirm('Delete this plan? This cannot be undone.')) return;
    await fetch(`/api/plans/${id}`, { method: 'DELETE' });
    setPlans((prev) => prev.filter((p) => p.id !== id));
  }
  async function duplicatePlan(plan) {
    const { id: _drop, updated: _u, ...rest } = plan;
    const payload = { ...rest, name: `${plan.name} (copy)` };
    const res = await fetch('/api/plans', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const created = await res.json();
    setPlans((prev) => [created, ...prev]);
  }
  async function downloadPlan(plan) {
    setDownloadingPlanId(plan.id);
    try {
      const { downloadPlanPdf } = await import('@/lib/pdfTemplates');
      await downloadPlanPdf(plan);
    } finally {
      setDownloadingPlanId(null);
    }
  }
  // "Add example plans" button in the empty state — POSTs each example plan
  // one after another so they appear as regular editable/deletable plans.
  async function addExamplePlans() {
    setSeedingPlans(true);
    try {
      const created = [];
      for (const ex of EXAMPLE_PLANS) {
        const res = await fetch('/api/plans', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(ex),
        });
        if (res.ok) created.push(await res.json());
      }
      // POST unshifts each one, so newest-first order flips the array — reverse to
      // match the intended order (Social Media first).
      setPlans((prev) => [...created.reverse(), ...prev]);
    } finally {
      setSeedingPlans(false);
    }
  }

  // ---- contracts ----
  function openContractModal(contract) {
    if (contract) {
      setEditingContractId(contract.id);
      setContractForm({
        title: contract.title || '',
        partyType: contract.partyType || 'client',
        partyName: contract.partyName || '',
        role: contract.role || '',
        startDate: contract.startDate || '',
        endDate: contract.endDate || '',
        currency: contract.currency || 'LE',
        items: contract.items?.length ? contract.items : [{ label: '', quantity: '', amount: '' }],
        terms: contract.terms || '',
        notes: contract.notes || '',
      });
    } else {
      setEditingContractId(null);
      setContractForm(EMPTY_CONTRACT);
    }
    setContractModalOpen(true);
  }
  function updateContractItem(idx, field, value) {
    setContractForm((f) => ({ ...f, items: f.items.map((it, i) => (i === idx ? { ...it, [field]: value } : it)) }));
  }
  function addContractItem() {
    setContractForm((f) => ({ ...f, items: [...f.items, { label: '', quantity: '', amount: '' }] }));
  }
  function removeContractItem(idx) {
    setContractForm((f) => ({ ...f, items: f.items.filter((_, i) => i !== idx) }));
  }
  async function saveContract(e) {
    e.preventDefault();
    if (!contractForm.title.trim()) return;
    const payload = { ...contractForm, items: contractForm.items.filter((it) => it.label.trim() || it.quantity.trim() || it.amount.trim()) };
    if (editingContractId) {
      const res = await fetch(`/api/contracts/${editingContractId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const updated = await res.json();
      setContracts((prev) => prev.map((c) => (c.id === editingContractId ? updated : c)));
    } else {
      const res = await fetch('/api/contracts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const created = await res.json();
      setContracts((prev) => [created, ...prev]);
    }
    setContractModalOpen(false);
  }
  async function deleteContract(id) {
    if (!confirm('Delete this contract? This cannot be undone.')) return;
    await fetch(`/api/contracts/${id}`, { method: 'DELETE' });
    setContracts((prev) => prev.filter((c) => c.id !== id));
  }
  async function duplicateContract(contract) {
    const { id: _drop, updated: _u, ...rest } = contract;
    const payload = { ...rest, title: `${contract.title} (copy)` };
    const res = await fetch('/api/contracts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const created = await res.json();
    setContracts((prev) => [created, ...prev]);
  }
  async function downloadContract(contract) {
    setDownloadingContractId(contract.id);
    try {
      const { downloadContractPdf } = await import('@/lib/pdfTemplates');
      await downloadContractPdf(contract);
    } finally {
      setDownloadingContractId(null);
    }
  }

  if (authStatus === 'checking') return null;

  if (authStatus === 'needsSetup') {
    return (
      <div id="loginGate" dir="ltr">
        <div className="login-box">
          <div className="login-brand"><img src="/keda-white.png" alt="KEDA" /></div>
          <div className="logo">Set up your admin account</div>
          <div className="sub">You're the first person here — choose the username and password you'll sign in with. You can add more people (with their own permissions) once you're in.</div>
          <form onSubmit={doSetup}>
            <Field label="Username">
              <input value={authUsername} onChange={(e) => setAuthUsername(e.target.value)} placeholder="e.g. keda" autoComplete="username" />
            </Field>
            <Field label="Password" hint="at least 8 characters">
              <input type="password" value={authPassword} onChange={(e) => setAuthPassword(e.target.value)} placeholder="••••••••" autoComplete="new-password" />
            </Field>
            <Field label="Confirm password">
              <input type="password" value={authPasswordConfirm} onChange={(e) => setAuthPasswordConfirm(e.target.value)} placeholder="••••••••" autoComplete="new-password" />
            </Field>
            <button className="login-btn" type="submit" disabled={authBusy}>{authBusy ? 'Creating…' : 'Create account'}</button>
          </form>
          <div className={`error ${authError ? 'show' : ''}`}>{authError}</div>
        </div>
      </div>
    );
  }

  if (authStatus === 'loggedOut') {
    return (
      <div id="loginGate" dir="ltr">
        <div className="login-box">
          <div className="login-brand"><img src="/keda-white.png" alt="KEDA" /></div>
          <div className="logo">Admin</div>
          <div className="sub">Sign in to manage your site content.</div>
          <form onSubmit={doLogin}>
            <Field label="Username">
              <input value={authUsername} onChange={(e) => setAuthUsername(e.target.value)} placeholder="Username" autoComplete="username" />
            </Field>
            <Field label="Password">
              <input type="password" value={authPassword} onChange={(e) => setAuthPassword(e.target.value)} placeholder="••••••••" autoComplete="current-password" />
            </Field>
            <button className="login-btn" type="submit" disabled={authBusy}>{authBusy ? 'Signing in…' : 'Sign in'}</button>
          </form>
          <div className={`error ${authError ? 'show' : ''}`}>{authError}</div>
        </div>
      </div>
    );
  }

  const liveCount = projects.filter((p) => p.status === 'live').length;
  const isAr = editLang === 'ar';
  const isOwner = currentUser?.role === 'owner';

  // Filter every tab (except 'overview', always shown) down to what this user
  // is actually allowed to see, then drop any group left with no tabs at all.
  const visibleGroups = TAB_GROUPS
    .map((group) => ({ ...group, tabs: group.tabs.filter((key) => key === 'overview' || permissions[key]) }))
    .filter((group) => group.tabs.length > 0);
  const configureExtras = ['account', ...(isOwner ? ['users'] : [])];

  return (
    <div id="dashboard" dir="ltr">
      <div className="shell">
        <aside className="sidebar">
          <div className="side-brand"><img src="/keda-white.png" alt="KEDA" /><span>Admin</span></div>
          <nav className="side-links">
            {visibleGroups.map((group) => (
              <div className="side-group" key={group.label}>
                <div className="side-group-label">{group.label}</div>
                {group.tabs.map((key) => (
                  <a key={key} className={tab === key ? 'active' : ''} onClick={() => setTab(key)}>
                    <span className="side-icon">{TAB_ICONS[key]}</span>
                    {TAB_TITLES[key]}
                    {key === 'messages' && messages.length > 0 && <span className="side-badge">{messages.length}</span>}
                  </a>
                ))}
              </div>
            ))}
            <div className="side-group">
              <div className="side-group-label">Account</div>
              {configureExtras.map((key) => (
                <a key={key} className={tab === key ? 'active' : ''} onClick={() => setTab(key)}>
                  <span className="side-icon">{TAB_ICONS[key]}</span>
                  {TAB_TITLES[key]}
                </a>
              ))}
            </div>
          </nav>
          <div className="side-account">
            <div className="side-account-name">{currentUser?.username}</div>
            <div className="side-account-role">{isOwner ? 'Owner' : 'Member'}</div>
          </div>
          <div className="logout" onClick={doLogout}>↩ Log out</div>
        </aside>

        <main className="main">
          <div className="topbar">
            <div>
              <h1>{TAB_TITLES[tab]}</h1>
              <div className="topbar-sub">{TAB_SUB[tab]}</div>
            </div>
            <a className="view-site" href="/" target="_blank" rel="noreferrer">View site ↗</a>
          </div>

          {tab === 'overview' && (
            <section className="tab-panel active">
              <div className="stat-grid">
                <div className="stat-card">
                  <div className="label">Projects Published</div>
                  <div className="value">{liveCount}</div>
                  <div className="delta">{liveCount ? `${projects.length} total (incl. drafts)` : 'Add your first case study'}</div>
                </div>
                <div className="stat-card">
                  <div className="label">Clients Listed</div>
                  <div className="value">{clients.length}</div>
                  <div className="delta">{clients.length ? 'Showing on homepage' : 'Add your first client'}</div>
                </div>
                <div className="stat-card">
                  <div className="label">New Messages</div>
                  <div className="value">{messages.length}</div>
                  <div className="delta">{messages.length ? 'From your contact form' : 'Nothing yet'}</div>
                </div>
                <div className="stat-card">
                  <div className="label">Site Status</div>
                  <div className="value" style={{ fontSize: 20 }}>{liveCount > 0 ? 'Live' : 'Draft'}</div>
                  <div className="delta" style={{ color: liveCount > 0 ? 'var(--green)' : 'var(--gold)' }}>
                    {liveCount > 0 ? 'Showing on homepage' : 'Not live'}
                  </div>
                </div>
              </div>

              <div className="panel">
                <div className="panel-head"><h3>Recent Messages</h3></div>
                <table>
                  <thead><tr><th>From</th><th>Message</th><th>Received</th></tr></thead>
                  <tbody>
                    {messages.length === 0 ? (
                      <tr><td colSpan={3}><div className="empty">Nothing yet.</div></td></tr>
                    ) : (
                      messages.slice(0, 3).map((m) => (
                        <tr key={m.id}>
                          <td>{m.name}</td>
                          <td className="msg-cell">{m.message}</td>
                          <td>{fmtDate(m.received)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {tab === 'projects' && (
            <section className="tab-panel active">
              <div className="panel">
                <div className="panel-head">
                  <h3>Projects</h3>
                  <button type="button" className="add-btn" onClick={() => openProjectModal(null)}>+ Add Project</button>
                </div>
                <p className="field-hint" style={{ marginBottom: 14 }}>Use the ↑ / ↓ arrows to set the order — the topmost project shows first on the portfolio page.</p>
                <table>
                  <thead><tr><th>Order</th><th>Title</th><th>Category</th><th>Status</th><th>Updated</th><th></th></tr></thead>
                  <tbody>
                    {projects.length === 0 ? (
                      <tr><td colSpan={6}><div className="empty">No projects yet — add your first case study to show it here and on the homepage.</div></td></tr>
                    ) : (
                      projects.map((p, idx) => (
                        <tr key={p.id}>
                          <td>
                            <div className="order-controls">
                              <button type="button" className="order-btn" onClick={() => moveProject(idx, -1)} disabled={idx === 0} aria-label="Move up">↑</button>
                              <button type="button" className="order-btn" onClick={() => moveProject(idx, 1)} disabled={idx === projects.length - 1} aria-label="Move down">↓</button>
                            </div>
                          </td>
                          <td>{p.title}</td>
                          <td>{p.category}</td>
                          <td><span className={`status ${p.status}`}>{p.status === 'live' ? 'Live' : 'Draft'}</span></td>
                          <td>{fmtDate(p.updated)}</td>
                          <td>
                            <div className="row-actions">
                              <span onClick={() => openProjectModal(p)}>Edit</span>
                              <span className="danger" onClick={() => deleteProject(p.id)}>Delete</span>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {tab === 'clients' && (
            <section className="tab-panel active">
              <div className="panel">
                <div className="panel-head">
                  <h3>Client Logos</h3>
                  <button type="button" className="add-btn" onClick={() => openClientModal(null)}>+ Add Client</button>
                </div>
                <table>
                  <thead><tr><th>Logo</th><th>Name</th><th>Added</th><th></th></tr></thead>
                  <tbody>
                    {clients.length === 0 ? (
                      <tr><td colSpan={4}><div className="empty">No clients added yet.</div></td></tr>
                    ) : (
                      clients.map((c) => (
                        <tr key={c.id}>
                          <td>{c.logo ? <img src={c.logo} alt={c.name} className="client-logo-thumb" /> : <span className="no-logo">—</span>}</td>
                          <td>{c.name}</td>
                          <td>{fmtDate(c.added)}</td>
                          <td>
                            <div className="row-actions">
                              <span onClick={() => openClientModal(c)}>Edit</span>
                              <span className="danger" onClick={() => deleteClient(c.id)}>Delete</span>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {tab === 'messages' && (
            <section className="tab-panel active">
              <div className="panel">
                <div className="panel-head"><h3>Contact Messages</h3></div>
                <table>
                  <thead><tr><th>From</th><th>Message</th><th>Prefers</th><th>Received</th><th></th></tr></thead>
                  <tbody>
                    {messages.length === 0 ? (
                      <tr><td colSpan={5}><div className="empty">Messages sent from the site&apos;s contact form will appear here.</div></td></tr>
                    ) : (
                      messages.map((m) => (
                        <tr key={m.id}>
                          <td>{m.name}<br /><span style={{ color: 'var(--text-dim)', fontSize: 12 }}>{m.email}</span></td>
                          <td className="msg-cell">{m.message}</td>
                          <td>
                            {METHOD_LABELS[m.contactMethod] || 'WhatsApp'}
                            {m.phone && <><br /><span style={{ color: 'var(--text-dim)', fontSize: 12 }}>{m.phone}</span></>}
                          </td>
                          <td>{fmtDate(m.received)}</td>
                          <td><div className="row-actions"><span className="danger" onClick={() => deleteMessage(m.id)}>Delete</span></div></td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {tab === 'invoices' && (
            <section className="tab-panel active">
              <div className="panel">
                <div className="panel-head">
                  <h3>Invoices</h3>
                  <button type="button" className="add-btn" onClick={() => openInvoiceModal(null)}>+ New Invoice</button>
                </div>
                <table>
                  <thead><tr><th>Project</th><th>Client</th><th>Total</th><th>Updated</th><th></th></tr></thead>
                  <tbody>
                    {invoices.length === 0 ? (
                      <tr><td colSpan={5}><div className="empty">No invoices yet — create one to send a client a branded PDF breakdown.</div></td></tr>
                    ) : (
                      invoices.map((inv) => {
                        const { total } = invoiceTotals(inv);
                        return (
                          <tr key={inv.id}>
                            <td>{inv.projectName}</td>
                            <td>{inv.clientName || '—'}</td>
                            <td>{formatAmount(total)} {inv.currency}</td>
                            <td>{fmtDate(inv.updated)}</td>
                            <td>
                              <div className="row-actions">
                                <span onClick={() => downloadInvoice(inv)}>{downloadingInvoiceId === inv.id ? 'Preparing…' : 'Download PDF'}</span>
                                <span onClick={() => openInvoiceModal(inv)}>Edit</span>
                                <span className="danger" onClick={() => deleteInvoice(inv.id)}>Delete</span>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {tab === 'plans' && (
            <section className="tab-panel active">
              <div className="panel">
                <div className="panel-head">
                  <h3>Plans</h3>
                  <button type="button" className="add-btn" onClick={() => openPlanModal(null)}>+ New Plan</button>
                </div>
                {plans.length === 0 ? (
                  <div className="plans-empty">
                    <p className="plans-empty-title">You don&apos;t have any saved plans yet.</p>
                    <p className="plans-empty-sub">Start with a set of example plans (Social Media, Brand Identity, Logo Animation) — you can freely edit or delete any of them afterwards.</p>
                    <div className="plans-empty-actions">
                      <button type="button" className="add-btn" onClick={addExamplePlans} disabled={seedingPlans}>
                        {seedingPlans ? 'Adding…' : 'Add example plans'}
                      </button>
                      <button type="button" className="btn-secondary" onClick={() => openPlanModal(null)}>Or start blank</button>
                    </div>
                  </div>
                ) : (
                  <table>
                    <thead><tr><th>Name</th><th>Price</th><th>Includes</th><th>Updated</th><th></th></tr></thead>
                    <tbody>
                      {plans.map((p) => (
                        <tr key={p.id}>
                          <td>
                            {p.name}
                            {p.description && <><br /><span style={{ color: 'var(--text-dim)', fontSize: 12 }}>{p.description}</span></>}
                          </td>
                          <td>
                            {p.price ? `${p.price} ${p.currency}` : '—'}
                            {p.cycle && <span style={{ color: 'var(--text-dim)', fontSize: 12 }}> / {p.cycle}</span>}
                          </td>
                          <td style={{ color: 'var(--text-dim)', fontSize: 12 }}>{p.items?.length || 0} item{(p.items?.length || 0) === 1 ? '' : 's'}</td>
                          <td>{fmtDate(p.updated)}</td>
                          <td>
                            <div className="row-actions">
                              <span onClick={() => downloadPlan(p)}>{downloadingPlanId === p.id ? 'Preparing…' : 'Download PDF'}</span>
                              <span onClick={() => openPlanModal(p)}>Edit</span>
                              <span onClick={() => duplicatePlan(p)}>Duplicate</span>
                              <span className="danger" onClick={() => deletePlan(p.id)}>Delete</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </section>
          )}

          {tab === 'contracts' && (
            <section className="tab-panel active">
              <div className="panel">
                <div className="panel-head">
                  <h3>Contracts</h3>
                  <button type="button" className="add-btn" onClick={() => openContractModal(null)}>+ New Contract</button>
                </div>
                {contracts.length === 0 ? (
                  <div className="empty">No contracts yet — create one for a client or a team member and download it as a branded PDF.</div>
                ) : (
                  <table>
                    <thead><tr><th>Title</th><th>For</th><th>Total</th><th>Updated</th><th></th></tr></thead>
                    <tbody>
                      {contracts.map((c) => {
                        const total = contractTotal(c);
                        return (
                          <tr key={c.id}>
                            <td>{c.title}</td>
                            <td>
                              {c.partyName || '—'}
                              <br /><span style={{ color: 'var(--text-dim)', fontSize: 12 }}>{c.partyType === 'employee' ? 'Team member' : 'Client'}{c.role ? ` · ${c.role}` : ''}</span>
                            </td>
                            <td>{total > 0 ? `${formatAmount(total)} ${c.currency}` : '—'}</td>
                            <td>{fmtDate(c.updated)}</td>
                            <td>
                              <div className="row-actions">
                                <span onClick={() => downloadContract(c)}>{downloadingContractId === c.id ? 'Preparing…' : 'Download PDF'}</span>
                                <span onClick={() => openContractModal(c)}>Edit</span>
                                <span onClick={() => duplicateContract(c)}>Duplicate</span>
                                <span className="danger" onClick={() => deleteContract(c.id)}>Delete</span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </section>
          )}

          {tab === 'settings' && (
            <section className="tab-panel active">
              <form onSubmit={saveSettings}>
                <div className="lang-edit-bar">
                  <div className="lang-edit-info">
                    <span className="lang-edit-title">Editing content in</span>
                    <div className="lang-seg">
                      <button type="button" className={editLang === 'en' ? 'active' : ''} onClick={() => setEditLang('en')}>English</button>
                      <button type="button" className={editLang === 'ar' ? 'active' : ''} onClick={() => setEditLang('ar')}>العربية</button>
                    </div>
                  </div>
                  <div className="lang-edit-actions">
                    <span className={`saved-note ${settingsSaved ? 'show' : ''}`}>Saved ✓</span>
                    <button className="save-btn" type="submit">Save all changes</button>
                  </div>
                </div>

                <div className={`content-editor ${isAr ? 'rtl-preview' : ''}`}>
                  <div className="panel">
                    <div className="panel-head"><h3>Brand</h3><span className="panel-tag">Both languages</span></div>
                    <Field label="Site name (used in page titles)">
                      <input className="neutral-input" value={settingsForm.siteName} onChange={setNeutral('siteName')} placeholder="e.g. KEDA" />
                    </Field>
                  </div>

                  <div className="panel">
                    <div className="panel-head"><h3>Hero section</h3><span className="panel-tag">{isAr ? 'عربي' : 'English'}</span></div>
                    <Field label="Eyebrow (small label above the headline)">
                      <input value={locVal('heroEyebrow')} onChange={setLoc('heroEyebrow')} />
                    </Field>

                    <div className="sub-block">
                      <div className="sub-block-title">Animated headline</div>
                      <div className="field-row">
                        <Field label="First line"><input value={locVal('heroLine1')} onChange={setLoc('heroLine1')} /></Field>
                        <Field label="Last line"><input value={locVal('heroLine3')} onChange={setLoc('heroLine3')} /></Field>
                      </div>
                      <label className="repeat-label">Rotating words (the middle line cycles through these)</label>
                      {settingsForm.heroWords.map((w, i) => (
                        <div className="repeat-item" key={i}>
                          <input value={w.text?.[editLang] ?? ''} onChange={(e) => updateWordText(i, e.target.value)} placeholder={isAr ? 'كلمة' : 'word'} />
                          <select value={w.color} onChange={(e) => updateWordColor(i, e.target.value)}>
                            {WORD_COLORS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                          </select>
                          <button type="button" className="repeat-remove" onClick={() => removeWord(i)} disabled={settingsForm.heroWords.length <= 1}>✕</button>
                        </div>
                      ))}
                      <button type="button" className="repeat-add" onClick={addWord}>+ Add word</button>
                    </div>

                    <Field label="Optional fixed headline (overrides the animation when filled)">
                      <input value={locVal('heroHeading')} onChange={setLoc('heroHeading')} placeholder="Leave empty to keep the rotating headline" />
                    </Field>
                    <Field label="Paragraph"><textarea value={locVal('heroPara')} onChange={setLoc('heroPara')} /></Field>
                    <Field label="Button label"><input value={locVal('heroCtaLabel')} onChange={setLoc('heroCtaLabel')} /></Field>
                  </div>

                  <div className="panel">
                    <div className="panel-head"><h3>Services — “What We Do”</h3><span className="panel-tag">{isAr ? 'عربي' : 'English'}</span></div>
                    <div className="field-row">
                      <Field label="Eyebrow"><input value={locVal('servicesEyebrow')} onChange={setLoc('servicesEyebrow')} /></Field>
                      <Field label="Heading (Enter → bold second line)"><textarea value={locVal('servicesHeading')} onChange={setLoc('servicesHeading')} /></Field>
                    </div>
                    <label className="repeat-label">Service cards</label>
                    {settingsForm.services.map((s, i) => (
                      <div className="repeat-card" key={i}>
                        <div className="repeat-card-head">
                          <span className="repeat-num">{String(i + 1).padStart(2, '0')}</span>
                          <input value={s.title?.[editLang] ?? ''} onChange={(e) => updateService(i, 'title', e.target.value)} placeholder={isAr ? 'اسم الخدمة' : 'Service title'} />
                          <button type="button" className="repeat-remove" onClick={() => removeService(i)} disabled={settingsForm.services.length <= 1}>✕</button>
                        </div>
                        <textarea value={s.desc?.[editLang] ?? ''} onChange={(e) => updateService(i, 'desc', e.target.value)} placeholder={isAr ? 'وصف قصير' : 'Short description'} />
                        <div className="repeat-subrow">
                          <input className="neutral-input" value={s.stat ?? ''} onChange={(e) => updateServiceNeutral(i, 'stat', e.target.value)} placeholder="Big number, e.g. 50+" />
                          <input className="neutral-input" value={s.image ?? ''} onChange={(e) => updateServiceNeutral(i, 'image', e.target.value)} placeholder="Background image URL (optional)" />
                        </div>
                      </div>
                    ))}
                    <button type="button" className="repeat-add" onClick={addService}>+ Add service</button>
                  </div>

                  <div className="panel">
                    <div className="panel-head"><h3>Sections headings</h3><span className="panel-tag">{isAr ? 'عربي' : 'English'}</span></div>
                    <div className="field-row">
                      <Field label="Clients — eyebrow"><input value={locVal('clientsEyebrow')} onChange={setLoc('clientsEyebrow')} /></Field>
                      <Field label="Clients — heading"><textarea value={locVal('clientsHeading')} onChange={setLoc('clientsHeading')} /></Field>
                    </div>
                    <div className="field-row">
                      <Field label="Selected work — eyebrow"><input value={locVal('workEyebrow')} onChange={setLoc('workEyebrow')} /></Field>
                      <Field label="Selected work — heading"><textarea value={locVal('workHeading')} onChange={setLoc('workHeading')} /></Field>
                    </div>
                  </div>

                  <div className="panel">
                    <div className="panel-head"><h3>Portfolio page</h3><span className="panel-tag">{isAr ? 'عربي' : 'English'}</span></div>
                    <p className="field-hint" style={{ marginBottom: 14 }}>The full <b>/portfolio</b> page — projects come from the Projects tab.</p>
                    <div className="field-row">
                      <Field label="Eyebrow"><input value={locVal('portfolioEyebrow')} onChange={setLoc('portfolioEyebrow')} /></Field>
                      <Field label="Heading (Enter → gold second line)"><textarea value={locVal('portfolioHeading')} onChange={setLoc('portfolioHeading')} /></Field>
                    </div>
                  </div>

                  <div className="panel">
                    <div className="panel-head"><h3>Our Impact</h3><span className="panel-tag">{isAr ? 'عربي' : 'English'}</span></div>
                    <div className="field-row">
                      <Field label="Eyebrow"><input value={locVal('impactEyebrow')} onChange={setLoc('impactEyebrow')} /></Field>
                      <Field label="Heading (Enter → bold second line)"><textarea value={locVal('impactHeading')} onChange={setLoc('impactHeading')} /></Field>
                    </div>
                    <label className="repeat-label">Impact numbers</label>
                    {settingsForm.impact.map((it, i) => (
                      <div className="repeat-card" key={i}>
                        <div className="repeat-card-head">
                          <input className="neutral-input impact-value-input" value={it.value ?? ''} onChange={(e) => updateImpactNeutral(i, 'value', e.target.value)} placeholder="700M+" />
                          <input value={it.label?.[editLang] ?? ''} onChange={(e) => updateImpact(i, 'label', e.target.value)} placeholder={isAr ? 'العنوان' : 'Label'} />
                          <select className="neutral-input" value={it.color} onChange={(e) => updateImpactNeutral(i, 'color', e.target.value)}>
                            {WORD_COLORS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                          </select>
                          <button type="button" className="repeat-remove" onClick={() => removeImpact(i)} disabled={settingsForm.impact.length <= 1}>✕</button>
                        </div>
                        <textarea value={it.sub?.[editLang] ?? ''} onChange={(e) => updateImpact(i, 'sub', e.target.value)} placeholder={isAr ? 'وصف قصير' : 'Short description'} />
                      </div>
                    ))}
                    <button type="button" className="repeat-add" onClick={addImpact}>+ Add number</button>
                  </div>

                  <div className="panel">
                    <div className="panel-head"><h3>About section</h3><span className="panel-tag">{isAr ? 'عربي' : 'English'}</span></div>
                    <div className="field-row">
                      <Field label="Eyebrow"><input value={locVal('aboutEyebrow')} onChange={setLoc('aboutEyebrow')} /></Field>
                      <Field label="Heading (Enter → bold second line)"><textarea value={locVal('aboutHeading')} onChange={setLoc('aboutHeading')} /></Field>
                    </div>
                    <Field label="Body text"><textarea value={locVal('aboutBody')} onChange={setLoc('aboutBody')} /></Field>
                  </div>

                  <div className="panel">
                    <div className="panel-head"><h3>About page</h3><span className="panel-tag">Mixed</span></div>
                    <p className="field-hint" style={{ marginBottom: 14 }}>The full <b>/about</b> page — reuses the "About section" eyebrow, heading and body above for its top heading and panel text.</p>
                    <Field label={`Panel heading (${isAr ? 'عربي' : 'English'})`}>
                      <input value={locVal('aboutPanelHeading')} onChange={setLoc('aboutPanelHeading')} placeholder="Who are we?" />
                    </Field>
                    <div className="field-row">
                      <Field label="Panel image URL (optional)">
                        <input className="neutral-input" value={settingsForm.aboutImage} onChange={setNeutral('aboutImage')} placeholder="https://…  (leave empty for a placeholder)" />
                      </Field>
                      <Field label={`Vertical side label (${isAr ? 'عربي' : 'English'})`}>
                        <input value={locVal('aboutSideLabel')} onChange={setLoc('aboutSideLabel')} placeholder="KEDA" />
                      </Field>
                    </div>
                  </div>

                  <div className="panel">
                    <div className="panel-head"><h3>Contact page</h3><span className="panel-tag">{isAr ? 'عربي' : 'English'}</span></div>
                    <p className="field-hint" style={{ marginBottom: 14 }}>The big heading at the top of <b>/contact</b>. Contact email &amp; social links are set below in &quot;Contact &amp; social&quot;.</p>
                    <div className="field-row">
                      <Field label="Heading — line 1 (white)"><input value={locVal('contactHeadingLine1')} onChange={setLoc('contactHeadingLine1')} /></Field>
                      <Field label="Heading — line 2 (orange)"><input value={locVal('contactHeadingLine2')} onChange={setLoc('contactHeadingLine2')} /></Field>
                    </div>
                    <Field label="Email block label"><input value={locVal('contactDropLabel')} onChange={setLoc('contactDropLabel')} placeholder="Drop a line" /></Field>
                  </div>

                  <div className="panel">
                    <div className="panel-head"><h3>Call to action</h3><span className="panel-tag">{isAr ? 'عربي' : 'English'}</span></div>
                    <div className="field-row">
                      <Field label="Line 1 (orange)"><input value={locVal('ctaLine1')} onChange={setLoc('ctaLine1')} /></Field>
                      <Field label="Line 2 (white)"><input value={locVal('ctaLine2')} onChange={setLoc('ctaLine2')} /></Field>
                    </div>
                    <Field label="Button label"><input value={locVal('ctaButton')} onChange={setLoc('ctaButton')} /></Field>
                  </div>

                  <div className="panel">
                    <div className="panel-head"><h3>Footer</h3><span className="panel-tag">{isAr ? 'عربي' : 'English'}</span></div>
                    <Field label="Footer note (bottom line)"><input value={locVal('footerNote')} onChange={setLoc('footerNote')} /></Field>
                  </div>

                  <div className="panel">
                    <div className="panel-head"><h3>Contact &amp; social</h3><span className="panel-tag">Both languages</span></div>
                    <Field label="Contact email (shown on the contact page)">
                      <input type="email" value={settingsForm.contactEmail} onChange={setNeutral('contactEmail')} placeholder="hello@keda.studio" />
                    </Field>
                    <div className="field-row">
                      <Field label="Facebook URL"><input className="neutral-input" value={settingsForm.facebookUrl} onChange={setNeutral('facebookUrl')} placeholder="https://facebook.com/…" /></Field>
                      <Field label="Instagram URL"><input className="neutral-input" value={settingsForm.instagramUrl} onChange={setNeutral('instagramUrl')} placeholder="https://instagram.com/…" /></Field>
                    </div>
                    <div className="field-row">
                      <Field label="Behance URL"><input className="neutral-input" value={settingsForm.behanceUrl} onChange={setNeutral('behanceUrl')} placeholder="https://behance.net/…" /></Field>
                      <Field label="X (Twitter) URL"><input className="neutral-input" value={settingsForm.xUrl} onChange={setNeutral('xUrl')} placeholder="https://x.com/…" /></Field>
                    </div>
                  </div>
                </div>
              </form>
            </section>
          )}

          {tab === 'users' && isOwner && (
            <section className="tab-panel active">
              <div className="panel">
                <div className="panel-head">
                  <h3>Users</h3>
                  <button type="button" className="add-btn" onClick={() => openUserModal(null)}>+ Add User</button>
                </div>
                <table>
                  <thead><tr><th>Username</th><th>Role</th><th>Can access</th><th></th></tr></thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id}>
                        <td>{u.username}{u.id === currentUser.id && <span className="panel-tag" style={{ marginInlineStart: 8 }}>You</span>}</td>
                        <td>{u.role === 'owner' ? 'Owner' : 'Member'}</td>
                        <td style={{ color: 'var(--text-dim)', fontSize: 12 }}>
                          {u.role === 'owner'
                            ? 'Everything'
                            : PERMISSIONS.filter((p) => u.permissions?.[p]).map((p) => PERMISSION_LABELS[p]).join(', ') || 'Nothing yet'}
                        </td>
                        <td>
                          {u.role !== 'owner' && (
                            <div className="row-actions">
                              <span onClick={() => openUserModal(u)}>Edit</span>
                              <span className="danger" onClick={() => deleteUser(u.id)}>Delete</span>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {tab === 'account' && (
            <section className="tab-panel active">
              <div className="panel">
                <div className="panel-head"><h3>My Account</h3></div>
                <form onSubmit={saveAccount}>
                  <Field label="Username">
                    <input className="neutral-input" value={accountUsername} onChange={(e) => setAccountUsername(e.target.value)} autoComplete="username" />
                  </Field>
                  <Field label="New password (optional)" hint="leave blank to keep your current password">
                    <input className="neutral-input" type="password" value={accountPassword} onChange={(e) => setAccountPassword(e.target.value)} placeholder="••••••••" autoComplete="new-password" />
                  </Field>
                  {accountError && <p className="field-hint" style={{ color: 'var(--red)', marginBottom: 14 }}>{accountError}</p>}
                  <div className="settings-actions">
                    <button className="save-btn" type="submit">Save changes</button>
                    <span className={`saved-note ${accountSaved ? 'show' : ''}`}>Saved ✓</span>
                  </div>
                </form>
              </div>
            </section>
          )}
        </main>
      </div>

      {projectModalOpen && (
        <div className="modal-overlay open">
          <div className="modal-box">
            <h3>{editingProjectId ? 'Edit Project' : 'Add Project'}</h3>
            <form onSubmit={saveProject}>
              <Field label="Title">
                <input value={projectForm.title} onChange={(e) => setProjectForm((f) => ({ ...f, title: e.target.value }))} placeholder="e.g. Sunset Coffee — Brand Identity" />
              </Field>
              <Field label="Category">
                <select value={projectForm.category} onChange={(e) => setProjectForm((f) => ({ ...f, category: e.target.value }))}>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </Field>
              <Field label="Client">
                <input value={projectForm.client} onChange={(e) => setProjectForm((f) => ({ ...f, client: e.target.value }))} placeholder="e.g. Sunset Coffee Co." />
              </Field>
              <Field label="Work included">
                <input value={projectForm.work} onChange={(e) => setProjectForm((f) => ({ ...f, work: e.target.value }))} placeholder="e.g. Logo, Guidelines, Naming" />
              </Field>
              <Field label="Thumbnail image URL (optional)">
                <input value={projectForm.image} onChange={(e) => setProjectForm((f) => ({ ...f, image: e.target.value }))} placeholder="https://…  (shows in the hero gallery, used as video poster)" />
              </Field>
              <Field label="Video URL (optional)" hint="portrait or landscape — sized automatically">
                <input value={projectForm.video} onChange={(e) => setProjectForm((f) => ({ ...f, video: e.target.value }))} placeholder="https://…mp4  (shown instead of the image on the portfolio page)" />
              </Field>
              {projectForm.video ? (
                <div className="admin-video-preview">
                  <PortfolioVideo src={projectForm.video} poster={projectForm.image} />
                </div>
              ) : null}
              <Field label="Status">
                <select value={projectForm.status} onChange={(e) => setProjectForm((f) => ({ ...f, status: e.target.value }))}>
                  <option value="live">Live — visible on homepage</option>
                  <option value="draft">Draft — hidden from homepage</option>
                </select>
              </Field>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setProjectModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Save project</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {clientModalOpen && (
        <div className="modal-overlay open">
          <div className="modal-box">
            <h3>{editingClientId ? 'Edit Client' : 'Add Client'}</h3>
            <form onSubmit={saveClient}>
              <Field label="Client name">
                <input value={clientForm.name} onChange={(e) => setClientForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Sunset Coffee Co." />
              </Field>
              <Field label="Logo image URL (optional — shows in the scrolling bar)">
                <input value={clientForm.logo} onChange={(e) => setClientForm((f) => ({ ...f, logo: e.target.value }))} placeholder="https://…  (leave empty to show the name)" />
              </Field>
              {clientForm.logo ? (
                <div className="logo-preview"><img src={clientForm.logo} alt="logo preview" /></div>
              ) : null}
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setClientModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Save client</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {invoiceModalOpen && (
        <div className="modal-overlay open">
          <div className="modal-box modal-box-wide">
            <h3>{editingInvoiceId ? 'Edit Invoice' : 'New Invoice'}</h3>
            <form onSubmit={saveInvoice}>
              <div className="field-row">
                <Field label="Project name">
                  <input value={invoiceForm.projectName} onChange={(e) => setInvoiceForm((f) => ({ ...f, projectName: e.target.value }))} placeholder="Project name" />
                </Field>
                <Field label="Client name (optional)">
                  <input value={invoiceForm.clientName} onChange={(e) => setInvoiceForm((f) => ({ ...f, clientName: e.target.value }))} placeholder="Client name" />
                </Field>
              </div>

              <label className="repeat-label">Deliverables</label>
              {invoiceForm.sections.map((s, i) => (
                <div className="repeat-card" key={i}>
                  <div className="repeat-card-head">
                    <span className="repeat-num">{String(i + 1).padStart(2, '0')}</span>
                    <input value={s.title} onChange={(e) => updateInvoiceSection(i, 'title', e.target.value)} placeholder="Deliverable group name" />
                    <input className="neutral-input" style={{ flex: 'none', width: 130 }} value={s.price} onChange={(e) => updateInvoiceSection(i, 'price', e.target.value)} placeholder="Price" />
                    <button type="button" className="repeat-remove" onClick={() => removeInvoiceSection(i)} disabled={invoiceForm.sections.length <= 1}>✕</button>
                  </div>
                  <textarea
                    className="items-textarea"
                    rows={6}
                    value={s.items.join('\n')}
                    onChange={(e) => updateInvoiceSectionItems(i, e.target.value)}
                    placeholder={'One deliverable per line, e.g.\nMascot Logo Design\nBrand Color Palette\nTypography Selection'}
                  />
                </div>
              ))}
              <button type="button" className="repeat-add" onClick={addInvoiceSection}>+ Add deliverable group</button>

              <div className="field-row" style={{ marginTop: 16 }}>
                <Field label="Discount (optional)">
                  <input className="neutral-input" value={invoiceForm.discount} onChange={(e) => setInvoiceForm((f) => ({ ...f, discount: e.target.value }))} placeholder="0" />
                </Field>
                <Field label="Currency">
                  <input className="neutral-input" value={invoiceForm.currency} onChange={(e) => setInvoiceForm((f) => ({ ...f, currency: e.target.value }))} placeholder="LE" />
                </Field>
              </div>

              {(() => {
                const { subtotal, discount, total } = invoiceTotals(invoiceForm);
                return (
                  <div className="invoice-totals-preview">
                    <span>Subtotal <b>{formatAmount(subtotal)} {invoiceForm.currency}</b></span>
                    {discount > 0 && <span>Discount <b>−{formatAmount(discount)} {invoiceForm.currency}</b></span>}
                    <span>Total <b>{formatAmount(total)} {invoiceForm.currency}</b></span>
                  </div>
                );
              })()}

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setInvoiceModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Save invoice</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {planModalOpen && (
        <div className="modal-overlay open">
          <div className="modal-box modal-box-wide">
            <h3>{editingPlanId ? 'Edit Plan' : 'New Plan'}</h3>
            <form onSubmit={savePlan}>
              <Field label="Plan name">
                <input value={planForm.name} onChange={(e) => setPlanForm((f) => ({ ...f, name: e.target.value }))} placeholder="Plan name" />
              </Field>
              <Field label="Short description (optional)">
                <input value={planForm.description} onChange={(e) => setPlanForm((f) => ({ ...f, description: e.target.value }))} placeholder="One line summary" />
              </Field>
              <div className="field-row">
                <Field label="Price">
                  <input className="neutral-input" value={planForm.price} onChange={(e) => setPlanForm((f) => ({ ...f, price: e.target.value }))} placeholder="6,000" />
                </Field>
                <Field label="Currency">
                  <input className="neutral-input" value={planForm.currency} onChange={(e) => setPlanForm((f) => ({ ...f, currency: e.target.value }))} placeholder="LE" />
                </Field>
                <Field label="Cycle (optional)" hint="e.g. month, year">
                  <input className="neutral-input" value={planForm.cycle} onChange={(e) => setPlanForm((f) => ({ ...f, cycle: e.target.value }))} placeholder="month" />
                </Field>
              </div>
              <Field label="What's included" hint="one line per item">
                <textarea
                  className="items-textarea"
                  rows={8}
                  value={planForm.items.join('\n')}
                  onChange={(e) => updatePlanItems(e.target.value)}
                  placeholder={'e.g.\nPage management (Facebook, Instagram, YouTube)\nMonthly content plan\nPost design and creative production\nCopywriting and hashtags\nScheduling and community engagement'}
                />
              </Field>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setPlanModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Save plan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {contractModalOpen && (
        <div className="modal-overlay open">
          <div className="modal-box modal-box-wide">
            <h3>{editingContractId ? 'Edit Contract' : 'New Contract'}</h3>
            <form onSubmit={saveContract}>
              <Field label="Contract title">
                <input value={contractForm.title} onChange={(e) => setContractForm((f) => ({ ...f, title: e.target.value }))} placeholder="e.g. Design Services Agreement" />
              </Field>
              <div className="field-row">
                <Field label="This contract is for">
                  <select value={contractForm.partyType} onChange={(e) => setContractForm((f) => ({ ...f, partyType: e.target.value }))}>
                    <option value="client">A client</option>
                    <option value="employee">A team member</option>
                  </select>
                </Field>
                <Field label="Name">
                  <input value={contractForm.partyName} onChange={(e) => setContractForm((f) => ({ ...f, partyName: e.target.value }))} placeholder="Person or company name" />
                </Field>
              </div>
              <div className="field-row">
                <Field label="Role (optional)" hint="e.g. Designer">
                  <input value={contractForm.role} onChange={(e) => setContractForm((f) => ({ ...f, role: e.target.value }))} placeholder="Role" />
                </Field>
                <Field label="Start date (optional)">
                  <input type="date" className="neutral-input" value={contractForm.startDate} onChange={(e) => setContractForm((f) => ({ ...f, startDate: e.target.value }))} />
                </Field>
                <Field label="End date (optional)">
                  <input type="date" className="neutral-input" value={contractForm.endDate} onChange={(e) => setContractForm((f) => ({ ...f, endDate: e.target.value }))} />
                </Field>
              </div>

              <label className="repeat-label">Scope of work</label>
              {contractForm.items.map((it, i) => (
                <div className="repeat-item" key={i}>
                  <input value={it.label} onChange={(e) => updateContractItem(i, 'label', e.target.value)} placeholder="What will be done (e.g. Logo design)" />
                  <input className="neutral-input" style={{ flex: 'none', width: 90 }} value={it.quantity} onChange={(e) => updateContractItem(i, 'quantity', e.target.value)} placeholder="Qty" />
                  <input className="neutral-input" style={{ flex: 'none', width: 110 }} value={it.amount} onChange={(e) => updateContractItem(i, 'amount', e.target.value)} placeholder="Amount" />
                  <button type="button" className="repeat-remove" onClick={() => removeContractItem(i)} disabled={contractForm.items.length <= 1}>✕</button>
                </div>
              ))}
              <button type="button" className="repeat-add" onClick={addContractItem}>+ Add item</button>

              <div className="field-row" style={{ marginTop: 16 }}>
                <Field label="Currency">
                  <input className="neutral-input" value={contractForm.currency} onChange={(e) => setContractForm((f) => ({ ...f, currency: e.target.value }))} placeholder="LE" />
                </Field>
                <div className="field" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                  <div className="invoice-totals-preview" style={{ marginTop: 0 }}>
                    <span>Total <b>{formatAmount(contractTotal(contractForm))} {contractForm.currency}</b></span>
                  </div>
                </div>
              </div>

              <Field label="Terms & details" hint="one point per line">
                <textarea
                  className="items-textarea"
                  rows={7}
                  value={contractForm.terms}
                  onChange={(e) => setContractForm((f) => ({ ...f, terms: e.target.value }))}
                  placeholder={'Write the agreement details here, e.g.\nRevisions: up to 3 rounds per deliverable.\nPayment is made monthly within 5 days of month end.\nAll source files remain the property of KEDA.'}
                />
              </Field>
              <Field label="Notes (optional)">
                <textarea value={contractForm.notes} onChange={(e) => setContractForm((f) => ({ ...f, notes: e.target.value }))} placeholder="Anything else worth noting" />
              </Field>

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setContractModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Save contract</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {userModalOpen && (
        <div className="modal-overlay open">
          <div className="modal-box">
            <h3>{editingUserId ? 'Edit User' : 'Add User'}</h3>
            <form onSubmit={saveUser}>
              <Field label="Username">
                <input value={userForm.username} onChange={(e) => setUserForm((f) => ({ ...f, username: e.target.value }))} placeholder="Username" autoComplete="off" />
              </Field>
              <Field label={editingUserId ? 'New password (optional)' : 'Password'} hint={editingUserId ? 'leave blank to keep their current password' : 'at least 8 characters'}>
                <input type="password" value={userForm.password} onChange={(e) => setUserForm((f) => ({ ...f, password: e.target.value }))} placeholder="••••••••" autoComplete="new-password" />
              </Field>
              <label className="repeat-label">Can access</label>
              <div className="permissions-grid">
                {PERMISSIONS.map((key) => (
                  <label className="permission-check" key={key}>
                    <input type="checkbox" checked={userForm.permissions[key]} onChange={() => toggleUserPermission(key)} />
                    {PERMISSION_LABELS[key]}
                  </label>
                ))}
              </div>
              {userFormError && <p className="field-hint" style={{ color: 'var(--red)', marginTop: 14 }}>{userFormError}</p>}
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setUserModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Save user</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

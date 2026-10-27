// The CRM's vocabulary, shared by the API (which normalises what it stores
// against it) and the admin (which draws it). Plain data only, so both sides
// can import it.

// The pipeline, left to right. 'won' and 'lost' are the two ways out of it.
export const LEAD_STAGES = [
  { key: 'new', label: 'New', color: 'var(--violet)' },
  { key: 'contacted', label: 'Contacted', color: 'var(--cobalt)' },
  { key: 'meeting', label: 'Meeting', color: 'var(--aqua)' },
  { key: 'proposal', label: 'Proposal sent', color: 'var(--tangerine)' },
  { key: 'won', label: 'Won', color: 'var(--acid)' },
  { key: 'lost', label: 'Lost', color: 'var(--edge-2)' },
];
export const OPEN_STAGES = ['new', 'contacted', 'meeting', 'proposal'];

export const LEAD_SOURCES = [
  { key: 'website', label: 'Website form' },
  { key: 'whatsapp', label: 'WhatsApp' },
  { key: 'instagram', label: 'Instagram' },
  { key: 'facebook', label: 'Facebook' },
  { key: 'referral', label: 'Referral' },
  { key: 'other', label: 'Other' },
];

export const LEAD_SERVICES = ['Branding', 'Social Media', 'Motion', 'Video', 'Photography', 'Campaigns', 'Website', 'Other'];

const has = (list, key) => list.some((x) => x.key === key);
const text = (v, max) => (typeof v === 'string' || typeof v === 'number' ? String(v).trim().slice(0, max) : '');
const isoDate = (v) => (/^\d{4}-\d{2}-\d{2}$/.test(text(v, 10)) ? text(v, 10) : '');

// One note on a lead's timeline. Notes are only ever appended through the
// API (see app/api/leads/[id]/route.js), so a stored one is kept as it is.
export function normalizeNote(input = {}) {
  return {
    id: text(input.id, 40),
    at: text(input.at, 40) || new Date().toISOString(),
    by: text(input.by, 60),
    kind: ['note', 'stage', 'system'].includes(input.kind) ? input.kind : 'note',
    text: text(input.text, 2000),
  };
}

// Everything the API stores goes through here, so a record is always
// complete and never carries fields it doesn't know about.
export function normalizeLead(input = {}, existing = {}) {
  const pick = (key, fallback) => (input[key] !== undefined ? input[key] : existing[key] ?? fallback);
  const stage = pick('stage', 'new');
  const source = pick('source', 'other');
  const value = Number(String(pick('value', '')).replace(/[^0-9.]/g, ''));
  return {
    name: text(pick('name', ''), 120),
    company: text(pick('company', ''), 120),
    email: text(pick('email', ''), 160),
    phone: text(pick('phone', ''), 40),
    source: has(LEAD_SOURCES, source) ? source : 'other',
    service: text(pick('service', ''), 60),
    value: Number.isFinite(value) && value > 0 ? Math.round(value) : 0,
    currency: text(pick('currency', 'LE'), 8) || 'LE',
    stage: has(LEAD_STAGES, stage) ? stage : 'new',
    followUp: isoDate(pick('followUp', '')),
    clientId: text(pick('clientId', ''), 64),
    messageId: text(pick('messageId', ''), 64),
  };
}

export const stageOf = (key) => LEAD_STAGES.find((s) => s.key === key) || LEAD_STAGES[0];
export const sourceLabel = (key) => (LEAD_SOURCES.find((s) => s.key === key) || LEAD_SOURCES[LEAD_SOURCES.length - 1]).label;

// A lead built from a contact-form message, so the two never drift apart.
export function leadFromMessage(m) {
  return {
    ...normalizeLead({ name: m.name, email: m.email, phone: m.phone, source: 'website', messageId: m.id }),
    notes: [normalizeNote({ id: `m-${m.id}`, at: m.received, kind: 'system', text: m.message ? `Message from the website: ${m.message}` : 'Sent the contact form.' })],
  };
}

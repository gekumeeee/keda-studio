// Abuse protection for the public contact endpoint (app/api/messages POST).
//
// That route has to stay open — it's how visitors reach the studio — but
// open meant genuinely unlimited: no length cap, no rate limit, and every
// accepted submission is a write to the Blob store. A bot looping on it
// would have burned through the same free-tier quota that took the site
// down in August, so this is as much about protecting the store as about
// keeping junk out of the inbox.
//
// Everything here is in-memory and dependency-free on purpose. A Blob- or
// KV-backed counter would be more accurate across instances, but writing to
// Blob to protect Blob defeats the point, and a paid KV isn't on the table.

// Caps are generous for a real enquiry and still bound what a single
// submission can cost in storage — 4KB of message rather than 10MB.
export const LIMITS = {
  name: 120,
  email: 200,
  phone: 40,
  message: 4000,
};

// Deliberately loose: the point is to reject "not an email at all", not to
// adjudicate the RFC. Over-strict patterns reject valid addresses, and a
// rejected lead costs more than a junk one.
const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Egyptian mobile networks put a lot of users behind shared (CGNAT)
// addresses, so several genuine visitors can arrive on one IP. The window
// is sized to stop a bot (which sends hundreds) while leaving room for
// that — plus the odd person who submits twice because they forgot
// something.
const RATE_LIMIT = { max: 5, windowMs: 10 * 60 * 1000 };

// ip -> array of submission timestamps. Per-instance, so it catches a burst
// against a warm function rather than enforcing a global quota; combined
// with the honeypot that covers the realistic case.
const hits = new Map();

function prune(now) {
  for (const [ip, times] of hits) {
    const fresh = times.filter((t) => now - t < RATE_LIMIT.windowMs);
    if (fresh.length) hits.set(ip, fresh);
    else hits.delete(ip);
  }
}

// Called once per submission. Returns true when the caller is over the
// limit. Pruning on every call keeps the map from growing without bound —
// there's no cleanup timer in a serverless function to rely on.
export function isRateLimited(ip) {
  if (!ip) return false;
  const now = Date.now();
  prune(now);
  const times = hits.get(ip) || [];
  if (times.length >= RATE_LIMIT.max) return true;
  times.push(now);
  hits.set(ip, times);
  return false;
}

export function clientIp(request) {
  // x-forwarded-for is a comma-separated chain; the first entry is the
  // original client as far as Vercel's proxy is concerned.
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return request.headers.get('x-real-ip') || '';
}

// The honeypot is a field styled off-screen and hidden from assistive tech
// (see components/ContactForm.js) — a person never sees it, so anything
// that fills it is automated.
export function isBot(body) {
  return Boolean(body.website && String(body.website).trim());
}

// Returns { error } with a ready message, or { data } with trimmed,
// length-capped values.
export function validateMessage(body) {
  const name = String(body.name || '').trim();
  const email = String(body.email || '').trim();
  const message = String(body.message || '').trim();
  const phone = String(body.phone || '').trim();

  if (!name || !email || !message) {
    return { error: 'Name, email and message are required' };
  }
  if (!EMAIL_SHAPE.test(email)) {
    return { error: 'That email address doesn’t look right' };
  }
  for (const [field, value] of [['name', name], ['email', email], ['phone', phone], ['message', message]]) {
    if (value.length > LIMITS[field]) {
      return { error: `That ${field} is too long (max ${LIMITS[field]} characters)` };
    }
  }

  return { data: { name, email, phone, message } };
}

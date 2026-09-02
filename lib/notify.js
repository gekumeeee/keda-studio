// Email notification for new contact-form messages.
//
// Without this, a submitted message only ever lands in the Blob store and
// sits there until someone happens to open /admin — which for an agency
// means a real lead can go unseen for days. This sends it straight to the
// inbox instead.
//
// Deliberately a plain fetch() against Resend's REST API rather than the
// `resend` npm package: it's one HTTP POST, and this project's whole shape
// (scrypt instead of bcrypt, JSON instead of Prisma) is to avoid a
// dependency where a few lines do the job.
//
// Setup is two env vars on Vercel, both optional:
//   RESEND_API_KEY       - from resend.com; without it this no-ops entirely
//                          and the site behaves exactly as it did before.
//   CONTACT_NOTIFY_EMAIL - where to send. Falls back to the contactEmail
//                          set in the admin's Settings tab.
//   CONTACT_FROM_EMAIL   - optional sender override. Defaults to Resend's
//                          onboarding@resend.dev, which works with no DNS
//                          setup at all but can only deliver to the address
//                          that owns the Resend account. Once the domain is
//                          verified on Resend, set this to something like
//                          noreply@kedaagency.com and mail can go anywhere.

const RESEND_ENDPOINT = 'https://api.resend.com/emails';
const DEFAULT_FROM = 'KEDA Website <onboarding@resend.dev>';
// A hung request must never hold up the visitor's form submission, so the
// send gets its own deadline well under any platform function timeout.
const SEND_TIMEOUT_MS = 6000;

const METHOD_LABELS = {
  whatsapp: 'WhatsApp',
  email: 'Email',
  call: 'Phone call',
};

// Message fields are visitor-supplied and go straight into an HTML email —
// escape them rather than trusting them.
function esc(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildHtml(message) {
  const rows = [
    ['Name', esc(message.name)],
    ['Email', `<a href="mailto:${esc(message.email)}">${esc(message.email)}</a>`],
    message.phone ? ['Phone', esc(message.phone)] : null,
    ['Prefers', esc(METHOD_LABELS[message.contactMethod] || message.contactMethod)],
  ].filter(Boolean);

  return `
    <div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#0D0D0D;">
      <p style="margin:0 0 4px;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#8a8a8a;">New enquiry — kedaagency.com</p>
      <h1 style="margin:0 0 20px;font-size:22px;">${esc(message.name)} got in touch</h1>
      <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:20px;">
        ${rows
          .map(
            ([label, value]) => `
          <tr>
            <td style="padding:8px 12px 8px 0;color:#8a8a8a;white-space:nowrap;vertical-align:top;">${label}</td>
            <td style="padding:8px 0;">${value}</td>
          </tr>`
          )
          .join('')}
      </table>
      <div style="padding:16px;background:#F5F3EE;border-radius:12px;font-size:15px;line-height:1.6;white-space:pre-wrap;">${esc(message.message)}</div>
      <p style="margin:24px 0 0;font-size:13px;color:#8a8a8a;">
        Reply to this email to answer ${esc(message.name)} directly, or open the
        <a href="https://www.kedaagency.com/admin" style="color:#0D0D0D;">admin panel</a>.
      </p>
    </div>`;
}

// Returns a short status string instead of throwing — the caller treats
// notification as best-effort and must never fail a save because of it.
export async function notifyNewMessage(message, settings = {}) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return 'skipped: no RESEND_API_KEY';

  const to = process.env.CONTACT_NOTIFY_EMAIL || settings.contactEmail;
  if (!to) return 'skipped: no recipient configured';

  const res = await fetch(RESEND_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: process.env.CONTACT_FROM_EMAIL || DEFAULT_FROM,
      to: [to],
      // Hitting Reply in the mail client answers the visitor, not Resend.
      reply_to: message.email,
      subject: `New enquiry from ${message.name}`,
      html: buildHtml(message),
    }),
    signal: AbortSignal.timeout(SEND_TIMEOUT_MS),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`Resend responded ${res.status}: ${detail.slice(0, 200)}`);
  }
  return 'sent';
}

'use client';

import { useLayoutEffect, useRef } from 'react';
import { POST_STATUSES, POST_PLATFORMS, POST_FORMATS, CONTENT_TYPES, statusOf } from '@/lib/contentPosts';

// One post's brief, laid out the way the team already works: the meta line
// on top (when, what, where), the design copy and the caption as the main
// sheet, and the designer's direction beside it. The same component is the
// editor (editable) and the picture that gets exported and sent to the
// designer (not editable) — so what the writer sees is what the designer
// gets. Labels are bilingual; every typed field sets its own direction, so an
// Arabic caption reads right to left inside an English frame.

// A textarea that grows with its text instead of scrolling inside itself.
function GrowingTextarea({ value, onChange, className, placeholder, minRows = 1 }) {
  const ref = useRef(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);
  return (
    <textarea
      ref={ref}
      className={className}
      value={value}
      rows={minRows}
      dir="auto"
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

// Editable text in the editor, plain text in the export.
function Field({ editable, value, onChange, className, placeholder, multiline = false, minRows }) {
  if (editable) {
    return multiline ? (
      <GrowingTextarea className={className} value={value} onChange={onChange} placeholder={placeholder} minRows={minRows} />
    ) : (
      <input className={className} value={value} dir="auto" placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    );
  }
  if (!String(value || '').trim()) return <div className={`${className} is-empty`}>—</div>;
  // One element per line, each finding its own direction — the same as the
  // editor's textarea does line by line. As a single block, a line with no
  // letters in it (a phone number) inherited the caption's right-to-left
  // direction and its digit groups came out swapped.
  return (
    <div className={className}>
      {String(value).split('\n').map((line, i) => (
        <div key={i} dir="auto">{line || '\u00a0'}</div>
      ))}
    </div>
  );
}

function fmtDate(iso) {
  if (!iso) return '';
  const d = new Date(`${iso}T00:00:00`);
  return isNaN(d) ? iso : d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}
function fmtTime(hhmm) {
  if (!hhmm) return '';
  const [h, m] = hhmm.split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')} ${suffix}`;
}

export default function PostBrief({ post, clients = [], editable = false, compact = false, onChange }) {
  const set = (key) => (value) => onChange?.({ ...post, [key]: value });
  // the editor always shows every block; the exported picture only the
  // ones that have something in them
  const show = (key) => editable || String(post[key] || '').trim() !== '';
  const status = statusOf(post.status);
  const client = clients.find((c) => c.id === post.clientId);

  function setClientName(name) {
    const match = clients.find((c) => c.name.trim().toLowerCase() === name.trim().toLowerCase());
    onChange?.({ ...post, clientName: name, clientId: match ? match.id : '' });
  }
  function togglePlatform(key) {
    const has = post.platforms.includes(key);
    onChange?.({ ...post, platforms: has ? post.platforms.filter((p) => p !== key) : [...post.platforms, key] });
  }

  return (
    <div className={`brief ${editable ? 'is-editing' : 'is-export'}${compact ? ' is-compact' : ''}`} dir="ltr">
      <div className="brief-top">
        <div className="brief-meta">
          <div className="brief-meta-item">
            <span className="brief-meta-label">Publish <i>تاريخ النشر</i></span>
            {editable ? (
              <div className="brief-meta-row">
                <input type="date" value={post.date} onChange={(e) => set('date')(e.target.value)} />
                <input type="time" value={post.time} onChange={(e) => set('time')(e.target.value)} />
              </div>
            ) : (
              <span className="brief-meta-value">{[fmtDate(post.date), fmtTime(post.time)].filter(Boolean).join(' · ') || '—'}</span>
            )}
          </div>

          <div className="brief-meta-item">
            <span className="brief-meta-label">Content type <i>نوع المحتوى</i></span>
            {editable ? (
              <>
                <input list="brief-content-types" value={post.contentType} onChange={(e) => set('contentType')(e.target.value)} />
                <datalist id="brief-content-types">
                  {CONTENT_TYPES.map((t) => <option key={t} value={t} />)}
                </datalist>
              </>
            ) : (
              <span className="brief-meta-value">{post.contentType || '—'}</span>
            )}
          </div>

          <div className="brief-meta-item">
            <span className="brief-meta-label">Where <i>مكان النشر</i></span>
            {editable ? (
              <div className="brief-meta-row">
                <div className="brief-platforms">
                  {POST_PLATFORMS.map((p) => (
                    <button
                      type="button"
                      key={p.key}
                      className={post.platforms.includes(p.key) ? 'is-on' : ''}
                      aria-pressed={post.platforms.includes(p.key)}
                      onClick={() => togglePlatform(p.key)}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
                <select value={post.format} onChange={(e) => set('format')(e.target.value)} aria-label="Format">
                  {POST_FORMATS.map((f) => <option key={f.key} value={f.key}>{f.label}</option>)}
                </select>
              </div>
            ) : (
              <span className="brief-meta-value">
                {[
                  post.platforms.map((k) => POST_PLATFORMS.find((p) => p.key === k)?.label).filter(Boolean).join(' + '),
                  `#${POST_FORMATS.find((f) => f.key === post.format)?.label || 'Post'}`,
                ].filter(Boolean).join(' ')}
              </span>
            )}
          </div>

          <div className="brief-meta-item">
            <span className="brief-meta-label">Status <i>الحالة</i></span>
            {editable ? (
              <select value={post.status} onChange={(e) => set('status')(e.target.value)} className={`brief-status is-${post.status}`}>
                {POST_STATUSES.map((s) => <option key={s.key} value={s.key}>{s.label} — {s.ar}</option>)}
              </select>
            ) : (
              <span className={`brief-status-pill is-${post.status}`}>{status.label} · {status.ar}</span>
            )}
          </div>
        </div>

        <div className="brief-brand">
          {client?.logo ? <img className="brief-client-logo" src={client.logo} alt="" /> : null}
          <div className="brief-client">
            <span className="brief-meta-label">Client <i>العميل</i></span>
            {editable ? (
              <>
                <input list="brief-clients" value={post.clientName} placeholder="Pick or type a client" onChange={(e) => setClientName(e.target.value)} />
                <datalist id="brief-clients">
                  {clients.map((c) => <option key={c.id} value={c.name} />)}
                </datalist>
              </>
            ) : (
              <span className="brief-meta-value" dir="auto">{post.clientName || '—'}</span>
            )}
          </div>
          <img className="brief-keda" src="/brand/keda-logomark-white.svg" alt="KEDA" />
        </div>
      </div>

      <div className="brief-body">
        {show('direction') || show('reference') ? (
          <aside className="brief-direction">
            <div className="brief-clip" aria-hidden="true" />
            <div className="brief-direction-card">
              <div className="brief-label is-violet">Design direction <i>دايركشن التصميم</i></div>
              {show('direction') ? (
                <Field
                  editable={editable}
                  multiline
                  minRows={6}
                  className="brief-direction-text"
                  value={post.direction}
                  onChange={set('direction')}
                  placeholder="What the design should do: layout, mood, what goes in it, dates to show…"
                />
            ) : null}
            {show('reference') ? (
              <>
                <div className="brief-label is-small">Reference <i>ريفرنس</i></div>
                <Field
                  editable={editable}
                  className="brief-reference"
                  value={post.reference}
                  onChange={set('reference')}
                  placeholder="https://…"
                />
              </>
            ) : null}
          </div>
        </aside>
        ) : null}

        <main className="brief-main">
          {show('headline') ? (
            <div className="brief-headline-bar">
              <Field
                editable={editable}
                multiline
                className="brief-headline"
                value={post.headline}
                onChange={set('headline')}
                placeholder="Headline on the design — العنوان على التصميم"
              />
            </div>
          ) : null}
          {show('subText') ? (
            <Field
              editable={editable}
              multiline
              className="brief-sub"
              value={post.subText}
              onChange={set('subText')}
              placeholder="Sub text (smaller line) — النص الصغير"
            />
          ) : null}
          {show('caption') ? (
            <div className="brief-caption-box">
              <span className="brief-label is-magenta">Caption <i>الكابشن</i></span>
              <Field
                editable={editable}
                multiline
                minRows={8}
                className="brief-caption"
                value={post.caption}
                onChange={set('caption')}
                placeholder="The post caption — hashtags, contact number, everything that gets posted with it."
              />
            </div>
          ) : null}
        </main>
      </div>
    </div>
  );
}

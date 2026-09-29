'use client';

import { useEffect, useMemo, useState } from 'react';
import PostBrief from './PostBrief';
import { POST_STATUSES, POST_PLATFORMS, POST_FORMATS, statusOf } from '@/lib/contentPosts';

// The content calendar: a month of planned posts per client. The writer fills
// in each post's brief (components/admin/PostBrief.js); the brief exports as
// an image to hand to the designer. Loads and saves its own data, like the
// Reports tab, so someone given only the "content" permission can use it.

const WEEKDAYS = ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
const pad = (n) => String(n).padStart(2, '0');
const dayKey = (y, m, d) => `${y}-${pad(m + 1)}-${pad(d)}`;
const todayKey = () => {
  const t = new Date();
  return dayKey(t.getFullYear(), t.getMonth(), t.getDate());
};

function emptyPost(date, client) {
  return {
    id: null,
    clientId: client?.id || '',
    clientName: client?.name || '',
    date,
    time: '',
    platforms: ['facebook', 'instagram'],
    format: 'post',
    contentType: 'Social Design',
    headline: '',
    subText: '',
    caption: '',
    direction: '',
    reference: '',
    status: 'idea',
  };
}

// Everything the form edits, for "has anything changed since it was opened".
const snapshot = (p) => JSON.stringify({ ...p, id: undefined, updated: undefined, createdAt: undefined, createdBy: undefined });

export default function ContentTab() {
  const [posts, setPosts] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [month, setMonth] = useState(() => {
    const t = new Date();
    return { y: t.getFullYear(), m: t.getMonth() };
  });
  const [clientFilter, setClientFilter] = useState('all');
  const [draft, setDraft] = useState(null);
  const [opened, setOpened] = useState('');
  const [busy, setBusy] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    let cancelled = false;
    fetch('/api/content')
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(`HTTP ${res.status}`))))
      .then((data) => {
        if (cancelled) return;
        setPosts(Array.isArray(data.posts) ? data.posts : []);
        setClients(Array.isArray(data.clients) ? data.clients : []);
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setLoadError('The content calendar couldn’t be loaded — refresh to try again.');
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const dirty = draft && snapshot(draft) !== opened;

  function open(post) {
    setDraft(post);
    setOpened(snapshot(post));
    setNotice('');
    window.scrollTo({ top: 0 });
  }
  function close() {
    if (dirty && !confirm('Close without saving? Your changes to this post will be lost.')) return;
    setDraft(null);
  }

  // Escape closes the editor, same as the other admin forms
  useEffect(() => {
    if (!draft) return undefined;
    function onKey(e) {
      if (e.key === 'Escape') close();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  function matchesFilter(p) {
    if (clientFilter === 'all') return true;
    if (clientFilter === 'none') return !p.clientId && !p.clientName;
    return p.clientId === clientFilter;
  }

  const monthPrefix = `${month.y}-${pad(month.m + 1)}`;
  const monthPosts = useMemo(
    () => posts
      .filter((p) => p.date?.startsWith(monthPrefix) && matchesFilter(p))
      .sort((a, b) => (a.date + (a.time || '99:99')).localeCompare(b.date + (b.time || '99:99'))),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [posts, monthPrefix, clientFilter]
  );
  const unscheduled = posts.filter((p) => !p.date && matchesFilter(p));

  // The month grid, weeks starting on Saturday
  const cells = useMemo(() => {
    const first = new Date(month.y, month.m, 1);
    const lead = (first.getDay() + 1) % 7;
    const days = new Date(month.y, month.m + 1, 0).getDate();
    const list = [];
    for (let i = 0; i < lead; i++) list.push(null);
    for (let d = 1; d <= days; d++) list.push(dayKey(month.y, month.m, d));
    while (list.length % 7) list.push(null);
    return list;
  }, [month]);

  const byDay = useMemo(() => {
    const map = {};
    for (const p of monthPosts) (map[p.date] ||= []).push(p);
    return map;
  }, [monthPosts]);

  const monthLabel = new Date(month.y, month.m, 1).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
  const shiftMonth = (delta) => setMonth(({ y, m }) => {
    const d = new Date(y, m + delta, 1);
    return { y: d.getFullYear(), m: d.getMonth() };
  });
  const filterClient = clients.find((c) => c.id === clientFilter) || null;

  async function save() {
    setBusy('save');
    setNotice('');
    try {
      const res = await fetch(draft.id ? `/api/content/${draft.id}` : '/api/content', {
        method: draft.id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draft),
      });
      if (!res.ok) throw new Error();
      const saved = await res.json();
      setPosts((prev) => (draft.id ? prev.map((p) => (p.id === saved.id ? saved : p)) : [...prev, saved]));
      setDraft(saved);
      setOpened(snapshot(saved));
      setNotice(''); // the Save button itself turns to "Saved ✓"
    } catch {
      setNotice('Saving failed — nothing was lost here; try again.');
    } finally {
      setBusy('');
    }
  }

  async function remove() {
    if (!draft.id || !confirm('Delete this post from the calendar? This cannot be undone.')) return;
    setBusy('delete');
    const res = await fetch(`/api/content/${draft.id}`, { method: 'DELETE' });
    setBusy('');
    if (!res.ok) {
      setNotice('Deleting failed — the post is still there. Try again.');
      return;
    }
    setPosts((prev) => prev.filter((p) => p.id !== draft.id));
    setDraft(null);
  }

  function duplicate() {
    open({ ...draft, id: null, status: 'idea', createdAt: undefined, updated: undefined, createdBy: undefined });
    setNotice('A copy — change the date and save it as a new post.');
  }

  async function copyCaption() {
    try {
      await navigator.clipboard.writeText(draft.caption || '');
      setNotice('Caption copied ✓');
    } catch {
      setNotice('Couldn’t copy — select the caption and copy it by hand.');
    }
  }

  async function exportImage() {
    setBusy('export');
    setNotice('');
    try {
      const { captureOffscreen, dataUrlToBlob, downloadBlob, safeFileName, scaleToFit } = await import('@/lib/sheetCapture');
      // The brief as it looks in the editor, in a picture that's always
      // landscape or square — never a long strip either way. It starts
      // 1100px wide; if the text makes it taller than it is wide, it widens
      // (so the caption wraps into fewer lines) until it's square, and only
      // past 1700px does it shrink to fit the square. A short brief keeps
      // at least a 4:3 shape, with the paper running to the bottom.
      const dataUrl = await captureOffscreen(
        <div className="brief-export">
          <div className="brief-export-fit"><PostBrief post={draft} clients={clients} /></div>
        </div>,
        { selector: '.brief-export', format: 'png', pixelRatio: 1.5, prepare: fitBriefFrame }
      );
      const name = [draft.clientName, draft.date, draft.format].filter(Boolean).join(' ');
      downloadBlob(await dataUrlToBlob(dataUrl), `brief-${safeFileName(name, 'post')}.png`);
    } catch (err) {
      console.error('[content] export failed', err);
      setNotice('The image couldn’t be made — try again.');
    } finally {
      setBusy('');
    }
  }

  // An open post takes the calendar's place in the page — the sidebar and the
  // section heading stay where they are, and "← Calendar" goes back.
  if (draft) {
    const status = statusOf(draft.status);
    const when = draft.date
      ? new Date(`${draft.date}T00:00:00`).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
      : 'No date yet';
    return (
      <section className="tab-panel active brief-page">
        <div className="brief-actions">
          <div className="brief-actions-left">
            <button type="button" className="folder-back brief-back" onClick={close}>← Calendar</button>
            <div className="brief-crumb">
              <b>{draft.id ? when : 'New post'}</b>
              {draft.clientName ? <span dir="auto">{draft.clientName}</span> : null}
              <span className={`brief-status-pill is-${draft.status}`}>{status.label}</span>
              {dirty ? <span className="brief-unsaved">Unsaved changes</span> : null}
            </div>
          </div>
          <div className="brief-actions-right">
            {notice ? <span className="brief-notice">{notice}</span> : null}
            <button type="button" className="panel-head-link" onClick={copyCaption} disabled={!draft.caption}>Copy caption</button>
            <button type="button" className="panel-head-link" onClick={exportImage} disabled={busy === 'export'}>
              {busy === 'export' ? 'Making image…' : 'Export image'}
            </button>
            {draft.id ? <button type="button" className="panel-head-link" onClick={duplicate}>Duplicate</button> : null}
            {draft.id ? <button type="button" className="danger-btn" onClick={remove} disabled={busy === 'delete'}>Delete</button> : null}
            <button type="button" className="add-btn" onClick={save} disabled={busy === 'save' || (!dirty && !!draft.id)}>
              {busy === 'save' ? 'Saving…' : draft.id ? (dirty ? 'Save changes' : 'Saved ✓') : 'Save post'}
            </button>
          </div>
        </div>
        <PostBrief post={draft} clients={clients} editable onChange={setDraft} />
        {/* on a phone the toolbar scrolls away with the page; this keeps Save
            in reach whenever there's something to save (hidden on desktop,
            where the toolbar itself stays pinned) */}
        {dirty ? (
          <button type="button" className="add-btn brief-save-float" onClick={save} disabled={busy === 'save'}>
            {busy === 'save' ? 'Saving…' : 'Save changes'}
          </button>
        ) : null}
      </section>
    );
  }

  if (loading) return <section className="tab-panel active"><div className="panel"><div className="empty">Loading the calendar…</div></div></section>;
  if (loadError) return <section className="tab-panel active"><div className="panel"><div className="empty">{loadError}</div></div></section>;

  return (
    <section className="tab-panel active">
      <div className="panel content-panel">
        <div className="content-toolbar">
          <div className="content-month">
            <button type="button" className="content-nav" onClick={() => shiftMonth(-1)} aria-label="Previous month">‹</button>
            <h3>{monthLabel}</h3>
            <button type="button" className="content-nav" onClick={() => shiftMonth(1)} aria-label="Next month">›</button>
            <button type="button" className="panel-head-link" onClick={() => {
              const t = new Date();
              setMonth({ y: t.getFullYear(), m: t.getMonth() });
            }}>Today</button>
          </div>
          <div className="content-filters">
            <select value={clientFilter} onChange={(e) => setClientFilter(e.target.value)} aria-label="Client">
              <option value="all">All clients</option>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              <option value="none">No client</option>
            </select>
            <button type="button" className="add-btn" onClick={() => open(emptyPost(todayKey().startsWith(monthPrefix) ? todayKey() : `${monthPrefix}-01`, filterClient))}>
              + New post
            </button>
          </div>
        </div>

        <div className="content-legend">
          {POST_STATUSES.map((s) => <span key={s.key}><i className={`status-dot is-${s.key}`} />{s.label}</span>)}
        </div>

        <div className="content-calendar" role="grid" aria-label={monthLabel}>
          {WEEKDAYS.map((d) => <div className="content-weekday" key={d} role="columnheader">{d}</div>)}
          {cells.map((key, i) => {
            if (!key) return <div className="content-day is-blank" key={`b${i}`} />;
            const items = byDay[key] || [];
            return (
              <div className={`content-day${key === todayKey() ? ' is-today' : ''}`} key={key} role="gridcell">
                <button type="button" className="content-day-add" onClick={() => open(emptyPost(key, filterClient))} aria-label={`New post on ${key}`}>
                  <span className="content-day-num">{Number(key.slice(8))}</span>
                  <span className="content-day-plus" aria-hidden="true">+</span>
                </button>
                {items.map((p) => (
                  <button type="button" key={p.id} className={`content-chip is-${p.status}`} onClick={() => open(p)} title={p.headline || p.caption || ''}>
                    <i className={`status-dot is-${p.status}`} />
                    <span>{p.time ? `${p.time} ` : ''}{p.clientName || 'Post'}</span>
                  </button>
                ))}
              </div>
            );
          })}
        </div>

        <div className="content-list">
          <h4>This month <span>{monthPosts.length} post{monthPosts.length === 1 ? '' : 's'}</span></h4>
          {monthPosts.length === 0 ? (
            <div className="empty">Nothing planned for {monthLabel} yet — pick a day above to add a post.</div>
          ) : (
            monthPosts.map((p) => <PostRow key={p.id} post={p} onOpen={() => open(p)} />)
          )}
          {unscheduled.length ? (
            <>
              <h4>No date yet <span>{unscheduled.length}</span></h4>
              {unscheduled.map((p) => <PostRow key={p.id} post={p} onOpen={() => open(p)} />)}
            </>
          ) : null}
        </div>
      </div>

    </section>
  );
}

// Sizes the export frame around the laid-out brief (see exportImage).
function fitBriefFrame(frame) {
  const fit = frame.querySelector('.brief-export-fit');
  const brief = fit.querySelector('.brief');
  let width = 0;
  let height = 0;
  for (let w = 1100; w <= 1700; w += 50) {
    fit.style.width = `${w}px`;
    const h = fit.getBoundingClientRect().height;
    if (h <= w) {
      width = w;
      height = Math.max(h, Math.round(w * 0.75));
      break;
    }
  }
  let scale = 1;
  if (!width) {
    // still taller than wide at the widest: shrink it into a square
    width = height = 1700;
    scale = scaleToFit(fit, width, height, 0.5);
  }
  brief.style.minHeight = `${height / scale}px`;
  frame.style.width = `${width}px`;
  frame.style.height = `${height}px`;
}

function PostRow({ post, onOpen }) {
  const status = statusOf(post.status);
  const date = post.date ? new Date(`${post.date}T00:00:00`) : null;
  return (
    <button type="button" className="content-row" onClick={onOpen}>
      <span className="content-row-date">
        {date ? <><b>{date.getDate()}</b>{date.toLocaleDateString('en-GB', { weekday: 'short' })}</> : '—'}
      </span>
      <span className="content-row-main">
        <span className="content-row-title" dir="auto">{post.headline || post.caption?.split('\n')[0] || 'Untitled post'}</span>
        <span className="content-row-meta">
          {[post.clientName, post.time, post.platforms.map((k) => POST_PLATFORMS.find((p) => p.key === k)?.label).filter(Boolean).join(' + '), POST_FORMATS.find((f) => f.key === post.format)?.label].filter(Boolean).join(' · ')}
        </span>
      </span>
      <span className={`brief-status-pill is-${post.status}`}>{status.label}</span>
    </button>
  );
}

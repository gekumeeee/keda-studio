'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import PostBrief from './PostBrief';
import { POST_STATUSES, POST_PLATFORMS, POST_FORMATS, statusOf } from '@/lib/contentPosts';

// The content plan: a month of planned posts per client. The writer fills in
// each post's brief (components/admin/PostBrief.js); the brief exports as an
// image to hand to the designer. It lives on its own page (/admin/content,
// opened from the admin's sidebar in a new browser tab) with a calendar for
// the big picture and a list for working through the posts, and it loads and
// saves its own data like the Reports tab, so someone given only the
// "content" permission can use it.

const WEEKDAYS = ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
const PLATFORM_SHORT = { facebook: 'FB', instagram: 'IG', tiktok: 'TT', linkedin: 'IN', x: 'X', youtube: 'YT' };
const MOBILE_QUERY = '(max-width: 760px)';
const MAX_CHIPS = 3;
const MAX_ZOOM = 2.5;
const ZOOM_STEP = 1.3;
const pad = (n) => String(n).padStart(2, '0');
const dayKey = (y, m, d) => `${y}-${pad(m + 1)}-${pad(d)}`;
const todayKey = () => {
  const t = new Date();
  return dayKey(t.getFullYear(), t.getMonth(), t.getDate());
};
const fromKey = (key) => new Date(`${key}T00:00:00`);
const isPhone = () => typeof window !== 'undefined' && window.matchMedia(MOBILE_QUERY).matches;
const postTitle = (p) => p.headline || p.caption?.split('\n')[0] || p.clientName || 'Untitled post';

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

export default function ContentTab({ username = '' }) {
  const [posts, setPosts] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [month, setMonth] = useState(() => {
    const t = new Date();
    return { y: t.getFullYear(), m: t.getMonth() };
  });
  // a phone starts on the list — a seven-column grid is too tight to work in
  const [view, setView] = useState(() => (isPhone() ? 'list' : 'month'));
  const [clientFilter, setClientFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedDay, setSelectedDay] = useState(null);
  const [draft, setDraft] = useState(null);
  const [opened, setOpened] = useState('');
  const [busy, setBusy] = useState('');
  const [notice, setNotice] = useState('');
  const dayPanel = useRef(null);
  // An open post is one history entry, so the phone's back button (or the
  // browser's) returns to the plan instead of leaving the page.
  const inHistory = useRef(false);
  const skipConfirm = useRef(false);

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
        setLoadError('The content plan couldn’t be loaded — refresh to try again.');
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
    if (!inHistory.current) {
      window.history.pushState({ contentPost: true }, '');
      inHistory.current = true;
    }
  }
  // Closing goes through history.back() so the entry open() added is removed;
  // the popstate handler below does the actual closing (and the unsaved check).
  function close(force = false) {
    skipConfirm.current = force;
    if (inHistory.current) window.history.back();
    else if (force || !dirty || confirm('Close without saving? Your changes to this post will be lost.')) setDraft(null);
  }

  // The listeners are added once and read the current state through a ref, so
  // a history event can never land in the gap while they're re-attached.
  const live = useRef({});
  useEffect(() => {
    live.current = { draft, dirty, close };
  });
  useEffect(() => {
    function onPop() {
      inHistory.current = false;
      const skip = skipConfirm.current;
      skipConfirm.current = false;
      const { draft: current, dirty: unsaved } = live.current;
      if (!current) return;
      if (!skip && unsaved && !confirm('Close without saving? Your changes to this post will be lost.')) {
        window.history.pushState({ contentPost: true }, '');
        inHistory.current = true;
        return;
      }
      setDraft(null);
    }
    function onKey(e) {
      if (e.key === 'Escape' && live.current.draft) live.current.close();
    }
    window.addEventListener('popstate', onPop);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('popstate', onPop);
      window.removeEventListener('keydown', onKey);
    };
  }, []);

  // an unsaved post survives a stray tab close or refresh only with a warning
  useEffect(() => {
    if (!dirty) return undefined;
    const warn = (e) => e.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  function matchesClient(p) {
    if (clientFilter === 'all') return true;
    if (clientFilter === 'none') return !p.clientId && !p.clientName;
    return p.clientId === clientFilter;
  }

  const monthPrefix = `${month.y}-${pad(month.m + 1)}`;
  const inMonth = useMemo(
    () => posts
      .filter((p) => p.date?.startsWith(monthPrefix) && matchesClient(p))
      .sort((a, b) => (a.date + (a.time || '99:99')).localeCompare(b.date + (b.time || '99:99'))),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [posts, monthPrefix, clientFilter]
  );
  const monthPosts = statusFilter === 'all' ? inMonth : inMonth.filter((p) => p.status === statusFilter);
  const unscheduled = posts.filter((p) => !p.date && matchesClient(p) && (statusFilter === 'all' || p.status === statusFilter));
  const statusCount = (key) => inMonth.filter((p) => p.status === key).length;

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
  const shiftMonth = (delta) => {
    setSelectedDay(null);
    setMonth(({ y, m }) => {
      const d = new Date(y, m + delta, 1);
      return { y: d.getFullYear(), m: d.getMonth() };
    });
  };
  const filterClient = clients.find((c) => c.id === clientFilter) || null;
  const newPostDate = todayKey().startsWith(monthPrefix) ? todayKey() : `${monthPrefix}-01`;

  // A day on the grid: a phone selects it (its posts show underneath), a
  // desktop starts a new post on it, as the "+" on the cell says.
  function pickDay(key) {
    if (isPhone()) {
      setSelectedDay(key);
      requestAnimationFrame(() => dayPanel.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }));
    } else {
      open(emptyPost(key, filterClient));
    }
  }
  function showDay(key) {
    setSelectedDay(key);
    requestAnimationFrame(() => dayPanel.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }));
  }

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
    if (!draft.id || !confirm('Delete this post from the plan? This cannot be undone.')) return;
    setBusy('delete');
    // a dropped connection used to throw out of here and leave the button
    // stuck on busy; treat it like any other failed delete
    const res = await fetch(`/api/content/${draft.id}`, { method: 'DELETE' }).catch(() => null);
    setBusy('');
    if (!res?.ok) {
      setNotice('Deleting failed — the post is still there. Try again.');
      return;
    }
    setPosts((prev) => prev.filter((p) => p.id !== draft.id));
    close(true);
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
        { selector: '.brief-export', format: 'png', pixelRatio: 1.5, prepare: (frame) => fitBriefFrame(frame, scaleToFit) }
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

  let body;
  if (draft) {
    // An open post takes the plan's place in the page; "← Plan" goes back.
    const status = statusOf(draft.status);
    const when = draft.date
      ? fromKey(draft.date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
      : 'No date yet';
    body = (
      <section className="brief-page">
        <div className="brief-actions">
          <div className="brief-actions-left">
            <button type="button" className="folder-back brief-back" onClick={() => close()}>← Plan</button>
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
  } else if (loading) {
    body = <div className="panel"><div className="empty">Loading the plan…</div></div>;
  } else if (loadError) {
    body = <div className="panel"><div className="empty">{loadError}</div></div>;
  } else {
    const dayPosts = selectedDay ? (byDay[selectedDay] || []) : [];
    // the list view's groups: one heading per day that has posts
    const groups = [];
    for (const p of monthPosts) {
      const last = groups[groups.length - 1];
      if (last && last.date === p.date) last.items.push(p);
      else groups.push({ date: p.date, items: [p] });
    }
    body = (
      <>
        <div className="cp-controls">
          <div className="cp-month">
            <button type="button" className="content-nav" onClick={() => shiftMonth(-1)} aria-label="Previous month">‹</button>
            <h2>{monthLabel}</h2>
            <button type="button" className="content-nav" onClick={() => shiftMonth(1)} aria-label="Next month">›</button>
            <button type="button" className="panel-head-link" onClick={() => {
              const t = new Date();
              setSelectedDay(null);
              setMonth({ y: t.getFullYear(), m: t.getMonth() });
            }}>Today</button>
          </div>
          <div className="cp-tools">
            <div className="cp-seg" role="group" aria-label="View">
              <button type="button" className={view === 'month' ? 'is-on' : ''} aria-pressed={view === 'month'} onClick={() => setView('month')}>Calendar</button>
              <button type="button" className={view === 'list' ? 'is-on' : ''} aria-pressed={view === 'list'} onClick={() => setView('list')}>List</button>
            </div>
            <select value={clientFilter} onChange={(e) => setClientFilter(e.target.value)} aria-label="Client">
              <option value="all">All clients</option>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              <option value="none">No client</option>
            </select>
            <button type="button" className="add-btn cp-new" onClick={() => open(emptyPost(newPostDate, filterClient))}>
              + New post
            </button>
          </div>
        </div>

        <div className="cp-status" role="group" aria-label="Status">
          <button type="button" className={`cp-status-chip${statusFilter === 'all' ? ' is-on' : ''}`} aria-pressed={statusFilter === 'all'} onClick={() => setStatusFilter('all')}>
            All <b>{inMonth.length}</b>
          </button>
          {POST_STATUSES.map((s) => (
            <button type="button" key={s.key} className={`cp-status-chip${statusFilter === s.key ? ' is-on' : ''}`} aria-pressed={statusFilter === s.key} onClick={() => setStatusFilter(statusFilter === s.key ? 'all' : s.key)}>
              <i className={`status-dot is-${s.key}`} />{s.label} <b>{statusCount(s.key)}</b>
            </button>
          ))}
        </div>

        {view === 'month' ? (
          <ZoomFrame key={monthPrefix}>
          <div className="content-calendar" role="grid" aria-label={monthLabel}>
            {WEEKDAYS.map((d) => <div className="content-weekday" key={d} role="columnheader">{d}</div>)}
            {cells.map((key, i) => {
              if (!key) return <div className="content-day is-blank" key={`b${i}`} />;
              const items = byDay[key] || [];
              return (
                <div className={`content-day${key === todayKey() ? ' is-today' : ''}${key === selectedDay ? ' is-selected' : ''}`} key={key} role="gridcell">
                  <button type="button" className="content-day-add" onClick={() => pickDay(key)} aria-label={`${items.length ? `${items.length} post${items.length === 1 ? '' : 's'} on` : 'New post on'} ${key}`}>
                    <span className="content-day-num">{Number(key.slice(8))}</span>
                    <span className="content-day-plus" aria-hidden="true">+</span>
                    {items.length ? (
                      <span className="content-dots" aria-hidden="true">
                        {items.slice(0, 4).map((p) => <i key={p.id} className={`status-dot is-${p.status}`} />)}
                      </span>
                    ) : null}
                  </button>
                  {items.slice(0, MAX_CHIPS).map((p) => (
                    <button type="button" key={p.id} className={`content-chip is-${p.status}`} onClick={() => open(p)} title={[postTitle(p), p.clientName].filter(Boolean).join(' — ')}>
                      <span className="content-chip-title" dir="auto">{p.time ? `${p.time} ` : ''}{postTitle(p)}</span>
                      {p.clientName && p.clientName !== postTitle(p) ? <span className="content-chip-client" dir="auto">{p.clientName}</span> : null}
                    </button>
                  ))}
                  {items.length > MAX_CHIPS ? (
                    <button type="button" className="content-more" onClick={() => showDay(key)}>+{items.length - MAX_CHIPS} more</button>
                  ) : null}
                </div>
              );
            })}
          </div>
          </ZoomFrame>
        ) : (
          <div className="content-list">
            {groups.length === 0 && unscheduled.length === 0 ? (
              <div className="empty">
                {statusFilter === 'all' ? `Nothing planned for ${monthLabel} yet.` : 'No posts with this status this month.'}
                <div><button type="button" className="add-btn" onClick={() => open(emptyPost(newPostDate, filterClient))}>+ Plan a post</button></div>
              </div>
            ) : null}
            {groups.map((g) => (
              <div className="content-group" key={g.date}>
                <h4 className={g.date === todayKey() ? 'is-today' : ''}>
                  {fromKey(g.date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' })}
                  {g.date === todayKey() ? <em>Today</em> : null}
                  <button type="button" className="content-group-add" onClick={() => open(emptyPost(g.date, filterClient))} aria-label={`New post on ${g.date}`}>+</button>
                </h4>
                {g.items.map((p) => <PostRow key={p.id} post={p} onOpen={() => open(p)} />)}
              </div>
            ))}
            {unscheduled.length ? (
              <div className="content-group">
                <h4>No date yet <span>{unscheduled.length}</span></h4>
                {unscheduled.map((p) => <PostRow key={p.id} post={p} onOpen={() => open(p)} />)}
              </div>
            ) : null}
          </div>
        )}

        {view === 'month' && selectedDay ? (
          <div className="content-day-panel" ref={dayPanel}>
            <h4>
              {fromKey(selectedDay).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
              <span>{dayPosts.length} post{dayPosts.length === 1 ? '' : 's'}</span>
              <button type="button" className="panel-head-link" onClick={() => setSelectedDay(null)}>Close</button>
            </h4>
            {dayPosts.length === 0 ? <div className="empty">Nothing planned for this day.</div> : dayPosts.map((p) => <PostRow key={p.id} post={p} onOpen={() => open(p)} />)}
            <button type="button" className="add-btn" onClick={() => open(emptyPost(selectedDay, filterClient))}>+ Add a post on this day</button>
          </div>
        ) : null}

        {view === 'month' && unscheduled.length ? (
          <div className="content-list">
            <div className="content-group">
              <h4>No date yet <span>{unscheduled.length}</span></h4>
              {unscheduled.map((p) => <PostRow key={p.id} post={p} onOpen={() => open(p)} />)}
            </div>
          </div>
        ) : null}

        {/* the phone's way to add a post: always one thumb-tap away */}
        <button type="button" className="add-btn cp-fab" onClick={() => open(emptyPost(selectedDay || newPostDate, filterClient))} aria-label="New post">+</button>
      </>
    );
  }

  return (
    <div id="dashboard" dir="ltr" className={`cp${draft ? ' is-editing' : ''}`}>
      <header className="cp-bar">
        <a className="cp-brand" href="/admin">
          <img className="logo-d" src="/brand/keda-logo-white.png" alt="KEDA Agency" /><img className="logo-l" src="/brand/keda-logo-black.png" alt="KEDA Agency" />
          <span>Content plan</span>
        </a>
        <div className="cp-bar-right">
          {username ? <span className="cp-user">{username}</span> : null}
          <a className="view-site" href="/admin">← Admin</a>
        </div>
      </header>
      <main className="cp-main">{body}</main>
    </div>
  );
}

// Wraps the month grid so it can be magnified in place: Ctrl + scroll (which
// is also what a trackpad pinch sends) or a two-finger pinch zooms toward the
// cursor with a short easing, the − / + buttons zoom toward the middle, a
// zoomed grid can be dragged around, and zooming back out to 100% (or the
// percentage button) puts it back exactly as it was.
function applyZoom(view, factor, cx, cy, w, h) {
  const s = Math.min(MAX_ZOOM, view.s * factor);
  if (s < 1.04) return { s: 1, x: 0, y: 0 };
  const k = s / view.s;
  return clampView(s, cx - (cx - view.x) * k, cy - (cy - view.y) * k, w, h);
}
// the magnified grid never slides off its frame and leaves a gap
const clampView = (s, x, y, w, h) => ({ s, x: Math.min(0, Math.max(w - w * s, x)), y: Math.min(0, Math.max(h - h * s, y)) });

function ZoomFrame({ children }) {
  const frame = useRef(null);
  const [view, setView] = useState({ s: 1, x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const drag = useRef(null);

  useEffect(() => {
    const el = frame.current;
    let pinch = null;
    const box = () => el.getBoundingClientRect();
    const spread = (t) => Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);
    function onWheel(e) {
      if (!e.ctrlKey && !e.metaKey) return; // a plain scroll still scrolls the page
      e.preventDefault();
      const b = box();
      setView((v) => applyZoom(v, Math.exp(-e.deltaY * 0.0025), e.clientX - b.left, e.clientY - b.top, b.width, b.height));
    }
    function onTouchStart(e) {
      pinch = e.touches.length === 2 ? spread(e.touches) : null;
    }
    function onTouchMove(e) {
      if (e.touches.length !== 2 || !pinch) return;
      e.preventDefault();
      const now = spread(e.touches);
      const b = box();
      const cx = (e.touches[0].clientX + e.touches[1].clientX) / 2 - b.left;
      const cy = (e.touches[0].clientY + e.touches[1].clientY) / 2 - b.top;
      const factor = now / pinch;
      pinch = now;
      setView((v) => applyZoom(v, factor, cx, cy, b.width, b.height));
    }
    const endPinch = (e) => {
      if (e.touches.length < 2) pinch = null;
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', endPinch);
    el.addEventListener('touchcancel', endPinch);
    return () => {
      el.removeEventListener('wheel', onWheel);
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', endPinch);
      el.removeEventListener('touchcancel', endPinch);
    };
  }, []);

  const zoomBy = (factor) => {
    const b = frame.current.getBoundingClientRect();
    setView((v) => applyZoom(v, factor, b.width / 2, b.height / 2, b.width, b.height));
  };
  const zoomed = view.s > 1;

  // Dragging only starts after a few pixels, so a plain tap on a post still
  // opens it; once it starts the frame keeps the pointer until it is released.
  function onPointerDown(e) {
    if (!zoomed || (e.pointerType === 'mouse' && e.button !== 0)) return;
    drag.current = { id: e.pointerId, x: e.clientX, y: e.clientY, vx: view.x, vy: view.y, on: false };
  }
  function onPointerMove(e) {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    if (!d.on) {
      if (Math.hypot(dx, dy) < 6) return;
      d.on = true;
      e.currentTarget.setPointerCapture(e.pointerId);
      setDragging(true);
    }
    const b = e.currentTarget.getBoundingClientRect();
    setView((v) => clampView(v.s, d.vx + dx, d.vy + dy, b.width, b.height));
  }
  function onPointerEnd() {
    drag.current = null;
    setDragging(false);
  }

  return (
    <div className="cp-zoom">
      <div className="cp-zoombar">
        <span className="cp-zoom-hint">Ctrl + scroll or pinch to zoom</span>
        <button type="button" onClick={() => zoomBy(1 / ZOOM_STEP)} disabled={!zoomed} aria-label="Zoom out">−</button>
        <button type="button" className="cp-zoom-level" onClick={() => setView({ s: 1, x: 0, y: 0 })} disabled={!zoomed} aria-label="Back to 100%">{Math.round(view.s * 100)}%</button>
        <button type="button" onClick={() => zoomBy(ZOOM_STEP)} disabled={view.s >= MAX_ZOOM} aria-label="Zoom in">+</button>
      </div>
      <div
        ref={frame}
        className={`cp-zoom-frame${zoomed ? ' is-zoomed' : ''}${dragging ? ' is-dragging' : ''}`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerEnd}
        onPointerCancel={onPointerEnd}
      >
        <div className="cp-zoom-inner" style={{ transform: `translate(${view.x}px, ${view.y}px) scale(${view.s})` }}>
          {children}
        </div>
      </div>
    </div>
  );
}

// Sizes the export frame around the laid-out brief (see exportImage).
function fitBriefFrame(frame, scaleToFit) {
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
  const date = post.date ? fromKey(post.date) : null;
  const platforms = post.platforms.map((k) => PLATFORM_SHORT[k]).filter(Boolean);
  const format = POST_FORMATS.find((f) => f.key === post.format)?.label;
  const platformNames = post.platforms.map((k) => POST_PLATFORMS.find((p) => p.key === k)?.label).filter(Boolean).join(' + ');
  return (
    <button type="button" className={`content-row is-${post.status}`} onClick={onOpen}>
      <span className="content-row-date">
        {date ? <><b>{date.getDate()}</b>{date.toLocaleDateString('en-GB', { weekday: 'short' })}</> : '—'}
      </span>
      <span className="content-row-main">
        <span className="content-row-title" dir="auto">{post.headline || post.caption?.split('\n')[0] || 'Untitled post'}</span>
        <span className="content-row-meta" title={platformNames}>
          {[post.clientName, post.time, format].filter(Boolean).join(' · ')}
          {platforms.length ? <span className="content-row-platforms">{platforms.map((p) => <i key={p}>{p}</i>)}</span> : null}
        </span>
      </span>
      <span className={`brief-status-pill is-${post.status}`}>{status.label}</span>
    </button>
  );
}

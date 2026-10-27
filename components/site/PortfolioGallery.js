'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import PortfolioVideo from '../PortfolioVideo';
import { NextIcon, PlusIcon, PlayIcon } from './Icons';

// The portfolio's client galleries: filter pills (All + each client, with
// counts), then one drifting strip per client that pauses under the pointer,
// and a lightbox for seeing any piece large (prev/next, arrow keys, Esc).
const COUNT_COLORS = ['var(--aqua)', 'var(--magenta)', 'var(--acid)', 'var(--tangerine)', 'var(--violet)'];
const FACES = ['09', '04', '01', '07', '03'];

const noMenu = (e) => e.preventDefault();

// Each strip repeats its pieces until a pass is wide enough to cover a wide
// screen, then the pass twice over so the -50% loop never shows a gap.
function fill(items) {
  const reps = Math.max(2, Math.ceil(8 / items.length));
  const half = [];
  for (let k = 0; k < reps; k++) items.forEach((it, i) => half.push([it, i]));
  return { half, cells: [...half, ...half] };
}

function Tile({ item, index, name, onOpen, hidden, labels }) {
  // the tile starts portrait and takes the picture's own shape once loaded
  const setRatio = (e) => {
    const img = e.currentTarget;
    if (img.naturalWidth && img.naturalHeight) {
      img.closest('.pf-item')?.style.setProperty('--ar', `${img.naturalWidth} / ${img.naturalHeight}`);
    }
  };
  return (
    <button
      className="pf-item"
      type="button"
      tabIndex={hidden ? -1 : undefined}
      aria-hidden={hidden ? true : undefined}
      aria-label={`${name} ${index + 1}${item.title ? ` — ${item.title}` : ''}${item.video ? ` (${labels.play})` : ''}`}
      onClick={(e) => onOpen(index, e.currentTarget)}
      style={item.orientation === 'landscape' && !item.image ? { '--ar': '16 / 9' } : item.orientation === 'portrait' && !item.image ? { '--ar': '9 / 16' } : undefined}
    >
      {item.image ? (
        <img loading="lazy" decoding="async" src={item.image} alt="" draggable={false} onLoad={setRatio} onContextMenu={noMenu} />
      ) : (
        <span className="vid">{item.label}</span>
      )}
      {item.video ? <span className="pf-play"><PlayIcon /></span> : null}
      {item.title ? <span className="pf-cap">{item.title}</span> : null}
      <span className="pf-zoom"><PlusIcon /></span>
    </button>
  );
}

export default function PortfolioGallery({ galleries, initial = 'all', labels, lang }) {
  const [filter, setFilter] = useState(initial);
  const [box, setBox] = useState(null); // { g, n } while the lightbox is open
  const from = useRef(null);
  const closeBtn = useRef(null);
  const rtl = lang === 'ar';
  const total = galleries.reduce((n, g) => n + g.items.length, 0);

  function pick(key) {
    setFilter(key);
    // keep the address in step, so a filtered view can be shared or reloaded
    const url = new URL(window.location.href);
    if (key === 'all') url.searchParams.delete('client');
    else url.searchParams.set('client', key);
    window.history.replaceState(window.history.state, '', url);
  }

  const open = (g, n, el) => {
    from.current = el;
    setBox({ g, n });
  };
  const close = useCallback(() => {
    setBox(null);
    from.current?.focus();
  }, []);
  const step = useCallback(
    (d) => setBox((b) => (b ? { g: b.g, n: (b.n + d + galleries[b.g].items.length) % galleries[b.g].items.length } : b)),
    [galleries]
  );

  const isOpen = box !== null;
  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = 'hidden';
    closeBtn.current?.focus();
    function onKey(e) {
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowRight') step(rtl ? -1 : 1);
      else if (e.key === 'ArrowLeft') step(rtl ? 1 : -1);
      else if (e.key === 'Tab') {
        // keep focus inside the dialog
        const els = [...document.querySelectorAll('.lb button, .lb iframe, .lb video')];
        const i = els.indexOf(document.activeElement);
        if (e.shiftKey && i <= 0) { e.preventDefault(); els[els.length - 1]?.focus(); }
        else if (!e.shiftKey && i === els.length - 1) { e.preventDefault(); els[0]?.focus(); }
      }
    }
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [isOpen, close, step, rtl]);

  const shown = box ? galleries[box.g] : null;
  const item = shown ? shown.items[box.n] : null;

  return (
    <>
      <div className="filters rv" role="group" aria-label={labels.filterBy}>
        <button className="fp" type="button" aria-pressed={filter === 'all'} onClick={() => pick('all')}>
          {labels.all}<b>{total}</b>
        </button>
        {galleries.map((g) => (
          <button key={g.key} className="fp" type="button" aria-pressed={filter === g.key} onClick={() => pick(g.key)}>
            {g.name}<b>{g.items.length}</b>
          </button>
        ))}
      </div>

      {galleries.map((g, r) => {
        const { half, cells } = fill(g.items);
        return (
          <article className={`pf-row${r % 2 ? ' rev' : ''}`} key={g.key} hidden={filter !== 'all' && filter !== g.key}>
            <header className="pf-head">
              {g.logo ? <img className="pf-logo" src={g.logo} alt="" loading="lazy" draggable={false} /> : null}
              <img className="face-sm" src={`/blocks/block-${FACES[r % FACES.length]}.svg`} alt="" draggable={false} />
              <h3 className="d">{g.name}</h3>
              <span className="pf-count" style={{ '--c': COUNT_COLORS[r % COUNT_COLORS.length] }}>
                {g.items.length} {labels.works}
              </span>
            </header>
            <div className="pf-strip">
              <div className="pf-track" style={{ '--dur': `${Math.round(half.length * 4.2)}s` }}>
                {cells.map(([it, i], n) => (
                  <Tile
                    key={`${it.id}-${n}`}
                    item={it}
                    index={i}
                    name={g.name}
                    labels={labels}
                    // only the first pass of each strip is reachable by
                    // keyboard; the rest are repeats for the loop
                    hidden={n >= g.items.length}
                    onOpen={(idx, el) => open(r, idx, el)}
                  />
                ))}
              </div>
            </div>
          </article>
        );
      })}

      {item ? (
        <div
          className="lb"
          role="dialog"
          aria-modal="true"
          aria-label={labels.preview}
          onClick={(e) => e.target === e.currentTarget && close()}
        >
          <p className="lb-cap">
            {shown.name}
            <span>{box.n + 1} / {shown.items.length}</span>
          </p>
          {item.video ? (
            <div className="lb-media" key={item.id}>
              <PortfolioVideo src={item.video} poster={item.image} orientation={item.orientation} label={item.title || shown.name} />
            </div>
          ) : (
            <img key={item.id} src={item.image} alt={item.title || ''} draggable={false} onContextMenu={noMenu} />
          )}
          <button className="lb-x" type="button" aria-label={labels.close} onClick={close} ref={closeBtn}>
            <PlusIcon rotate />
          </button>
          {shown.items.length > 1 ? (
            <>
              <button className="lb-p" type="button" aria-label={labels.prev} onClick={() => step(rtl ? 1 : -1)}>
                <NextIcon />
              </button>
              <button className="lb-n" type="button" aria-label={labels.next} onClick={() => step(rtl ? -1 : 1)}>
                <NextIcon />
              </button>
            </>
          ) : null}
        </div>
      ) : null}
    </>
  );
}

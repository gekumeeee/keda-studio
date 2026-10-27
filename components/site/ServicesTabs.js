'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowIcon, CheckIcon } from './Icons';

// "What we do": one tab per service from the admin's Site Content, the whole
// block taking on each service's colour. The colours and the scene of block
// characters cycle in the approved design's order; everything written comes
// from settings.services.
const LOOKS = [
  { c: 'var(--tangerine)', fg: 'var(--ink)', blocks: [['05', '44%', '6%', '8%', '-10deg', '7s', '0s', '0s'], ['03', '40%', '46%', '2%', '12deg', '8s', '-2s', '.1s'], ['08', '34%', '30%', '46%', '-4deg', '6.5s', '-4s', '.2s']], tags: [['2%', '58%', '-6deg', '0s'], ['62%', '62%', '5deg', '.4s']] },
  { c: 'var(--magenta)', fg: 'var(--ink)', blocks: [['09', '42%', '4%', '6%', '8deg', '7s', '0s', '0s'], ['10', '38%', '50%', '10%', '-12deg', '8s', '-3s', '.1s'], ['05', '32%', '34%', '48%', '6deg', '6.8s', '-1s', '.2s']], tags: [['60%', '2%', '6deg', '0s'], ['4%', '66%', '-5deg', '.4s']] },
  { c: 'var(--cobalt)', fg: 'var(--paper)', blocks: [['01', '40%', '8%', '4%', '-8deg', '7s', '0s', '0s'], ['02', '40%', '48%', '8%', '10deg', '8s', '-2s', '.1s'], ['09', '32%', '30%', '48%', '-3deg', '6.6s', '-4s', '.2s']], tags: [['2%', '62%', '-6deg', '0s'], ['64%', '64%', '5deg', '.4s']] },
  { c: 'var(--violet)', fg: 'var(--paper)', blocks: [['08', '40%', '6%', '6%', '9deg', '7s', '0s', '0s'], ['07', '38%', '50%', '4%', '-11deg', '8s', '-3s', '.1s'], ['09', '32%', '32%', '48%', '4deg', '6.7s', '-1s', '.2s']], tags: [['4%', '64%', '-5deg', '0s'], ['62%', '62%', '6deg', '.4s']] },
];

export default function ServicesTabs({ services, startLabel, tablistLabel }) {
  const [active, setActive] = useState(0);
  const tabs = useRef([]);
  const look = LOOKS[active % LOOKS.length];

  function onKey(e, i) {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    const rtl = document.documentElement.dir === 'rtl';
    const d = (e.key === 'ArrowRight') !== rtl ? 1 : -1;
    const n = (i + d + services.length) % services.length;
    setActive(n);
    tabs.current[n]?.focus();
  }

  return (
    <div className="svc rv" style={{ '--c': look.c, '--fg': look.fg }}>
      <div className="svc-tabs" role="tablist" aria-label={tablistLabel}>
        {services.map((s, i) => (
          <button
            key={i}
            ref={(el) => { tabs.current[i] = el; }}
            className="tab"
            role="tab"
            id={`svc-tab-${i}`}
            aria-controls={`svc-panel-${i}`}
            aria-selected={i === active}
            tabIndex={i === active ? 0 : -1}
            type="button"
            onClick={() => setActive(i)}
            onKeyDown={(e) => onKey(e, i)}
          >
            {s.tab || s.title}
          </button>
        ))}
      </div>
      {services.map((s, i) => {
        const lk = LOOKS[i % LOOKS.length];
        const on = i === active;
        return (
          <div
            key={i}
            className={`svc-panel${on ? ' on' : ''}`}
            role="tabpanel"
            id={`svc-panel-${i}`}
            aria-labelledby={`svc-tab-${i}`}
            hidden={!on}
          >
            <div className="svc-txt">
              {s.stat ? (
                <span className="stat">
                  <b>{s.stat}</b>
                  {s.statLabel ? <span>{s.statLabel}</span> : null}
                </span>
              ) : null}
              <h3 className="d">{s.title}</h3>
              {s.desc ? <p>{s.desc}</p> : null}
              {s.points.length ? (
                <ul className="ticks">
                  {s.points.map((p, k) => (
                    <li key={k}>
                      <CheckIcon />
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
              <Link className="btn btn-ink" href="/contact">
                <span>{startLabel}</span>
                <ArrowIcon />
              </Link>
            </div>
            <div className="vis" aria-hidden="true">
              {lk.blocks.map(([src, w, x, y, r, t, dl, pd]) => (
                <img
                  key={src}
                  className="bk"
                  src={`/blocks/block-${src}.svg`}
                  alt=""
                  draggable={false}
                  style={{ '--w': w, '--x': x, '--y': y, '--r': r, '--t': t, '--dl': dl, '--pd': pd }}
                />
              ))}
              {s.image ? <img className="ph" src={s.image} alt="" draggable={false} /> : null}
              {s.points.slice(0, 2).map((p, k) => {
                const [x, y, r, pd] = lk.tags[k];
                return (
                  <span key={k} className="tag" style={{ '--x': x, '--y': y, '--r': r, '--pd': pd }}>
                    {p}
                  </span>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

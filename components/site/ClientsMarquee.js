import Link from 'next/link';

// "Our clients": every client's logo on one strip, drifting past one after
// another with no frames. Dim at rest, each lights up with its own coloured
// glow when pointed at, and opens that client's work on the portfolio page.
const GLOWS = ['var(--acid)', 'var(--aqua)', 'var(--tangerine)', 'var(--cobalt)', 'var(--violet)', 'var(--magenta)'];

export default function ClientsMarquee({ clients }) {
  if (!clients.length) return null;
  // enough logos in one group to run wider than the screen, then the group
  // twice over so the -50% loop is seamless
  const reps = Math.max(2, Math.ceil(10 / clients.length));
  const group = Array.from({ length: reps }, () => clients).flat();

  return (
    <div className="cl-strip rv">
      <div className="cl-track">
        {[0, 1].map((copy) => (
          <div className="cl-group" key={copy}>
            {group.map((c, i) => {
              const first = copy === 0 && i < clients.length;
              return (
                <Link
                  key={`${copy}-${i}`}
                  className="cl"
                  style={{ '--c': GLOWS[clients.indexOf(c) % GLOWS.length] }}
                  href={`/portfolio?client=${encodeURIComponent(c.id)}`}
                  aria-label={c.name}
                  // only the first pass is reachable by keyboard; the rest
                  // are the same links again, there for the loop
                  tabIndex={first ? undefined : -1}
                  aria-hidden={first ? undefined : true}
                >
                  {c.logo ? (
                    <img src={c.logo} alt="" loading="lazy" draggable={false} />
                  ) : (
                    <span className="nm">{c.name}</span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

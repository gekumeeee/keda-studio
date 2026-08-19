'use client';

// Two responsive variants of the same tile set, toggled by CSS media query
// (not JS) so there's no client/server layout mismatch:
//  - .hero-gallery: three vertical columns that scroll continuously
//    (outer up, middle down), shown from ~900px up.
//  - .hero-slide: one wide swipeable row, shown below that — three narrow
//    columns on a phone squeeze every image down to a sliver, so mobile gets
//    a single row of full-size cards you scroll through sideways instead.
// Content comes from live projects; when there aren't enough, tiles repeat
// to keep the layout full.

// The hero carries no accent — colour enters the page further down. These
// placeholder tiles therefore stay strictly monochrome, alternating ink
// surfaces with paper ones so the grid still reads as varied.
const TILE_COLORS = [
  { bg: 'var(--paper)', fg: 'var(--ink)' },
  { bg: '#1A1A1A', fg: 'var(--paper)' },
  { bg: 'var(--ink)', fg: 'var(--paper)' },
  { bg: 'var(--paper)', fg: 'var(--ink)' },
  { bg: '#262626', fg: 'var(--paper)' },
  { bg: '#1A1A1A', fg: 'var(--paper)' },
];

// A real project image is shown alone — no title, no overlay. Only the
// colour-block placeholder (no image at all) keeps its label, since that's
// the only thing telling the two tiles apart.
function Tile({ project, colorIndex, className = '' }) {
  const color = TILE_COLORS[colorIndex % TILE_COLORS.length];
  const cls = `gcard ${className}`.trim();
  if (project.image) {
    return (
      <div className={cls}>
        <img src={project.image} alt={project.title} loading="lazy" />
      </div>
    );
  }
  return (
    <div className={cls} style={{ background: color.bg, color: color.fg }}>
      <span className="gcard-title">{project.title}</span>
    </div>
  );
}

const PLACEHOLDERS = {
  en: ['Branding', 'Motion', 'Social', 'Video', 'Campaign', 'Identity', 'Content', 'Photography', 'Editorial'],
  ar: ['براندينج', 'موشن', 'سوشيال', 'فيديو', 'حملة', 'هوية', 'محتوى', 'تصوير', 'تحرير'],
};

export default function HeroGallery({ projects, lang = 'en' }) {
  const live = projects.filter((p) => p.status === 'live');

  // Fallback placeholder set so the gallery looks full before real projects exist.
  const source =
    live.length > 0
      ? live
      : PLACEHOLDERS[lang].map((title, i) => ({ id: `p${i}`, title }));

  // Ensure at least 9 tiles so every column has depth.
  const filled = [];
  let i = 0;
  while (filled.length < Math.max(9, source.length)) {
    filled.push(source[i % source.length]);
    i++;
  }

  // Distribute round-robin into 3 columns for the desktop gallery.
  const columns = [[], [], []];
  filled.forEach((item, idx) => columns[idx % 3].push({ item, colorIndex: idx }));

  return (
    <>
      <div className="hero-gallery" aria-hidden="true">
        {columns.map((col, c) => (
          <div key={c} className={`hero-col ${c === 1 ? 'down' : 'up'}`}>
            {/* duplicated once for a seamless loop */}
            {[...col, ...col].map((entry, idx) => (
              <Tile key={idx} project={entry.item} colorIndex={entry.colorIndex} />
            ))}
          </div>
        ))}
      </div>
      <div className="hero-slide" aria-hidden="true">
        {filled.map((item, idx) => (
          <Tile key={idx} project={item} colorIndex={idx} className="hero-slide-item" />
        ))}
      </div>
    </>
  );
}

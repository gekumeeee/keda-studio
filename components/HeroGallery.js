'use client';

// Three vertical columns of thumbnails that scroll continuously.
// Outer columns scroll up, the middle column scrolls down (counter-motion),
// mirroring the senu-style hero gallery. Content comes from live projects;
// when there aren't enough, tiles repeat to keep the columns full.

const TILE_COLORS = [
  { bg: 'var(--blue)', fg: '#fff' },
  { bg: '#2b2926', fg: 'var(--text)' },
  { bg: 'var(--green)', fg: '#0A0A0A' },
  { bg: '#3a2a20', fg: 'var(--text)' },
  { bg: 'var(--gold)', fg: '#0A0A0A' },
  { bg: 'var(--orange)', fg: 'var(--on-accent)' },
];

function Tile({ project, colorIndex }) {
  const color = TILE_COLORS[colorIndex % TILE_COLORS.length];
  if (project.image) {
    return (
      <div className="gcard">
        <img src={project.image} alt={project.title} loading="lazy" />
        <span className="gcard-label">{project.title}</span>
      </div>
    );
  }
  return (
    <div className="gcard" style={{ background: color.bg, color: color.fg }}>
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

  // Distribute round-robin into 3 columns.
  const columns = [[], [], []];
  filled.forEach((item, idx) => columns[idx % 3].push({ item, colorIndex: idx }));

  return (
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
  );
}

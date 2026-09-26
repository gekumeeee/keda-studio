import Reveal from './Reveal';

// Every section on the site is introduced the same way: the sentence, then the
// section's own name in a chip beside it. `level` is 1 for the heading that
// opens a page (its <h1>, set a size up) and 2 for a section within one.
// `center` is for a section whose content is a centred grid rather than a row.
export default function SectionHead({ title, tag, level = 2, center = false }) {
  const Heading = level === 1 ? 'h1' : 'h2';
  const classes = ['head-row', level === 1 ? 'is-page' : '', center ? 'is-center' : ''].filter(Boolean).join(' ');
  return (
    <Reveal className={classes}>
      <Heading className="head-title">{String(title).replace(/\n/g, ' ')}</Heading>
      {tag ? (
        <span className="head-tag">
          <Sparkle />
          {tag}
        </span>
      ) : null}
    </Reveal>
  );
}

// The four-point burst in the chip — it takes its colour from CSS, per ground.
function Sparkle() {
  return (
    <svg className="sparkle" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 0 L14.4 9.6 L24 12 L14.4 14.4 L12 24 L9.6 14.4 L0 12 L9.6 9.6 Z" fill="currentColor" />
    </svg>
  );
}

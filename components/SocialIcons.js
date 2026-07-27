// Small original monoline glyphs used to represent each platform link.
// Simple geometric shapes (not traced from any brand's official artwork).

export function FacebookIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" aria-hidden="true" {...props}>
      <path
        d="M15 8.5h-2c-.55 0-1 .45-1 1V12h3l-.4 3H12v7h-3v-7H7v-3h2V9.2C9 6.9 10.4 5.5 12.6 5.5H15v3Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function InstagramIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true" {...props}>
      <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
      <circle cx="12" cy="12" r="4.2" />
      <circle cx="17.2" cy="6.8" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function XIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true" {...props}>
      <path d="M5 5l14 14M19 5L5 19" />
    </svg>
  );
}

export function BehanceIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="26" height="14" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true" {...props}>
      <path d="M2 5.5h5.2c2.6 0 3.9 1.1 3.9 2.9 0 1.3-.7 2.1-1.8 2.5 1.4.4 2.3 1.4 2.3 2.9 0 2.1-1.6 3.2-4.2 3.2H2v-11.5Z" />
      <path d="M2 10.6h4.6" />
      <path d="M15 12.2c0-2.6 1.7-4.3 4-4.3s3.8 1.6 3.8 4v.7h-6.1c.1 1.5 1 2.3 2.4 2.3.9 0 1.6-.4 1.9-1.1h1.7c-.4 1.6-1.8 2.6-3.7 2.6-2.4 0-4-1.7-4-4.2Z" />
      <path d="M15.6 5.8h4.4" />
    </svg>
  );
}

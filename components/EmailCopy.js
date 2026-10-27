'use client';

import { useState } from 'react';

// The studio's address, big and clickable, with a one-tap copy button. The
// site blocks copying text, so this button is the way to take it with you.
export default function EmailCopy({ email, dropLabel, copyLabel, copiedLabel }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(email);
    } catch {
      // clipboard API unavailable — still flip the label so the click feels responsive
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="c-mail">
      <div className="c-mail-row">
        <span>{dropLabel}</span>
        <button type="button" className="c-copy" onClick={copy} aria-live="polite">
          {copied ? copiedLabel : copyLabel}
        </button>
      </div>
      <a href={`mailto:${email}`}>{email}</a>
    </div>
  );
}

'use client';

import { useState } from 'react';

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
    <div className="email-copy">
      <div className="email-copy-row">
        <span className="email-copy-label">{dropLabel}</span>
        <button type="button" className="email-copy-btn" onClick={copy}>
          {copied ? copiedLabel : copyLabel}
        </button>
      </div>
      <a href={`mailto:${email}`} className="email-copy-big">{email}</a>
    </div>
  );
}

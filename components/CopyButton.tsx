'use client';

import { useState } from 'react';

// Icon-only copy button: two stacked sheets. Once clicked it turns into a tick and a
// short "Copied to clipboard" note appears beside it for a moment.
export function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  return (
    <button
      className="copy-button"
      type="button"
      onClick={copy}
      aria-label={label}
      title={copied ? undefined : 'Copy BibTeX'}
      data-copied={copied ? 'true' : undefined}
    >
      <svg className="link-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        {copied ? (
          <path d="m5 12.5 4.5 4.5L19 7.5" />
        ) : (
          <>
            <rect x="8.5" y="8.5" width="11" height="11" rx="1.5" />
            <path d="M15.5 8.5V6A1.5 1.5 0 0 0 14 4.5H6A1.5 1.5 0 0 0 4.5 6v8A1.5 1.5 0 0 0 6 15.5h2.5" />
          </>
        )}
      </svg>
      <span className="copy-note" aria-live="polite">
        {copied ? 'Copied to clipboard' : ''}
      </span>
    </button>
  );
}

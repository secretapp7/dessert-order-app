"use client";

import { useState } from "react";

export function AdminCopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1600);
        } catch {
          setCopied(false);
        }
      }}
      className="rounded-lg border border-[color:var(--border-soft)] bg-[color:var(--card-cream)] px-3 py-1.5 text-xs font-semibold text-[color:var(--brand-burgundy)] hover:bg-[color:var(--card-beige)]"
    >
      {copied ? "Copied" : label}
    </button>
  );
}

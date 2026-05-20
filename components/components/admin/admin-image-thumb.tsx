"use client";

import { useState } from "react";

type AdminImageThumbProps = {
  src: string;
  alt?: string;
  className?: string;
};

export function AdminImageThumb({ src, alt = "", className = "" }: AdminImageThumbProps) {
  const trimmed = src.trim();
  const [broken, setBroken] = useState(false);

  if (!trimmed || broken) {
    return (
      <div
        className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-lg border border-dashed border-[color:var(--border-soft)] bg-[color:var(--card-beige)] text-[9px] text-[color:var(--muted-text)] ${className}`}
        aria-hidden
      >
        No preview
      </div>
    );
  }

  return (
    <img
      src={trimmed}
      alt={alt}
      className={`h-16 w-16 shrink-0 rounded-lg border border-[color:var(--border-soft)] object-cover ${className}`}
      onError={() => setBroken(true)}
    />
  );
}

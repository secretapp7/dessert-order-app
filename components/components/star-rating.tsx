type StarBarProps = {
  rating: number;
  className?: string;
  max?: number;
};

export function StarBar({ rating, className = "", max = 5 }: StarBarProps) {
  const clamped = Math.min(max, Math.max(0, rating));
  const pct = (clamped / max) * 100;
  return (
    <div className={`relative inline-flex h-[1em] min-w-[4.25rem] items-center ${className}`} aria-hidden>
      <span className="block text-[11px] leading-none tracking-tight text-[color:var(--card-beige)]">★★★★★</span>
      <span
        className="absolute start-0 top-0 block overflow-hidden text-[11px] leading-none tracking-tight text-[color:var(--brand-gold)]"
        style={{ width: `${pct}%` }}
      >
        ★★★★★
      </span>
    </div>
  );
}

type StarRowProps = {
  rating: number;
  sizeClass?: string;
};

export function StarRow({ rating, sizeClass = "text-[11px]" }: StarRowProps) {
  const n = Math.min(5, Math.max(0, Math.round(rating)));
  return (
    <span className={`inline-flex gap-0.5 text-[color:var(--brand-gold)] ${sizeClass}`} aria-hidden>
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} className={i < n ? "opacity-100" : "opacity-25"}>
          ★
        </span>
      ))}
    </span>
  );
}

"use client";

export function PrintProductionButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="rounded-xl border border-[color:var(--border-soft)] bg-white px-4 py-2 text-sm font-semibold text-[color:var(--brand-burgundy)] shadow-sm hover:bg-[color:var(--card-cream)] print:hidden"
    >
      Print production sheet
    </button>
  );
}

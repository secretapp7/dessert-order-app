import Link from "next/link";
import { notFound } from "next/navigation";

import { OfferEditForm } from "@/components/admin/offers/offer-forms";
import { getOfferForAdmin } from "@/lib/admin/data/offer-queries";

export default async function AdminEditOfferPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const offer = await getOfferForAdmin(id);
  if (!offer) notFound();

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[color:var(--accent-cocoa)]">Edit offer</h1>
          <p className="mt-1 font-mono text-xs text-[color:var(--muted-text)]">{offer.slug}</p>
        </div>
        <Link
          href="/admin/offers"
          className="rounded-xl border border-[color:var(--border-soft)] px-4 py-2 text-sm font-semibold text-[color:var(--brand-burgundy)] hover:bg-[color:var(--card-cream)]"
        >
          Back to list
        </Link>
      </div>

      <section className="rounded-2xl border border-[color:var(--border-soft)] bg-white/80 p-4 shadow-sm">
        <h2 className="text-xs font-bold uppercase tracking-wide text-[color:var(--brand-gold-muted)]">Offer details</h2>
        <div className="mt-3">
          <OfferEditForm offer={offer} />
        </div>
      </section>
    </div>
  );
}

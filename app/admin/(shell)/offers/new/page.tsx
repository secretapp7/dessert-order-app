import Link from "next/link";

import { OfferCreateForm } from "@/components/admin/offers/offer-forms";
import { isAdminImageStorageConfigured } from "@/lib/storage/image-storage";

export default async function AdminNewOfferPage() {
  const uploadAvailable = isAdminImageStorageConfigured();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[color:var(--accent-cocoa)]">New offer</h1>
          <p className="mt-1 text-sm text-[color:var(--muted-text)]">
            Slug must be lowercase and URL-safe. Optional start/end dates use the UTC fields shown below.
          </p>
        </div>
        <Link
          href="/admin/offers"
          className="rounded-xl border border-[color:var(--border-soft)] px-4 py-2 text-sm font-semibold text-[color:var(--brand-burgundy)] hover:bg-[color:var(--card-cream)]"
        >
          Back to list
        </Link>
      </div>
      <section className="rounded-2xl border border-[color:var(--border-soft)] bg-white/80 p-4 shadow-sm">
        <OfferCreateForm uploadAvailable={uploadAvailable} />
      </section>
    </div>
  );
}

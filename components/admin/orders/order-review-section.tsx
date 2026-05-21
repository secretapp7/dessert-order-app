"use client";

import { useRouter } from "next/navigation";

import { AdminCopyButton } from "@/components/admin/copy-button";
import { markReviewRequestedAction } from "@/lib/admin/actions/order-review-actions";
import { OrderStatus } from "@prisma/client";

type OrderReviewSectionProps = {
  orderId: string;
  orderStatus: OrderStatus;
  reviewUrl: string;
  whatsAppReviewUrl: string | null;
  reviewRequestedAtLabel: string | null;
  reviewedAtLabel: string | null;
};

export function OrderReviewSection({
  orderId,
  orderStatus,
  reviewUrl,
  whatsAppReviewUrl,
  reviewRequestedAtLabel,
  reviewedAtLabel,
}: OrderReviewSectionProps) {
  const router = useRouter();
  const delivered = orderStatus === OrderStatus.DELIVERED;
  const reviewed = reviewedAtLabel != null;
  const canWhatsApp = delivered && whatsAppReviewUrl != null;

  function onWhatsAppClick() {
    void (async () => {
      await markReviewRequestedAction(orderId);
      router.refresh();
    })();
  }

  return (
    <section className="rounded-2xl border border-[color:var(--border-soft)] bg-[color:var(--card-beige)] p-4">
      <h2 className="text-xs font-bold uppercase tracking-wide text-[color:var(--brand-gold-muted)]">
        Customer review
      </h2>

      <dl className="mt-3 space-y-2 text-sm">
        <div>
          <dt className="text-[10px] uppercase text-[color:var(--muted-text)]">Status</dt>
          <dd className="font-medium">
            {reviewed
              ? `Review submitted · ${reviewedAtLabel}`
              : reviewRequestedAtLabel
                ? `Requested · ${reviewRequestedAtLabel}`
                : "Not requested yet"}
          </dd>
        </div>
        <div>
          <dt className="text-[10px] uppercase text-[color:var(--muted-text)]">Review link</dt>
          <dd className="break-all font-mono text-[11px] text-[color:var(--foreground)]">{reviewUrl}</dd>
        </div>
      </dl>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <AdminCopyButton text={reviewUrl} label="Copy review link" />
        {canWhatsApp ? (
          <a
            href={whatsAppReviewUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onWhatsAppClick}
            className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow hover:brightness-110"
          >
            Send review request on WhatsApp
          </a>
        ) : delivered ? (
          <p className="text-xs font-medium text-[color:var(--brand-burgundy-soft)]">
            Customer phone is missing. Copy the review link manually.
          </p>
        ) : (
          <span className="rounded-xl border border-[color:var(--border-soft)] bg-[color:var(--card-cream)] px-4 py-2 text-xs font-medium text-[color:var(--muted-text)]">
            WhatsApp review request available after order is delivered
          </span>
        )}
      </div>
    </section>
  );
}

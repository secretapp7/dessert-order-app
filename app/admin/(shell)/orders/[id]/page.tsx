import Link from "next/link";
import { notFound } from "next/navigation";

import { AdminCopyButton } from "@/components/admin/copy-button";
import { OrderAdminForms } from "@/components/admin/orders/order-admin-forms";
import { OrderReviewSection } from "@/components/admin/orders/order-review-section";
import { FulfillmentMethod, OrderStatus } from "@prisma/client";

import { getAdminOrderById } from "@/lib/admin/dashboard-data";
import { decimalToFormString } from "@/lib/admin/admin-serialize";
import {
  buildOrderReviewUrl,
  buildReviewWhatsAppMessage,
  ensureOrderReviewToken,
} from "@/lib/reviews/review-token";
import { brand } from "@/config/brand";

function money(n: number) {
  return n.toFixed(3);
}

function digitsOnly(phone: string) {
  return phone.replace(/\D/g, "");
}

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await getAdminOrderById(id);
  if (!order) notFound();

  const reviewToken = await ensureOrderReviewToken(order.id);
  const reviewUrl = buildOrderReviewUrl({ publicId: order.publicId, reviewToken });
  const reviewWhatsAppMessage = buildReviewWhatsAppMessage(
    order.customerName,
    reviewUrl,
    order.language,
  );
  const whatsAppReviewUrl = `https://wa.me/${digitsOnly(order.customerPhone)}?text=${encodeURIComponent(reviewWhatsAppMessage)}`;

  const waCustomer = `https://wa.me/${digitsOnly(order.customerPhone)}`;
  const mapsLink = order.mapsLink?.trim();

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--brand-gold-muted)]">
            Order
          </p>
          <h1 className="text-2xl font-bold text-[color:var(--accent-cocoa)]">{order.publicId}</h1>
          <p className="mt-1 text-sm text-[color:var(--muted-text)]">
            Placed {order.createdAt.toISOString()} · Needed {order.dateNeeded.toISOString().slice(0, 10)}
          </p>
          {order.archivedAt ? (
            <p className="mt-2 inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-950">
              Archived
            </p>
          ) : (
            <p className="mt-2 inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-900">
              Active list
            </p>
          )}
        </div>
        <Link
          href="/admin/orders"
          className="text-sm font-semibold text-[color:var(--brand-burgundy-soft)] underline-offset-2 hover:underline"
        >
          ← All orders
        </Link>
      </div>

      <div className="flex flex-wrap gap-2">
        <a
          href={waCustomer}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow hover:brightness-110"
        >
          Customer WhatsApp
        </a>
        {mapsLink ? (
          <a
            href={mapsLink}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-xl border border-[color:var(--border-soft)] bg-[color:var(--card-cream)] px-4 py-2 text-sm font-semibold text-[color:var(--brand-burgundy)] hover:bg-[color:var(--card-beige)]"
          >
            Open maps link
          </a>
        ) : null}
        <AdminCopyButton text={order.whatsappMessage} label="Copy WhatsApp message" />
      </div>

      <OrderAdminForms
        order={{
          id: order.id,
          publicId: order.publicId,
          archivedAtIso: order.archivedAt?.toISOString() ?? null,
          orderStatus: order.orderStatus,
          paymentStatus: order.paymentStatus,
          deliveryStatus: order.deliveryStatus,
          customerName: order.customerName,
          customerPhone: order.customerPhone,
          notes: order.notes,
          adminNote: order.adminNote,
          cancelReason: order.cancelReason,
          deliveryFeeOmr:
            order.deliveryFeeOmr != null ? decimalToFormString(order.deliveryFeeOmr) : null,
        }}
      />

      <OrderReviewSection
        orderId={order.id}
        orderStatus={order.orderStatus}
        reviewUrl={reviewUrl}
        whatsAppReviewUrl={whatsAppReviewUrl}
        reviewRequestedAtLabel={
          order.reviewRequestedAt ? order.reviewRequestedAt.toISOString().slice(0, 19).replace("T", " ") : null
        }
        reviewedAtLabel={
          order.reviewedAt ? order.reviewedAt.toISOString().slice(0, 19).replace("T", " ") : null
        }
      />

      <section className="rounded-2xl border border-[color:var(--border-soft)] bg-[color:var(--card-beige)] p-4">
        <h2 className="text-xs font-bold uppercase tracking-wide text-[color:var(--brand-gold-muted)]">
          Customer snapshot
        </h2>
        <dl className="mt-2 space-y-1 text-sm">
          <div>
            <dt className="text-[10px] uppercase text-[color:var(--muted-text)]">Name</dt>
            <dd className="font-medium">{order.customerName}</dd>
          </div>
          <div>
            <dt className="text-[10px] uppercase text-[color:var(--muted-text)]">Phone</dt>
            <dd className="font-mono">{order.customerPhone}</dd>
          </div>
          {order.customer ? (
            <div>
              <dt className="text-[10px] uppercase text-[color:var(--muted-text)]">Profile</dt>
              <dd className="text-[color:var(--muted-text)]">Linked customer record</dd>
            </div>
          ) : null}
        </dl>
        <p className="mt-3 text-[11px] text-[color:var(--muted-text)]">
          Editable in Customer, notes & admin note above (order snapshot only).
        </p>
      </section>

      <section className="rounded-2xl border border-[color:var(--border-soft)] bg-[color:var(--card-beige)] p-4">
        <h2 className="text-xs font-bold uppercase tracking-wide text-[color:var(--brand-gold-muted)]">
          Fulfillment
        </h2>
        <dl className="mt-2 space-y-1 text-sm">
          <div>
            <dt className="text-[10px] uppercase text-[color:var(--muted-text)]">Method</dt>
            <dd>{order.fulfillmentMethod}</dd>
          </div>
          <div>
            <dt className="text-[10px] uppercase text-[color:var(--muted-text)]">Language</dt>
            <dd>{order.language}</dd>
          </div>
          {order.fulfillmentMethod === FulfillmentMethod.DELIVERY ? (
            <>
              <div>
                <dt className="text-[10px] uppercase text-[color:var(--muted-text)]">Address</dt>
                <dd className="whitespace-pre-wrap">{order.addressDetails ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-[10px] uppercase text-[color:var(--muted-text)]">GPS</dt>
                <dd className="font-mono text-xs">
                  {order.gpsLatitude != null && order.gpsLongitude != null
                    ? `${order.gpsLatitude}, ${order.gpsLongitude}` +
                      (order.gpsAccuracy != null ? ` (±${order.gpsAccuracy}m)` : "")
                    : "—"}
                </dd>
              </div>
            </>
          ) : null}
          <div>
            <dt className="text-[10px] uppercase text-[color:var(--muted-text)]">Current total</dt>
            <dd className="font-semibold tabular-nums">
              {money(Number(order.totalOmr))} {brand.currency}
              {order.orderStatus === OrderStatus.CANCELLED ? (
                <span className="ml-2 text-xs font-normal text-[color:var(--muted-text)]">(Cancelled)</span>
              ) : null}
            </dd>
          </div>
        </dl>
      </section>

      <section className="rounded-2xl border border-[color:var(--border-soft)] bg-[color:var(--card-beige)] p-4">
        <h2 className="text-xs font-bold uppercase tracking-wide text-[color:var(--brand-gold-muted)]">
          Line items
        </h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-[color:var(--border-soft)] text-[10px] uppercase text-[color:var(--muted-text)]">
                <th className="py-2 pr-2">Product</th>
                <th className="py-2 pr-2">Size</th>
                <th className="py-2 pr-2">Qty</th>
                <th className="py-2 pr-2">Unit</th>
                <th className="py-2">Line</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((line) => (
                <tr key={line.id} className="border-b border-[color:var(--border-soft)]/60">
                  <td className="py-2 pr-2">
                    <div className="font-medium">{line.productNameEn}</div>
                    <div className="text-xs text-[color:var(--muted-text)]">{line.productNameAr}</div>
                  </td>
                  <td className="py-2 pr-2 text-xs">
                    <div>{line.sizeLabelEn}</div>
                    <div className="text-[color:var(--muted-text)]">{line.sizeLabelAr}</div>
                  </td>
                  <td className="py-2 pr-2 tabular-nums">{line.quantity}</td>
                  <td className="py-2 pr-2 tabular-nums">{money(Number(line.unitPriceOmr))}</td>
                  <td className="py-2 tabular-nums font-semibold">{money(Number(line.lineTotalOmr))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4 space-y-1 border-t border-[color:var(--border-soft)] pt-3 text-sm">
          <div className="flex justify-between tabular-nums">
            <span className="text-[color:var(--muted-text)]">Dessert subtotal</span>
            <span>
              {money(Number(order.dessertSubtotalOmr))} {brand.currency}
            </span>
          </div>
          <div className="flex justify-between tabular-nums">
            <span className="text-[color:var(--muted-text)]">Delivery fee</span>
            <span>
              {order.deliveryFeeOmr != null
                ? `${money(Number(order.deliveryFeeOmr))} ${brand.currency}`
                : "—"}
            </span>
          </div>
          <div className="flex justify-between text-base font-bold tabular-nums text-[color:var(--accent-cocoa)]">
            <span>Total</span>
            <span>
              {money(Number(order.totalOmr))} {brand.currency}
            </span>
          </div>
        </div>
      </section>

      {order.adminNote ? (
        <section className="rounded-2xl border border-[color:var(--border-soft)] bg-[color:var(--card-beige)] p-4">
          <h2 className="text-xs font-bold uppercase tracking-wide text-[color:var(--brand-gold-muted)]">
            Admin note (read-only view)
          </h2>
          <p className="mt-2 whitespace-pre-wrap text-sm">{order.adminNote}</p>
        </section>
      ) : null}

      <section className="rounded-2xl border border-[color:var(--border-soft)] bg-[color:var(--card-beige)] p-4">
        <h2 className="text-xs font-bold uppercase tracking-wide text-[color:var(--brand-gold-muted)]">
          Stored WhatsApp message
        </h2>
        <pre className="mt-2 max-h-80 overflow-auto whitespace-pre-wrap rounded-xl bg-[color:var(--card-cream)] p-3 text-xs leading-relaxed">
          {order.whatsappMessage}
        </pre>
      </section>
    </div>
  );
}

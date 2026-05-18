import Link from "next/link";
import { notFound } from "next/navigation";

import { AdminCopyButton } from "@/components/admin/copy-button";
import {
  DeliveryStatus,
  FulfillmentMethod,
  OrderStatus,
  PaymentStatus,
} from "@prisma/client";

import {
  cancelOrderAction,
  updateDeliveryFeeAction,
  updateOrderCoreAction,
} from "./actions";
import { getAdminOrderById } from "@/lib/admin/dashboard-data";
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

      <section className="rounded-2xl border border-[color:var(--border-soft)] bg-[color:var(--card-beige)] p-4">
        <h2 className="text-xs font-bold uppercase tracking-wide text-[color:var(--brand-gold-muted)]">
          Status & payment
        </h2>
        <form action={updateOrderCoreAction} className="mt-4 grid gap-3 md:grid-cols-3">
          <input type="hidden" name="orderId" value={order.id} />
          <label className="block text-xs font-semibold text-[color:var(--muted-text)]">
            Order status
            <select
              name="orderStatus"
              defaultValue={order.orderStatus}
              className="mt-1 w-full rounded-xl border border-[color:var(--border-soft)] bg-white px-2 py-2 text-sm"
            >
              {Object.values(OrderStatus).map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-xs font-semibold text-[color:var(--muted-text)]">
            Payment
            <select
              name="paymentStatus"
              defaultValue={order.paymentStatus}
              className="mt-1 w-full rounded-xl border border-[color:var(--border-soft)] bg-white px-2 py-2 text-sm"
            >
              {Object.values(PaymentStatus).map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-xs font-semibold text-[color:var(--muted-text)]">
            Delivery status
            <select
              name="deliveryStatus"
              defaultValue={order.deliveryStatus}
              className="mt-1 w-full rounded-xl border border-[color:var(--border-soft)] bg-white px-2 py-2 text-sm"
            >
              {Object.values(DeliveryStatus).map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <div className="md:col-span-3">
            <button
              type="submit"
              className="rounded-xl bg-[color:var(--brand-burgundy)] px-4 py-2 text-sm font-semibold text-[color:var(--card-cream)] hover:brightness-110"
            >
              Save status changes
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-2xl border border-[color:var(--border-soft)] bg-[color:var(--card-beige)] p-4">
        <h2 className="text-xs font-bold uppercase tracking-wide text-[color:var(--brand-gold-muted)]">
          Delivery fee & total
        </h2>
        <p className="mt-1 text-xs text-[color:var(--muted-text)]">
          Updating the fee recalculates total as dessert subtotal + delivery fee (OMR, up to 3 decimals).
        </p>
        <form action={updateDeliveryFeeAction} className="mt-3 flex flex-wrap items-end gap-3">
          <input type="hidden" name="orderId" value={order.id} />
          <label className="text-xs font-semibold text-[color:var(--muted-text)]">
            Delivery fee (OMR)
            <input
              name="deliveryFeeOmr"
              type="text"
              inputMode="decimal"
              placeholder="empty = none"
              defaultValue={
                order.deliveryFeeOmr != null ? String(order.deliveryFeeOmr) : ""
              }
              className="mt-1 w-40 rounded-xl border border-[color:var(--border-soft)] bg-white px-2 py-2 text-sm tabular-nums"
            />
          </label>
          <button
            type="submit"
            className="rounded-xl bg-[color:var(--brand-burgundy)] px-4 py-2 text-sm font-semibold text-[color:var(--card-cream)] hover:brightness-110"
          >
            Update fee & total
          </button>
          <span className="text-sm tabular-nums text-[color:var(--muted-text)]">
            Current total: {money(Number(order.totalOmr))} {brand.currency}
          </span>
        </form>
      </section>

      {order.orderStatus !== OrderStatus.CANCELLED ? (
        <section className="rounded-2xl border border-[color:var(--brand-burgundy-soft)]/35 bg-[color:var(--card-cream)] p-4">
          <h2 className="text-xs font-bold uppercase tracking-wide text-[color:var(--brand-gold-muted)]">
            Cancel order
          </h2>
          <form action={cancelOrderAction} className="mt-3 space-y-2">
            <input type="hidden" name="orderId" value={order.id} />
            <label className="block text-xs font-semibold text-[color:var(--muted-text)]">
              Reason (optional)
              <textarea
                name="cancelReason"
                rows={2}
                placeholder="Why cancelled…"
                className="mt-1 w-full max-w-lg rounded-xl border border-[color:var(--border-soft)] bg-white px-2 py-2 text-sm"
              />
            </label>
            <button
              type="submit"
              className="rounded-xl border-2 border-[color:var(--brand-burgundy-soft)] bg-white px-4 py-2 text-sm font-semibold text-[color:var(--brand-burgundy)] hover:bg-[color:var(--card-beige)]"
            >
              Mark as cancelled
            </button>
          </form>
        </section>
      ) : (
        <p className="rounded-xl border border-[color:var(--border-soft)] bg-[color:var(--card-cream)] px-3 py-2 text-sm text-[color:var(--muted-text)]">
          Cancelled
          {order.cancelReason ? `: ${order.cancelReason}` : "."}
        </p>
      )}

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-[color:var(--border-soft)] bg-[color:var(--card-beige)] p-4">
          <h2 className="text-xs font-bold uppercase tracking-wide text-[color:var(--brand-gold-muted)]">
            Customer
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
        </div>
        <div className="rounded-2xl border border-[color:var(--border-soft)] bg-[color:var(--card-beige)] p-4">
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
          </dl>
        </div>
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
            <span>{money(Number(order.dessertSubtotalOmr))} {brand.currency}</span>
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

      {order.notes ? (
        <section className="rounded-2xl border border-[color:var(--border-soft)] bg-[color:var(--card-beige)] p-4">
          <h2 className="text-xs font-bold uppercase tracking-wide text-[color:var(--brand-gold-muted)]">
            Notes
          </h2>
          <p className="mt-2 whitespace-pre-wrap text-sm">{order.notes}</p>
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

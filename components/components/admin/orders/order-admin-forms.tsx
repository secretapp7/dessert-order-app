"use client";

import { DeliveryStatus, OrderStatus, PaymentStatus } from "@prisma/client";

import { AdminActionForm } from "@/components/admin/action-form";
import {
  archiveOrderFormAction,
  cancelOrderFormAction,
  unarchiveOrderFormAction,
  updateOrderCustomerNotesFormAction,
  updateOrderDeliveryFeeFormAction,
  updateOrderStatusesFormAction,
} from "@/lib/admin/actions/order-actions";

const field =
  "mt-1 w-full rounded-xl border border-[color:var(--border-soft)] bg-white px-2 py-2 text-sm";
const lbl = "block text-xs font-semibold text-[color:var(--muted-text)]";

export function OrderAdminForms({
  order,
}: {
  order: {
    id: string;
    publicId: string;
    archivedAtIso: string | null;
    orderStatus: OrderStatus;
    paymentStatus: PaymentStatus;
    deliveryStatus: DeliveryStatus;
    customerName: string;
    customerPhone: string;
    notes: string | null;
    adminNote: string | null;
    cancelReason: string | null;
    deliveryFeeOmr: string | null;
  };
}) {
  const isArchived = Boolean(order.archivedAtIso);
  const isCancelled = order.orderStatus === OrderStatus.CANCELLED;

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-[color:var(--border-soft)] bg-[color:var(--card-beige)] p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wide text-[color:var(--brand-gold-muted)]">
              Visibility
            </h2>
            <p className="mt-1 text-[11px] text-[color:var(--muted-text)]">
              {isArchived
                ? "This order is archived and hidden from the default list."
                : "Shown in the Active list."}{" "}
              Archiving preserves business history.
            </p>
          </div>
          {!isArchived ? (
            <AdminActionForm action={archiveOrderFormAction} className="flex flex-wrap items-center gap-2">
              <input type="hidden" name="orderId" value={order.id} />
              <button
                type="submit"
                className="rounded-xl border-2 border-amber-800/40 bg-amber-50 px-4 py-2 text-xs font-bold text-amber-950 hover:brightness-95"
              >
                Archive order
              </button>
              <span className="hidden text-[10px] text-[color:var(--muted-text)] sm:inline">
                Hides from default list
              </span>
            </AdminActionForm>
          ) : (
            <AdminActionForm action={unarchiveOrderFormAction} className="flex flex-wrap items-center gap-2">
              <input type="hidden" name="orderId" value={order.id} />
              <button
                type="submit"
                className="rounded-xl bg-[color:var(--brand-burgundy)] px-4 py-2 text-xs font-bold text-[color:var(--card-cream)] hover:brightness-110"
              >
                Unarchive order
              </button>
              <span className="hidden text-[10px] text-[color:var(--muted-text)] sm:inline">
                Restores to Active list
              </span>
            </AdminActionForm>
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-[color:var(--border-soft)] bg-[color:var(--card-beige)] p-4">
        <h2 className="text-xs font-bold uppercase tracking-wide text-[color:var(--brand-gold-muted)]">
          Status & payment
        </h2>
        <AdminActionForm action={updateOrderStatusesFormAction} className="mt-4 grid gap-3 md:grid-cols-3">
          <input type="hidden" name="orderId" value={order.id} />
          <label className={lbl}>
            Order status
            <select name="orderStatus" defaultValue={order.orderStatus} className={field}>
              {Object.values(OrderStatus).map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <label className={lbl}>
            Payment
            <select name="paymentStatus" defaultValue={order.paymentStatus} className={field}>
              {Object.values(PaymentStatus).map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <label className={lbl}>
            Delivery status
            <select name="deliveryStatus" defaultValue={order.deliveryStatus} className={field}>
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
        </AdminActionForm>
      </section>

      <section className="rounded-2xl border border-[color:var(--border-soft)] bg-[color:var(--card-beige)] p-4">
        <h2 className="text-xs font-bold uppercase tracking-wide text-[color:var(--brand-gold-muted)]">
          Delivery fee & total
        </h2>
        <p className="mt-1 text-xs text-[color:var(--muted-text)]">
          Updating the fee recalculates total as dessert subtotal + delivery fee (OMR, up to 3 decimals).
        </p>
        <AdminActionForm action={updateOrderDeliveryFeeFormAction} className="mt-3 flex flex-wrap items-end gap-3">
          <input type="hidden" name="orderId" value={order.id} />
          <label className={lbl}>
            Delivery fee (OMR)
            <input
              name="deliveryFeeOmr"
              type="text"
              inputMode="decimal"
              defaultValue={order.deliveryFeeOmr ?? ""}
              className="mt-1 w-40 rounded-xl border border-[color:var(--border-soft)] bg-white px-2 py-2 text-sm tabular-nums"
            />
            <span className="mt-1 block text-[10px] text-[color:var(--muted-text)]">Leave empty for none</span>
          </label>
          <button
            type="submit"
            className="rounded-xl bg-[color:var(--brand-burgundy)] px-4 py-2 text-sm font-semibold text-[color:var(--card-cream)] hover:brightness-110"
          >
            Update fee & total
          </button>
        </AdminActionForm>
      </section>

      <section className="rounded-2xl border border-[color:var(--border-soft)] bg-[color:var(--card-beige)] p-4">
        <h2 className="text-xs font-bold uppercase tracking-wide text-[color:var(--brand-gold-muted)]">
          Customer, notes & admin note
        </h2>
        <p className="mt-1 text-[11px] text-[color:var(--muted-text)]">
          Updates fields on this order only (does not rewrite the linked customer profile). Use for typos and
          internal tracking.
        </p>
        <AdminActionForm action={updateOrderCustomerNotesFormAction} className="mt-3 space-y-3">
          <input type="hidden" name="orderId" value={order.id} />
          <div className="grid gap-3 md:grid-cols-2">
            <label className={lbl}>
              Customer name
              <input name="customerName" required defaultValue={order.customerName} className={field} />
            </label>
            <label className={lbl}>
              Phone
              <input name="customerPhone" required defaultValue={order.customerPhone} className={field} />
            </label>
          </div>
          <label className={lbl}>
            Customer notes (from checkout)
            <textarea name="notes" rows={3} defaultValue={order.notes ?? ""} className={field} />
          </label>
          <label className={lbl}>
            Admin internal note
            <textarea name="adminNote" rows={2} defaultValue={order.adminNote ?? ""} className={field} />
          </label>
          {isCancelled ? (
            <label className={lbl}>
              Cancel reason
              <textarea name="cancelReason" rows={2} defaultValue={order.cancelReason ?? ""} className={field} />
            </label>
          ) : null}
          <button
            type="submit"
            className="rounded-xl bg-[color:var(--brand-burgundy)] px-4 py-2 text-sm font-semibold text-[color:var(--card-cream)] hover:brightness-110"
          >
            Save customer & notes
          </button>
        </AdminActionForm>
      </section>

      {!isCancelled ? (
        <section className="rounded-2xl border border-[color:var(--brand-burgundy-soft)]/35 bg-[color:var(--card-cream)] p-4">
          <h2 className="text-xs font-bold uppercase tracking-wide text-[color:var(--brand-gold-muted)]">
            Cancel order
          </h2>
          <p className="mt-1 text-[11px] text-[color:var(--muted-text)]">
            Cancelling keeps the record and sets status to CANCELLED. Use Archive if you only want to hide the row
            from the default list.
          </p>
          <AdminActionForm action={cancelOrderFormAction} className="mt-3 space-y-2">
            <input type="hidden" name="orderId" value={order.id} />
            <label className={lbl}>
              Reason (optional)
              <textarea name="cancelReason" rows={2} className={field} />
            </label>
            <button
              type="submit"
              className="rounded-xl border-2 border-[color:var(--brand-burgundy-soft)] bg-white px-4 py-2 text-sm font-semibold text-[color:var(--brand-burgundy)] hover:bg-[color:var(--card-beige)]"
            >
              Mark as cancelled
            </button>
          </AdminActionForm>
        </section>
      ) : (
        <p className="rounded-xl border border-[color:var(--border-soft)] bg-[color:var(--card-cream)] px-3 py-2 text-sm text-[color:var(--muted-text)]">
          Cancelled
          {order.cancelReason ? `: ${order.cancelReason}` : "."}
        </p>
      )}
    </div>
  );
}

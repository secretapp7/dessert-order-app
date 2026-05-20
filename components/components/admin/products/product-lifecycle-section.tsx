"use client";

import { AdminActionForm } from "@/components/admin/action-form";
import {
  activateProductFormAction,
  deleteProductFormAction,
  hideProductFormAction,
  soldOutProductFormAction,
} from "@/lib/admin/actions/product-actions";

const btnSolid =
  "rounded-lg bg-[color:var(--brand-burgundy)] px-3 py-2 text-xs font-semibold text-[color:var(--card-cream)] hover:brightness-110";
const btnGhost = "rounded-lg border border-[color:var(--border-soft)] px-3 py-2 text-xs font-semibold hover:bg-white/80";

export function ProductLifecycleSection({ productId, slug }: { productId: string; slug: string }) {
  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-xs font-bold uppercase tracking-wide text-[color:var(--brand-gold-muted)]">
          Visibility & availability
        </h2>
        <p className="mt-1 text-[11px] text-[color:var(--muted-text)]">
          Quick actions on top of the Status field in “Core details”. Hiding is safer than deleting when there is
          any chance of past orders.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <AdminActionForm action={activateProductFormAction} className="inline">
          <input type="hidden" name="id" value={productId} />
          <button type="submit" className={btnSolid}>
            Activate
          </button>
        </AdminActionForm>
        <AdminActionForm action={soldOutProductFormAction} className="inline">
          <input type="hidden" name="id" value={productId} />
          <button type="submit" className={btnGhost}>
            Mark sold out
          </button>
        </AdminActionForm>
        <AdminActionForm action={hideProductFormAction} className="inline">
          <input type="hidden" name="id" value={productId} />
          <button type="submit" className={btnGhost}>
            Hide
          </button>
        </AdminActionForm>
      </div>

      <div className="rounded-xl border border-[color:var(--brand-burgundy-soft)]/40 bg-[color:var(--card-cream)] p-3">
        <h3 className="text-[10px] font-bold uppercase tracking-wide text-[color:var(--brand-gold-muted)]">
          Delete permanently
        </h3>
        <p className="mt-1 text-[11px] text-[color:var(--muted-text)]">
          Only allowed when this product never appears on orders. Otherwise use Hide instead. Type the slug{" "}
          <span className="font-mono">{slug}</span> exactly to confirm.
        </p>
        <AdminActionForm action={deleteProductFormAction} className="mt-2 space-y-2">
          <input type="hidden" name="id" value={productId} />
          <label className="block text-[11px] font-semibold text-[color:var(--muted-text)]">
            Confirm slug (lowercase)
            <input name="confirmSlug" autoComplete="off" className="mt-1 w-full max-w-sm rounded-lg border border-[color:var(--border-soft)] bg-white px-2 py-1.5 font-mono text-sm" />
          </label>
          <button type="submit" className="rounded-lg border-2 border-[color:var(--brand-burgundy-soft)] bg-white px-3 py-2 text-xs font-bold text-[color:var(--brand-burgundy)]">
            Delete product permanently
          </button>
        </AdminActionForm>
      </div>
    </div>
  );
}

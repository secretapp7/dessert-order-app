"use client";

import { AdminActionForm } from "@/components/admin/action-form";
import {
  approveReviewFormAction,
  createReviewFormAction,
  deleteReviewFormAction,
  featureReviewFormAction,
  hideReviewFormAction,
  unfeatureReviewFormAction,
  updateReviewFormAction,
} from "@/lib/admin/actions/review-actions";
import type { ReviewAdminClientRecord } from "@/lib/admin/data/review-serialize";
import type { ReviewProductOption } from "@/lib/admin/data/review-queries";

const field =
  "mt-1 w-full rounded-lg border border-[color:var(--border-soft)] bg-white px-2 py-1.5 text-sm";
const lbl = "block text-[11px] font-semibold text-[color:var(--muted-text)]";
const btn =
  "rounded-lg bg-[color:var(--brand-burgundy)] px-3 py-2 text-xs font-semibold text-[color:var(--card-cream)]";
const btnGhost =
  "rounded-lg border border-[color:var(--border-soft)] px-3 py-2 text-xs font-semibold hover:bg-white";

const SOURCE_OPTIONS = ["Instagram", "WhatsApp", "Manual", "Customer"] as const;

function ProductSelect({
  products,
  defaultValue,
}: {
  products: ReviewProductOption[];
  defaultValue?: string | null;
}) {
  return (
    <select name="productId" defaultValue={defaultValue ?? ""} className={field}>
      <option value="">— General / no product —</option>
      {products.map((p) => (
        <option key={p.id} value={p.id}>
          {p.nameEn} ({p.slug})
        </option>
      ))}
    </select>
  );
}

function ReviewFields({
  products,
  review,
}: {
  products: ReviewProductOption[];
  review?: ReviewAdminClientRecord;
}) {
  return (
    <>
      <label className={lbl}>
        Product (optional)
        <ProductSelect products={products} defaultValue={review?.productId} />
      </label>
      <div className="grid gap-2 sm:grid-cols-2">
        <label className={lbl}>
          Customer name (EN) *
          <input name="customerName" required defaultValue={review?.customerName ?? ""} className={field} />
        </label>
        <label className={lbl}>
          Customer name (AR)
          <input
            name="customerNameAr"
            defaultValue={review?.customerNameAr ?? ""}
            className={field}
            dir="rtl"
          />
        </label>
      </div>
      <div className="grid gap-2 sm:grid-cols-3">
        <label className={lbl}>
          Rating (1–5) *
          <input
            name="rating"
            type="number"
            min={1}
            max={5}
            required
            defaultValue={review?.rating ?? 5}
            className={field}
          />
        </label>
        <label className={lbl}>
          Source
          <select name="source" defaultValue={review?.source ?? ""} className={field}>
            <option value="">—</option>
            {SOURCE_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label className={lbl}>
          Review date (UTC, optional)
          <input name="reviewDate" type="date" defaultValue={review?.reviewDateIso ?? ""} className={field} />
        </label>
      </div>
      <label className={lbl}>
        Comment (EN) *
        <textarea name="textEn" required rows={4} defaultValue={review?.textEn ?? ""} className={field} />
      </label>
      <label className={lbl}>
        Comment (AR)
        <textarea name="textAr" rows={4} defaultValue={review?.textAr ?? ""} className={field} dir="rtl" />
      </label>
      <div className="grid gap-2 sm:grid-cols-2">
        <label className={lbl}>
          Sort order
          <input
            name="sortOrder"
            type="number"
            defaultValue={review?.sortOrder ?? 0}
            className={field}
          />
        </label>
        {review ? (
          <label className={lbl}>
            Status
            <select name="status" defaultValue={review.status} className={field}>
              <option value="APPROVED">Approved (visible publicly)</option>
              <option value="PENDING">Pending</option>
              <option value="HIDDEN">Hidden</option>
            </select>
          </label>
        ) : null}
      </div>
      <div className="flex flex-wrap gap-4">
        {!review ? (
          <label className={`${lbl} flex items-center gap-2`}>
            <input type="checkbox" name="isApproved" className="h-4 w-4" />
            Approved
          </label>
        ) : null}
        <label className={`${lbl} flex items-center gap-2`}>
          <input
            type="checkbox"
            name="featured"
            defaultChecked={review?.featured ?? false}
            className="h-4 w-4"
          />
          Featured
        </label>
        <label className={`${lbl} flex items-center gap-2`}>
          <input
            type="checkbox"
            name="verifiedOrder"
            defaultChecked={review?.verifiedOrder ?? false}
            className="h-4 w-4"
          />
          Verified order
        </label>
      </div>
    </>
  );
}

export function ReviewCreateForm({ products }: { products: ReviewProductOption[] }) {
  return (
    <AdminActionForm action={createReviewFormAction} className="max-w-2xl space-y-3">
      <ReviewFields products={products} />
      <button type="submit" className={btn}>
        Create review
      </button>
    </AdminActionForm>
  );
}

export function ReviewEditForm({
  review,
  products,
}: {
  review: ReviewAdminClientRecord;
  products: ReviewProductOption[];
}) {
  return (
    <>
      <AdminActionForm action={updateReviewFormAction} className="max-w-3xl space-y-3">
        <input type="hidden" name="id" value={review.id} />
        <ReviewFields products={products} review={review} />
        <button type="submit" className={btn}>
          Save changes
        </button>
      </AdminActionForm>

      <div className="mt-6 flex flex-wrap gap-2 border-t border-[color:var(--border-soft)] pt-4">
        {review.status !== "APPROVED" ? (
          <AdminActionForm action={approveReviewFormAction} className="inline">
            <input type="hidden" name="id" value={review.id} />
            <button type="submit" className={btnGhost}>
              Approve
            </button>
          </AdminActionForm>
        ) : (
          <AdminActionForm action={hideReviewFormAction} className="inline">
            <input type="hidden" name="id" value={review.id} />
            <button type="submit" className={btnGhost}>
              Hide
            </button>
          </AdminActionForm>
        )}
        {!review.featured ? (
          <AdminActionForm action={featureReviewFormAction} className="inline">
            <input type="hidden" name="id" value={review.id} />
            <button type="submit" className={btnGhost}>
              Feature
            </button>
          </AdminActionForm>
        ) : (
          <AdminActionForm action={unfeatureReviewFormAction} className="inline">
            <input type="hidden" name="id" value={review.id} />
            <button type="submit" className={btnGhost}>
              Unfeature
            </button>
          </AdminActionForm>
        )}
      </div>

      <section className="mt-8 rounded-xl border border-[color:var(--brand-burgundy-soft)]/30 bg-[color:var(--card-cream)] p-4">
        <h3 className="text-xs font-bold uppercase tracking-wide text-[color:var(--brand-burgundy-soft)]">
          Delete review
        </h3>
        <p className="mt-1 text-[11px] text-[color:var(--muted-text)]">
          Reviews are marketing content and can be permanently deleted. Type the customer name exactly to confirm.
        </p>
        <AdminActionForm action={deleteReviewFormAction} className="mt-3 max-w-md space-y-2">
          <input type="hidden" name="id" value={review.id} />
          <label className={lbl}>
            Type customer name: <span className="font-mono">{review.customerName}</span>
            <input name="confirmName" required className={field} autoComplete="off" />
          </label>
          <label className={`${lbl} flex items-center gap-2`}>
            <input type="checkbox" name="confirmDelete" required className="h-4 w-4" />
            I understand this cannot be undone
          </label>
          <button
            type="submit"
            className="rounded-lg border border-[color:var(--brand-burgundy-soft)] bg-white px-3 py-2 text-xs font-semibold text-[color:var(--brand-burgundy-soft)] hover:bg-[color:var(--card-beige)]"
          >
            Delete permanently
          </button>
        </AdminActionForm>
      </section>
    </>
  );
}

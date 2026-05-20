"use client";

import { AdminActionForm } from "@/components/admin/action-form";
import { ImageUploadField } from "@/components/admin/image-upload-field";
import {
  activateOfferFormAction,
  createOfferFormAction,
  deactivateOfferFormAction,
  deleteOfferFormAction,
  featureOfferFormAction,
  unfeatureOfferFormAction,
  updateOfferFormAction,
} from "@/lib/admin/actions/offer-actions";
import type { OfferAdminClientRecord } from "@/lib/admin/offer-admin-record";

const field =
  "mt-1 w-full rounded-lg border border-[color:var(--border-soft)] bg-white px-2 py-1.5 text-sm";
const lbl = "block text-[11px] font-semibold text-[color:var(--muted-text)]";
const btn =
  "rounded-lg bg-[color:var(--brand-burgundy)] px-3 py-2 text-xs font-semibold text-[color:var(--card-cream)]";
const btnGhost =
  "rounded-lg border border-[color:var(--border-soft)] px-3 py-2 text-xs font-semibold hover:bg-white";

export function OfferCreateForm({ uploadAvailable = true }: { uploadAvailable?: boolean }) {
  return (
    <AdminActionForm action={createOfferFormAction} className="max-w-2xl space-y-3">
      <div className="grid gap-2 sm:grid-cols-2">
        <label className={lbl}>
          Slug (lowercase, hyphens)
          <input name="slug" required className={field} />
        </label>
        <label className={lbl}>
          Price (OMR)
          <input name="priceOmr" required inputMode="decimal" defaultValue="0" className={field} />
        </label>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <label className={lbl}>
          Title (EN)
          <input name="titleEn" required className={field} />
        </label>
        <label className={lbl}>
          Title (AR)
          <input name="titleAr" required className={field} dir="rtl" />
        </label>
      </div>
      <label className={lbl}>
        Description (EN)
        <textarea name="descriptionEn" required rows={3} className={field} />
      </label>
      <label className={lbl}>
        Description (AR)
        <textarea name="descriptionAr" required rows={3} className={field} dir="rtl" />
      </label>
      <ImageUploadField
        inputName="imageUrl"
        label="Offer image (optional)"
        section="offers"
        inputClassName={field}
        uploadAvailable={uploadAvailable}
      />
      <div className="grid gap-2 sm:grid-cols-2">
        <label className={lbl}>
          Starts at (UTC, optional)
          <input name="startsAt" type="datetime-local" className={field} />
        </label>
        <label className={lbl}>
          Ends at (UTC, optional)
          <input name="endsAt" type="datetime-local" className={field} />
        </label>
      </div>
      <label className={`${lbl} flex items-center gap-2`}>
        <input type="checkbox" name="isActive" defaultChecked className="h-4 w-4" />
        Active
      </label>
      <label className={`${lbl} flex items-center gap-2`}>
        <input type="checkbox" name="featuredOnHome" className="h-4 w-4" />
        Featured on home
      </label>
      <button type="submit" className={btn}>
        Create offer
      </button>
    </AdminActionForm>
  );
}

export function OfferEditForm({
  offer,
  uploadAvailable = true,
}: {
  offer: OfferAdminClientRecord;
  uploadAvailable?: boolean;
}) {
  return (
    <>
      <AdminActionForm action={updateOfferFormAction} className="max-w-3xl space-y-3">
        <input type="hidden" name="id" value={offer.id} />
        <div className="grid gap-2 sm:grid-cols-2">
          <label className={lbl}>
            Slug
            <input name="slug" required defaultValue={offer.slug} className={field} />
          </label>
          <label className={lbl}>
            Price (OMR)
            <input name="priceOmr" required inputMode="decimal" defaultValue={offer.priceOmr} className={field} />
          </label>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <label className={lbl}>
            Title (EN)
            <input name="titleEn" required defaultValue={offer.titleEn} className={field} />
          </label>
          <label className={lbl}>
            Title (AR)
            <input name="titleAr" required defaultValue={offer.titleAr} className={field} dir="rtl" />
          </label>
        </div>
        <label className={lbl}>
          Description (EN)
          <textarea name="descriptionEn" required rows={3} defaultValue={offer.descriptionEn} className={field} />
        </label>
        <label className={lbl}>
          Description (AR)
          <textarea name="descriptionAr" required rows={3} defaultValue={offer.descriptionAr} className={field} dir="rtl" />
        </label>
        <ImageUploadField
          inputName="imageUrl"
          label="Offer image (optional)"
          defaultValue={offer.imageUrl ?? ""}
          section="offers"
          entitySlug={offer.slug}
          entityId={offer.id}
          inputClassName={field}
          uploadAvailable={uploadAvailable}
        />
        <div className="grid gap-2 sm:grid-cols-2">
          <label className={lbl}>
            Starts at (UTC, optional)
            <input
              name="startsAt"
              type="datetime-local"
              defaultValue={offer.startsAtLocal}
              className={field}
            />
          </label>
          <label className={lbl}>
            Ends at (UTC, optional)
            <input name="endsAt" type="datetime-local" defaultValue={offer.endsAtLocal} className={field} />
          </label>
        </div>
        <label className={`${lbl} flex items-center gap-2`}>
          <input type="checkbox" name="isActive" defaultChecked={offer.isActive} className="h-4 w-4" />
          Active
        </label>
        <label className={`${lbl} flex items-center gap-2`}>
          <input type="checkbox" name="featuredOnHome" defaultChecked={offer.featuredOnHome} className="h-4 w-4" />
          Featured on home
        </label>
        <button type="submit" className={btn}>
          Save offer
        </button>
      </AdminActionForm>

      <div className="mt-8 max-w-3xl space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wide text-[color:var(--brand-gold-muted)]">Quick actions</h2>
        <div className="flex flex-wrap gap-2">
          <AdminActionForm action={activateOfferFormAction} className="inline">
            <input type="hidden" name="id" value={offer.id} />
            <button type="submit" className={btn}>
              Activate
            </button>
          </AdminActionForm>
          <AdminActionForm action={deactivateOfferFormAction} className="inline">
            <input type="hidden" name="id" value={offer.id} />
            <button type="submit" className={btnGhost}>
              Deactivate
            </button>
          </AdminActionForm>
          <AdminActionForm action={featureOfferFormAction} className="inline">
            <input type="hidden" name="id" value={offer.id} />
            <button type="submit" className={btnGhost}>
              Feature on home
            </button>
          </AdminActionForm>
          <AdminActionForm action={unfeatureOfferFormAction} className="inline">
            <input type="hidden" name="id" value={offer.id} />
            <button type="submit" className={btnGhost}>
              Remove home feature
            </button>
          </AdminActionForm>
        </div>
      </div>

      <div className="mt-8 max-w-3xl space-y-2 rounded-xl border border-[color:var(--brand-burgundy-soft)]/40 bg-[color:var(--card-cream)] p-4">
        <h2 className="text-[10px] font-bold uppercase tracking-wide text-[color:var(--brand-gold-muted)]">
          Delete permanently
        </h2>
        <p className="text-[11px] text-[color:var(--muted-text)]">
          Offers are not linked to order history yet. If that changes, switch to archive/disable. Type slug{" "}
          <span className="font-mono">{offer.slug}</span>.
        </p>
        <AdminActionForm action={deleteOfferFormAction} className="space-y-2">
          <input type="hidden" name="id" value={offer.id} />
          <label className={lbl}>
            Confirm slug (lowercase)
            <input name="confirmSlug" autoComplete="off" className={`${field} font-mono`} />
          </label>
          <label className={`${lbl} flex items-start gap-2 text-[11px]`}>
            <input type="checkbox" name="confirmDelete" required className="mt-1 h-4 w-4" />I understand this cannot be
            undone.
          </label>
          <button
            type="submit"
            className="rounded-lg border-2 border-[color:var(--brand-burgundy-soft)] bg-white px-3 py-2 text-xs font-bold text-[color:var(--brand-burgundy)]"
          >
            Delete offer permanently
          </button>
        </AdminActionForm>
      </div>
    </>
  );
}

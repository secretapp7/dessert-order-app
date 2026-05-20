"use client";

import { AdminActionForm } from "@/components/admin/action-form";
import {
  activateCategoryFormAction,
  createCategoryFormAction,
  deactivateCategoryFormAction,
  deleteCategoryFormAction,
  updateCategoryFormAction,
} from "@/lib/admin/actions/category-actions";

const activateBtn =
  "rounded-xl bg-[color:var(--brand-burgundy)] px-4 py-2 text-sm font-semibold text-[color:var(--card-cream)] hover:brightness-110";

const deactivateBtn =
  "rounded-xl border border-[color:var(--border-soft)] px-4 py-2 text-sm font-semibold text-[color:var(--brand-burgundy)] hover:bg-[color:var(--card-cream)]";
const field =
  "mt-1 w-full rounded-lg border border-[color:var(--border-soft)] bg-white px-2 py-1.5 text-sm";
const lbl = "block text-[11px] font-semibold text-[color:var(--muted-text)]";

export function CategoryCreateForm() {
  return (
    <AdminActionForm action={createCategoryFormAction} className="max-w-2xl space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className={lbl}>
          Slug (lowercase, hyphens)
          <input name="slug" required className={field} />
        </label>
        <label className={lbl}>
          Sort order
          <input name="sortOrder" type="number" defaultValue={0} className={field} />
        </label>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className={lbl}>
          Name (EN)
          <input name="nameEn" required className={field} />
        </label>
        <label className={lbl}>
          Name (AR)
          <input name="nameAr" required className={field} dir="rtl" />
        </label>
      </div>
      <label className={lbl}>
        Description (EN, optional)
        <textarea name="descriptionEn" rows={2} className={field} />
      </label>
      <label className={lbl}>
        Description (AR, optional)
        <textarea name="descriptionAr" rows={2} className={field} dir="rtl" />
      </label>
      <label className={`${lbl} flex items-center gap-2`}>
        <input type="checkbox" name="isActive" defaultChecked className="h-4 w-4" />
        Active (visible for assignment)
      </label>
      <button
        type="submit"
        className="rounded-xl bg-[color:var(--brand-burgundy)] px-4 py-2.5 text-sm font-semibold text-[color:var(--card-cream)] hover:brightness-110"
      >
        Create category
      </button>
    </AdminActionForm>
  );
}

export function CategoryEditForm({
  category,
}: {
  category: {
    id: string;
    slug: string;
    nameEn: string;
    nameAr: string;
    descriptionEn: string | null;
    descriptionAr: string | null;
    sortOrder: number;
    isActive: boolean;
  };
}) {
  return (
    <AdminActionForm action={updateCategoryFormAction} className="max-w-2xl space-y-4">
      <input type="hidden" name="id" value={category.id} />
      <div className="grid gap-3 sm:grid-cols-2">
        <label className={lbl}>
          Slug (lowercase, hyphens)
          <input name="slug" required defaultValue={category.slug} className={field} />
        </label>
        <label className={lbl}>
          Sort order
          <input name="sortOrder" type="number" defaultValue={category.sortOrder} className={field} />
        </label>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className={lbl}>
          Name (EN)
          <input name="nameEn" required defaultValue={category.nameEn} className={field} />
        </label>
        <label className={lbl}>
          Name (AR)
          <input name="nameAr" required defaultValue={category.nameAr} className={field} dir="rtl" />
        </label>
      </div>
      <label className={lbl}>
        Description (EN, optional)
        <textarea name="descriptionEn" rows={2} defaultValue={category.descriptionEn ?? ""} className={field} />
      </label>
      <label className={lbl}>
        Description (AR, optional)
        <textarea name="descriptionAr" rows={2} defaultValue={category.descriptionAr ?? ""} className={field} dir="rtl" />
      </label>
      <label className={`${lbl} flex items-center gap-2`}>
        <input type="checkbox" name="isActive" defaultChecked={category.isActive} className="h-4 w-4" />
        Active
      </label>
      <p className="text-[11px] text-[color:var(--muted-text)]">
        Categories with products cannot be deleted; deactivate to hide from new assignments.
      </p>
      <button
        type="submit"
        className="rounded-xl bg-[color:var(--brand-burgundy)] px-4 py-2.5 text-sm font-semibold text-[color:var(--card-cream)] hover:brightness-110"
      >
        Save category
      </button>
    </AdminActionForm>
  );
}

export function CategoryLifecycleSection({ categoryId, slug }: { categoryId: string; slug: string }) {
  return (
    <div className="mt-8 max-w-2xl space-y-4">
      <div>
        <h2 className="text-xs font-bold uppercase tracking-wide text-[color:var(--brand-gold-muted)]">
          Activation & deletion
        </h2>
        <p className="mt-1 text-[11px] text-[color:var(--muted-text)]">
          The main form includes the Active checkbox; these shortcuts follow the same rules for quick operations.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <AdminActionForm action={activateCategoryFormAction} className="inline">
          <input type="hidden" name="id" value={categoryId} />
          <button type="submit" className={activateBtn}>
            Activate
          </button>
        </AdminActionForm>
        <AdminActionForm action={deactivateCategoryFormAction} className="inline">
          <input type="hidden" name="id" value={categoryId} />
          <button type="submit" className={deactivateBtn}>
            Deactivate
          </button>
        </AdminActionForm>
      </div>

      <div className="rounded-xl border border-[color:var(--brand-burgundy-soft)]/40 bg-[color:var(--card-cream)] p-4">
        <h3 className="text-[10px] font-bold uppercase tracking-wide text-[color:var(--brand-gold-muted)]">
          Delete category permanently
        </h3>
        <p className="mt-1 text-[11px] text-[color:var(--muted-text)]">
          Only when no products reference this category. Otherwise deactivate or move products first. Type slug{" "}
          <span className="font-mono">{slug}</span> exactly to confirm.
        </p>
        <AdminActionForm action={deleteCategoryFormAction} className="mt-3 space-y-2">
          <input type="hidden" name="id" value={categoryId} />
          <label className={lbl}>
            Confirm slug (lowercase)
            <input name="confirmSlug" autoComplete="off" className={`${field} font-mono`} />
          </label>
          <button
            type="submit"
            className="rounded-xl border-2 border-[color:var(--brand-burgundy-soft)] bg-white px-4 py-2 text-sm font-bold text-[color:var(--brand-burgundy)]"
          >
            Delete category permanently
          </button>
        </AdminActionForm>
      </div>
    </div>
  );
}

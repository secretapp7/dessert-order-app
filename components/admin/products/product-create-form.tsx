"use client";

import { ProductStatus } from "@prisma/client";

import { AdminActionForm } from "@/components/admin/action-form";
import { createProductFormAction } from "@/lib/admin/actions/product-actions";

const field =
  "mt-1 w-full rounded-lg border border-[color:var(--border-soft)] bg-white px-2 py-1.5 text-sm";
const lbl = "block text-[11px] font-semibold text-[color:var(--muted-text)]";

type Cat = { id: string; slug: string; nameEn: string };

export function ProductCreateForm({ categories }: { categories: Cat[] }) {
  return (
    <AdminActionForm action={createProductFormAction} className="max-w-2xl space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className={lbl}>
          Slug (lowercase, hyphens)
          <input name="slug" required className={field} />
        </label>
        <label className={lbl}>
          Category
          <select name="categoryId" className={field}>
            <option value="">— None —</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nameEn} ({c.slug})
              </option>
            ))}
          </select>
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
        Description (EN)
        <textarea name="descriptionEn" required rows={3} className={field} />
      </label>
      <label className={lbl}>
        Description (AR)
        <textarea name="descriptionAr" required rows={3} className={field} dir="rtl" />
      </label>
      <div className="grid gap-3 sm:grid-cols-3">
        <label className={lbl}>
          Status
          <select name="status" className={field} defaultValue={ProductStatus.ACTIVE}>
            {Object.values(ProductStatus).map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label className={lbl}>
          Sort order
          <input name="sortOrder" type="number" defaultValue={0} className={field} />
        </label>
        <label className={`${lbl} flex items-end gap-2 pb-2`}>
          <input type="checkbox" name="featured" className="h-4 w-4" />
          <span>Featured</span>
        </label>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className={lbl}>
          Badge (EN, optional)
          <input name="badgeEn" className={field} />
        </label>
        <label className={lbl}>
          Badge (AR, optional)
          <input name="badgeAr" className={field} dir="rtl" />
        </label>
      </div>

      <div className="rounded-xl border border-[color:var(--border-soft)] bg-[color:var(--card-beige)] p-3">
        <p className="text-[10px] font-bold uppercase tracking-wide text-[color:var(--brand-gold-muted)]">
          First size (required)
        </p>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          <label className={lbl}>
            Label EN
            <input name="size_labelEn" required className={field} />
          </label>
          <label className={lbl}>
            Label AR
            <input name="size_labelAr" required className={field} dir="rtl" />
          </label>
          <label className={lbl}>
            Serves EN
            <input name="size_servesEn" required className={field} />
          </label>
          <label className={lbl}>
            Serves AR
            <input name="size_servesAr" required className={field} dir="rtl" />
          </label>
          <label className={lbl}>
            Price (OMR)
            <input name="size_priceOmr" type="text" inputMode="decimal" required className={field} />
          </label>
          <label className={lbl}>
            Sort order
            <input name="size_sortOrder" type="number" defaultValue={0} className={field} />
          </label>
          <label className={lbl}>
            Ingredient cost
            <input name="size_ingredientCostOmr" type="text" inputMode="decimal" defaultValue="0" className={field} />
          </label>
          <label className={lbl}>
            Packaging cost
            <input name="size_packagingCostOmr" type="text" inputMode="decimal" defaultValue="0" className={field} />
          </label>
          <label className={lbl}>
            Labor cost
            <input name="size_laborCostOmr" type="text" inputMode="decimal" defaultValue="0" className={field} />
          </label>
          <label className={`${lbl} flex items-end gap-2 pb-2`}>
            <input type="checkbox" name="size_isActive" defaultChecked className="h-4 w-4" />
            <span>Size active</span>
          </label>
        </div>
      </div>

      <button
        type="submit"
        className="rounded-xl bg-[color:var(--brand-burgundy)] px-4 py-2.5 text-sm font-semibold text-[color:var(--card-cream)] hover:brightness-110"
      >
        Create product
      </button>
    </AdminActionForm>
  );
}

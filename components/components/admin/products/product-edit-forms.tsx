"use client";

import { ProductImageType, ProductStatus } from "@prisma/client";

import { AdminActionForm } from "@/components/admin/action-form";
import { ImageUploadField } from "@/components/admin/image-upload-field";
import {
  createProductImageFormAction,
  createProductSizeFormAction,
  deactivateProductSizeFormAction,
  deleteProductImageFormAction,
  deleteProductSizeFormAction,
  updateProductFormAction,
  updateProductImageFormAction,
  updateProductSizeFormAction,
} from "@/lib/admin/actions/product-actions";

const field =
  "mt-1 w-full rounded-lg border border-[color:var(--border-soft)] bg-white px-2 py-1.5 text-sm";
const lbl = "block text-[11px] font-semibold text-[color:var(--muted-text)]";

function profitMeta(s: SerializedSize): { profit: string; margin: string | null } {
  const price = Number(s.priceOmr);
  const costs =
    Number(s.ingredientCostOmr) + Number(s.packagingCostOmr) + Number(s.laborCostOmr);
  const profit = price - costs;
  if (!Number.isFinite(profit)) return { profit: "—", margin: null };
  if (price === 0) return { profit: profit.toFixed(3), margin: null };
  return {
    profit: profit.toFixed(3),
    margin: ((profit / price) * 100).toFixed(2),
  };
}

export type SerializedSize = {
  id: string;
  labelEn: string;
  labelAr: string;
  servesEn: string;
  servesAr: string;
  priceOmr: string;
  ingredientCostOmr: string;
  packagingCostOmr: string;
  laborCostOmr: string;
  sortOrder: number;
  isActive: boolean;
};

export type SerializedImage = {
  id: string;
  type: ProductImageType;
  url: string;
  altEn: string | null;
  altAr: string | null;
  sortOrder: number;
};

type Cat = { id: string; slug: string; nameEn: string };

export function ProductCoreEditForm({
  product,
  categories,
}: {
  product: {
    id: string;
    slug: string;
    nameEn: string;
    nameAr: string;
    descriptionEn: string;
    descriptionAr: string;
    categoryId: string | null;
    status: ProductStatus;
    badgeEn: string | null;
    badgeAr: string | null;
    featured: boolean;
    sortOrder: number;
  };
  categories: Cat[];
}) {
  return (
    <AdminActionForm action={updateProductFormAction} className="space-y-3">
      <input type="hidden" name="id" value={product.id} />
      <div className="grid gap-2 sm:grid-cols-2">
        <label className={lbl}>
          Slug
          <input name="slug" required defaultValue={product.slug} className={field} />
        </label>
        <label className={lbl}>
          Category
          <select name="categoryId" defaultValue={product.categoryId ?? ""} className={field}>
            <option value="">— None —</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nameEn}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <label className={lbl}>
          Name (EN)
          <input name="nameEn" required defaultValue={product.nameEn} className={field} />
        </label>
        <label className={lbl}>
          Name (AR)
          <input name="nameAr" required defaultValue={product.nameAr} className={field} dir="rtl" />
        </label>
      </div>
      <label className={lbl}>
        Description (EN)
        <textarea name="descriptionEn" required rows={3} defaultValue={product.descriptionEn} className={field} />
      </label>
      <label className={lbl}>
        Description (AR)
        <textarea name="descriptionAr" required rows={3} defaultValue={product.descriptionAr} className={field} dir="rtl" />
      </label>
      <div className="grid gap-2 sm:grid-cols-3">
        <label className={lbl}>
          Status
          <select name="status" defaultValue={product.status} className={field}>
            {Object.values(ProductStatus).map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label className={lbl}>
          Sort order
          <input name="sortOrder" type="number" defaultValue={product.sortOrder} className={field} />
        </label>
        <label className={`${lbl} flex items-end gap-2 pb-2`}>
          <input type="checkbox" name="featured" defaultChecked={product.featured} className="h-4 w-4" />
          <span>Featured</span>
        </label>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <label className={lbl}>
          Badge EN
          <input name="badgeEn" defaultValue={product.badgeEn ?? ""} className={field} />
        </label>
        <label className={lbl}>
          Badge AR
          <input name="badgeAr" defaultValue={product.badgeAr ?? ""} className={field} dir="rtl" />
        </label>
      </div>
      <button
        type="submit"
        className="rounded-lg bg-[color:var(--brand-burgundy)] px-4 py-2 text-sm font-semibold text-[color:var(--card-cream)]"
      >
        Save product
      </button>
    </AdminActionForm>
  );
}

export function ProductSizesSection({ productId, sizes }: { productId: string; sizes: SerializedSize[] }) {
  return (
    <div className="space-y-4">
      <h2 className="text-xs font-bold uppercase tracking-wide text-[color:var(--brand-gold-muted)]">Sizes</h2>
      <div className="space-y-4">
        {sizes.map((s) => {
          const { profit, margin } = profitMeta(s);
          return (
            <div
              key={s.id}
              className="rounded-xl border border-[color:var(--border-soft)] bg-[color:var(--card-beige)] p-3"
            >
              <div className="mb-2 flex flex-wrap items-center gap-3 text-[11px] text-[color:var(--muted-text)]">
                <span
                  className={
                    s.isActive
                      ? "rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-950"
                      : "rounded-full bg-stone-200 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-stone-800"
                  }
                >
                  {s.isActive ? "Active" : "Inactive"}
                </span>
                <span>
                  Est. profit:{" "}
                  <strong className="font-mono text-[color:var(--foreground)]">{profit}</strong> OMR
                </span>
                {margin !== null ? (
                  <span>
                    Margin: <strong>{margin}%</strong>
                  </span>
                ) : null}
              </div>
              <AdminActionForm action={updateProductSizeFormAction} className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                <input type="hidden" name="id" value={s.id} />
                <input type="hidden" name="productId" value={productId} />
                <label className={lbl}>
                  Label EN
                  <input name="labelEn" defaultValue={s.labelEn} required className={field} />
                </label>
                <label className={lbl}>
                  Label AR
                  <input name="labelAr" defaultValue={s.labelAr} required className={field} dir="rtl" />
                </label>
                <label className={lbl}>
                  Serves EN
                  <input name="servesEn" defaultValue={s.servesEn} required className={field} />
                </label>
                <label className={lbl}>
                  Serves AR
                  <input name="servesAr" defaultValue={s.servesAr} required className={field} dir="rtl" />
                </label>
                <label className={lbl}>
                  Price OMR
                  <input name="priceOmr" defaultValue={s.priceOmr} required className={field} />
                </label>
                <label className={lbl}>
                  Ingredient cost
                  <input name="ingredientCostOmr" defaultValue={s.ingredientCostOmr} className={field} />
                </label>
                <label className={lbl}>
                  Packaging cost
                  <input name="packagingCostOmr" defaultValue={s.packagingCostOmr} className={field} />
                </label>
                <label className={lbl}>
                  Labor cost
                  <input name="laborCostOmr" defaultValue={s.laborCostOmr} className={field} />
                </label>
                <label className={lbl}>
                  Sort order
                  <input name="sortOrder" type="number" defaultValue={s.sortOrder} className={field} />
                </label>
                <label className={`${lbl} flex items-end gap-2 pb-1`}>
                  <input type="checkbox" name="isActive" defaultChecked={s.isActive} className="h-4 w-4" />
                  Active
                </label>
                <div className="sm:col-span-2 lg:col-span-3 flex flex-wrap items-center gap-2">
                  <button
                    type="submit"
                    className="rounded-lg bg-[color:var(--brand-burgundy)] px-3 py-2 text-xs font-semibold text-[color:var(--card-cream)]"
                  >
                    Save size
                  </button>
                </div>
              </AdminActionForm>
              <div className="mt-2 flex flex-wrap gap-2">
                {s.isActive ? (
                  <AdminActionForm action={deactivateProductSizeFormAction} className="inline-block">
                    <input type="hidden" name="id" value={s.id} />
                    <input type="hidden" name="productId" value={productId} />
                    <button
                      type="submit"
                      className="rounded-lg border border-[color:var(--border-soft)] px-3 py-2 text-xs font-semibold"
                    >
                      Deactivate
                    </button>
                  </AdminActionForm>
                ) : null}
              </div>
              <AdminActionForm
                action={deleteProductSizeFormAction}
                className="mt-3 space-y-2 rounded-lg border border-[color:var(--brand-burgundy-soft)]/35 bg-[color:var(--card-cream)] p-2"
              >
                <input type="hidden" name="id" value={s.id} />
                <input type="hidden" name="productId" value={productId} />
                <p className="text-[10px] font-bold uppercase tracking-wide text-[color:var(--brand-gold-muted)]">
                  Delete size permanently
                </p>
                <p className="text-[11px] text-[color:var(--muted-text)]">
                  Only allowed when this size was never referenced on orders. Prefer Deactivate for catalog changes that
                  should stay historical.
                </p>
                <label className="flex items-start gap-2 text-[11px] text-[color:var(--muted-text)]">
                  <input type="checkbox" name="confirmDelete" required className="mt-1 h-4 w-4 shrink-0" />
                  <span>I understand this cannot be undone and may fail if orders reference this size.</span>
                </label>
                <button
                  type="submit"
                  className="rounded-lg border-2 border-[color:var(--brand-burgundy-soft)] bg-white px-3 py-2 text-[11px] font-bold text-[color:var(--brand-burgundy)]"
                >
                  Delete size permanently
                </button>
              </AdminActionForm>
            </div>
          );
        })}
      </div>

      <div className="rounded-xl border border-dashed border-[color:var(--border-soft)] bg-[color:var(--card-beige)] p-3">
        <p className="text-[10px] font-bold uppercase text-[color:var(--brand-gold-muted)]">Add size</p>
        <AdminActionForm action={createProductSizeFormAction} className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          <input type="hidden" name="productId" value={productId} />
          <label className={lbl}>
            Label EN
            <input name="labelEn" required className={field} />
          </label>
          <label className={lbl}>
            Label AR
            <input name="labelAr" required className={field} dir="rtl" />
          </label>
          <label className={lbl}>
            Serves EN
            <input name="servesEn" required className={field} />
          </label>
          <label className={lbl}>
            Serves AR
            <input name="servesAr" required className={field} dir="rtl" />
          </label>
          <label className={lbl}>
            Price OMR
            <input name="priceOmr" required className={field} />
          </label>
          <label className={lbl}>
            Ingredient cost
            <input name="ingredientCostOmr" defaultValue="0" className={field} />
          </label>
          <label className={lbl}>
            Packaging cost
            <input name="packagingCostOmr" defaultValue="0" className={field} />
          </label>
          <label className={lbl}>
            Labor cost
            <input name="laborCostOmr" defaultValue="0" className={field} />
          </label>
          <label className={lbl}>
            Sort order
            <input name="sortOrder" type="number" defaultValue={0} className={field} />
          </label>
          <label className={`${lbl} flex items-end gap-2`}>
            <input type="checkbox" name="isActive" defaultChecked className="h-4 w-4" />
            Active
          </label>
          <div className="flex items-end">
            <button
              type="submit"
              className="rounded-lg bg-[color:var(--brand-burgundy)] px-3 py-2 text-xs font-semibold text-[color:var(--card-cream)]"
            >
              Add size
            </button>
          </div>
        </AdminActionForm>
      </div>
    </div>
  );
}

export function ProductImagesSection({
  productId,
  productSlug,
  images,
  uploadAvailable = true,
}: {
  productId: string;
  productSlug: string;
  images: SerializedImage[];
  uploadAvailable?: boolean;
}) {
  return (
    <div className="space-y-4">
      <h2 className="text-xs font-bold uppercase tracking-wide text-[color:var(--brand-gold-muted)]">Images</h2>
      <p className="text-[11px] text-[color:var(--muted-text)]">
        Upload from your PC when storage is configured, or paste a public path like{" "}
        <code className="font-mono">/images/products/…</code> or an https URL.
      </p>
      <div className="space-y-3">
        {images.map((im) => (
          <div key={im.id} className="rounded-xl border border-[color:var(--border-soft)] bg-white/90 p-3">
            <AdminActionForm action={updateProductImageFormAction} className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              <input type="hidden" name="id" value={im.id} />
              <input type="hidden" name="productId" value={productId} />
              <ImageUploadField
                key={im.id}
                inputName="url"
                label="Product image"
                defaultValue={im.url}
                section="products"
                entitySlug={productSlug}
                entityId={productId}
                required
                inputClassName={field}
                uploadAvailable={uploadAvailable}
              />
              <label className={lbl}>
                Type
                <select name="type" defaultValue={im.type} className={field}>
                  {Object.values(ProductImageType).map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </label>
              <label className={lbl}>
                Sort order
                <input name="sortOrder" type="number" defaultValue={im.sortOrder} className={field} />
              </label>
              <label className={lbl}>
                Alt EN
                <input name="altEn" defaultValue={im.altEn ?? ""} className={field} />
              </label>
              <label className={lbl}>
                Alt AR
                <input name="altAr" defaultValue={im.altAr ?? ""} className={field} dir="rtl" />
              </label>
              <div className="flex flex-wrap items-end gap-2 sm:col-span-2">
                <button
                  type="submit"
                  className="rounded-lg bg-[color:var(--brand-burgundy)] px-3 py-2 text-xs font-semibold text-[color:var(--card-cream)]"
                >
                  Save image
                </button>
              </div>
            </AdminActionForm>
            <AdminActionForm action={deleteProductImageFormAction} className="mt-2 inline-block">
              <input type="hidden" name="id" value={im.id} />
              <input type="hidden" name="productId" value={productId} />
              <button
                type="submit"
                className="rounded-lg border border-[color:var(--brand-burgundy-soft)] px-3 py-2 text-xs font-semibold text-[color:var(--brand-burgundy-soft)]"
              >
                Delete image
              </button>
            </AdminActionForm>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-dashed border-[color:var(--border-soft)] bg-[color:var(--card-beige)] p-3">
        <p className="text-[10px] font-bold uppercase text-[color:var(--brand-gold-muted)]">Add image</p>
        <AdminActionForm action={createProductImageFormAction} className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          <input type="hidden" name="productId" value={productId} />
          <ImageUploadField
            inputName="url"
            label="Product image"
            section="products"
            entitySlug={productSlug}
            entityId={productId}
            required
            inputClassName={field}
            uploadAvailable={uploadAvailable}
          />
          <label className={lbl}>
            Type
            <select name="type" defaultValue="GALLERY" className={field}>
              {Object.values(ProductImageType).map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
          <label className={lbl}>
            Sort order
            <input name="sortOrder" type="number" defaultValue={0} className={field} />
          </label>
          <label className={lbl}>
            Alt EN
            <input name="altEn" className={field} />
          </label>
          <label className={lbl}>
            Alt AR
            <input name="altAr" className={field} dir="rtl" />
          </label>
          <div className="flex items-end">
            <button
              type="submit"
              className="rounded-lg bg-[color:var(--brand-burgundy)] px-3 py-2 text-xs font-semibold text-[color:var(--card-cream)]"
            >
              Add image
            </button>
          </div>
        </AdminActionForm>
      </div>
    </div>
  );
}

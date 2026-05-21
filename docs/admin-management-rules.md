# Coco Treats — Admin management rules (internal)

This document records **safe defaults** for catalog and operations data. It complements `docs/backend-roadmap.md` and is the standard for future admin sections (reviews, settings).

## Audit summary (current implementation)

| Area | Add / edit | Delete / hide | Notes |
|------|------------|---------------|--------|
| **Orders** | Status, payment, delivery, fee, customer snapshot, notes, admin note, cancel | **Archive** (default) / **Unarchive** | No free “delete order”. Records stay in PostgreSQL. |
| **Products** | Full CRUD fields, sizes, images | **Hide** / **Sold out** / **Activate**; **Delete** only if no `OrderItem` references | Slug confirmation required to delete. |
| **Product sizes** | Edit, **Deactivate** | **Delete** only if no `OrderItem` references | Prefer deactivate for live menus. |
| **Categories** | Full fields + Active checkbox | **Deactivate** shortcuts; **Delete** only if category has **zero** products | Slug confirmation to delete. |
| **Offers** | Full fields; activate/deactivate and feature shortcuts | **Delete** allowed today (slug + checklist); **Deactivate**/`isActive`/dates preferred for campaigns | Offers are **not** linked to `OrderItem`/`Order` rows yet — if they become order-linked later, swap delete for **disable/archive** snapshots. |
| **Expenses** | Category, title, amount, UTC date (`expenseDate`), notes | Prefer **Void** (`voidedAt`, optional reason) — excluded from totals; **Delete** for mistaken/test rows with title confirmation + acknowledgment | Negative amounts rejected. |
| **Profit report** | N/A read-only aggregates | N/A | Admin-only math from orders + expense lines (`expenseDate`, void excluded). Archived orders remain in totals unless cancelled. |
| **Availability / capacity** | Global settings; closed datetime ranges; per-day overrides | Prefer **Deactivate** on overrides / closed rows vs deleting history | Capacity counts **non-cancelled** orders by matching **`dateNeeded`** UTC day; archive **does not** free a slot; WhatsApp opens only after successful persist + availability gate. |
| **Production board** | N/A (read-only planning view) | N/A | `/admin/production` groups non-cancelled orders by UTC `dateNeeded`; archived orders still count; print sheet is browser-based. |
| **Settings** | Business identity, contact channels, customer-facing copy | N/A | `BusinessSetting` key/value; falls back to static config; secrets stay in env. |
| **Reviews** | Customer name (EN/AR optional), rating, bilingual comment, optional product, source, featured/sort, approve/hide | **Delete** allowed (customer-name confirmation) — marketing content, not financial records | Only **`APPROVED`** rows appear on storefront; zero approved reviews shows an empty-state message (no static testimonials). **Customer submissions** via `/review/{publicId}?token=…` → `PENDING` until approved; one review per order (`Order.reviewedAt`). |

**Hard deletes that are comparatively safe**: empty categories; product/size rows never referenced by `order_items`; product images (media records only); offers while unreferenced by orders.

**Prefer soft workflows**: archiving orders; hiding/deactivating products and categories; voiding duplicate expenses instead of wiping history.

## Orders

- Archive (`archivedAt`) hides rows from the **default** `/admin/orders` list without destroying data.
- **Cancel** sets `orderStatus` to `CANCELLED` and should keep the row for accountability.
- **Do not** add casual “delete order” for production noise; archive first. If test-order cleanup is ever needed, gate it behind explicit safeguards (not shipped in this pass).

## Products

- Operational states: **ACTIVE**, **SOLD_OUT**, **HIDDEN** (stored in `Product.status`).
- **Delete permanently** runs only when `order_items.productId` has **no rows** for that product.
- Sizes: **Deactivate** clears `ProductSize.isActive`. **Delete size** runs only when `order_items.productSizeId` is unused.

## Categories

- **`isActive: false`** = deactivated (still assignable historically; products may retain `categoryId` until moved).
- **Delete category** only when **no products** use `categoryId` for that category.

## Offers

- Operational toggles: `isActive` and `featuredOnHome`, plus optional `startsAt` / `endsAt`.
- **Hard delete OK for now**: no FK from orders into `offers` yet — still require lowercase slug confirmation + irrevocable acknowledgement.
- If future schema snapshots offers on checkout, **migrate this rule**: prefer disable + historical copies instead of wiping customer-visible deals.

## Expenses & reporting

- Expenses keyed by **`expenseDate`** (stored as Postgres `DATE`, interpreted as UTC day in filters/forms).
- **Void** hides an entry from aggregates while retaining an audit stub (`voidedAt`, `voidReason`).
- Admin profit views combine **stored order totals (`totalOmr`, delivery fee when persisted)** minus **estimated COGS from line items**, minus non-void expenses in the UTC month.
- Older orders might lack populated `estimatedUnitCostOmr` / `estimatedLineProfitOmr` — surfaced as on-page disclaimers rather than guesses.

## Availability & capacity

- **Minimum notice** and **default daily limit** live in `availability_settings` (`minimum_notice_days`, `default_daily_order_limit`, etc.). Missing rows fall back to code defaults until seeded.
- **Closed periods** block ordering for every UTC day overlapping `[startsAt, endsAt]` while `isActive`.
- **Overrides** set `maxOrders` for a single UTC calendar date; `maxOrders <= 0` is treated as **unlimited** for that day unless closed.
- **Regular orders** must satisfy minimum calendar-day advance from **today UTC**; **large orders** (quantity ≥ threshold) must satisfy the larger notice window or submission is rejected server-side with bilingual copy.
- **Cancelled orders never consume capacity**; archived orders **still consume** capacity because fulfillment reality unchanged.

## Production planning (`/admin/production`)

- Totals come from saved **`OrderItem` snapshots** (`productNameEn/Ar`, `sizeLabelEn/Ar`, quantities, line revenue/profit fields) joined to parent orders filtered by UTC **`dateNeeded`**.
- **Cancelled orders are excluded** from all production totals and checklists.
- **Archived orders still appear** — archive only hides default order lists, not kitchen prep reality.
- **Unpaid orders** remain visible with clear UNPAID markers.
- **Delivery orders** without address/maps/GPS show a warning on the production board.
- **DELIVERED** orders may appear on historical dates but are visually muted.
- **Print:** use the in-page **Print production sheet** button (browser print; no PDF export in this phase).

## Settings (`/admin/settings`)

- **`BusinessSetting`** stores non-secret business copy and contact channels (`whatsapp_number`, `instagram_url`, bilingual notes, home/contact hero text).
- Missing keys fall back to **`config/brand.ts`** and **`config/translations.ts`** so the customer app stays resilient.
- **Do not** store admin passwords, JWT secrets, or API tokens in settings — env/Vercel only.
- Seed uses **`createMany({ skipDuplicates: true })`** so re-seeding does not overwrite admin edits.
- Legacy JSON note keys (`note_preorder`, etc.) remain readable as fallbacks until fully migrated.

### Future sections

| Section | Intended pattern |
|---------|------------------|
| **Reviews** | **HIDE** status or soft-hide; delete only spam after moderation. |
| **Settings** | Feature-flag style toggles rather than wiping production config snapshots. |

## Admin images (products, offers, future settings)

- **Stored value:** URL/path string on `ProductImage.url` or `Offer.imageUrl` — same field whether uploaded or pasted manually.
- **Upload API:** `POST /admin/api/uploads/image` (multipart field `file`, optional `section`, `entitySlug`, `entityId`) requires an admin session. Returns JSON `{ ok, url }` or `{ ok: false, error }` — never stack traces.
- **Storage:** Vercel Blob when `BLOB_READ_WRITE_TOKEN` is set (`coco-treats/admin/{section}/{year}/…`). If the token is missing, the API returns a clear message to use manual paths; **do not** fake success or write to `/public` at runtime.
- **Validation:** JPEG, PNG, WebP only; max 5 MB; SVG rejected for product/offer photos.
- **Storefront:** Public `/`, `/menu`, `/products/[slug]` continue to render whatever URL/path is saved (local `/images/…` or Blob https URL). `next/image` allows `*.public.blob.vercel-storage.com` when Blob URLs are used.
- **UI:** Reuse `ImageUploadField` in admin forms; keep the manual URL/path input as fallback.

## UX / engineering rules

- All admin mutations go through **`requireAdmin()`** (upload route checks admin session via `getAdminSession()`).
- Prefer **friendly messages** over raw errors; never return stack traces to the client.
- **Avoid nested `<form>`** elements; use sibling forms/button groups.
- Destructive actions need **explicit copy** (“Delete permanently”, “Archive”, “Hide”) plus confirmations where deletes are irreversible.

| **Reports / export** | N/A read-only | N/A | UTC month/range reports; CSV export admin-only; cancelled orders excluded from income; voided expenses excluded; archived orders included in order exports. |

## Reports & CSV export

- **Income:** Sum of `Order.totalOmr` for non-cancelled orders in UTC `createdAt` window; dessert subtotal and delivery fees tracked separately.
- **Expenses:** Sum by `expenseDate`; rows with `voidedAt` excluded from profit totals (included in expense CSV with void columns).
- **Net profit:** Gross income minus expenses; **estimated net profit** also subtracts COGS from `OrderItem.estimatedUnitCostOmr` when present.
- **Unpaid receivables:** Sum of `totalOmr` for qualifying orders with `paymentStatus: UNPAID` — shown separately, still counted in gross income.
- **CSV exports:** Admin session required; UTF-8 BOM for Excel; filenames `coco-treats-*-YYYY-MM.csv`.

## Reviews

- Operational states: **`APPROVED`** (public), **`PENDING`** (admin only), **`HIDDEN`** (admin only).
- **Featured** + **sortOrder** control home/testimonial ordering; optional **productId** links reviews to a catalog item.
- **Hard delete OK**: testimonials are marketing content, not financial records — require exact customer-name confirmation + irrevocable checkbox.
- Public pages read **approved reviews only** from PostgreSQL via `lib/storefront/storefront-reviews.ts`. When zero approved rows exist, ratings and review cards are hidden; home shows an honest empty message. `data/reviews.ts` is seed-only (not shown on the storefront).
- **Customer review links:** `/review/{publicId}?token={reviewToken}` — token assigned on admin order view; invalid token/publicId returns generic message (no leak).
- **WhatsApp review requests:** Admin opens prefilled `wa.me` to customer phone from order detail; admin sends manually. Automatic WhatsApp Business API sending is a future optional upgrade.
- A future phase may add additional customer-submitted flows — do not expose unmoderated content publicly.

## Orders (review links)

- **`reviewToken`:** Secure random token; generated when admin opens order detail if missing.
- **`reviewRequestedAt`:** Set when admin clicks “Send review request on WhatsApp”.
- **`reviewedAt`:** Set when customer submits review; blocks duplicate submissions for that order.

## Database migrations

Whenever `prisma/schema.prisma` gains admin fields (`archivedAt`, `adminNote`, `voidedAt`, etc.), regenerate the client locally:

```bash
npm run prisma:generate
```

Apply schema to Neon when you intentionally sync the DB (local/staging/production policy is yours):

```bash
npm run prisma:push
```

Additive nullable columns preserve existing orders; destructive operations still require deliberate SQL/migrate planning.

## Seed script (`npm run prisma:seed`)

- **Safe on empty DB** — creates categories, products, sizes, images, default settings, availability defaults, and static reviews (skip if ID exists).
- **Not safe after live admin edits** — re-seed **upserts** product/category rows from static files and **replaces** product images and sizes for seeded slugs. Business settings use `skipDuplicates` only.
- **Production:** run seed once at initial setup; never as routine cleanup. See `docs/cleanup-guide.md`.

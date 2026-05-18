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

### Future sections

| Section | Intended pattern |
|---------|------------------|
| **Reviews** | **HIDE** status or soft-hide; delete only spam after moderation. |
| **Settings** | Feature-flag style toggles rather than wiping production config snapshots. |

## UX / engineering rules

- All admin mutations go through **`requireAdmin()`**.
- Prefer **friendly messages** over raw errors; never return stack traces to the client.
- **Avoid nested `<form>`** elements; use sibling forms/button groups.
- Destructive actions need **explicit copy** (“Delete permanently”, “Archive”, “Hide”) plus confirmations where deletes are irreversible.

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

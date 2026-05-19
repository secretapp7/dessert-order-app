# Coco Treats backend roadmap

## Current phase

**Phase 6 — Public storefront database sync (completed)**

- **Data layer:** `lib/storefront/*` — Prisma-backed queries with safe DTOs (`StorefrontProduct`, `StorefrontOffer`); no admin-only fields on the wire.
- **Fallback:** If no `ACTIVE`/`SOLD_OUT` rows exist in Postgres, public pages use `data/products.ts` (kept as emergency/reference; not deleted).
- **Pages:** `/`, `/menu`, `/products/[slug]`, `/order` are server-fetched (`dynamic = force-dynamic`) and pass serialized catalog props to client UI.
- **Rules:** `HIDDEN` never shown; `SOLD_OUT` visible with labels but not orderable; order `persistOrder` resolves DB product slug + size cuid first, static fallback second; snapshots use DB labels/prices/costs.
- **Offers:** Home/menu promo blocks prefer `Offer.featuredOnHome` when active and in date range; otherwise static Launch Box copy.
- **Revalidation:** Product/category/offer admin actions call `revalidateStorefrontPaths()` for `/`, `/menu`, `/order`, and `/products/[slug]` when known.

**Phase 5 — Availability & daily capacity (completed)**

- **Models:** `AvailabilitySetting` (key/value notice + limits), `ClosedDate` (admin blackout ranges), `DailyCapacityOverride` (per UTC calendar day max orders).
- **Service:** `lib/availability/availability-service.ts` — `getAvailabilityForDate`, `assertDateCanAcceptOrder`, `getAvailabilityCalendarRange`; statuses include AVAILABLE, FEW_SLOTS_LEFT, FULLY_BOOKED, CLOSED, TOO_SOON, LARGE_ORDER_NEEDS_MORE_NOTICE; counts exclude **CANCELLED** orders only (archived rows still consume slots).
- **Customer `/order`:** Debounced server action shows bilingual availability after picking date/qty; submit blocked unless AVAILABLE or FEW_SLOTS_LEFT; persist failures surface localized availability messages without opening WhatsApp.
- **Admin:** `/admin/availability` hub + closed-period CRUD + capacity overrides + dashboard snapshot (today/tomorrow slots, next fully booked scan, upcoming closures, tomorrow production mix).

**Phase 4B — Admin offers management (completed)**

- **Routes:** `/admin/offers`, `/admin/offers/new`, `/admin/offers/[id]` with real `Offer` CRUD/actions.
- **Data:** Reads/writes `Offer` (`slug`, titles, descriptions, `priceOmr`, optional imagery/schedule flags, timestamps).
- **Rules:** Duplicate slug surfaced as friendly error; deactivate/feature shortcuts; deletes require lowercase slug acknowledgement while offers remain order-unlinked — migrate to archival later if FKs arrive.

**Phase 4C — Expenses & profit analytics (completed)**

- **Routes:** `/admin/expenses`, `/admin/expenses/new`, `/admin/expenses/[id]` plus **`/admin/reports/profit`** (UTC-month snapshot).
- **Data:** Adds `Expense.voidedAt` / `voidReason` helpers for soft reversals excluded from aggregates; aggregates read `Expense` amounts by `expenseDate` plus `Order`/`OrderItem` revenue + estimated costs.
- **Dashboard:** Lightweight month KPIs linking to Offers, Expenses, and the profit report alongside existing orders/products metrics.

**Phase 4A — Admin products & categories management (completed)**

- **Routes:** `/admin/products`, `/admin/products/new`, `/admin/products/[id]`, `/admin/categories`, `/admin/categories/new`, `/admin/categories/[id]`.
- **Data:** Lists and forms read/write real `Product`, `ProductSize`, `ProductImage`, and `Category` records via Prisma.
- **Server actions:** Product/category CRUD gated with `requireAdmin()`, Zod validation, friendly errors, bounded deletes.
- **Images:** Admin stores URL/path strings on `ProductImage.url` (public paths or Vercel Blob https URLs). Optional PC upload via `POST /admin/api/uploads/image` when `BLOB_READ_WRITE_TOKEN` is set; manual URL/path remains available.
- **Public storefront:** Synced in Phase 6 (see above). `data/products.ts` remains as fallback only.

**Phase 3 — Admin login, dashboard shell, order management (completed)**

- **Authentication:** bcrypt passwords + JWT session cookie (`jose`).
- **Routes:** `/admin/login`, `/admin`, `/admin/orders`, `/admin/orders/[id]`.
- **Nav:** Offers, Expenses, Profit reports, and **Availability** are enabled; Reviews and Settings remain “soon”.
- **Customer storefront** unchanged; WhatsApp-first ordering persists.

**Phase 2 — Persist customer orders before WhatsApp (completed)**

- See “Order flow” below.

**Phase 1 — Database foundation (done)**

- PostgreSQL + Prisma + seed script support.

---

## Admin environment variables

Set in `.env.local` (local) and deployment env settings:

| Variable | Purpose |
|----------|---------|
| `ADMIN_EMAIL` | Allowed login email (compared case-insensitively). |
| `ADMIN_PASSWORD_HASH` | bcrypt hash — never plaintext. |
| `ADMIN_SESSION_SECRET` | JWT signing secret — **≥ 32 chars**. |
| `BLOB_READ_WRITE_TOKEN` | Optional. Enables admin image uploads to Vercel Blob. Without it, paste `/images/…` or https URLs manually. |

Generation snippets remain unchanged from earlier phases (see archived docs or run `openssl rand -hex 32` / bcrypt helper CLI).

Create a Blob store in the Vercel project (or use the Vercel CLI) and copy the read-write token into `.env.local` for local upload testing.

---

## How to test admin locally

1. Provide `DATABASE_URL`, admin auth env vars.
2. `npm run dev`
3. Visit `/admin` → login → Dashboard, Orders, Products, Offers, Expenses.
4. Open `/admin/reports/profit` after seeding expenses and placing non-cancelled orders to validate aggregates.
5. Public `/menu` reads Neon catalog when products exist; run `prisma:seed` if the menu is empty.

Logout clears the cookie via `/admin/login` action.

---

## Database setup (unchanged)

1. Neon + `DATABASE_URL` with TLS.
2. `npm run prisma:generate`
3. `npm run prisma:push`
4. `npm run prisma:seed` optional.

Whenever `Expense` void columns or shape changes ship, rerun **generate + push** before relying on totals.

---

## Order flow (customer)

1. Customer submits bilingual order UI.
2. **`createOrderAction`** validates + persists (`Customer`, `Order`, `OrderItem`) then emits WhatsApp deep link fallback.
3. Client opens WhatsApp; optional retry UX if persistence fails.

---

## Next / deferred

- Admin CRUD for **Reviews** / **global Settings** (`/admin/reviews`, `/admin/settings` placeholders remain).
- Optional Next.js middleware → proxy wording updates when framework guidance changes again.
- **Storefront DB sync**: replace static catalog with Prisma-fed menu + CDN images.
- Payments, richer customer portal, disciplined `migrate` pipeline for Neon long term.

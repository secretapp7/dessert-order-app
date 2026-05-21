# Coco Treats backend roadmap

## Current phase

**Phase 11 — Final polish, testing, cleanup & launch readiness (completed)**

- **Route audit:** All public routes (`/`, `/menu`, `/products/[slug]`, `/order`, `/contact`, `/review/[publicId]`) and admin routes build and compile; admin shell protected via middleware + `requireAdmin()`; CSV export and image upload require session.
- **Docs:** `docs/launch-checklist.md` (step-by-step QA), `docs/cleanup-guide.md` (safe test data handling), updated `README.md`.
- **Security pass:** Server-only env for `DATABASE_URL`, admin auth, Blob token; `NEXT_PUBLIC_SITE_URL` safe fallback; review route token-gated; no stack traces in UI.
- **Build/lint:** Unused import cleanup; remaining warnings documented (admin `<img>` thumb, Next.js middleware→proxy deprecation).
- **Seed safety:** Documented — re-run seed overwrites static catalog slugs; use only on empty DB (see cleanup guide).

**Phase 10 — Reports, export & income dashboard (completed)**

- **Routes:** `/admin/reports` (hub), `/admin/reports/monthly`, `/admin/reports/profit` (upgraded), `/admin/reports/export`, plus protected CSV routes under `/admin/reports/export/{orders|order-items|expenses|profit|products}`.
- **Data:** Shared `lib/admin/data/report-queries.ts` — income/expense/profit summaries, product sales, order/payment/fulfillment breakdowns, daily trends (UTC boundaries).
- **Rules:** Gross income from `Order.totalOmr`; cancelled excluded; archived included; voided expenses excluded; unpaid totals tracked separately; net profit = income − expenses; estimated product profit from `OrderItem` cost snapshots when available.
- **Export:** UTF-8 BOM CSV for Excel Arabic; admin session required; no new npm packages.

**Phase 9B — Customer review submission (completed)**

- **Public route:** `/review/{publicId}?token=…` — token-protected review form after delivery (no customer login).
- **Order fields:** `reviewToken`, `reviewRequestedAt`, `reviewedAt` on `Order`; secure token generated on demand via `lib/reviews/review-token.ts`.
- **Admin:** `/admin/orders/[id]` shows review status, copy link, and **Send review request on WhatsApp** (click-to-chat, manual send — no backend WhatsApp API).
- **Flow:** Customer submission creates `Review` with `status: PENDING`, `verifiedOrder: true`, `source: "Order review"`; admin approves from `/admin/reviews`; public storefront unchanged until approved.
- **Site URL:** `NEXT_PUBLIC_SITE_URL` for production review links (fallback `http://localhost:3000`).

**Phase 9 — Reviews management (completed)**

- **Routes:** `/admin/reviews`, `/admin/reviews/new`, `/admin/reviews/[id]` — admin CRUD for customer testimonials.
- **Data:** `Review` model with bilingual text, optional product link, `status` (`APPROVED` / `PENDING` / `HIDDEN`), `featured`, `sortOrder`, optional `source` and `reviewDate`.
- **Public integration:** Home testimonials, menu/product rating summaries, and product detail reviews load approved rows from PostgreSQL via `lib/storefront/storefront-reviews.ts`; static `data/reviews.ts` remains fallback when zero approved reviews exist.
- **Rules:** Only `APPROVED` reviews appear publicly; pending/hidden never show. Reviews are marketing content — hard delete allowed with customer-name confirmation. Future phase may add customer-submitted or verified-order reviews.

**Phase 8 — Admin settings page (completed)**

- **Route:** `/admin/settings` — edit `BusinessSetting` key/value rows (identity, contact channels, customer notes, homepage + contact copy).
- **Data:** `lib/admin/data/settings-queries.ts`, `lib/settings/public-settings.ts` with fallbacks to `config/brand.ts` + `config/translations.ts` when rows are missing.
- **Public integration:** Contact page, footer, header WhatsApp, order/product notes, home hero copy, and server order WhatsApp URL read DB settings via `PublicSettingsProvider` (safe fallback if DB unavailable).
- **Secrets:** Admin passwords, JWT, Blob tokens remain in env only — not stored in settings.

**Phase 7 — Admin production planning board (completed)**

- **Route:** `/admin/production` — UTC date filter (today, tomorrow, custom `?date=`, week overview `?view=week`).
- **Data:** `lib/admin/data/production-queries.ts` aggregates real `Order` / `OrderItem` snapshots by `dateNeeded`; **cancelled orders excluded**; **archived orders included** (archive is admin list cleanup only).
- **UI:** Summary cards, product/size quantity table, pickup vs delivery prep lists, order table (unpaid + missing delivery address warnings), ingredients/packaging/delivery checklists derived from line items.
- **Print:** Browser print via **Print production sheet** (`@media print` hides admin sidebar/nav).
- **Dashboard:** Tomorrow orders/units/top item + link to production board; sidebar nav includes **Production**.

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

- Optional Next.js **middleware → proxy** migration when framework guidance stabilises (deprecation warning only; auth still works).
- Payments, richer customer portal, disciplined `migrate` pipeline for Neon long term.
- Replace admin `<img>` previews with `next/image` if Blob/CDN loader is configured (cosmetic lint warning today).

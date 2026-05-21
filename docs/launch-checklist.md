# Coco Treats — Launch checklist

Use this checklist before and after deploying to Vercel. Work through each section in order on **staging/production** with real admin credentials. Do not use fake orders in production unless you plan to archive or cancel them afterward (see `docs/cleanup-guide.md`).

---

## Customer app

| # | Step | Pass? | Notes |
|---|------|-------|-------|
| 1 | Open **/** — home loads, hero, featured products, testimonials, language toggle works | ☐ | |
| 2 | Open **/menu** — categories, product cards, sold-out labels, images with fallback | ☐ | |
| 3 | Open **/products/[slug]** — detail, sizes, reviews, order CTA | ☐ | |
| 4 | Submit **pickup** order on **/order** — validation, date picker, availability message | ☐ | |
| 5 | Submit **delivery** order — address/location fields, fee note visible | ☐ | |
| 6 | Confirm **WhatsApp opens** after successful save (not before) | ☐ | Message is one language only |
| 7 | Confirm order appears in **/admin/orders** with correct items and total | ☐ | |
| 8 | Set a day to **full capacity** — customer cannot submit for that date | ☐ | |
| 9 | Add **closed date** — customer sees closed message for affected days | ☐ | |
| 10 | Mark product **sold out** — visible on menu but not orderable | ☐ | |
| 11 | Mark product **hidden** — does not appear on public pages | ☐ | |
| 12 | Submit review via **/review/[publicId]?token=…** after delivery link | ☐ | Creates PENDING review |
| 13 | Switch **English ↔ Arabic** on customer pages — RTL layout correct | ☐ | |
| 14 | Open **/contact** — WhatsApp, Instagram, copy matches admin settings | ☐ | |

---

## Admin app

| # | Step | Pass? | Notes |
|---|------|-------|-------|
| 1 | **/admin/login** — wrong password rejected; correct login redirects | ☐ | |
| 2 | **/admin** dashboard — today/month income, unpaid, production snapshot | ☐ | |
| 3 | **/admin/orders** — list, filters, archive toggle | ☐ | |
| 4 | Open order detail — update status, payment, notes; save succeeds | ☐ | |
| 5 | **Send review request** — WhatsApp link uses `api.whatsapp.com/send` | ☐ | |
| 6 | **/admin/reviews** — approve customer submission; appears on storefront | ☐ | |
| 7 | **/admin/products/new** — create product + sizes | ☐ | |
| 8 | Upload product **image** (if `BLOB_READ_WRITE_TOKEN` set) | ☐ | |
| 9 | **/admin/offers** — create/activate offer; shows on home/menu if featured | ☐ | |
| 10 | **/admin/expenses/new** — add expense; void works | ☐ | |
| 11 | **/admin/reports/profit** — month totals match expectations | ☐ | |
| 12 | **/admin/reports/export** — download each CSV (orders, items, expenses, profit, products) | ☐ | Requires login |
| 13 | **/admin/production** — tomorrow’s orders, print sheet | ☐ | |
| 14 | **/admin/availability** — closed dates + capacity overrides | ☐ | |
| 15 | **/admin/settings** — edit contact copy; verify on public **/contact** and footer | ☐ | |
| 16 | Log out — **/admin** redirects to login | ☐ | |

---

## Security smoke tests

| # | Step | Pass? | Notes |
|---|------|-------|-------|
| 1 | Visit **/admin/orders** logged out → redirect to login | ☐ | |
| 2 | CSV export URL logged out → **401** | ☐ | |
| 3 | `POST /admin/api/uploads/image` logged out → **401** | ☐ | |
| 4 | Review link with **wrong token** → invalid message (no order data leak) | ☐ | |
| 5 | View page source / network — no `DATABASE_URL`, password hash, or Blob token in client bundle | ☐ | |

---

## Deployment (Vercel)

| # | Step | Pass? | Notes |
|---|------|-------|-------|
| 1 | All env vars set (see `.env.example`) | ☐ | |
| 2 | `NEXT_PUBLIC_SITE_URL` = production URL (no trailing slash) | ☐ | Review links |
| 3 | Vercel **build succeeds** | ☐ | |
| 4 | Live **/**, **/menu**, **/order** load | ☐ | |
| 5 | Live **/admin/login** works | ☐ | |
| 6 | Place test order on production → appears in admin | ☐ | Archive/cancel after test |
| 7 | Image upload works on production (if Blob configured) | ☐ | |
| 8 | CSV download works on production | ☐ | |
| 9 | Review WhatsApp link from production order uses correct domain | ☐ | |

---

## Environment variables (production)

| Variable | Required | Server-only |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | Yes |
| `ADMIN_EMAIL` | Yes | Yes |
| `ADMIN_PASSWORD_HASH` | Yes | Yes |
| `ADMIN_SESSION_SECRET` | Yes | Yes |
| `BLOB_READ_WRITE_TOKEN` | Optional (uploads) | Yes |
| `NEXT_PUBLIC_SITE_URL` | Recommended | Public (safe) |

---

## Pre-launch database

- [ ] `npm run prisma:push` applied on Neon (review fields, availability, etc.)
- [ ] `npm run prisma:seed` run **only on empty DB** — re-seeding overwrites catalog from static files (see `docs/cleanup-guide.md`)
- [ ] Admin password hash generated locally, never committed

---

## Sign-off

| Role | Name | Date | Ready? |
|------|------|------|--------|
| Owner | | | ☐ |
| Dev | | | ☐ |

When all critical rows pass: **Ready for soft launch**.

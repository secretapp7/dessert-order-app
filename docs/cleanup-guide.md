# Coco Treats — Safe cleanup guide

This guide explains how to remove **test data** without damaging real business records. The app does **not** auto-delete production data.

---

## Golden rules

1. **Never run `npm run prisma:seed` on a live database** after you have edited products, prices, or images in admin. Seed **upserts** static catalog data and **replaces** product images and sizes for seeded slugs.
2. **Prefer archive/cancel/void/hide** over hard delete for anything tied to sales or customers.
3. **Keep real orders** — they drive income reports, production board, and capacity counts.
4. **Back up Neon** (branch or export) before bulk cleanup.

---

## Test orders

### Recommended: archive or cancel

| Goal | Action in `/admin/orders/[id]` |
|------|--------------------------------|
| Hide from default list, keep history | **Archive** |
| Order should not count toward income/capacity | **Cancel** (sets status `CANCELLED`) |

Archived orders still appear in reports unless cancelled. Cancelled orders are excluded from income and capacity.

### What not to do

- There is **no casual “delete order”** button by design.
- Do not delete rows directly in the database unless you understand report and FK impact.

---

## Test products, categories, offers

| Type | Safe approach |
|------|----------------|
| **Product you created for testing** | **Hide** or **Deactivate** first. **Delete** only if never referenced by any `OrderItem`. |
| **Product size** | **Deactivate**; delete only if unused in orders. |
| **Category** | **Deactivate**; delete only when zero products reference it. |
| **Offer** | **Deactivate** or set end date; delete only after confirming it was a test campaign (slug confirmation required). |

Hidden products do not show on the public menu. Sold-out products show but cannot be ordered.

---

## Test reviews

| Type | Action |
|------|--------|
| Manual admin review (mistake) | Delete from `/admin/reviews/[id]` with customer-name confirmation |
| Customer submission (test) | Leave **PENDING** or set **HIDDEN**; delete only if sure it is not needed |

Only **APPROVED** reviews appear on the storefront.

---

## Test expenses

| Type | Action |
|------|--------|
| Duplicate or mistaken entry | **Void** (excluded from profit totals) |
| Pure test row with no audit need | Delete with title confirmation |

---

## Availability / capacity test data

- **Closed dates:** use **Deactivate** instead of deleting history.
- **Capacity overrides:** deactivate or edit; deleting is OK for mistaken single-day tests.

---

## What to keep

| Data | Why |
|------|-----|
| Real customer orders (even archived) | Sales history, WhatsApp trail, review tokens |
| Products linked to past orders | Snapshot integrity on order lines |
| Approved public reviews | Social proof on home/menu |
| Voided expenses | Audit trail |
| Business settings | Live contact copy and notes |

---

## Cleaning an empty dev database

Safe order for a **fresh local or preview DB**:

```bash
npm run prisma:push
npm run prisma:seed
```

Use seed only when the database is new or you intentionally want to reset catalog to static defaults.

---

## Production soft launch

1. Place one real test order → verify admin + WhatsApp → **cancel or archive** it if you do not want it in month totals.
2. Remove test products/offers via admin (hide/delete per rules above).
3. Confirm dashboard income matches expected real orders only.

For launch verification steps, see `docs/launch-checklist.md`.

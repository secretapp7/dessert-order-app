# Coco Treats backend roadmap

## Current phase

**Phase 2 — Persist customer orders before WhatsApp (completed)**

- Order submissions run `createOrderAction` (server action) which validates payload, saves `Customer`, `Order`, and `OrderItem` to PostgreSQL, then returns a WhatsApp URL built from the same one-language template as before.
- The storefront still renders menu/product data from **`data/products.ts`**; persisted rows link catalog IDs from the seeded Prisma catalog when sizes align with the seed.
- Saving runs **before** `window.open` for the primary submit path.
- **No admin UI**, **no payments**, **no customer login**.
- WhatsApp remains the fulfillment channel after save.

**Phase 1 — Database foundation (done)**

- PostgreSQL + Prisma schema, singleton client at `lib/db/prisma.ts`, seed categories/products/settings.

---

## Database setup

1. Create a Neon PostgreSQL database and copy the connection string (SSL).
2. In `.env.local` (local) or Vercel env (production), set:

   `DATABASE_URL="postgresql://USER:PASSWORD@HOST/DATABASE?sslmode=require"`

3. `npm run prisma:generate`

4. `npm run prisma:push`

5. `npm run prisma:seed` (keeps catalog rows aligned with current static products/sizes).

Optional: `npm run prisma:studio` to inspect `orders`, `customers`, `order_items`.

Admin-related placeholders (later): `ADMIN_EMAIL`, `ADMIN_PASSWORD_HASH`, `ADMIN_SESSION_SECRET` — see `.env.example`.

---

## Order flow (today)

1. Customer completes the usual form (English or Arabic UI; WhatsApp preview text stays in **that UI language**, unchanged behavior).
2. Client calls **`createOrderAction`** with normalized fields (`productSizeId` = static size id).
3. Server validates (`server/orders/order-validation.ts` + Zod), resolves prices/names from `data/products.ts`, matches Prisma **`Product`** / **`ProductSize`** when present (`server/orders/order-service.ts`).
4. Server assigns a readable **`publicId`** (`CT-YYYYMMDD-XXXX`), writes **`Order.whatsappMessage`** (same structured copy as WhatsApp opens), **`deliveryFeeOmr`**: `null`, **`totalOmr`** = dessert subtotal.
5. On success, the client opens the returned **`whatsappUrl`**; on failure it shows localized error text and optionally **“send on WhatsApp anyway”** (uses the locally built client message).

---

## Planned admin routes (not built yet)

- `/admin` — dashboard  
- `/admin/orders`, `/admin/products`, `/admin/categories`, `/admin/offers`, `/admin/expenses`, `/admin/reviews`, `/admin/settings`

---

## Later work (not done)

- Migrate catalog reads off `data/products.ts` to Prisma-backed APIs  
- Authenticated admin for order status edits (`OrderStatus`, `DeliveryStatus`, `PaymentStatus`)  
- Payment gateway, customer accounts, automated `prisma migrate` hardening  

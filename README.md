# Coco Treats — Dessert order app

Mobile-first bilingual (English / Arabic) storefront for **Coco Treats** in Muscat. Customers browse the menu, place pickup or delivery orders, and continue on **WhatsApp**. Orders are saved to **PostgreSQL** before WhatsApp opens. An **admin dashboard** manages catalog, orders, production, availability, expenses, reports, reviews, and settings.

---

## Main features

### Customer app

- Home, menu, product detail, order form, contact page
- English / Arabic with RTL support
- Catalog from Neon (fallback to static data if DB empty)
- Sold-out and hidden product rules
- Date availability, capacity limits, closed dates
- Post-delivery review links (`/review/[publicId]?token=…`)

### Admin dashboard (`/admin`)

- Login (bcrypt + JWT session cookie)
- Orders, production board, products, categories, offers
- Expenses and profit / monthly reports + CSV export
- Availability and capacity management
- Reviews (approve customer submissions)
- Business settings (contact, copy, notes)
- Image upload via Vercel Blob (optional)

---

## Local setup

### Prerequisites

- Node.js 20+
- PostgreSQL (e.g. [Neon](https://neon.tech))
- npm

### Install

```bash
npm install
cp .env.example .env.local
# Edit .env.local with your values
```

### Database

```bash
npm run prisma:generate
npm run prisma:push
npm run prisma:seed   # optional — only on empty DB; see docs/cleanup-guide.md
```

### Run

```bash
npm run dev
```

- Customer app: [http://localhost:3000](http://localhost:3000)
- Admin: [http://localhost:3000/admin](http://localhost:3000/admin)

---

## Environment variables

Copy from `.env.example`. Never commit real secrets.

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string (server-only) |
| `NEXT_PUBLIC_SITE_URL` | Public site URL for review links (no trailing slash) |
| `ADMIN_EMAIL` | Admin login email |
| `ADMIN_PASSWORD_HASH` | bcrypt hash of admin password (server-only) |
| `ADMIN_SESSION_SECRET` | JWT signing secret, 32+ chars (server-only) |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob read-write token for admin uploads (optional, server-only) |

### Admin password hash

Generate locally (example):

```bash
node -e "const b=require('bcryptjs'); console.log(b.hashSync('YOUR_PASSWORD', 12));"
```

### Session secret

```bash
openssl rand -hex 32
```

---

## Prisma commands

| Command | Purpose |
|---------|---------|
| `npm run prisma:generate` | Regenerate Prisma client |
| `npm run prisma:push` | Push schema to database |
| `npm run prisma:seed` | Seed catalog/settings (safe only on empty DB) |
| `npm run prisma:studio` | Open Prisma Studio |

---

## Vercel deployment

1. Connect the repo to Vercel.
2. Set all environment variables from `.env.example`.
3. Set `NEXT_PUBLIC_SITE_URL` to your production domain.
4. Deploy — `postinstall` runs `prisma generate`.
5. Run `prisma db push` against production Neon once (or use a migration pipeline later).
6. Seed **only** if the production catalog is empty.

### Image upload

Create a Vercel Blob store and add `BLOB_READ_WRITE_TOKEN`. Without it, admins can paste `/images/…` paths or external URLs.

---

## Business flow overview

1. Customer builds order on `/order` (pickup or delivery, date, items).
2. Server validates availability and persists `Customer`, `Order`, `OrderItem`.
3. Client opens WhatsApp with a pre-filled message (one language).
4. Admin manages order on `/admin/orders`, production on `/admin/production`.
5. After delivery, admin sends review link via WhatsApp; customer submits on `/review/…`.
6. Admin approves review → appears on storefront.
7. Reports and CSV export use persisted order and expense data.

---

## Scripts

```bash
npm run dev          # Development server
npm run build        # Production build
npm run start        # Production server
npm run lint         # ESLint
```

---

## Documentation

| Doc | Description |
|-----|-------------|
| [docs/launch-checklist.md](docs/launch-checklist.md) | Pre-launch testing steps |
| [docs/cleanup-guide.md](docs/cleanup-guide.md) | Safe test data cleanup |
| [docs/backend-roadmap.md](docs/backend-roadmap.md) | Phase history and architecture |
| [docs/admin-management-rules.md](docs/admin-management-rules.md) | Admin CRUD safety rules |

---

## Tech stack

- Next.js 16 (App Router)
- React 19, Tailwind CSS 4
- Prisma + PostgreSQL (Neon)
- Vercel Blob (optional uploads)
- jose (JWT), bcryptjs

---

## License

Private — Coco Treats internal use.

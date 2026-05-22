import Link from "next/link";

import { adminLogoutAction } from "@/app/admin/login/actions";

const links: { href: string; label: string; disabled?: boolean }[] = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/customers", label: "Customers" },
  { href: "/admin/production", label: "Production" },
  { href: "/admin/inventory", label: "Inventory" },
  { href: "/admin/categories", label: "Categories" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/offers", label: "Offers" },
  { href: "/admin/expenses", label: "Expenses" },
  { href: "/admin/reports", label: "Reports" },
  { href: "/admin/availability", label: "Availability" },
  { href: "/admin/reviews", label: "Reviews" },
  { href: "/admin/settings", label: "Settings" },
];

export function AdminChrome({
  children,
  email,
}: {
  children: React.ReactNode;
  email: string;
}) {
  return (
    <div className="min-h-screen bg-[#f2e8dc] text-[color:var(--foreground)]">
      <div className="mx-auto flex max-w-[1400px] flex-col md:flex-row md:min-h-screen">
        <aside className="border-[color:var(--border-soft)] bg-[color:var(--brand-burgundy)] text-[color:var(--card-cream)] md:w-56 md:shrink-0 md:border-r print:hidden">
          <div className="flex items-center justify-between gap-2 px-4 py-4 md:block">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[color:var(--brand-gold-soft)]">
                Coco Treats
              </p>
              <p className="text-sm font-bold">Admin</p>
            </div>
            <p className="hidden max-w-[10rem] truncate text-[10px] text-white/70 md:mt-3 md:block" title={email}>
              {email}
            </p>
          </div>
          <nav className="flex flex-wrap gap-1 px-2 pb-3 md:flex-col md:gap-0 md:px-3">
            {links.map((item) =>
              item.disabled ? (
                <span
                  key={item.label}
                  className="rounded-lg px-3 py-2 text-xs text-white/35 md:text-sm"
                >
                  {item.label}
                  <span className="ml-1 text-[10px] uppercase text-white/25"> soon </span>
                </span>
              ) : (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-lg px-3 py-2 text-xs font-medium text-white/90 hover:bg-white/10 md:text-sm"
                >
                  {item.label}
                </Link>
              ),
            )}
            <form action={adminLogoutAction} className="mt-2 md:mt-4 md:border-t md:border-white/15 md:pt-3">
              <button
                type="submit"
                className="w-full rounded-lg px-3 py-2 text-left text-xs font-semibold text-[color:var(--brand-gold-soft)] hover:bg-white/10 md:text-sm"
              >
                Log out
              </button>
            </form>
          </nav>
        </aside>
        <main className="min-w-0 flex-1 px-4 py-6 md:px-8">{children}</main>
      </div>
    </div>
  );
}

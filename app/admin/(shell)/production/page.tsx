import Link from "next/link";

import { PrintProductionButton } from "@/components/admin/production/print-production-button";
import {
  getProductionPlanForDate,
  getProductionPlanRange,
  getProductionWeekDayIsos,
  parseProductionDateIso,
  type ProductionOrderRow,
  type ProductionPlan,
  type ProductionProductGroup,
} from "@/lib/admin/data/production-queries";
import { addUtcCalendarDays, utcIsoToday } from "@/lib/availability/availability-service";
import { getLowStockItems } from "@/lib/admin/data/inventory-queries";
import { INVENTORY_TYPE_LABELS, INVENTORY_UNIT_LABELS } from "@/lib/admin/inventory-serialize";
import { InventoryItemType } from "@prisma/client";

export default async function AdminProductionPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; view?: string }>;
}) {
  const sp = await searchParams;
  const todayIso = utcIsoToday();
  const view = sp.view === "week" ? "week" : "day";
  const selectedDate = parseProductionDateIso(sp.date) ?? todayIso;
  const lowStockItems = (await getLowStockItems(8)).filter(
    (i) => i.type === InventoryItemType.INGREDIENT || i.type === InventoryItemType.PACKAGING,
  );

  if (view === "week") {
    const weekDays = getProductionWeekDayIsos(todayIso, 7);
    const plans = await getProductionPlanRange(weekDays[0], weekDays[6]);

    return (
      <div className="production-board space-y-6">
        <ProductionHeader
          title="Production — next 7 days"
          subtitle="UTC calendar days · cancelled orders excluded · archived orders included"
          selectedDate={selectedDate}
          view="week"
        />
        <WeekOverviewTable plans={plans} todayIso={todayIso} />
        <InventoryLowStockSection items={lowStockItems} />
      </div>
    );
  }

  const plan = await getProductionPlanForDate(selectedDate);

  return (
    <div className="production-board space-y-6">
      <ProductionHeader
        title="Production board"
        subtitle={`UTC date ${plan.dateIso} · cancelled excluded · archived included`}
        selectedDate={selectedDate}
        view="day"
      />

      <InventoryLowStockSection items={lowStockItems} />

      <DateNav selectedDate={selectedDate} todayIso={todayIso} />

      {plan.summary.totalOrders === 0 ? (
        <div className="rounded-2xl border border-dashed border-[color:var(--border-soft)] bg-[color:var(--card-beige)] px-4 py-10 text-center">
          <p className="text-sm font-semibold text-[color:var(--accent-cocoa)]">No production needed for this date.</p>
          <p className="mt-1 text-[11px] text-[color:var(--muted-text)]">
            No non-cancelled orders are scheduled for {plan.dateIso} (UTC).
          </p>
        </div>
      ) : (
        <>
          <SummaryCards plan={plan} />
          <ProductGroupsTable groups={plan.productGroups} />
          <Checklists plan={plan} />
          <FulfillmentSections plan={plan} />
          <OrdersTable orders={plan.orders} dateIso={plan.dateIso} />
        </>
      )}

      <PrintBlock plan={plan} />
    </div>
  );
}

function ProductionHeader({
  title,
  subtitle,
  selectedDate,
  view,
}: {
  title: string;
  subtitle: string;
  selectedDate: string;
  view: "day" | "week";
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4 print:hidden">
      <div>
        <h1 className="text-2xl font-bold text-[color:var(--accent-cocoa)]">{title}</h1>
        <p className="mt-1 text-sm text-[color:var(--muted-text)]">{subtitle}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <PrintProductionButton />
        <Link
          href={view === "week" ? `/admin/production?date=${selectedDate}` : `/admin/production?view=week`}
          className="rounded-xl border border-[color:var(--border-soft)] bg-white px-4 py-2 text-sm font-semibold text-[color:var(--brand-burgundy)] hover:bg-[color:var(--card-cream)]"
        >
          {view === "week" ? "Single day view" : "Next 7 days"}
        </Link>
        <Link
          href="/admin/orders"
          className="rounded-xl border border-[color:var(--border-soft)] px-4 py-2 text-sm font-semibold text-[color:var(--brand-burgundy)] hover:bg-[color:var(--card-cream)]"
        >
          All orders
        </Link>
      </div>
    </div>
  );
}

function DateNav({ selectedDate, todayIso }: { selectedDate: string; todayIso: string }) {
  const tomorrowIso = addUtcCalendarDays(todayIso, 1);

  function linkClass(isActive: boolean) {
    return isActive
      ? "rounded-xl bg-[color:var(--brand-burgundy)] px-4 py-2 text-sm font-semibold text-[color:var(--card-cream)]"
      : "rounded-xl border border-[color:var(--border-soft)] bg-white px-4 py-2 text-sm font-semibold text-[color:var(--brand-burgundy)] hover:bg-[color:var(--card-cream)]";
  }

  return (
    <div className="flex flex-wrap items-center gap-2 print:hidden">
      <Link href={`/admin/production?date=${todayIso}`} className={linkClass(selectedDate === todayIso)}>
        Today
      </Link>
      <Link href={`/admin/production?date=${tomorrowIso}`} className={linkClass(selectedDate === tomorrowIso)}>
        Tomorrow
      </Link>
      <Link href="/admin/production?view=week" className={linkClass(false)}>
        Next 7 days
      </Link>
      <form method="get" className="ml-auto flex flex-wrap items-center gap-2">
        <label className="text-xs font-semibold text-[color:var(--muted-text)]">
          Custom date
          <input
            type="date"
            name="date"
            defaultValue={selectedDate}
            className="mt-1 block rounded-xl border border-[color:var(--border-soft)] bg-white px-2 py-1.5 text-sm"
          />
        </label>
        <button
          type="submit"
          className="mt-5 rounded-xl bg-[color:var(--brand-burgundy)] px-4 py-2 text-sm font-semibold text-[color:var(--card-cream)]"
        >
          Go
        </button>
      </form>
    </div>
  );
}

function SummaryCards({ plan }: { plan: ProductionPlan }) {
  const s = plan.summary;
  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 print:grid-cols-3">
      <StatCard title="Total orders" value={String(s.totalOrders)} />
      <StatCard title="Total units" value={String(s.totalUnits)} />
      <StatCard title="Pickup orders" value={String(s.pickupOrders)} />
      <StatCard title="Delivery orders" value={String(s.deliveryOrders)} />
      <StatCard title="Estimated revenue" value={`${s.estimatedRevenueOmr} OMR`} />
      <StatCard
        title="Estimated profit"
        value={s.estimatedProfitOmr ? `${s.estimatedProfitOmr} OMR` : "—"}
        hint={s.hasProfitData ? "From line snapshots" : "No cost data on items"}
      />
      <div className="rounded-2xl border border-[color:var(--border-soft)] bg-[color:var(--card-beige)] p-4 shadow-sm sm:col-span-2 xl:col-span-3">
        <p className="text-[10px] font-bold uppercase tracking-wide text-[color:var(--brand-gold-muted)]">
          Order status counts
        </p>
        <div className="mt-2 flex flex-wrap gap-2 text-xs">
          {(
            [
              ["NEW", s.statusCounts.NEW],
              ["CONFIRMED", s.statusCounts.CONFIRMED],
              ["PREPARING", s.statusCounts.PREPARING],
              ["READY", s.statusCounts.READY],
              ["DELIVERED", s.statusCounts.DELIVERED],
            ] as const
          ).map(([label, count]) => (
            <span
              key={label}
              className="rounded-full bg-[color:var(--card-cream)] px-2.5 py-1 font-semibold tabular-nums text-[color:var(--foreground)]"
            >
              {label}: {count}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

function ProductGroupsTable({ groups }: { groups: ProductionProductGroup[] }) {
  return (
    <section className="rounded-2xl border border-[color:var(--border-soft)] bg-white/80 p-4 shadow-sm">
      <h2 className="text-xs font-bold uppercase tracking-wide text-[color:var(--brand-gold-muted)]">
        Production by product & size
      </h2>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-[color:var(--border-soft)] text-[10px] font-bold uppercase tracking-wide text-[color:var(--brand-gold-muted)]">
              <th className="px-2 py-2">Product (EN)</th>
              <th className="px-2 py-2">Product (AR)</th>
              <th className="px-2 py-2">Size</th>
              <th className="px-2 py-2 text-right">Qty</th>
              <th className="px-2 py-2 text-right">Orders</th>
              <th className="px-2 py-2 text-right">Revenue</th>
              <th className="px-2 py-2 text-right">Est. profit</th>
            </tr>
          </thead>
          <tbody>
            {groups.map((g) => (
              <tr key={g.key} className="border-b border-[color:var(--border-soft)]/70">
                <td className="px-2 py-2 font-semibold">{g.productNameEn}</td>
                <td className="px-2 py-2" dir="rtl">
                  {g.productNameAr}
                </td>
                <td className="px-2 py-2 text-[color:var(--muted-text)]">
                  {g.sizeLabelEn}
                  {g.sizeLabelAr ? (
                    <span className="block text-[10px]" dir="rtl">
                      {g.sizeLabelAr}
                    </span>
                  ) : null}
                </td>
                <td className="px-2 py-2 text-right tabular-nums font-bold">{g.quantity}</td>
                <td className="px-2 py-2 text-right tabular-nums">{g.orderCount}</td>
                <td className="px-2 py-2 text-right tabular-nums">{g.revenueSubtotalOmr}</td>
                <td className="px-2 py-2 text-right tabular-nums">{g.profitSubtotalOmr ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Checklists({ plan }: { plan: ProductionPlan }) {
  return (
    <section className="grid gap-3 lg:grid-cols-3">
      <ChecklistCard title="Ingredients checklist" lines={plan.checklists.ingredients} />
      <ChecklistCard title="Packaging checklist" lines={plan.checklists.packaging} />
      <div className="rounded-2xl border border-[color:var(--border-soft)] bg-[color:var(--card-beige)] p-4 shadow-sm">
        <h2 className="text-xs font-bold uppercase tracking-wide text-[color:var(--brand-gold-muted)]">
          Delivery checklist
        </h2>
        <p className="mt-1 text-[11px] text-[color:var(--muted-text)]">
          {plan.checklists.delivery.orderCount} delivery order
          {plan.checklists.delivery.orderCount === 1 ? "" : "s"}
        </p>
        <ul className="mt-3 max-h-64 space-y-2 overflow-y-auto text-[11px]">
          {plan.checklists.delivery.lines.length === 0 ? (
            <li className="text-[color:var(--muted-text)]">No deliveries for this date.</li>
          ) : (
            plan.checklists.delivery.lines.map((line) => (
              <li
                key={line.publicId}
                className={`rounded-xl border px-2.5 py-2 ${line.warning ? "border-amber-700/40 bg-amber-50/80" : "border-[color:var(--border-soft)] bg-white/80"}`}
              >
                <p className="font-semibold text-[color:var(--foreground)]">
                  {line.publicId} · {line.customerName}
                </p>
                <p className="mt-0.5 text-[10px] text-[color:var(--muted-text)]">
                  {line.deliveryStatus} · {line.paymentStatus}
                </p>
                {line.warning ? (
                  <p className="mt-1 text-[10px] font-semibold text-amber-900">Missing address / maps / GPS</p>
                ) : null}
                {line.addressSummary ? (
                  <p className="mt-1 text-[10px] leading-snug text-[color:var(--foreground)]/75">{line.addressSummary}</p>
                ) : null}
              </li>
            ))
          )}
        </ul>
      </div>
    </section>
  );
}

function ChecklistCard({ title, lines }: { title: string; lines: { label: string; quantity: number }[] }) {
  return (
    <div className="rounded-2xl border border-[color:var(--border-soft)] bg-[color:var(--card-beige)] p-4 shadow-sm">
      <h2 className="text-xs font-bold uppercase tracking-wide text-[color:var(--brand-gold-muted)]">{title}</h2>
      <ul className="mt-3 space-y-1.5 text-[11px]">
        {lines.map((line) => (
          <li key={line.label} className="flex items-start justify-between gap-2 rounded-lg bg-white/70 px-2 py-1.5">
            <span className="min-w-0">{line.label}</span>
            <span className="shrink-0 font-bold tabular-nums">×{line.quantity}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function FulfillmentSections({ plan }: { plan: ProductionPlan }) {
  return (
    <section className="grid gap-3 lg:grid-cols-2">
      <FulfillmentList title="Pickup preparation" orders={plan.pickupOrders} />
      <FulfillmentList title="Delivery preparation" orders={plan.deliveryOrders} />
    </section>
  );
}

function FulfillmentList({ title, orders }: { title: string; orders: ProductionOrderRow[] }) {
  return (
    <div className="rounded-2xl border border-[color:var(--border-soft)] bg-white/80 p-4 shadow-sm">
      <h2 className="text-xs font-bold uppercase tracking-wide text-[color:var(--brand-gold-muted)]">{title}</h2>
      <p className="mt-1 text-[11px] text-[color:var(--muted-text)]">{orders.length} order(s)</p>
      <ul className="mt-3 space-y-2 text-[11px]">
        {orders.length === 0 ? (
          <li className="text-[color:var(--muted-text)]">None</li>
        ) : (
          orders.map((o) => (
            <li
              key={o.id}
              className={`rounded-xl border px-2.5 py-2 ${o.isDelivered ? "border-[color:var(--border-soft)]/60 bg-stone-100/80 opacity-75" : "border-[color:var(--border-soft)] bg-[color:var(--card-cream)]"}`}
            >
              <Link href={`/admin/orders/${o.id}`} className="font-semibold text-[color:var(--brand-burgundy-soft)] hover:underline">
                {o.publicId}
              </Link>
              <span className="text-[color:var(--muted-text)]"> · {o.customerName}</span>
              <p className="mt-0.5 tabular-nums">
                {o.orderStatus} · {o.totalOmr} OMR
                {o.isUnpaid ? <span className="ml-1 font-semibold text-[color:var(--brand-burgundy-soft)]">· UNPAID</span> : null}
                {o.isArchived ? <span className="ml-1 text-[color:var(--muted-text)]">· archived</span> : null}
              </p>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}

function OrdersTable({ orders, dateIso }: { orders: ProductionOrderRow[]; dateIso: string }) {
  return (
    <section className="rounded-2xl border border-[color:var(--border-soft)] bg-white/80 p-4 shadow-sm print:break-before-page">
      <h2 className="text-xs font-bold uppercase tracking-wide text-[color:var(--brand-gold-muted)]">
        Orders for {dateIso}
      </h2>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[980px] text-left text-sm">
          <thead>
            <tr className="border-b border-[color:var(--border-soft)] text-[10px] font-bold uppercase tracking-wide text-[color:var(--brand-gold-muted)]">
              <th className="px-2 py-2">Public ID</th>
              <th className="px-2 py-2">Customer</th>
              <th className="px-2 py-2">Phone</th>
              <th className="px-2 py-2">Fulfillment</th>
              <th className="px-2 py-2">Order</th>
              <th className="px-2 py-2">Delivery</th>
              <th className="px-2 py-2">Payment</th>
              <th className="px-2 py-2 text-right">Total</th>
              <th className="px-2 py-2">Needed</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr
                key={o.id}
                className={`border-b border-[color:var(--border-soft)]/70 ${o.isDelivered ? "opacity-60" : ""}`}
              >
                <td className="px-2 py-2">
                  <Link href={`/admin/orders/${o.id}`} className="font-semibold text-[color:var(--brand-burgundy-soft)] hover:underline">
                    {o.publicId}
                  </Link>
                  {o.isArchived ? <span className="ml-1 text-[10px] text-[color:var(--muted-text)]">archived</span> : null}
                </td>
                <td className="px-2 py-2">{o.customerName}</td>
                <td className="px-2 py-2 font-mono text-xs">{o.customerPhone}</td>
                <td className="px-2 py-2 text-xs">{o.fulfillmentMethod}</td>
                <td className="px-2 py-2 text-xs">{o.orderStatus}</td>
                <td className="px-2 py-2 text-xs">
                  {o.deliveryStatus}
                  {o.deliveryWarning ? (
                    <span className="ml-1 text-[10px] font-semibold text-amber-800">⚠ no address</span>
                  ) : null}
                </td>
                <td className="px-2 py-2 text-xs">
                  {o.paymentStatus}
                  {o.isUnpaid ? <span className="ml-1 font-semibold text-[color:var(--brand-burgundy-soft)]">!</span> : null}
                </td>
                <td className="px-2 py-2 text-right tabular-nums">{o.totalOmr}</td>
                <td className="px-2 py-2 text-xs">{o.dateNeededIso}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function WeekOverviewTable({ plans, todayIso }: { plans: ProductionPlan[]; todayIso: string }) {
  return (
    <section className="rounded-2xl border border-[color:var(--border-soft)] bg-white/80 p-4 shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-[color:var(--border-soft)] text-[10px] font-bold uppercase tracking-wide text-[color:var(--brand-gold-muted)]">
              <th className="px-2 py-2">Date (UTC)</th>
              <th className="px-2 py-2 text-right">Orders</th>
              <th className="px-2 py-2 text-right">Units</th>
              <th className="px-2 py-2 text-right">Pickup</th>
              <th className="px-2 py-2 text-right">Delivery</th>
              <th className="px-2 py-2 text-right">Revenue</th>
              <th className="px-2 py-2">Top item</th>
              <th className="px-2 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {plans.map((plan) => {
              const top = plan.productGroups[0];
              const isToday = plan.dateIso === todayIso;
              return (
                <tr key={plan.dateIso} className="border-b border-[color:var(--border-soft)]/70">
                  <td className="px-2 py-2 font-mono text-xs">
                    {plan.dateIso}
                    {isToday ? <span className="ml-2 text-[10px] font-semibold text-[color:var(--brand-burgundy-soft)]">today</span> : null}
                  </td>
                  <td className="px-2 py-2 text-right tabular-nums">{plan.summary.totalOrders}</td>
                  <td className="px-2 py-2 text-right tabular-nums">{plan.summary.totalUnits}</td>
                  <td className="px-2 py-2 text-right tabular-nums">{plan.summary.pickupOrders}</td>
                  <td className="px-2 py-2 text-right tabular-nums">{plan.summary.deliveryOrders}</td>
                  <td className="px-2 py-2 text-right tabular-nums">{plan.summary.estimatedRevenueOmr}</td>
                  <td className="px-2 py-2 text-xs text-[color:var(--muted-text)]">
                    {top ? `${top.productNameEn} ×${top.quantity}` : "—"}
                  </td>
                  <td className="px-2 py-2 text-right">
                    <Link
                      href={`/admin/production?date=${plan.dateIso}`}
                      className="text-xs font-semibold text-[color:var(--brand-burgundy-soft)] hover:underline"
                    >
                      Open day
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function InventoryLowStockSection({
  items,
}: {
  items: Awaited<ReturnType<typeof getLowStockItems>>;
}) {
  return (
    <section className="rounded-2xl border border-[color:var(--border-soft)] bg-[color:var(--card-beige)] p-4 shadow-sm print:hidden">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h2 className="text-xs font-bold uppercase tracking-wide text-[color:var(--brand-gold-muted)]">
          Inventory planning
        </h2>
        <Link
          href="/admin/inventory"
          className="text-xs font-semibold text-[color:var(--brand-burgundy-soft)] underline-offset-2 hover:underline"
        >
          Open inventory
        </Link>
      </div>
      <p className="mt-1 text-[11px] text-[color:var(--muted-text)]">
        Inventory planning is manual until recipe links are added. Stock is not deducted from orders in this phase.
      </p>
      {items.length === 0 ? (
        <p className="mt-3 text-sm text-[color:var(--muted-text)]">No low-stock ingredients or packaging right now.</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[color:var(--border-soft)] bg-white/80 px-3 py-2 text-sm"
            >
              <div>
                <Link
                  href={`/admin/inventory/${item.id}`}
                  className="font-semibold text-[color:var(--brand-burgundy-soft)] hover:underline"
                >
                  {item.nameEn}
                </Link>
                <span className="ml-2 text-[10px] text-[color:var(--muted-text)]">
                  {INVENTORY_TYPE_LABELS[item.type]}
                </span>
              </div>
              <span className="text-xs tabular-nums text-[color:var(--accent-cocoa)]">
                {item.currentQuantity.toFixed(3)} {INVENTORY_UNIT_LABELS[item.unit]}
                {item.lowStockThreshold != null ? (
                  <span className="ml-1 text-[color:var(--brand-burgundy-soft)]">· low</span>
                ) : null}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function PrintBlock({ plan }: { plan: ProductionPlan }) {
  return (
    <div className="production-print-header hidden print:block">
      <p className="text-lg font-bold text-black">Coco Treats — Production sheet</p>
      <p className="text-sm text-black/70">UTC date: {plan.dateIso}</p>
      <p className="mt-2 text-sm text-black">
        {plan.summary.totalOrders} orders · {plan.summary.totalUnits} units · {plan.summary.estimatedRevenueOmr} OMR
        revenue
        {plan.summary.estimatedProfitOmr ? ` · ${plan.summary.estimatedProfitOmr} OMR est. profit` : ""}
      </p>
    </div>
  );
}

function StatCard({ title, value, hint }: { title: string; value: string; hint?: string }) {
  return (
    <div className="rounded-2xl border border-[color:var(--border-soft)] bg-[color:var(--card-beige)] p-4 shadow-sm">
      <p className="text-[10px] font-bold uppercase tracking-wide text-[color:var(--brand-gold-muted)]">{title}</p>
      <p className="mt-2 text-2xl font-bold tabular-nums text-[color:var(--accent-cocoa)]">{value}</p>
      {hint ? <p className="mt-1 text-[10px] text-[color:var(--muted-text)]">{hint}</p> : null}
    </div>
  );
}

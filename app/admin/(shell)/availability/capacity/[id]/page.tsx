import Link from "next/link";
import { notFound } from "next/navigation";

import { CapacityOverrideEditForm } from "@/components/admin/availability/capacity-forms";
import { serializeCapacityOverrideForAdmin } from "@/lib/admin/availability-admin-record";
import { prisma } from "@/lib/db/prisma";

export default async function AdminCapacityEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const dbRow = await prisma.dailyCapacityOverride.findUnique({ where: { id } });
  if (!dbRow) notFound();
  const row = serializeCapacityOverrideForAdmin(dbRow);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-[color:var(--accent-cocoa)]">Edit capacity override</h1>
        <Link
          href="/admin/availability"
          className="rounded-xl border border-[color:var(--border-soft)] px-4 py-2 text-sm font-semibold text-[color:var(--brand-burgundy)] hover:bg-[color:var(--card-cream)]"
        >
          Back
        </Link>
      </div>
      <section className="rounded-2xl border border-[color:var(--border-soft)] bg-white/90 p-4 shadow-sm">
        <CapacityOverrideEditForm row={row} />
      </section>
    </div>
  );
}

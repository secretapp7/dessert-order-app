import "server-only";

import { revalidatePath } from "next/cache";

/** Revalidate admin report pages after financial data changes. */
export function revalidateAdminReports() {
  revalidatePath("/admin");
  revalidatePath("/admin/reports");
  revalidatePath("/admin/reports/profit");
  revalidatePath("/admin/reports/monthly");
  revalidatePath("/admin/reports/export");
}

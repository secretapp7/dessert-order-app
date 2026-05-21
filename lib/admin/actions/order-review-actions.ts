"use server";

import type { AdminFormState } from "@/lib/admin/admin-form-state";
import { requireAdmin } from "@/lib/auth/admin-session";
import { prisma } from "@/lib/db/prisma";

export async function markReviewRequestedAction(orderId: string): Promise<AdminFormState> {
  await requireAdmin();
  if (!orderId?.trim()) return { error: "Missing order." };
  try {
    await prisma.order.update({
      where: { id: orderId.trim() },
      data: { reviewRequestedAt: new Date() },
    });
    return { success: "Review request marked." };
  } catch {
    return { error: "Could not update order." };
  }
}

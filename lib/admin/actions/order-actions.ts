"use server";

import { revalidatePath } from "next/cache";

import { OrderStatus, Prisma } from "@prisma/client";

import type { AdminFormState } from "@/lib/admin/admin-form-state";
import {
  orderCancelSchema,
  orderCustomerDetailsSchema,
  orderDeliveryFeeSchema,
  orderIdFieldSchema,
  orderStatusesSchema,
} from "@/lib/admin/validation/order-admin";
import { requireAdmin } from "@/lib/auth/admin-session";
import { revalidateAdminReports } from "@/lib/admin/revalidate-reports";
import { prisma } from "@/lib/db/prisma";

function revalidateOrderPaths(orderId: string) {
  revalidateAdminReports();
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
}

export async function updateOrderStatusesFormAction(
  _prev: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  await requireAdmin();
  const parsed = orderStatusesSchema.safeParse({
    orderId: String(formData.get("orderId")),
    orderStatus: String(formData.get("orderStatus")),
    paymentStatus: String(formData.get("paymentStatus")),
    deliveryStatus: String(formData.get("deliveryStatus")),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues.map((i) => i.message).join(" ") };
  }
  try {
    const exists = await prisma.order.findUnique({
      where: { id: parsed.data.orderId },
      select: { id: true },
    });
    if (!exists) {
      return { error: "Order not found." };
    }
    await prisma.order.update({
      where: { id: parsed.data.orderId },
      data: {
        orderStatus: parsed.data.orderStatus,
        paymentStatus: parsed.data.paymentStatus,
        deliveryStatus: parsed.data.deliveryStatus,
      },
    });
    revalidateOrderPaths(parsed.data.orderId);
    return { success: "Status and payment updated." };
  } catch {
    return { error: "Could not update order. Please try again." };
  }
}

export async function updateOrderDeliveryFeeFormAction(
  _prev: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  await requireAdmin();
  const parsed = orderDeliveryFeeSchema.safeParse({
    orderId: String(formData.get("orderId")),
    deliveryFeeOmr: String(formData.get("deliveryFeeOmr") ?? ""),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues.map((i) => i.message).join(" ") };
  }
  const raw = parsed.data.deliveryFeeOmr.trim();
  let deliveryFeeOmr: Prisma.Decimal | null = null;
  if (raw !== "") {
    deliveryFeeOmr = new Prisma.Decimal(raw);
  }
  try {
    const order = await prisma.order.findUnique({
      where: { id: parsed.data.orderId },
      select: { dessertSubtotalOmr: true },
    });
    if (!order) {
      return { error: "Order not found." };
    }
    const fee = deliveryFeeOmr ?? new Prisma.Decimal(0);
    const totalOmr = order.dessertSubtotalOmr.plus(fee);
    await prisma.order.update({
      where: { id: parsed.data.orderId },
      data: {
        deliveryFeeOmr,
        totalOmr,
      },
    });
    revalidateOrderPaths(parsed.data.orderId);
    return { success: "Delivery fee and total updated." };
  } catch {
    return { error: "Could not update fee. Please try again." };
  }
}

export async function updateOrderCustomerNotesFormAction(
  _prev: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  await requireAdmin();
  const parsed = orderCustomerDetailsSchema.safeParse({
    orderId: String(formData.get("orderId")),
    customerName: String(formData.get("customerName") ?? ""),
    customerPhone: String(formData.get("customerPhone") ?? ""),
    notes: String(formData.get("notes") ?? ""),
    adminNote: String(formData.get("adminNote") ?? ""),
    cancelReason: String(formData.get("cancelReason") ?? ""),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues.map((i) => i.message).join(" ") };
  }
  const notes = parsed.data.notes?.trim() ? parsed.data.notes.trim() : null;
  const adminNote = parsed.data.adminNote?.trim() ? parsed.data.adminNote.trim() : null;
  const cancelReason = parsed.data.cancelReason?.trim() ? parsed.data.cancelReason.trim() : null;
  try {
    const exists = await prisma.order.findUnique({
      where: { id: parsed.data.orderId },
      select: { id: true, orderStatus: true },
    });
    if (!exists) {
      return { error: "Order not found." };
    }
    await prisma.order.update({
      where: { id: parsed.data.orderId },
      data: {
        customerName: parsed.data.customerName.trim(),
        customerPhone: parsed.data.customerPhone.trim(),
        notes,
        adminNote,
        ...(exists.orderStatus === OrderStatus.CANCELLED ? { cancelReason } : {}),
      },
    });
    revalidateOrderPaths(parsed.data.orderId);
    return { success: "Customer and notes saved." };
  } catch {
    return { error: "Could not save changes. Please try again." };
  }
}

export async function cancelOrderFormAction(
  _prev: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  await requireAdmin();
  const parsed = orderCancelSchema.safeParse({
    orderId: String(formData.get("orderId")),
    cancelReason: String(formData.get("cancelReason") ?? ""),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues.map((i) => i.message).join(" ") };
  }
  const reason = parsed.data.cancelReason?.trim() ? parsed.data.cancelReason.trim() : null;
  try {
    const order = await prisma.order.findUnique({
      where: { id: parsed.data.orderId },
      select: { id: true, orderStatus: true },
    });
    if (!order) {
      return { error: "Order not found." };
    }
    if (order.orderStatus === OrderStatus.CANCELLED) {
      return { error: "This order is already cancelled." };
    }
    await prisma.order.update({
      where: { id: parsed.data.orderId },
      data: {
        orderStatus: OrderStatus.CANCELLED,
        cancelReason: reason,
      },
    });
    revalidateOrderPaths(parsed.data.orderId);
    return { success: "Order marked as cancelled." };
  } catch {
    return { error: "Could not cancel order. Please try again." };
  }
}

export async function archiveOrderFormAction(
  _prev: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  await requireAdmin();
  const parsed = orderIdFieldSchema.safeParse({ orderId: String(formData.get("orderId")) });
  if (!parsed.success) {
    return { error: parsed.error.issues.map((i) => i.message).join(" ") };
  }
  try {
    const order = await prisma.order.findUnique({
      where: { id: parsed.data.orderId },
      select: { archivedAt: true },
    });
    if (!order) {
      return { error: "Order not found." };
    }
    if (order.archivedAt) {
      return { error: "This order is already archived." };
    }
    await prisma.order.update({
      where: { id: parsed.data.orderId },
      data: { archivedAt: new Date() },
    });
    revalidateOrderPaths(parsed.data.orderId);
    return { success: "Order archived (hidden from the default list)." };
  } catch {
    return { error: "Could not archive order. Please try again." };
  }
}

export async function unarchiveOrderFormAction(
  _prev: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  await requireAdmin();
  const parsed = orderIdFieldSchema.safeParse({ orderId: String(formData.get("orderId")) });
  if (!parsed.success) {
    return { error: parsed.error.issues.map((i) => i.message).join(" ") };
  }
  try {
    const order = await prisma.order.findUnique({
      where: { id: parsed.data.orderId },
      select: { archivedAt: true },
    });
    if (!order) {
      return { error: "Order not found." };
    }
    if (!order.archivedAt) {
      return { error: "This order is not archived." };
    }
    await prisma.order.update({
      where: { id: parsed.data.orderId },
      data: { archivedAt: null },
    });
    revalidateOrderPaths(parsed.data.orderId);
    return { success: "Order restored to the active list." };
  } catch {
    return { error: "Could not unarchive order. Please try again." };
  }
}

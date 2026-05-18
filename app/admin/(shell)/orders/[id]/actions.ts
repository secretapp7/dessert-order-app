"use server";

import { revalidatePath } from "next/cache";

import {
  DeliveryStatus,
  OrderStatus,
  PaymentStatus,
  Prisma,
} from "@prisma/client";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth/admin-session";
import { prisma } from "@/lib/db/prisma";

const idSchema = z.string().cuid();

export async function updateOrderCoreAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const idParsed = idSchema.safeParse(String(formData.get("orderId")));
  if (!idParsed.success) return;

  const orderStatus = z.nativeEnum(OrderStatus).safeParse(String(formData.get("orderStatus")));
  const paymentStatus = z.nativeEnum(PaymentStatus).safeParse(String(formData.get("paymentStatus")));
  const deliveryStatus = z.nativeEnum(DeliveryStatus).safeParse(
    String(formData.get("deliveryStatus")),
  );

  if (!orderStatus.success || !paymentStatus.success || !deliveryStatus.success) {
    return;
  }

  try {
    await prisma.order.update({
      where: { id: idParsed.data },
      data: {
        orderStatus: orderStatus.data,
        paymentStatus: paymentStatus.data,
        deliveryStatus: deliveryStatus.data,
      },
    });
    revalidatePath("/admin");
    revalidatePath("/admin/orders");
    revalidatePath(`/admin/orders/${idParsed.data}`);
  } catch {
    console.error("[admin] updateOrderCoreAction failed");
  }
}

export async function updateDeliveryFeeAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const idParsed = idSchema.safeParse(String(formData.get("orderId")));
  if (!idParsed.success) return;

  const raw = String(formData.get("deliveryFeeOmr") ?? "").trim();
  let deliveryFeeOmr: Prisma.Decimal | null = null;
  if (raw !== "") {
    const dec = z.string().regex(/^\d+(\.\d{1,3})?$/).safeParse(raw);
    if (!dec.success) return;
    deliveryFeeOmr = new Prisma.Decimal(dec.data);
  }

  try {
    const order = await prisma.order.findUnique({
      where: { id: idParsed.data },
      select: { dessertSubtotalOmr: true },
    });
    if (!order) return;

    const fee = deliveryFeeOmr ?? new Prisma.Decimal(0);
    const totalOmr = order.dessertSubtotalOmr.plus(fee);

    await prisma.order.update({
      where: { id: idParsed.data },
      data: {
        deliveryFeeOmr,
        totalOmr,
      },
    });
    revalidatePath("/admin");
    revalidatePath("/admin/orders");
    revalidatePath(`/admin/orders/${idParsed.data}`);
  } catch {
    console.error("[admin] updateDeliveryFeeAction failed");
  }
}

export async function cancelOrderAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const idParsed = idSchema.safeParse(String(formData.get("orderId")));
  if (!idParsed.success) return;

  const reason = String(formData.get("cancelReason") ?? "").trim().slice(0, 2000);

  try {
    await prisma.order.update({
      where: { id: idParsed.data },
      data: {
        orderStatus: OrderStatus.CANCELLED,
        cancelReason: reason || null,
      },
    });
    revalidatePath("/admin");
    revalidatePath("/admin/orders");
    revalidatePath(`/admin/orders/${idParsed.data}`);
  } catch {
    console.error("[admin] cancelOrderAction failed");
  }
}

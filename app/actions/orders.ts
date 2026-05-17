"use server";

import {
  createOrderPayloadSchema,
  type CreateOrderPayload,
} from "@/server/orders/order-validation";
import { persistOrder } from "@/server/orders/order-service";

export type CreateOrderActionSuccess = {
  success: true;
  publicId: string;
  orderId: string;
  whatsappMessage: string;
  whatsappUrl: string;
};

export type CreateOrderActionFailure = {
  success: false;
  errorMessage: string;
};

export async function createOrderAction(
  raw: unknown,
): Promise<CreateOrderActionSuccess | CreateOrderActionFailure> {
  const parsed = createOrderPayloadSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      errorMessage: "VALIDATION_FAILED",
    };
  }

  const payload: CreateOrderPayload = parsed.data;

  try {
    const saved = await persistOrder(payload);
    return {
      success: true,
      publicId: saved.publicId,
      orderId: saved.orderId,
      whatsappMessage: saved.whatsappMessage,
      whatsappUrl: saved.whatsappUrl,
    };
  } catch {
    console.error("[createOrderAction] Persist failed — see server logs.");
    return {
      success: false,
      errorMessage: "PERSIST_FAILED",
    };
  }
}

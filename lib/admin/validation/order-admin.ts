import { z } from "zod";

import { DeliveryStatus, OrderStatus, PaymentStatus } from "@prisma/client";

const cuid = z.string().cuid("Invalid order reference.");

export const orderIdFieldSchema = z.object({
  orderId: cuid,
});

export const orderStatusesSchema = z.object({
  orderId: cuid,
  orderStatus: z.nativeEnum(OrderStatus),
  paymentStatus: z.nativeEnum(PaymentStatus),
  deliveryStatus: z.nativeEnum(DeliveryStatus),
});

const moneyString = z
  .string()
  .trim()
  .regex(/^\d+(\.\d{1,3})?$/, "Use up to 3 decimal places (e.g. 1.250).");

export const orderDeliveryFeeSchema = z.object({
  orderId: cuid,
  deliveryFeeOmr: z
    .string()
    .trim()
    .refine((s) => s === "" || moneyString.safeParse(s).success, "Invalid delivery fee amount."),
});

export const orderCustomerDetailsSchema = z.object({
  orderId: cuid,
  customerName: z.string().trim().min(1, "Customer name is required.").max(200),
  customerPhone: z
    .string()
    .trim()
    .min(3, "Phone is too short.")
    .max(40, "Phone is too long.")
    .regex(/^[0-9+\s().-]+$/, "Use digits and common phone characters only."),
  notes: z.string().max(8000),
  adminNote: z.string().max(8000),
  cancelReason: z.string().max(2000),
});

export const orderCancelSchema = z.object({
  orderId: cuid,
  cancelReason: z.string().max(2000),
});

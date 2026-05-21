import { z } from "zod";

const COMMENT_MAX = 1200;
const NAME_MAX = 80;

export const reviewCoreSchema = z.object({
  productId: z
    .string()
    .trim()
    .transform((v) => (v.length > 0 ? v : undefined)),
  customerName: z.string().trim().min(1, "Customer name is required.").max(NAME_MAX),
  customerNameAr: z
    .string()
    .trim()
    .max(NAME_MAX)
    .optional()
    .transform((v) => (v ? v : null)),
  rating: z.coerce.number().int().min(1, "Rating must be 1–5.").max(5, "Rating must be 1–5."),
  textEn: z.string().trim().min(1, "Comment (EN) is required.").max(COMMENT_MAX),
  textAr: z
    .string()
    .trim()
    .max(COMMENT_MAX)
    .optional()
    .transform((v) => (v ? v : null)),
  source: z
    .string()
    .trim()
    .max(40)
    .optional()
    .transform((v) => (v ? v : null)),
  reviewDate: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? v : null)),
  verifiedOrder: z.boolean(),
  featured: z.boolean(),
  sortOrder: z.coerce.number().int().min(-9999).max(9999),
  status: z.enum(["APPROVED", "PENDING", "HIDDEN"]),
});

export const reviewCreateSchema = reviewCoreSchema;

export const reviewUpdateSchema = reviewCoreSchema.extend({
  id: z.string().trim().min(1),
});

export const reviewIdSchema = z.object({
  id: z.string().trim().min(1),
});

export const reviewDeleteSchema = z.object({
  id: z.string().trim().min(1),
  confirmName: z.string().trim().min(1, "Type the customer name to confirm."),
  confirmDelete: z.literal("on", { message: "Confirm permanent deletion." }),
});

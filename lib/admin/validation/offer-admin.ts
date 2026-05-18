import { z } from "zod";

import { slugSchema } from "@/lib/admin/validation/catalog";

const omrNonNeg = z.coerce.number().min(0, "Price must be zero or positive.");

export const optionalOfferDateInputSchema = z.preprocess(
  (v) => (typeof v === "string" ? v.trim() : ""),
  z.union([
    z.literal("").transform(() => undefined),
    z
      .string()
      .min(1)
      .refine((s) => !Number.isNaN(new Date(s).getTime()), "Invalid date/time.")
      .transform((s) => new Date(s)),
  ]),
);

export const offerCoreSchema = z
  .object({
    slug: slugSchema,
    titleEn: z.string().trim().min(1, "English title is required.").max(200),
    titleAr: z.string().trim().min(1, "Arabic title is required.").max(200),
    descriptionEn: z.string().trim().min(1, "English description is required.").max(8000),
    descriptionAr: z.string().trim().min(1, "Arabic description is required.").max(8000),
    priceOmr: omrNonNeg,
    imageUrl: z
      .string()
      .trim()
      .max(2000)
      .optional()
      .or(z.literal(""))
      .transform((v) => (v === "" ? undefined : v)),
    startsAt: optionalOfferDateInputSchema,
    endsAt: optionalOfferDateInputSchema,
    isActive: z.boolean(),
    featuredOnHome: z.boolean(),
  })
  .superRefine((data, ctx) => {
    if (data.startsAt && data.endsAt && data.endsAt <= data.startsAt) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "End date/time must be after start date/time.",
        path: ["endsAt"],
      });
    }
  });

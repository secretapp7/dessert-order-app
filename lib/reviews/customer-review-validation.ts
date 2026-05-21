import { z } from "zod";

const COMMENT_MAX = 800;
const NAME_MAX = 80;

export const customerReviewSubmitSchema = z.object({
  publicId: z.string().trim().min(1),
  token: z.string().trim().min(1),
  customerName: z.string().trim().min(1, "Name is required.").max(NAME_MAX),
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().trim().min(1, "Comment is required.").max(COMMENT_MAX),
  productId: z
    .string()
    .trim()
    .transform((v) => (v.length > 0 && v !== "general" ? v : null)),
});

export type CustomerReviewSubmitInput = z.infer<typeof customerReviewSubmitSchema>;

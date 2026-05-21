"use server";

import { customerReviewSubmitSchema } from "@/lib/reviews/customer-review-validation";
import { submitCustomerOrderReview } from "@/lib/reviews/customer-review-service";

export type CustomerReviewFormState =
  | { error?: string; success?: boolean }
  | { success: true };

export async function submitCustomerReviewAction(
  _prev: CustomerReviewFormState,
  formData: FormData,
): Promise<CustomerReviewFormState> {
  const parsed = customerReviewSubmitSchema.safeParse({
    publicId: formData.get("publicId"),
    token: formData.get("token"),
    customerName: formData.get("customerName"),
    rating: formData.get("rating"),
    comment: formData.get("comment"),
    productId: formData.get("productId"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues.map((i) => i.message).join(" ") };
  }

  const result = await submitCustomerOrderReview(parsed.data);
  if (result.ok) return { success: true };
  if (result.error === "already_reviewed") {
    return { error: "already_reviewed" };
  }
  return { error: "invalid" };
}

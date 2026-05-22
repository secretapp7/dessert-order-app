"use server";

import { revalidatePath } from "next/cache";

import type { AdminFormState } from "@/lib/admin/admin-form-state";
import {
  customerIdSchema,
  customerNoteSchema,
  customerPreferredLanguageSchema,
  customerProfileSchema,
  customerTagsSchema,
} from "@/lib/admin/validation/customer-admin";
import { requireAdmin } from "@/lib/auth/admin-session";
import { prisma } from "@/lib/db/prisma";

function revalidateCustomerPaths(id: string) {
  revalidatePath("/admin/customers");
  revalidatePath(`/admin/customers/${id}`);
  revalidatePath("/admin");
  revalidatePath("/admin/reports");
}

export async function updateCustomerProfileFormAction(
  _prev: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  await requireAdmin();
  const parsed = customerProfileSchema.safeParse({
    id: String(formData.get("id") ?? ""),
    name: String(formData.get("name") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    email: String(formData.get("email") ?? ""),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues.map((i) => i.message).join(" ") };
  }

  const exists = await prisma.customer.findUnique({
    where: { id: parsed.data.id },
    select: { id: true },
  });
  if (!exists) return { error: "Customer not found." };

  await prisma.customer.update({
    where: { id: parsed.data.id },
    data: {
      name: parsed.data.name.trim(),
      phone: parsed.data.phone.trim(),
      email: parsed.data.email?.trim() ? parsed.data.email.trim() : null,
    },
  });

  revalidateCustomerPaths(parsed.data.id);
  return { success: "Profile saved." };
}

export async function updateCustomerNoteFormAction(
  _prev: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  await requireAdmin();
  const parsed = customerNoteSchema.safeParse({
    id: String(formData.get("id") ?? ""),
    internalNote: String(formData.get("internalNote") ?? ""),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues.map((i) => i.message).join(" ") };
  }

  await prisma.customer.update({
    where: { id: parsed.data.id },
    data: { internalNote: parsed.data.internalNote?.trim() ? parsed.data.internalNote.trim() : null },
  });

  revalidateCustomerPaths(parsed.data.id);
  return { success: "Internal note saved." };
}

export async function updateCustomerTagsFormAction(
  _prev: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  await requireAdmin();
  const parsed = customerTagsSchema.safeParse({
    id: String(formData.get("id") ?? ""),
    tags: String(formData.get("tags") ?? ""),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues.map((i) => i.message).join(" ") };
  }

  await prisma.customer.update({
    where: { id: parsed.data.id },
    data: { tags: parsed.data.tags?.trim() ? parsed.data.tags.trim() : null },
  });

  revalidateCustomerPaths(parsed.data.id);
  return { success: "Tags saved." };
}

export async function updateCustomerPreferredLanguageFormAction(
  _prev: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  await requireAdmin();
  const parsed = customerPreferredLanguageSchema.safeParse({
    id: String(formData.get("id") ?? ""),
    preferredLanguage: String(formData.get("preferredLanguage") ?? ""),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues.map((i) => i.message).join(" ") };
  }

  const lang = parsed.data.preferredLanguage?.trim().toLowerCase();
  const value = lang === "en" || lang === "ar" ? lang : null;

  await prisma.customer.update({
    where: { id: parsed.data.id },
    data: { preferredLanguage: value },
  });

  revalidateCustomerPaths(parsed.data.id);
  return { success: "Preferred language saved." };
}

async function toggleFlag(
  id: string,
  field: "isVip" | "isBlocked",
  value: boolean,
  success: string,
): Promise<AdminFormState> {
  await requireAdmin();
  const parsed = customerIdSchema.safeParse({ id });
  if (!parsed.success) return { error: parsed.error.issues.map((i) => i.message).join(" ") };

  const exists = await prisma.customer.findUnique({
    where: { id: parsed.data.id },
    select: { id: true },
  });
  if (!exists) return { error: "Customer not found." };

  await prisma.customer.update({
    where: { id: parsed.data.id },
    data: { [field]: value },
  });

  revalidateCustomerPaths(parsed.data.id);
  return { success };
}

export async function markCustomerVipFormAction(
  _prev: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  return toggleFlag(String(formData.get("id") ?? ""), "isVip", true, "Marked as VIP.");
}

export async function unmarkCustomerVipFormAction(
  _prev: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  return toggleFlag(String(formData.get("id") ?? ""), "isVip", false, "VIP removed.");
}

export async function blockCustomerFormAction(
  _prev: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  return toggleFlag(String(formData.get("id") ?? ""), "isBlocked", true, "Customer blocked.");
}

export async function unblockCustomerFormAction(
  _prev: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  return toggleFlag(String(formData.get("id") ?? ""), "isBlocked", false, "Customer unblocked.");
}

export async function touchCustomerContactedAction(
  _prev: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  await requireAdmin();
  const parsed = customerIdSchema.safeParse({ id: String(formData.get("id") ?? "") });
  if (!parsed.success) return { error: parsed.error.issues.map((i) => i.message).join(" ") };

  await prisma.customer.update({
    where: { id: parsed.data.id },
    data: { lastContactedAt: new Date() },
  });

  revalidateCustomerPaths(parsed.data.id);
  return { success: "Last contacted updated." };
}

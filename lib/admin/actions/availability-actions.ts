"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import type { AdminFormState } from "@/lib/admin/admin-form-state";
import {
  availabilitySettingsFormSchema,
  capacityOverrideCreateSchema,
  capacityOverrideUpdateSchema,
  closedDateFormSchema,
} from "@/lib/admin/validation/availability-admin";
import { AVAILABILITY_KEYS } from "@/lib/availability/availability-keys";
import { requireAdmin } from "@/lib/auth/admin-session";
import { prisma } from "@/lib/db/prisma";

export type AvailabilityAdminFormState = AdminFormState;

function friendlyErr(): string {
  return "Something went wrong. Please try again.";
}

function revalidateAvailabilityPaths() {
  revalidatePath("/admin");
  revalidatePath("/admin/availability");
  revalidatePath("/order");
}

export async function updateAvailabilitySettingsFormAction(
  _prev: AvailabilityAdminFormState,
  formData: FormData,
): Promise<AvailabilityAdminFormState> {
  await requireAdmin();
  const parsed = availabilitySettingsFormSchema.safeParse({
    minimumNoticeDays: formData.get("minimumNoticeDays"),
    defaultDailyOrderLimit: formData.get("defaultDailyOrderLimit"),
    largeOrderNoticeDays: formData.get("largeOrderNoticeDays"),
    largeOrderQuantityThreshold: formData.get("largeOrderQuantityThreshold"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues.map((i) => i.message).join(" ") };
  }
  try {
    const d = parsed.data;
    const pairs: Array<{ key: string; value: string }> = [
      { key: AVAILABILITY_KEYS.minimumNoticeDays, value: String(d.minimumNoticeDays) },
      { key: AVAILABILITY_KEYS.defaultDailyOrderLimit, value: String(d.defaultDailyOrderLimit) },
      { key: AVAILABILITY_KEYS.largeOrderNoticeDays, value: String(d.largeOrderNoticeDays) },
      { key: AVAILABILITY_KEYS.largeOrderQuantityThreshold, value: String(d.largeOrderQuantityThreshold) },
    ];
    for (const { key, value } of pairs) {
      await prisma.availabilitySetting.upsert({
        where: { key },
        create: { key, value },
        update: { value },
      });
    }
  } catch {
    return { error: friendlyErr() };
  }
  revalidateAvailabilityPaths();
  redirect("/admin/availability");
}

function parseClosedFromForm(formData: FormData) {
  return {
    startsAt: String(formData.get("startsAt") ?? ""),
    endsAt: String(formData.get("endsAt") ?? ""),
    reasonEn: String(formData.get("reasonEn") ?? ""),
    reasonAr: String(formData.get("reasonAr") ?? ""),
    isActive: formData.has("isActive"),
  };
}

export async function createClosedDateFormAction(
  _prev: AvailabilityAdminFormState,
  formData: FormData,
): Promise<AvailabilityAdminFormState> {
  await requireAdmin();
  const parsed = closedDateFormSchema.safeParse(parseClosedFromForm(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues.map((i) => i.message).join(" ") };
  }
  let row;
  try {
    row = await prisma.closedDate.create({
      data: {
        startsAt: parsed.data.startsAt,
        endsAt: parsed.data.endsAt,
        reasonEn: parsed.data.reasonEn ?? null,
        reasonAr: parsed.data.reasonAr ?? null,
        isActive: parsed.data.isActive,
      },
    });
  } catch {
    return { error: friendlyErr() };
  }
  revalidateAvailabilityPaths();
  redirect(`/admin/availability/closed-dates/${row.id}`);
}

export async function updateClosedDateFormAction(
  _prev: AvailabilityAdminFormState,
  formData: FormData,
): Promise<AvailabilityAdminFormState> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Missing closed period." };
  const parsed = closedDateFormSchema.safeParse(parseClosedFromForm(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues.map((i) => i.message).join(" ") };
  }
  try {
    await prisma.closedDate.update({
      where: { id },
      data: {
        startsAt: parsed.data.startsAt,
        endsAt: parsed.data.endsAt,
        reasonEn: parsed.data.reasonEn ?? null,
        reasonAr: parsed.data.reasonAr ?? null,
        isActive: parsed.data.isActive,
      },
    });
  } catch {
    return { error: friendlyErr() };
  }
  revalidateAvailabilityPaths();
  redirect(`/admin/availability/closed-dates/${id}`);
}

export async function deactivateClosedDateFormAction(
  _prev: AvailabilityAdminFormState,
  formData: FormData,
): Promise<AvailabilityAdminFormState> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Missing closed period." };
  try {
    await prisma.closedDate.update({ where: { id }, data: { isActive: false } });
  } catch {
    return { error: friendlyErr() };
  }
  revalidateAvailabilityPaths();
  redirect("/admin/availability");
}

export async function upsertCapacityOverrideFormAction(
  _prev: AvailabilityAdminFormState,
  formData: FormData,
): Promise<AvailabilityAdminFormState> {
  await requireAdmin();
  const parsed = capacityOverrideCreateSchema.safeParse({
    date: formData.get("date"),
    maxOrders: formData.get("maxOrders"),
    noteEn: formData.get("noteEn"),
    noteAr: formData.get("noteAr"),
    isActive: formData.has("isActive"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues.map((i) => i.message).join(" ") };
  }
  let row;
  try {
    row = await prisma.dailyCapacityOverride.upsert({
      where: { date: parsed.data.date },
      create: {
        date: parsed.data.date,
        maxOrders: parsed.data.maxOrders,
        noteEn: parsed.data.noteEn ?? null,
        noteAr: parsed.data.noteAr ?? null,
        isActive: parsed.data.isActive,
      },
      update: {
        maxOrders: parsed.data.maxOrders,
        noteEn: parsed.data.noteEn ?? null,
        noteAr: parsed.data.noteAr ?? null,
        isActive: parsed.data.isActive,
      },
    });
  } catch {
    return { error: friendlyErr() };
  }
  revalidateAvailabilityPaths();
  redirect(`/admin/availability/capacity/${row.id}`);
}

export async function updateCapacityOverrideFormAction(
  _prev: AvailabilityAdminFormState,
  formData: FormData,
): Promise<AvailabilityAdminFormState> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Missing capacity row." };
  const parsed = capacityOverrideUpdateSchema.safeParse({
    maxOrders: formData.get("maxOrders"),
    noteEn: formData.get("noteEn"),
    noteAr: formData.get("noteAr"),
    isActive: formData.has("isActive"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues.map((i) => i.message).join(" ") };
  }
  try {
    await prisma.dailyCapacityOverride.update({
      where: { id },
      data: {
        maxOrders: parsed.data.maxOrders,
        noteEn: parsed.data.noteEn ?? null,
        noteAr: parsed.data.noteAr ?? null,
        isActive: parsed.data.isActive,
      },
    });
  } catch {
    return { error: friendlyErr() };
  }
  revalidateAvailabilityPaths();
  redirect(`/admin/availability/capacity/${id}`);
}

export async function deactivateCapacityOverrideFormAction(
  _prev: AvailabilityAdminFormState,
  formData: FormData,
): Promise<AvailabilityAdminFormState> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Missing capacity row." };
  try {
    await prisma.dailyCapacityOverride.update({ where: { id }, data: { isActive: false } });
  } catch {
    return { error: friendlyErr() };
  }
  revalidateAvailabilityPaths();
  redirect("/admin/availability");
}

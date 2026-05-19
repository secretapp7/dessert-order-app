import { NextResponse } from "next/server";

import { getAdminSession } from "@/lib/auth/admin-session";
import {
  uploadAdminImage,
  validateAdminImageFile,
  type ImageUploadSection,
} from "@/lib/storage/image-storage";

const SECTIONS: ImageUploadSection[] = ["products", "offers", "settings"];

function parseSection(value: FormDataEntryValue | null): ImageUploadSection | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase();
  return SECTIONS.includes(normalized as ImageUploadSection)
    ? (normalized as ImageUploadSection)
    : null;
}

export async function POST(request: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid upload request." }, { status: 400 });
  }

  const fileEntry = formData.get("file");
  if (!(fileEntry instanceof File)) {
    return NextResponse.json({ ok: false, error: "Please choose an image file." }, { status: 400 });
  }

  const section = parseSection(formData.get("section"));
  if (!section) {
    return NextResponse.json(
      { ok: false, error: "Upload section is required (products, offers, or settings)." },
      { status: 400 },
    );
  }

  const entitySlug =
    typeof formData.get("entitySlug") === "string" ? String(formData.get("entitySlug")).trim() : undefined;
  const entityId =
    typeof formData.get("entityId") === "string" ? String(formData.get("entityId")).trim() : undefined;

  const validation = validateAdminImageFile({
    name: fileEntry.name,
    type: fileEntry.type,
    size: fileEntry.size,
  });

  if (!validation.ok) {
    return NextResponse.json({ ok: false, error: validation.error }, { status: 400 });
  }

  const result = await uploadAdminImage(
    fileEntry,
    {
      name: fileEntry.name,
      type: fileEntry.type,
      size: fileEntry.size,
      mimeType: validation.mimeType,
    },
    { section, entitySlug, entityId },
  );

  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 503 });
  }

  return NextResponse.json({ ok: true, url: result.url });
}

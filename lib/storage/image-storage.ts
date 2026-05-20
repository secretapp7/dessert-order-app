import "server-only";

import crypto from "node:crypto";

import { del, put } from "@vercel/blob";

import {
  extensionForMime,
  sanitizeImageFileName,
  validateImageUpload,
  type AdminImageMimeType,
  type ImageUploadCandidate,
} from "@/lib/storage/image-validation";

export type ImageUploadSection = "products" | "offers" | "settings";

export type UploadAdminImageOptions = {
  section: ImageUploadSection;
  entitySlug?: string;
  entityId?: string;
};

export type UploadAdminImageResult =
  | { ok: true; url: string }
  | { ok: false; error: string };

export type DeleteAdminImageResult =
  | { ok: true }
  | { ok: false; error: string };

const STORAGE_NOT_CONFIGURED_MESSAGE =
  "Image upload storage is not configured. Use image URL/path manually or configure storage.";

function blobToken(): string | undefined {
  const token = process.env.BLOB_READ_WRITE_TOKEN?.trim();
  return token || undefined;
}

function isBlobConfigured(): boolean {
  return Boolean(blobToken());
}

function buildObjectPath(
  section: ImageUploadSection,
  safeFileName: string,
  options: UploadAdminImageOptions,
): string {
  const year = new Date().getUTCFullYear();
  const random = crypto.randomBytes(8).toString("hex");
  const entity =
    options.entitySlug?.trim().toLowerCase().replace(/[^a-z0-9-_]/g, "-") ||
    options.entityId?.trim().replace(/[^a-z0-9-_]/g, "-").slice(0, 24) ||
    "general";
  return `coco-treats/admin/${section}/${year}/${entity}-${random}-${safeFileName}`;
}

export function isAdminImageStorageConfigured(): boolean {
  return isBlobConfigured();
}

export function validateAdminImageFile(candidate: ImageUploadCandidate) {
  return validateImageUpload(candidate);
}

export async function uploadAdminImage(
  file: Blob,
  fileMeta: ImageUploadCandidate & { mimeType: AdminImageMimeType },
  options: UploadAdminImageOptions,
): Promise<UploadAdminImageResult> {
  const token = blobToken();
  if (!token) {
    return { ok: false, error: STORAGE_NOT_CONFIGURED_MESSAGE };
  }

  const safeName = sanitizeImageFileName(fileMeta.name ?? "image", fileMeta.mimeType);
  const pathname = buildObjectPath(options.section, safeName, options);

  try {
    const blob = await put(pathname, file, {
      access: "public",
      token,
      contentType: fileMeta.mimeType,
      addRandomSuffix: false,
    });

    if (!blob.url) {
      return { ok: false, error: "Upload completed but no URL was returned. Try again or use a manual path." };
    }

    return { ok: true, url: blob.url };
  } catch {
    return {
      ok: false,
      error: "Image upload failed. Try again or paste an image URL/path manually.",
    };
  }
}

export async function deleteAdminImage(url: string): Promise<DeleteAdminImageResult> {
  const token = blobToken();
  if (!token) {
    return { ok: false, error: STORAGE_NOT_CONFIGURED_MESSAGE };
  }

  const trimmed = url.trim();
  if (!trimmed) {
    return { ok: false, error: "No image URL to delete." };
  }

  if (!trimmed.includes("blob.vercel-storage.com")) {
    return {
      ok: false,
      error: "Only images uploaded to Vercel Blob storage can be deleted from here.",
    };
  }

  try {
    await del(trimmed, { token });
    return { ok: true };
  } catch {
    return { ok: false, error: "Could not delete the stored image." };
  }
}

export function defaultExtensionForMime(mimeType: AdminImageMimeType): string {
  return extensionForMime(mimeType);
}

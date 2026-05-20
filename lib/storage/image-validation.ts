export const ADMIN_IMAGE_MAX_BYTES = 5 * 1024 * 1024;

export const ADMIN_IMAGE_ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export type AdminImageMimeType = (typeof ADMIN_IMAGE_ALLOWED_MIME_TYPES)[number];

const EXT_BY_MIME: Record<AdminImageMimeType, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

export type ImageUploadCandidate = {
  name?: string;
  type: string;
  size: number;
};

export type ImageValidationResult =
  | { ok: true; mimeType: AdminImageMimeType }
  | { ok: false; error: string };

export function validateImageUpload(candidate: ImageUploadCandidate): ImageValidationResult {
  if (!candidate.size || candidate.size <= 0) {
    return { ok: false, error: "Please choose an image file." };
  }

  if (candidate.size > ADMIN_IMAGE_MAX_BYTES) {
    return {
      ok: false,
      error: "Image is too large. Maximum size is 5 MB.",
    };
  }

  const mime = candidate.type.trim().toLowerCase();
  if (mime === "image/svg+xml" || candidate.name?.toLowerCase().endsWith(".svg")) {
    return {
      ok: false,
      error: "SVG uploads are not supported. Use JPEG, PNG, or WebP.",
    };
  }

  if (!ADMIN_IMAGE_ALLOWED_MIME_TYPES.includes(mime as AdminImageMimeType)) {
    return {
      ok: false,
      error: "Only JPEG, PNG, and WebP images are allowed.",
    };
  }

  return { ok: true, mimeType: mime as AdminImageMimeType };
}

export function extensionForMime(mimeType: AdminImageMimeType): string {
  return EXT_BY_MIME[mimeType];
}

/** Safe filename segment for storage keys (keeps extension when present). */
export function sanitizeImageFileName(originalName: string, mimeType: AdminImageMimeType): string {
  const fallbackExt = extensionForMime(mimeType);
  const trimmed = originalName.trim() || `image${fallbackExt}`;
  const lastDot = trimmed.lastIndexOf(".");
  const rawBase = lastDot > 0 ? trimmed.slice(0, lastDot) : trimmed;
  const rawExt = lastDot > 0 ? trimmed.slice(lastDot).toLowerCase() : fallbackExt;

  const base = rawBase
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);

  const ext = rawExt.replace(/[^a-z0-9.]/g, "") || fallbackExt;
  return `${base || "image"}${ext.startsWith(".") ? ext : `.${ext}`}`;
}

"use client";

import { useId, useRef, useState } from "react";

import { AdminImageThumb } from "@/components/admin/admin-image-thumb";

export type ImageUploadSection = "products" | "offers" | "settings";

type ImageUploadFieldProps = {
  /** Form field name written on save (e.g. `url`, `imageUrl`). */
  inputName: string;
  label?: string;
  defaultValue?: string;
  section: ImageUploadSection;
  entitySlug?: string;
  entityId?: string;
  required?: boolean;
  inputClassName?: string;
  helperText?: string;
  /** When false, shows that PC upload is unavailable (manual URL/path still works). */
  uploadAvailable?: boolean;
};

const defaultInputClass =
  "mt-1 w-full rounded-lg border border-[color:var(--border-soft)] bg-white px-2 py-1.5 text-sm";

export function ImageUploadField({
  inputName,
  label = "Image URL / path",
  defaultValue = "",
  section,
  entitySlug,
  entityId,
  required = false,
  inputClassName = defaultInputClass,
  helperText,
  uploadAvailable = true,
}: ImageUploadFieldProps) {
  const fileInputId = useId();
  const fileRef = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState(defaultValue);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  async function uploadFile(file: File) {
    setError(null);
    setStatus(null);
    setLoading(true);

    const body = new FormData();
    body.append("file", file);
    body.append("section", section);
    if (entitySlug?.trim()) body.append("entitySlug", entitySlug.trim());
    if (entityId?.trim()) body.append("entityId", entityId.trim());

    try {
      const res = await fetch("/admin/api/uploads/image", {
        method: "POST",
        body,
        credentials: "same-origin",
      });

      const data = (await res.json()) as { ok?: boolean; url?: string; error?: string };

      if (!res.ok || !data.ok || !data.url) {
        setError(
          data.error ??
            "Image upload failed. Use image URL/path manually or configure storage.",
        );
        return;
      }

      setUrl(data.url);
      setStatus("Image uploaded. Review the path below, then save the form.");
    } catch {
      setError("Image upload failed. Check your connection or use a manual path.");
    } finally {
      setLoading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function onFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    await uploadFile(file);
  }

  return (
    <div className="space-y-2 sm:col-span-2 lg:col-span-3">
      <div className="flex flex-wrap items-start gap-3 rounded-xl border border-[color:var(--border-soft)] bg-[color:var(--card-beige)]/40 p-3">
        <AdminImageThumb src={url} alt={label} />
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <p className="text-[11px] font-semibold text-[color:var(--muted-text)]">{label}</p>

          <div className="flex flex-wrap items-center gap-2">
            <input
              ref={fileRef}
              id={fileInputId}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              onChange={onFileChange}
              disabled={loading || !uploadAvailable}
            />
            <label
              htmlFor={fileInputId}
              className={`inline-flex cursor-pointer items-center rounded-lg border-2 border-[color:var(--brand-burgundy)] bg-[color:var(--brand-burgundy)] px-3 py-2 text-xs font-semibold text-[color:var(--card-cream)] shadow-sm hover:brightness-110 ${loading || !uploadAvailable ? "pointer-events-none opacity-60" : ""}`}
            >
              {loading ? "Uploading…" : "Choose image from PC"}
            </label>
            {url.trim() ? (
              <button
                type="button"
                className="rounded-lg border border-[color:var(--border-soft)] bg-white px-3 py-2 text-xs font-semibold text-[color:var(--muted-text)] hover:bg-[color:var(--card-cream)]"
                onClick={() => {
                  setUrl("");
                  setStatus(null);
                  setError(null);
                }}
                disabled={loading}
              >
                Clear
              </button>
            ) : null}
          </div>

          {!uploadAvailable ? (
            <p className="text-[10px] font-medium text-amber-900">
              Image upload storage is not configured. Paste an image URL or path below, or set{" "}
              <code className="font-mono">BLOB_READ_WRITE_TOKEN</code> in the server environment.
            </p>
          ) : null}

          <label className="block text-[11px] font-semibold text-[color:var(--muted-text)]">
            Image URL / path
            <input
              name={inputName}
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                setError(null);
              }}
              required={required && !url.trim()}
              className={inputClassName}
              placeholder="/images/products/example/main.jpg"
            />
          </label>

          {helperText ? (
            <p className="text-[10px] leading-snug text-[color:var(--muted-text)]">{helperText}</p>
          ) : (
            <p className="text-[10px] leading-snug text-[color:var(--muted-text)]">
              JPEG, PNG, or WebP up to 5 MB. After upload, save the form to persist the URL.
            </p>
          )}

          {status ? (
            <p role="status" className="text-[10px] font-medium text-emerald-800">
              {status}
            </p>
          ) : null}
          {error ? (
            <p role="alert" className="text-[10px] font-medium text-[color:var(--brand-burgundy-soft)]">
              {error}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin · Coco Treats",
  robots: { index: false, follow: false },
};

/** Minimal wrapper for all `/admin/*` routes (login + shell). */
export default function AdminRootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <>{children}</>;
}

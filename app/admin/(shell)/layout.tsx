import { requireAdmin } from "@/lib/auth/admin-session";

import { AdminChrome } from "@/components/admin/admin-chrome";

export default async function AdminShellLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await requireAdmin();

  return <AdminChrome email={session.email}>{children}</AdminChrome>;
}

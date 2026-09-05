import type { Metadata } from "next";
import { Toaster } from "sonner";
import { AdminSidebar, AdminMobileNav } from "@/components/admin/AdminSidebar";
import { DeployStatus } from "@/components/admin/DeployStatus";
import { cookies } from "next/headers";
import { SESSION_COOKIE, verifySession } from "@/lib/auth";

export const metadata: Metadata = {
  title: "אדמין | אבי יומטוביאן",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const jar = await cookies();
  const authed = !!(await verifySession(jar.get(SESSION_COOKIE)?.value));

  // Login page renders inside this layout too, but without the shell.
  // We use `authed` to decide whether to show the sidebar + status pill.
  return (
    <div className="min-h-screen bg-bg" dir="rtl">
      {authed ? (
        <div className="flex min-h-screen">
          <AdminSidebar />
          <div className="flex min-h-screen flex-1 flex-col">
            <header className="sticky top-0 z-20 flex h-14 items-center justify-between gap-3 border-b border-border bg-surface/85 px-4 backdrop-blur">
              <div className="text-sm font-semibold text-text-muted">פאנל ניהול תוכן</div>
              <DeployStatus />
            </header>
            <main className="flex-1 p-4 sm:p-6 pb-24 md:pb-6">{children}</main>
          </div>
          <AdminMobileNav />
        </div>
      ) : (
        <main className="min-h-screen">{children}</main>
      )}
      <Toaster position="top-center" richColors closeButton dir="rtl" />
    </div>
  );
}

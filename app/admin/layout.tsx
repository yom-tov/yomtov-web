import type { Metadata } from "next";
import { Toaster } from "sonner";
import { AdminSidebar, AdminMobileNav } from "@/components/admin/AdminSidebar";
import { DeployStatus } from "@/components/admin/DeployStatus";
import { AlertsBell } from "@/components/admin/AlertsBell";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { cookies } from "next/headers";
import { after } from "next/server";
import { refreshIfStale } from "@/lib/admin/health/store";
import { SESSION_COOKIE, verifySession } from "@/lib/auth";

export const metadata: Metadata = {
  title: "אדמין | אבי יומטוביאן",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const jar = await cookies();
  const authed = !!(await verifySession(jar.get(SESSION_COOKIE)?.value));

  // Keep the alerts fresh between the daily cron runs: after the page is
  // sent, re-run the health checks if the last run is older than 15 minutes.
  if (authed) {
    after(async () => {
      try {
        await refreshIfStale(15 * 60 * 1000, "visit");
      } catch (e) {
        console.error("[health] background refresh failed", e);
      }
    });
  }

  // Login page renders inside this layout too, but without the shell.
  // We use `authed` to decide whether to show the sidebar + status pill.
  return (
    <div className="min-h-screen bg-bg" dir="rtl">
      {authed ? (
        <div className="flex min-h-screen">
          <AdminSidebar />
          <div className="flex min-h-screen min-w-0 flex-1 flex-col">
            <header className="sticky top-0 z-20 flex h-14 items-center justify-between gap-3 border-b border-border bg-surface/85 px-4 backdrop-blur">
              <div className="truncate text-sm font-semibold text-text-muted">מרכז ניהול האתר</div>
              <div className="flex items-center gap-2">
                <DeployStatus />
                <AlertsBell />
                <ThemeToggle variant="icon" />
              </div>
            </header>
            <main className="flex-1 p-4 pb-24 sm:p-6 md:pb-6">{children}</main>
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

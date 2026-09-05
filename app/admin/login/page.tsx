import type { Metadata } from "next";
import Image from "next/image";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = {
  title: "כניסה לאדמין",
  robots: { index: false, follow: false },
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  return (
    <div className="grid min-h-screen place-items-center bg-bg px-4">
      <div className="w-full max-w-sm rounded-3xl border border-border bg-surface p-8 shadow-lg">
        <div className="flex flex-col items-center gap-3">
          <Image src="/images/mark.png" alt="" width={64} height={64} className="h-16 w-16" />
          <h1 className="text-xl font-extrabold text-primary-900">כניסה לאדמין</h1>
          <p className="text-sm text-text-muted">אבי יומטוביאן - ניהול תוכן</p>
        </div>
        <div className="mt-6">
          <LoginForm next={next ?? "/admin"} />
        </div>
      </div>
    </div>
  );
}

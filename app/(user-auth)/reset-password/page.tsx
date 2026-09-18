import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { XCircle } from "lucide-react";
import { db } from "@/lib/db";
import { passwordResetTokens } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { ResetPasswordForm } from "./ResetPasswordForm";

export const metadata: Metadata = {
  title: "איפוס סיסמה",
};

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <div className="w-full max-w-sm rounded-3xl border border-border bg-surface p-8 shadow-lg text-center">
        <XCircle className="mx-auto h-12 w-12 text-rose-500" />
        <p className="mt-3 text-sm text-text-muted">קישור לא תקין.</p>
      </div>
    );
  }

  const [resetToken] = await db
    .select()
    .from(passwordResetTokens)
    .where(eq(passwordResetTokens.token, token))
    .limit(1);

  if (!resetToken || resetToken.used || resetToken.expiresAt < new Date()) {
    return (
      <div className="w-full max-w-sm rounded-3xl border border-border bg-surface p-8 shadow-lg text-center">
        <XCircle className="mx-auto h-12 w-12 text-rose-500" />
        <p className="mt-3 text-sm text-text-muted">
          קישור לא תקין או שפג תוקפו.
        </p>
        <Link
          href="/forgot-password"
          className="mt-4 inline-block text-xs text-primary-600 underline underline-offset-2 hover:text-primary-700 dark:text-primary-400"
        >
          בקש קישור חדש
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm rounded-3xl border border-border bg-surface p-8 shadow-lg">
      <div className="flex flex-col items-center gap-3">
        <Image
          src="/images/mark.png"
          alt=""
          width={64}
          height={64}
          className="h-16 w-16"
        />
        <h1 className="text-xl font-extrabold text-primary-900 dark:text-white">
          סיסמה חדשה
        </h1>
      </div>
      <div className="mt-6">
        <ResetPasswordForm token={token} />
      </div>
    </div>
  );
}

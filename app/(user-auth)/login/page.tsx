import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { UserLoginForm } from "./UserLoginForm";

export const metadata: Metadata = {
  title: "התחברות",
};

export default async function UserLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
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
          התחברות
        </h1>
        <p className="text-sm text-text-muted">כניסה לאזור האישי</p>
      </div>
      <div className="mt-6">
        <UserLoginForm next={next ?? "/dashboard"} />
      </div>
      <div className="mt-4 flex flex-col items-center gap-2 text-xs text-text-muted">
        <Link
          href="/forgot-password"
          className="text-primary-600 underline underline-offset-2 hover:text-primary-700 dark:text-primary-400"
        >
          שכחת סיסמה?
        </Link>
        <p>
          אין לך חשבון?{" "}
          <Link
            href="/register"
            className="font-semibold text-primary-600 underline underline-offset-2 hover:text-primary-700 dark:text-primary-400"
          >
            הירשם עכשיו
          </Link>
        </p>
      </div>
    </div>
  );
}

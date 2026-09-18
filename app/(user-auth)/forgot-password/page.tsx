import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ForgotPasswordForm } from "./ForgotPasswordForm";

export const metadata: Metadata = {
  title: "שחזור סיסמה",
};

export default function ForgotPasswordPage() {
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
          שחזור סיסמה
        </h1>
        <p className="text-sm text-text-muted">
          הזן את כתובת המייל שלך ונשלח לך קישור לאיפוס
        </p>
      </div>
      <div className="mt-6">
        <ForgotPasswordForm />
      </div>
      <p className="mt-4 text-center text-xs text-text-muted">
        <Link
          href="/login"
          className="text-primary-600 underline underline-offset-2 hover:text-primary-700 dark:text-primary-400"
        >
          חזרה לכניסה
        </Link>
      </p>
    </div>
  );
}

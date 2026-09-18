import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { RegisterForm } from "./RegisterForm";

export const metadata: Metadata = {
  title: "הרשמה",
};

export default function RegisterPage() {
  return (
    <div className="w-full max-w-md rounded-3xl border border-border bg-surface p-8 shadow-lg">
      <div className="flex flex-col items-center gap-3">
        <Image
          src="/images/mark.png"
          alt=""
          width={64}
          height={64}
          className="h-16 w-16"
        />
        <h1 className="text-xl font-extrabold text-primary-900 dark:text-white">
          הרשמה
        </h1>
        <p className="text-sm text-text-muted">
          צור חשבון לגישה לתוכן פרימיום
        </p>
      </div>
      <div className="mt-6">
        <RegisterForm />
      </div>
      <p className="mt-4 text-center text-xs text-text-muted">
        כבר יש לך חשבון?{" "}
        <Link
          href="/login"
          className="font-semibold text-primary-600 underline underline-offset-2 hover:text-primary-700 dark:text-primary-400"
        >
          התחבר
        </Link>
      </p>
    </div>
  );
}

import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { CheckCircle, XCircle } from "lucide-react";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getEmailProvider } from "@/lib/email";

export const metadata: Metadata = {
  title: "אימות דואר אלקטרוני",
};

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  let success = false;
  let message = "";

  if (!token) {
    message = "קישור אימות לא תקין.";
  } else {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.emailVerificationToken, token))
      .limit(1);

    if (!user) {
      message = "קישור אימות לא תקין או שפג תוקפו.";
    } else if (user.emailVerified) {
      success = true;
      message = "החשבון כבר אומת. אפשר להתחבר.";
    } else if (
      user.emailVerificationExpires &&
      user.emailVerificationExpires < new Date()
    ) {
      message = "פג תוקף קישור האימות. אנא הירשם מחדש.";
    } else {
      await db
        .update(users)
        .set({
          emailVerified: true,
          emailVerificationToken: null,
          emailVerificationExpires: null,
        })
        .where(eq(users.id, user.id));
      try {
        await getEmailProvider().sendWelcomeEmail(user.email, user.firstName);
      } catch (e) {
        console.error("Failed to send welcome email:", e);
      }
      success = true;
      message = "החשבון אומת בהצלחה! אפשר להתחבר.";
    }
  }

  return (
    <div className="w-full max-w-sm rounded-3xl border border-border bg-surface p-8 shadow-lg text-center">
      <div className="flex flex-col items-center gap-3">
        <Image
          src="/images/mark.png"
          alt=""
          width={64}
          height={64}
          className="h-16 w-16"
        />
        {success ? (
          <CheckCircle className="h-12 w-12 text-emerald-500" />
        ) : (
          <XCircle className="h-12 w-12 text-rose-500" />
        )}
        <h1 className="text-xl font-extrabold text-primary-900 dark:text-white">
          {success ? "אימות הצליח" : "אימות נכשל"}
        </h1>
        <p className="text-sm text-text-muted">{message}</p>
      </div>
      <div className="mt-6">
        <Link
          href="/login"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-l from-primary-700 to-primary-500 px-6 text-sm font-semibold text-white shadow-md hover:brightness-105"
        >
          עבור לכניסה
        </Link>
      </div>
    </div>
  );
}

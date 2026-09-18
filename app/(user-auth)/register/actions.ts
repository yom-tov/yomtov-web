"use server";

import { headers } from "next/headers";
import { nanoid } from "nanoid";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { hashPassword, userRateCheck, userRateRecord } from "@/lib/user-auth";
import { UserRegistrationSchema } from "@/lib/admin/user-validators";
import { getEmailProvider } from "@/lib/email";

export type RegisterState = {
  error?: string;
  success?: string;
  fieldErrors?: Record<string, string>;
} | null;

async function clientIp(): Promise<string> {
  const h = await headers();
  return (
    h.get("x-forwarded-for")?.split(",")[0].trim() ||
    h.get("x-real-ip") ||
    "unknown"
  );
}

export async function registerAction(
  _prev: RegisterState,
  formData: FormData,
): Promise<RegisterState> {
  const ip = await clientIp();
  const gate = userRateCheck(ip);
  if (!gate.allowed) {
    return {
      error: `יותר מדי ניסיונות. נסה שוב בעוד ${Math.ceil(gate.retryInSec / 60)} דק'.`,
    };
  }

  const raw = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
    confirmPassword: formData.get("confirmPassword") as string,
    firstName: formData.get("firstName") as string,
    lastName: formData.get("lastName") as string,
    phone: (formData.get("phone") as string) || "",
    institution: (formData.get("institution") as string) || "",
  };

  const parsed = UserRegistrationSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0]?.toString();
      if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { fieldErrors };
  }

  const { email, password, firstName, lastName, phone, institution } =
    parsed.data;

  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email.toLowerCase()))
    .limit(1);

  if (existing.length > 0) {
    userRateRecord(ip);
    return { error: "כתובת מייל זו כבר רשומה במערכת" };
  }

  const passwordHash = await hashPassword(password);
  const verificationToken = nanoid(32);
  const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

  await db.insert(users).values({
    email: email.toLowerCase(),
    passwordHash,
    firstName,
    lastName,
    phone: phone || null,
    institution: institution || null,
    emailVerificationToken: verificationToken,
    emailVerificationExpires: verificationExpires,
  });

  const emailProvider = getEmailProvider();
  await emailProvider.sendVerificationEmail(
    email,
    verificationToken,
    firstName,
  );

  return {
    success:
      "נרשמת בהצלחה! בדוק את תיבת הדואר האלקטרוני שלך לאימות החשבון.",
  };
}

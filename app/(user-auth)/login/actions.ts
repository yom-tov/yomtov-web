"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { users, userActivity } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import {
  USER_SESSION_COOKIE,
  USER_SESSION_MAX_AGE,
  signUserSession,
  verifyUserPassword,
  userRateCheck,
  userRateRecord,
  userRateReset,
} from "@/lib/user-auth";

async function clientIp(): Promise<string> {
  const h = await headers();
  return (
    h.get("x-forwarded-for")?.split(",")[0].trim() ||
    h.get("x-real-ip") ||
    "unknown"
  );
}

export async function userLoginAction(
  _prev: { error?: string } | null,
  formData: FormData,
): Promise<{ error?: string }> {
  const email = String(formData.get("email") ?? "").toLowerCase().trim();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/dashboard");

  const ip = await clientIp();
  const gate = userRateCheck(ip);
  if (!gate.allowed) {
    return {
      error: `יותר מדי ניסיונות כושלים. נסה שוב בעוד ${Math.ceil(gate.retryInSec / 60)} דק'.`,
    };
  }

  if (!email || !password) {
    return { error: "יש למלא מייל וסיסמה" };
  }

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (!user) {
    userRateRecord(ip);
    return { error: "מייל או סיסמה שגויים" };
  }

  const ok = await verifyUserPassword(password, user.passwordHash);
  if (!ok) {
    userRateRecord(ip);
    return { error: "מייל או סיסמה שגויים" };
  }

  if (!user.active) {
    return { error: "החשבון שלך אינו פעיל. פנה למנהל המערכת." };
  }

  if (!user.emailVerified) {
    return {
      error: "החשבון טרם אומת. בדוק את תיבת הדואר האלקטרוני שלך.",
    };
  }

  userRateReset(ip);

  await db
    .insert(userActivity)
    .values({ userId: user.id, eventType: "login" })
    .catch(() => {});

  const jar = await cookies();
  const jwt = await signUserSession(user.id);
  jar.set(USER_SESSION_COOKIE, jwt, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: USER_SESSION_MAX_AGE,
  });

  const safeNext =
    next.startsWith("/dashboard") || next.startsWith("/watch") || next.startsWith("/courses")
      ? next
      : "/dashboard";
  redirect(safeNext);
}

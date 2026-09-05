"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE_SECONDS,
  loginRateCheck,
  loginRateRecord,
  loginRateReset,
  signSession,
  verifyPassword,
} from "@/lib/auth";

async function clientIp(): Promise<string> {
  const h = await headers();
  return (
    h.get("x-forwarded-for")?.split(",")[0].trim() ||
    h.get("x-real-ip") ||
    "unknown"
  );
}

export async function loginAction(prev: { error?: string } | null, formData: FormData): Promise<{ error?: string }> {
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/admin");

  const ip = await clientIp();
  const gate = loginRateCheck(ip);
  if (!gate.allowed) {
    return { error: `יותר מדי ניסיונות כושלים. נסה שוב בעוד ${Math.ceil(gate.retryInSec / 60)} דק'.` };
  }

  if (!password) {
    return { error: "יש להזין סיסמה" };
  }

  let ok = false;
  try {
    ok = await verifyPassword(password);
  } catch (err) {
    return { error: (err as Error).message || "בעיית מערכת" };
  }

  if (!ok) {
    loginRateRecord(ip);
    return { error: "סיסמה שגויה" };
  }

  loginRateReset(ip);

  const jar = await cookies();
  const jwt = await signSession();
  jar.set(SESSION_COOKIE, jwt, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });

  // Only allow next values that stay on /admin/*
  const safeNext = next.startsWith("/admin") ? next : "/admin";
  redirect(safeNext);
}

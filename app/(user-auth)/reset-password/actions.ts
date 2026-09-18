"use server";

import { db } from "@/lib/db";
import { users, passwordResetTokens } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { hashPassword } from "@/lib/user-auth";

export async function resetPasswordAction(
  _prev: { error?: string; success?: string } | null,
  formData: FormData,
): Promise<{ error?: string; success?: string }> {
  const token = String(formData.get("token") ?? "");
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (!token) return { error: "קישור לא תקין" };

  if (password.length < 8) {
    return { error: "סיסמה חייבת להכיל לפחות 8 תווים" };
  }
  if (!/[a-zA-Z]/.test(password) || !/\d/.test(password)) {
    return { error: "סיסמה חייבת להכיל לפחות אות אחת וספרה אחת" };
  }
  if (password !== confirmPassword) {
    return { error: "הסיסמאות אינן תואמות" };
  }

  const [resetToken] = await db
    .select()
    .from(passwordResetTokens)
    .where(eq(passwordResetTokens.token, token))
    .limit(1);

  if (!resetToken || resetToken.used || resetToken.expiresAt < new Date()) {
    return { error: "קישור לא תקין או שפג תוקפו" };
  }

  const passwordHash = await hashPassword(password);

  await db
    .update(users)
    .set({ passwordHash })
    .where(eq(users.id, resetToken.userId));

  await db
    .update(passwordResetTokens)
    .set({ used: true })
    .where(eq(passwordResetTokens.id, resetToken.id));

  return { success: "הסיסמה שונתה בהצלחה! אפשר להתחבר." };
}

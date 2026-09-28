"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { serviceAccounts } from "@/lib/db/schema";
import { runAndStore, acknowledgeAlert, listOpenAlerts } from "@/lib/admin/health/store";
import { SERVICE_BY_ID, type ServiceId } from "@/lib/admin/architecture";
import { getAlertRecipient, saveAdminSettings } from "@/lib/admin/admin-settings";
import { renderAdminAlertEmail, sendOwnerEmail } from "@/lib/email";

export interface ActionResult {
  ok: boolean;
  error?: string;
  message?: string;
}

function fail(e: unknown): ActionResult {
  return { ok: false, error: (e as Error).message };
}

export async function runHealthChecksAction(): Promise<ActionResult> {
  try {
    await requireSession();
    const { results } = await runAndStore("manual");
    revalidatePath("/admin", "layout");
    const problems = results.filter((r) => r.status === "error" || r.status === "warn").length;
    return { ok: true, message: problems ? `נמצאו ${problems} בדיקות עם בעיה` : "הכל תקין" };
  } catch (e) {
    return fail(e);
  }
}

export async function acknowledgeAlertAction(id: string): Promise<ActionResult> {
  try {
    await requireSession();
    await acknowledgeAlert(z.string().min(1).max(200).parse(id));
    revalidatePath("/admin/health");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

const ServiceAccountSchema = z.object({
  serviceId: z.string().refine((id) => id in SERVICE_BY_ID, "שירות לא מוכר"),
  plan: z.string().max(100).nullable(),
  monthlyCost: z.string().max(50).nullable(),
  renewalDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable(),
  remindDaysBefore: z.number().int().min(1).max(120),
  accountHint: z.string().max(200).nullable(),
  notes: z.string().max(1000).nullable(),
});
export type ServiceAccountInput = z.infer<typeof ServiceAccountSchema>;

export async function saveServiceAccountAction(input: ServiceAccountInput): Promise<ActionResult> {
  try {
    await requireSession();
    const d = ServiceAccountSchema.parse(input);
    const values = {
      serviceId: d.serviceId as ServiceId,
      plan: d.plan || null,
      monthlyCost: d.monthlyCost || null,
      renewalDate: d.renewalDate || null,
      remindDaysBefore: d.remindDaysBefore,
      accountHint: d.accountHint || null,
      notes: d.notes || null,
      updatedAt: new Date(),
    };
    await db
      .insert(serviceAccounts)
      .values(values)
      .onConflictDoUpdate({ target: serviceAccounts.serviceId, set: values });
    revalidatePath("/admin/health");
    revalidatePath("/admin/architecture");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function sendTestAlertEmailAction(): Promise<ActionResult> {
  try {
    await requireSession();
    const to = await getAlertRecipient();
    if (!to) return { ok: false, error: "לא הוגדרה כתובת מייל להתראות (בהגדרות)" };
    const open = await listOpenAlerts();
    const items = open.length
      ? open
      : [
          {
            severity: "info" as const,
            title: "הכל תקין — זו רק דוגמה",
            detail: "כשתהיה בעיה אמיתית, היא תופיע כאן עם הסבר ומה לעשות.",
            actionHint: null,
            link: "/admin/health",
          },
        ];
    const { subject, html } = renderAdminAlertEmail(
      items.map((a) => ({
        severity: a.severity as "critical" | "warning" | "info",
        title: a.title,
        detail: a.detail,
        actionHint: a.actionHint,
        link: a.link,
      })),
      { test: true },
    );
    const res = await sendOwnerEmail(to, subject, html);
    return res.ok ? { ok: true, message: `נשלח ל-${to}` } : { ok: false, error: res.error };
  } catch (e) {
    return fail(e);
  }
}

const AlertSettingsSchema = z.object({
  alertEmail: z.string().email().or(z.literal("")).nullable(),
  dailyEmailEnabled: z.boolean(),
});

export async function saveAlertSettingsAction(input: z.infer<typeof AlertSettingsSchema>): Promise<ActionResult> {
  try {
    await requireSession();
    const d = AlertSettingsSchema.parse(input);
    await saveAdminSettings({ alertEmail: d.alertEmail || null, dailyEmailEnabled: d.dailyEmailEnabled });
    revalidatePath("/admin/settings");
    revalidatePath("/admin/health");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

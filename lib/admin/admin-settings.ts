// Owner-editable admin settings, stored as one row in site_content.
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { siteContent } from "@/lib/db/schema";

const KEY = "admin.settings";

export interface AdminSettings {
  /** Where the daily alert digest is sent. Falls back to ADMIN_ALERT_EMAIL. */
  alertEmail: string | null;
  /** Send the daily email at all. */
  dailyEmailEnabled: boolean;
}

const DEFAULTS: AdminSettings = { alertEmail: null, dailyEmailEnabled: true };

export async function getAdminSettings(): Promise<AdminSettings> {
  try {
    const [row] = await db.select().from(siteContent).where(eq(siteContent.key, KEY)).limit(1);
    return { ...DEFAULTS, ...((row?.value as Partial<AdminSettings> | undefined) ?? {}) };
  } catch {
    return DEFAULTS;
  }
}

export async function saveAdminSettings(patch: Partial<AdminSettings>): Promise<AdminSettings> {
  const next = { ...(await getAdminSettings()), ...patch };
  await db
    .insert(siteContent)
    .values({ key: KEY, value: next, updatedAt: new Date() })
    .onConflictDoUpdate({ target: siteContent.key, set: { value: next, updatedAt: new Date() } });
  return next;
}

export async function getAlertRecipient(): Promise<string | null> {
  const s = await getAdminSettings();
  return s.alertEmail || process.env.ADMIN_ALERT_EMAIL || null;
}

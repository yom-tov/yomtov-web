import { isNotNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { serviceAccounts } from "@/lib/db/schema";
import { SERVICE_BY_ID, type ServiceId } from "../../architecture";
import type { AlertDraft, HealthCheck } from "../types";
import { daysUntil, errMessage, fmtDateHe } from "../util";

export const renewalsCheck: HealthCheck = {
  id: "renewals",
  serviceId: "site",
  label: "חידושים ומנויים",
  async run() {
    try {
      const rows = await db.select().from(serviceAccounts).where(isNotNull(serviceAccounts.renewalDate));
      const alerts: AlertDraft[] = [];
      for (const r of rows) {
        if (!r.renewalDate) continue;
        const date = new Date(`${r.renewalDate}T00:00:00`);
        const days = daysUntil(date);
        if (days > r.remindDaysBefore) continue;
        const svc = SERVICE_BY_ID[r.serviceId as ServiceId];
        const name = svc?.name ?? r.serviceId;
        alerts.push({
          key: `renewal.${r.serviceId}.${r.renewalDate}`,
          severity: days <= 3 ? "critical" : "warning",
          title: days < 0 ? `החידוש של ${name} עבר!` : days === 0 ? `החידוש של ${name} היום` : `החידוש של ${name} בעוד ${days} ימים`,
          detail: `תאריך חידוש: ${fmtDateHe(date)}${r.plan ? ` · תוכנית: ${r.plan}` : ""}${r.monthlyCost ? ` · עלות: ${r.monthlyCost}` : ""}.`,
          actionHint: "ודא שאמצעי התשלום בתוקף ושהחידוש יתבצע. אחרי החידוש עדכן את התאריך הבא בדף מצב המערכת.",
          link: svc?.dashboardUrl,
        });
      }
      return {
        status: alerts.some((a) => a.severity === "critical") ? "error" : alerts.length ? "warn" : "ok",
        summary: rows.length ? (alerts.length ? `${alerts.length} חידושים מתקרבים` : `${rows.length} מנויים במעקב`) : "לא הוזנו תאריכי חידוש",
        alerts,
      };
    } catch (e) {
      return { status: "unknown", summary: `לא ניתן לבדוק: ${errMessage(e)}` };
    }
  },
};

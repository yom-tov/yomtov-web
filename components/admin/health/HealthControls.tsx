"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, Loader2, RefreshCw, Save, Send, CalendarClock } from "lucide-react";
import { Btn, Field, Input, Textarea } from "@/components/admin/ui/primitives";
import { refreshAlertSummary } from "@/components/admin/useAlertSummary";
import {
  runHealthChecksAction,
  acknowledgeAlertAction,
  saveServiceAccountAction,
  sendTestAlertEmailAction,
  type ServiceAccountInput,
} from "@/app/admin/health/actions";

export function RunChecksButton() {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <Btn
      variant="primary"
      disabled={pending}
      onClick={() =>
        start(async () => {
          const res = await runHealthChecksAction();
          if (!res.ok) {
            toast.error(res.error ?? "הבדיקה נכשלה");
            return;
          }
          toast.success(res.message ?? "הבדיקה הסתיימה");
          await refreshAlertSummary();
          router.refresh();
        })
      }
    >
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
      {pending ? "בודק… (עד 15 שניות)" : "בדוק עכשיו"}
    </Btn>
  );
}

export function AckButton({ id }: { id: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <Btn
      size="sm"
      disabled={pending}
      title="סמן שראית — המייל היומי יפסיק להזכיר את הבעיה הזו"
      onClick={() =>
        start(async () => {
          const res = await acknowledgeAlertAction(id);
          if (!res.ok) {
            toast.error(res.error ?? "שגיאה");
            return;
          }
          await refreshAlertSummary();
          router.refresh();
        })
      }
    >
      {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
      ראיתי
    </Btn>
  );
}

export function SendTestEmailButton() {
  const [pending, start] = useTransition();
  return (
    <Btn
      size="sm"
      disabled={pending}
      onClick={() =>
        start(async () => {
          const res = await sendTestAlertEmailAction();
          if (res.ok) toast.success(`מייל בדיקה ${res.message ?? "נשלח"}`);
          else toast.error(res.error ?? "השליחה נכשלה");
        })
      }
    >
      {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
      שלח מייל בדיקה
    </Btn>
  );
}

export interface ServiceAccountRow {
  serviceId: string;
  name: string;
  defaultPlan?: string;
  dashboardUrl: string;
  plan: string | null;
  monthlyCost: string | null;
  renewalDate: string | null;
  remindDaysBefore: number;
  accountHint: string | null;
  notes: string | null;
  /** Days until renewalDate (computed on the server). */
  daysLeft: number | null;
  /** e.g. the domain expiry the health check found automatically */
  autoRenewalNote?: string | null;
}

export function ServiceAccountEditor({ row }: { row: ServiceAccountRow }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<ServiceAccountInput>({
    serviceId: row.serviceId,
    plan: row.plan,
    monthlyCost: row.monthlyCost,
    renewalDate: row.renewalDate,
    remindDaysBefore: row.remindDaysBefore,
    accountHint: row.accountHint,
    notes: row.notes,
  });
  const set = <K extends keyof ServiceAccountInput>(k: K, v: ServiceAccountInput[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const days = row.daysLeft;

  return (
    <div className="rounded-xl border border-border bg-surface p-3">
      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-0 flex-1">
          <div className="text-sm font-bold text-text">{row.name}</div>
          <div className="text-xs text-text-muted">
            {row.plan || row.defaultPlan || "תוכנית לא הוזנה"}
            {row.monthlyCost ? ` · ${row.monthlyCost}` : ""}
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-xs">
          <CalendarClock className="h-3.5 w-3.5 text-text-subtle" />
          {row.renewalDate ? (
            <span className={days !== null && days <= row.remindDaysBefore ? "font-bold text-amber-600" : "text-text-muted"}>
              חידוש {new Date(`${row.renewalDate}T00:00:00`).toLocaleDateString("he-IL")}
              {days !== null && days >= 0 ? ` (בעוד ${days} ימים)` : days !== null ? " (עבר!)" : ""}
            </span>
          ) : row.autoRenewalNote ? (
            <span className="text-text-muted">{row.autoRenewalNote}</span>
          ) : (
            <span className="text-text-subtle">אין תאריך חידוש</span>
          )}
        </div>
        <Btn size="sm" variant="ghost" onClick={() => setOpen((o) => !o)}>
          {open ? "סגור" : "עריכה"}
        </Btn>
      </div>

      {open && (
        <form
          className="mt-3 grid gap-3 border-t border-border pt-3 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            start(async () => {
              const res = await saveServiceAccountAction(form);
              if (!res.ok) {
                toast.error(res.error ?? "שגיאה");
                return;
              }
              toast.success("נשמר");
              setOpen(false);
              router.refresh();
            });
          }}
        >
          <Field label="תוכנית">
            <Input value={form.plan ?? ""} placeholder={row.defaultPlan} onChange={(e) => set("plan", e.target.value || null)} />
          </Field>
          <Field label="עלות (למשל: $20 לחודש)">
            <Input value={form.monthlyCost ?? ""} onChange={(e) => set("monthlyCost", e.target.value || null)} />
          </Field>
          <Field label="תאריך החידוש / החיוב הבא">
            <Input type="date" value={form.renewalDate ?? ""} onChange={(e) => set("renewalDate", e.target.value || null)} />
          </Field>
          <Field label="להזכיר כמה ימים לפני">
            <Input
              type="number"
              min={1}
              max={120}
              value={form.remindDaysBefore}
              onChange={(e) => set("remindDaysBefore", Number(e.target.value) || 14)}
            />
          </Field>
          <Field label="חשבון (מייל ההתחברות — בלי סיסמה!)" className="sm:col-span-2">
            <Input value={form.accountHint ?? ""} onChange={(e) => set("accountHint", e.target.value || null)} />
          </Field>
          <Field label="הערות" className="sm:col-span-2">
            <Textarea rows={2} value={form.notes ?? ""} onChange={(e) => set("notes", e.target.value || null)} />
          </Field>
          <div className="flex items-center gap-2 sm:col-span-2">
            <Btn type="submit" variant="primary" size="sm" disabled={pending}>
              {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              שמור
            </Btn>
            <a href={row.dashboardUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary-700 hover:underline dark:text-primary-200">
              לחשבון ב-{row.name} ←
            </a>
          </div>
        </form>
      )}
    </div>
  );
}

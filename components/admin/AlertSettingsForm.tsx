"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";
import { Btn, Field, Input } from "./ui/primitives";
import { Toggle } from "./ui/interactive";
import { SendTestEmailButton } from "./health/HealthControls";
import { saveAlertSettingsAction } from "@/app/admin/health/actions";

export function AlertSettingsForm({
  alertEmail: initialEmail,
  dailyEmailEnabled: initialEnabled,
  envFallback,
}: {
  alertEmail: string | null;
  dailyEmailEnabled: boolean;
  envFallback: string | null;
}) {
  const router = useRouter();
  const [email, setEmail] = useState(initialEmail ?? "");
  const [enabled, setEnabled] = useState(initialEnabled);
  const [pending, start] = useTransition();
  const dirty = email !== (initialEmail ?? "") || enabled !== initialEnabled;

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const res = await saveAlertSettingsAction({ alertEmail: email.trim() || null, dailyEmailEnabled: enabled });
          if (!res.ok) {
            toast.error(res.error ?? "שגיאה");
            return;
          }
          toast.success("נשמר");
          router.refresh();
        });
      }}
    >
      <Toggle checked={enabled} onChange={setEnabled} label="לשלוח מייל יומי כשיש בעיה (כל בוקר ב-08:00)" />
      <Field
        label="לאיזו כתובת לשלוח"
        hint={envFallback && !email ? `כרגע נשלח ל-${envFallback} (מוגדר ב-Vercel)` : "המייל נשלח רק כשיש בעיה פתוחה שעוד לא סימנת \"ראיתי\"."}
      >
        <Input type="email" dir="ltr" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={envFallback ?? "you@example.com"} className="max-w-sm" />
      </Field>
      <div className="flex flex-wrap items-center gap-2">
        <Btn type="submit" variant="primary" size="sm" disabled={!dirty || pending}>
          {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
          שמור
        </Btn>
        <SendTestEmailButton />
      </div>
    </form>
  );
}

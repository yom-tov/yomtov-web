"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { VisibilityToggle } from "./ui/interactive";
import { setHiddenAction } from "@/app/admin/visibility-actions";

type Kind = "exam" | "assignment" | "formula" | "lab" | "subject";

/**
 * Eye toggle for content stored in GitHub. The change is a commit, so it
 * reaches the public site after the next build (~1 minute).
 */
export function HiddenToggle({ kind, id, hidden: initial, compact }: { kind: Kind; id: string; hidden: boolean; compact?: boolean }) {
  const router = useRouter();
  const [hidden, setHidden] = useState(initial);
  const [pending, start] = useTransition();
  return (
    <VisibilityToggle
      hidden={hidden}
      pending={pending}
      compact={compact}
      onToggle={() =>
        start(async () => {
          const next = !hidden;
          const res = await setHiddenAction(kind, id, next);
          if (!res.ok) {
            toast.error(res.error ?? "שגיאה");
            return;
          }
          setHidden(next);
          toast.success(next ? "יוסתר מהאתר תוך כדקה" : "יוצג באתר תוך כדקה");
          router.refresh();
        })
      }
    />
  );
}

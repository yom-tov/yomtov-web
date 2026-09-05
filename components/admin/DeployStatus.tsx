"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, CircleDashed, Loader2, XCircle, ExternalLink } from "lucide-react";
import { clsx } from "clsx";

type State = "READY" | "BUILDING" | "QUEUED" | "ERROR" | "CANCELED" | "INITIALIZING";
interface Deployment {
  id: string;
  state: State;
  url: string;
  createdAt: number;
  commitSha?: string;
  commitMessage?: string;
  inspectorUrl?: string;
}

const LABEL: Record<State, string> = {
  READY: "פורסם",
  BUILDING: "בונה…",
  QUEUED: "בתור…",
  ERROR: "שגיאת דפלוי",
  CANCELED: "בוטל",
  INITIALIZING: "מאתחל…",
};
const TONE: Record<State, string> = {
  READY: "border-emerald-200 bg-emerald-50 text-emerald-700",
  BUILDING: "border-amber-200 bg-amber-50 text-amber-800",
  QUEUED: "border-slate-200 bg-slate-50 text-slate-700",
  ERROR: "border-rose-200 bg-rose-50 text-rose-700",
  CANCELED: "border-slate-200 bg-slate-50 text-slate-700",
  INITIALIZING: "border-amber-200 bg-amber-50 text-amber-800",
};

function fmtRelative(ms: number): string {
  const s = Math.max(0, Math.floor((Date.now() - ms) / 1000));
  if (s < 60) return `${s} שניות`;
  if (s < 3600) return `${Math.floor(s / 60)} דק'`;
  return `${Math.floor(s / 3600)} שעות`;
}

export function DeployStatus() {
  const [d, setD] = useState<Deployment | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const tick = async () => {
      try {
        const res = await fetch("/api/admin/deploy-status", { cache: "no-store" });
        if (!res.ok) throw new Error(String(res.status));
        const json = (await res.json()) as { deployment: Deployment | null };
        if (!mounted) return;
        setErr(null);
        setD(json.deployment);
        const s = json.deployment?.state;
        // Keep polling while it's still building; else check every 30s.
        const nextIn = s === "BUILDING" || s === "QUEUED" || s === "INITIALIZING" ? 5000 : 30000;
        timer = setTimeout(tick, nextIn);
      } catch (e) {
        if (!mounted) return;
        setErr((e as Error).message || "בעיית תקשורת");
        timer = setTimeout(tick, 30000);
      }
    };
    tick();
    return () => {
      mounted = false;
      if (timer) clearTimeout(timer);
    };
  }, []);

  if (err && !d) {
    return (
      <div className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-700">
        <XCircle className="h-3.5 w-3.5" />
        סטטוס דפלוי לא זמין
      </div>
    );
  }
  if (!d) {
    return (
      <div className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-500">
        <CircleDashed className="h-3.5 w-3.5" />
        טוען סטטוס…
      </div>
    );
  }

  const Icon =
    d.state === "READY"
      ? CheckCircle2
      : d.state === "ERROR"
        ? XCircle
        : d.state === "CANCELED"
          ? XCircle
          : Loader2;

  return (
    <a
      href={d.inspectorUrl ?? `https://${d.url}`}
      target="_blank"
      rel="noopener"
      className={clsx(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold transition-colors hover:brightness-95",
        TONE[d.state]
      )}
      title={d.commitMessage ?? undefined}
    >
      <Icon
        className={clsx("h-3.5 w-3.5", (d.state === "BUILDING" || d.state === "QUEUED" || d.state === "INITIALIZING") && "animate-spin")}
      />
      <span>{LABEL[d.state]}</span>
      <span className="opacity-70 num">· {fmtRelative(d.createdAt)}</span>
      <ExternalLink className="h-3 w-3 opacity-60" />
    </a>
  );
}

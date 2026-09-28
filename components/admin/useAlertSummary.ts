"use client";

// Tiny shared store for the open-alerts summary. The header bell, the sidebar
// badge and the mobile nav all read the same data from one poller, so the
// panel makes a single request per minute no matter how many widgets show it.

import { useSyncExternalStore } from "react";

export interface AlertItem {
  id: string;
  key: string;
  source: string;
  severity: "critical" | "warning" | "info";
  title: string;
  detail: string | null;
  actionHint: string | null;
  link: string | null;
  firstSeenAt: string;
  lastSeenAt: string;
  acknowledgedAt: string | null;
}

export interface AlertSummary {
  alerts: AlertItem[];
  critical: number;
  warning: number;
  lastRunAt: string | null;
}

const POLL_MS = 60_000;

let state: AlertSummary | null = null;
const listeners = new Set<() => void>();
let timer: ReturnType<typeof setInterval> | null = null;
let inflight: Promise<void> | null = null;

function emit() {
  for (const l of listeners) l();
}

export async function refreshAlertSummary(): Promise<void> {
  if (inflight) return inflight;
  inflight = (async () => {
    try {
      const res = await fetch("/api/admin/alerts", { cache: "no-store" });
      if (!res.ok) return;
      state = (await res.json()) as AlertSummary;
      emit();
    } catch {
      // network hiccup — keep the last known state
    } finally {
      inflight = null;
    }
  })();
  return inflight;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (listeners.size === 1) {
    void refreshAlertSummary();
    timer = setInterval(() => void refreshAlertSummary(), POLL_MS);
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && timer) {
      clearInterval(timer);
      timer = null;
    }
  };
}

export function useAlertSummary(): AlertSummary | null {
  return useSyncExternalStore(
    subscribe,
    () => state,
    () => null,
  );
}

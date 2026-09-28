import type { ServiceId } from "../architecture";

export type CheckStatus = "ok" | "warn" | "error" | "unknown";
export type Severity = "critical" | "warning" | "info";

/** A problem a check found. `key` must be stable across runs. */
export interface AlertDraft {
  key: string;
  severity: Severity;
  title: string;
  detail?: string;
  /** Plain-language "what to do" for the site owner. */
  actionHint?: string;
  link?: string;
}

export interface CheckOutcome {
  status: CheckStatus;
  /** One short Hebrew line shown on the service card. */
  summary: string;
  alerts?: AlertDraft[];
  /** Extra structured data for the health page (deployments, commits…). */
  data?: Record<string, unknown>;
}

export interface CheckResult extends Required<Omit<CheckOutcome, "data">> {
  id: string;
  serviceId: ServiceId | "site";
  label: string;
  durationMs: number;
  /** True when the check itself crashed/timed out — its alerts are kept as-is. */
  failed: boolean;
  data?: Record<string, unknown>;
}

export interface CheckContext {
  signal: AbortSignal;
  /** Share expensive lookups between checks within one run. */
  memo<T>(key: string, fn: () => Promise<T>): Promise<T>;
}

export interface HealthCheck {
  id: string;
  serviceId: ServiceId | "site";
  label: string;
  run(ctx: CheckContext): Promise<CheckOutcome>;
}

export const SEVERITY_RANK: Record<Severity, number> = { critical: 0, warning: 1, info: 2 };

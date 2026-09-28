// Persistence for health runs and alerts (Neon).
//
// Alert lifecycle:
//   - a run reports a problem → upsert by `key` (new row, or refresh the open one)
//   - a completed check no longer reports it → resolved_at = now
//   - a resolved alert that shows up again is reopened (fresh first_seen_at,
//     acknowledgement and email state cleared)
// Checks that crashed/timed out keep their alerts untouched, so a flaky
// external API never "resolves" a real problem.
//
// Only production persists. Local dev and preview deployments share the same
// database but not the production secrets, so their runs would open bogus
// alerts ("VERCEL_TOKEN missing") in the owner's real panel. There, the last
// run is kept in memory instead.

import { and, asc, desc, eq, inArray, isNotNull, isNull, lt, notInArray, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { healthRuns, systemAlerts } from "@/lib/db/schema";
import { runAllChecks } from "./run";
import { SEVERITY_RANK, type CheckResult } from "./types";

export type AlertRow = typeof systemAlerts.$inferSelect;
export type RunTrigger = "cron" | "manual" | "visit";
export interface RunRecord {
  ranAt: Date;
  trigger: string;
  results: CheckResult[];
}

const KEEP_RUNS = 50;

export const PERSIST_HEALTH = process.env.VERCEL_ENV === "production";

// ---------------------------------------------------------------------------
// In-memory mode (non-production)
// ---------------------------------------------------------------------------
let memRun: RunRecord | null = null;
const memAcked = new Map<string, Date>();

function memAlerts(): AlertRow[] {
  if (!memRun) return [];
  return memRun.results
    .flatMap((r) =>
      r.alerts.map(
        (a): AlertRow => ({
          id: a.key,
          key: a.key,
          source: r.id,
          severity: a.severity,
          title: a.title,
          detail: a.detail ?? null,
          actionHint: a.actionHint ?? null,
          link: a.link ?? null,
          firstSeenAt: memRun!.ranAt,
          lastSeenAt: memRun!.ranAt,
          resolvedAt: null,
          acknowledgedAt: memAcked.get(a.key) ?? null,
          lastEmailedAt: null,
        }),
      ),
    )
    .sort((x, y) => SEVERITY_RANK[x.severity] - SEVERITY_RANK[y.severity]);
}

// ---------------------------------------------------------------------------
// Writes
// ---------------------------------------------------------------------------
export async function syncAlerts(results: CheckResult[]): Promise<void> {
  const now = new Date();
  const drafts = results.flatMap((r) => r.alerts.map((a) => ({ ...a, source: r.id })));
  const completedSources = results.filter((r) => !r.failed).map((r) => r.id);
  const seenKeys = drafts.map((d) => d.key);

  const upserts = drafts.map((d) =>
    db
      .insert(systemAlerts)
      .values({
        key: d.key,
        source: d.source,
        severity: d.severity,
        title: d.title,
        detail: d.detail ?? null,
        actionHint: d.actionHint ?? null,
        link: d.link ?? null,
        firstSeenAt: now,
        lastSeenAt: now,
      })
      .onConflictDoUpdate({
        target: systemAlerts.key,
        set: {
          source: d.source,
          severity: d.severity,
          title: d.title,
          detail: d.detail ?? null,
          actionHint: d.actionHint ?? null,
          link: d.link ?? null,
          lastSeenAt: now,
          // Postgres evaluates every SET expression against the OLD row, so
          // these CASEs see the previous resolved_at.
          firstSeenAt: sql`CASE WHEN ${systemAlerts.resolvedAt} IS NOT NULL THEN ${now} ELSE ${systemAlerts.firstSeenAt} END`,
          acknowledgedAt: sql`CASE WHEN ${systemAlerts.resolvedAt} IS NOT NULL THEN NULL ELSE ${systemAlerts.acknowledgedAt} END`,
          lastEmailedAt: sql`CASE WHEN ${systemAlerts.resolvedAt} IS NOT NULL THEN NULL ELSE ${systemAlerts.lastEmailedAt} END`,
          resolvedAt: null,
        },
      }),
  );

  const resolve = completedSources.length
    ? db
        .update(systemAlerts)
        .set({ resolvedAt: now })
        .where(
          and(
            isNull(systemAlerts.resolvedAt),
            inArray(systemAlerts.source, completedSources),
            seenKeys.length ? notInArray(systemAlerts.key, seenKeys) : undefined,
          ),
        )
    : null;

  const queries = [...upserts, ...(resolve ? [resolve] : [])];
  if (!queries.length) return;
  const [first, ...rest] = queries;
  await db.batch([first, ...rest]);
}

export async function saveRun(results: CheckResult[], trigger: RunTrigger, durationMs: number): Promise<void> {
  await db.insert(healthRuns).values({ trigger, results, durationMs });
  // Keep only the latest runs.
  await db.execute(sql`
    DELETE FROM ${healthRuns}
    WHERE ${healthRuns.id} NOT IN (
      SELECT ${healthRuns.id} FROM ${healthRuns} ORDER BY ${healthRuns.ranAt} DESC LIMIT ${KEEP_RUNS}
    )
  `);
}

export async function runAndStore(trigger: RunTrigger): Promise<RunRecord> {
  const started = Date.now();
  const results = await runAllChecks();
  const record: RunRecord = { ranAt: new Date(), trigger, results };
  if (!PERSIST_HEALTH) {
    memRun = record;
    return record;
  }
  await syncAlerts(results);
  await saveRun(results, trigger, Date.now() - started);
  return record;
}

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------
export async function getLatestRun(): Promise<RunRecord | null> {
  if (!PERSIST_HEALTH) return memRun;
  const [row] = await db.select().from(healthRuns).orderBy(desc(healthRuns.ranAt)).limit(1);
  if (!row) return null;
  return { ranAt: row.ranAt, trigger: row.trigger, results: row.results as CheckResult[] };
}

/** Run the checks only if the latest run is older than `maxAgeMs`. */
export async function refreshIfStale(maxAgeMs: number, trigger: RunTrigger = "visit"): Promise<boolean> {
  let lastRanAt: Date | null;
  if (PERSIST_HEALTH) {
    const [row] = await db
      .select({ ranAt: healthRuns.ranAt })
      .from(healthRuns)
      .orderBy(desc(healthRuns.ranAt))
      .limit(1);
    lastRanAt = row?.ranAt ?? null;
  } else {
    lastRanAt = memRun?.ranAt ?? null;
  }
  if (lastRanAt && Date.now() - lastRanAt.getTime() < maxAgeMs) return false;
  await runAndStore(trigger);
  return true;
}

const SEVERITY_ORDER = sql`CASE ${systemAlerts.severity} WHEN 'critical' THEN 0 WHEN 'warning' THEN 1 ELSE 2 END`;

export async function listOpenAlerts(): Promise<AlertRow[]> {
  if (!PERSIST_HEALTH) return memAlerts();
  return db
    .select()
    .from(systemAlerts)
    .where(isNull(systemAlerts.resolvedAt))
    .orderBy(asc(SEVERITY_ORDER), desc(systemAlerts.lastSeenAt));
}

export async function listResolvedAlerts(limit = 20): Promise<AlertRow[]> {
  if (!PERSIST_HEALTH) return [];
  return db
    .select()
    .from(systemAlerts)
    .where(isNotNull(systemAlerts.resolvedAt))
    .orderBy(desc(systemAlerts.resolvedAt))
    .limit(limit);
}

export async function acknowledgeAlert(id: string): Promise<void> {
  if (!PERSIST_HEALTH) {
    memAcked.set(id, new Date());
    return;
  }
  await db.update(systemAlerts).set({ acknowledgedAt: new Date() }).where(eq(systemAlerts.id, id));
}

/** Open, unacknowledged critical/warning alerts — what the daily email reports. */
export async function alertsToEmail(): Promise<AlertRow[]> {
  if (!PERSIST_HEALTH) {
    return memAlerts().filter((a) => !a.acknowledgedAt && a.severity !== "info");
  }
  return db
    .select()
    .from(systemAlerts)
    .where(
      and(
        isNull(systemAlerts.resolvedAt),
        isNull(systemAlerts.acknowledgedAt),
        inArray(systemAlerts.severity, ["critical", "warning"]),
      ),
    )
    .orderBy(asc(SEVERITY_ORDER), desc(systemAlerts.lastSeenAt));
}

export async function markEmailed(ids: string[]): Promise<void> {
  if (!ids.length || !PERSIST_HEALTH) return;
  await db.update(systemAlerts).set({ lastEmailedAt: new Date() }).where(inArray(systemAlerts.id, ids));
}

/** Drop resolved alerts older than 90 days so the table stays small. */
export async function pruneOldAlerts(): Promise<void> {
  if (!PERSIST_HEALTH) return;
  const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
  await db.delete(systemAlerts).where(and(isNotNull(systemAlerts.resolvedAt), lt(systemAlerts.resolvedAt, cutoff)));
}

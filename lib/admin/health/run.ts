import type { CheckContext, CheckResult, HealthCheck } from "./types";
import { errMessage } from "./util";
import { deploymentsCheck, accountCheck, siteUpCheck } from "./checks/vercel";
import { githubCheck } from "./checks/github";
import { dnsCheck, vercelDomainCheck, domainExpiryCheck } from "./checks/domain";
import { muxCheck } from "./checks/mux";
import { neonCheck } from "./checks/neon";
import { resendCheck } from "./checks/resend";
import { r2Check } from "./checks/r2";
import { envCheck, contentCheck } from "./checks/site";
import { renewalsCheck } from "./checks/renewals";

// Order = display order on the health page (most important first).
export const CHECKS: HealthCheck[] = [
  siteUpCheck,
  dnsCheck,
  vercelDomainCheck,
  deploymentsCheck,
  githubCheck,
  neonCheck,
  muxCheck,
  r2Check,
  resendCheck,
  accountCheck,
  domainExpiryCheck,
  renewalsCheck,
  envCheck,
  contentCheck,
];

const CHECK_TIMEOUT_MS = 9_000;

export async function runAllChecks(): Promise<CheckResult[]> {
  const memoStore = new Map<string, Promise<unknown>>();
  const memo = <T>(key: string, fn: () => Promise<T>): Promise<T> => {
    if (!memoStore.has(key)) memoStore.set(key, fn());
    return memoStore.get(key) as Promise<T>;
  };

  return Promise.all(
    CHECKS.map(async (check): Promise<CheckResult> => {
      const started = Date.now();
      const controller = new AbortController();
      const ctx: CheckContext = { signal: controller.signal, memo };
      let timer: ReturnType<typeof setTimeout> | undefined;
      try {
        const outcome = await Promise.race([
          check.run(ctx),
          new Promise<never>((_, reject) => {
            timer = setTimeout(() => {
              controller.abort();
              reject(new Error("הבדיקה לקחה יותר מדי זמן"));
            }, CHECK_TIMEOUT_MS);
          }),
        ]);
        return {
          id: check.id,
          serviceId: check.serviceId,
          label: check.label,
          status: outcome.status,
          summary: outcome.summary,
          alerts: outcome.alerts ?? [],
          data: outcome.data,
          durationMs: Date.now() - started,
          failed: false,
        };
      } catch (e) {
        return {
          id: check.id,
          serviceId: check.serviceId,
          label: check.label,
          status: "unknown",
          summary: `הבדיקה נכשלה: ${errMessage(e)}`,
          alerts: [],
          durationMs: Date.now() - started,
          failed: true,
        };
      } finally {
        if (timer) clearTimeout(timer);
      }
    }),
  );
}

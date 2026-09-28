import { exams, assignments } from "@/lib/content";
import { getAssetUrl } from "@/lib/pdf-url";
import type { HealthCheck } from "../types";
import { SITE_URL, errMessage } from "../util";

function absolute(url: string): string {
  return url.startsWith("http") ? url : `${SITE_URL}${url}`;
}

// A few representative PDFs: newest exam, its solution, one assignment.
function samplePaths(): string[] {
  const out: string[] = [];
  const exam = exams.find((e) => e.exam?.path);
  if (exam) out.push(exam.exam.path);
  const withSolution = exams.find((e) => e.solution?.path);
  if (withSolution?.solution) out.push(withSolution.solution.path);
  const a = assignments.find((x) => x.files[0]?.path);
  if (a) out.push(a.files[0].path);
  return out;
}

export const r2Check: HealthCheck = {
  id: "r2",
  serviceId: "r2",
  label: "קבצי PDF (Cloudflare R2)",
  async run(ctx) {
    if (!process.env.NEXT_PUBLIC_PDF_BASE_URL) {
      // Without the CDN base URL the links point at the site itself, where the
      // PDFs no longer live. The env check reports the missing variable.
      return { status: "unknown", summary: "חסר NEXT_PUBLIC_PDF_BASE_URL — לא ניתן לבדוק" };
    }
    const paths = samplePaths();
    if (!paths.length) return { status: "unknown", summary: "אין קבצים לבדיקה" };
    try {
      const results = await Promise.all(
        paths.map(async (p) => {
          const url = absolute(getAssetUrl(p));
          const res = await fetch(url, { method: "HEAD", signal: ctx.signal, cache: "no-store" });
          return { path: p, url, status: res.status };
        }),
      );
      const failed = results.filter((r) => r.status !== 200);
      if (failed.length) {
        return {
          status: "error",
          summary: `${failed.length} מתוך ${results.length} קבצים לא נטענים`,
          data: { results },
          alerts: [
            {
              key: "r2.files-unreachable",
              severity: "critical",
              title: "קבצי PDF לא נטענים",
              detail: `קבצים לדוגמה מחזירים שגיאה: ${failed.map((f) => `${f.path} (${f.status})`).join(", ")}.`,
              actionHint: "בדוק ב-Cloudflare → R2 שה-bucket \"yomtov-assets\" קיים ושהגישה הציבורית (Public access) פעילה, ושהכתובת ב-NEXT_PUBLIC_PDF_BASE_URL נכונה.",
              link: "https://dash.cloudflare.com/?to=/:account/r2/overview",
            },
          ],
        };
      }
      return { status: "ok", summary: `כל ${results.length} קבצי הבדיקה נטענים`, data: { results } };
    } catch (e) {
      return { status: "unknown", summary: `לא ניתן לבדוק: ${errMessage(e)}` };
    }
  },
};

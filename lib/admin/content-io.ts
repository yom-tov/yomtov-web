// Typed reads of content JSON files from GitHub. All writes go through
// `commitFiles` from ./github.ts as part of a larger atomic commit inside
// mutations.ts — this module deliberately doesn't offer write helpers so we
// never accidentally commit a JSON file alone without rebuilding search-index.

import type {
  Exam,
  Assignment,
  Lab,
  Subject,
  SearchItem,
  SubjectId,
  ExamSource,
} from "@/types/content";
import { readJson } from "./github";
import { SOURCE_LABEL_HE } from "./slug";

export const CONTENT_PATHS = {
  subjects: "content/subjects.json",
  exams: "content/exams.json",
  assignments: "content/assignments.json",
  labs: "content/labs.json",
  searchIndex: "content/search-index.json",
} as const;

export async function readSubjects() {
  return (await readJson<Subject[]>(CONTENT_PATHS.subjects)) ?? { data: [], sha: "" };
}
export async function readExams() {
  return (await readJson<Exam[]>(CONTENT_PATHS.exams)) ?? { data: [], sha: "" };
}
export async function readAssignments() {
  return (await readJson<Assignment[]>(CONTENT_PATHS.assignments)) ?? { data: [], sha: "" };
}
export async function readLabs() {
  return (await readJson<Lab[]>(CONTENT_PATHS.labs)) ?? { data: [], sha: "" };
}

// Rebuild the search index from the current exams + assignments in one place.
// Also lives inline in scripts/build-content.mjs; keeping the shape identical
// so both paths produce byte-equal files.
export function buildSearchIndex(exams: Exam[], assignments: Assignment[]): SearchItem[] {
  const out: SearchItem[] = [];
  for (const e of exams) {
    out.push({
      id: e.id,
      type: e.source === "mahat" ? "exam-mahat" : "exam-education",
      title: e.title,
      subject: e.subject,
      year: e.year,
      season: e.season,
      version: e.version,
      url: `/${e.subject}/${e.source === "mahat" ? "mahat-exams" : "ministry-exams"}/${e.slug}`,
    });
  }
  for (const a of assignments) {
    out.push({
      id: a.id,
      type: "assignment",
      title: a.title,
      subject: a.subject,
      url: `/${a.subject}/assignments/${a.slug}`,
    });
  }
  return out;
}

// Pretty JSON — 2-space indent + trailing newline — matches what
// scripts/build-content.mjs writes so diffs stay clean.
export function stringifyJson(value: unknown): string {
  return JSON.stringify(value, null, 2) + "\n";
}

// PDF path convention shared with build-content.mjs.
export function examPdfPath(exam: Pick<Exam, "subject" | "source" | "slug">, kind: "exam" | "solution"): string {
  const src = exam.source; // mahat | education
  const suffix = kind === "solution" ? "-solution.pdf" : ".pdf";
  return `public/pdfs/${src}/${exam.subject}/${exam.slug}${suffix}`;
}
export function assignmentPdfPath(a: Pick<Assignment, "subject" | "slug">, idx: number): string {
  const suffix = idx === 0 ? ".pdf" : `-${idx + 1}.pdf`;
  return `public/pdfs/assignments/${a.subject}/${a.slug}${suffix}`;
}

// Composite id used everywhere (URLs, admin routing).
export function examId(subject: SubjectId, source: ExamSource, slug: string): string {
  const t = source === "mahat" ? "exam-mahat" : "exam-education";
  return `${subject}/${t}/${slug}`;
}
export function assignmentId(subject: SubjectId, slug: string): string {
  return `${subject}/assignments/${slug}`;
}
export function labId(slug: string): string {
  return `labs/${slug}`;
}

export const SOURCE_LABEL = SOURCE_LABEL_HE; // re-export for admin UI

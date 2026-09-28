// Typed reads of content JSON files from GitHub. All writes go through
// `commitFiles` from ./github.ts as part of a larger atomic commit inside
// mutations.ts — this module deliberately doesn't offer write helpers so we
// never accidentally commit a JSON file alone without rebuilding search-index.

import type {
  Exam,
  Assignment,
  Formula,
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
  formulas: "content/formulas.json",
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
export async function readFormulas() {
  return (await readJson<Formula[]>(CONTENT_PATHS.formulas)) ?? { data: [], sha: "" };
}

// Everything the search index is built from, read in one go.
export async function readIndexedContent() {
  const [{ data: exams }, { data: assignments }, { data: formulas }] = await Promise.all([
    readExams(),
    readAssignments(),
    readFormulas(),
  ]);
  return { exams, assignments, formulas };
}

// Search-index type + URL segment per exam source. Mirrors SOURCE_SLUG in
// lib/content.ts (the public routes read that map).
const EXAM_INDEX_TYPE: Record<ExamSource, Extract<SearchItem, { year: number | null }>["type"]> = {
  mahat: "exam-mahat",
  education: "exam-education",
  technician: "exam-technician",
  "electrical-systems": "exam-electrical-systems",
};
const EXAM_URL_SEGMENT: Record<ExamSource, string> = {
  mahat: "mahat-exams",
  education: "ministry-exams",
  technician: "technician-exams",
  "electrical-systems": "electrical-systems-exams",
};

// Rebuild the search index from the current exams + assignments + formulas.
// Hidden items are left out so they never show up in the public search.
export function buildSearchIndex(
  exams: Exam[],
  assignments: Assignment[],
  formulas: Formula[],
): SearchItem[] {
  const out: SearchItem[] = [];
  for (const e of exams) {
    if (e.hidden) continue;
    out.push({
      id: e.id,
      type: EXAM_INDEX_TYPE[e.source],
      title: e.title,
      subject: e.subject,
      year: e.year,
      season: e.season,
      version: e.version,
      url: `/${e.subject}/${EXAM_URL_SEGMENT[e.source]}/${e.slug}`,
    });
  }
  for (const a of assignments) {
    if (a.hidden) continue;
    out.push({
      id: a.id,
      type: "assignment",
      title: a.title,
      subject: a.subject,
      url: `/${a.subject}/assignments/${a.slug}`,
    });
  }
  for (const f of formulas) {
    if (f.hidden) continue;
    out.push({
      id: f.id,
      type: "formula",
      title: f.title,
      subject: f.subject,
      url: `/${f.subject}/formulas/${f.slug}`,
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
  return `${subject}/${EXAM_INDEX_TYPE[source]}/${slug}`;
}
export function assignmentId(subject: SubjectId, slug: string): string {
  return `${subject}/assignments/${slug}`;
}
export function formulaId(subject: SubjectId, slug: string): string {
  return `${subject}/formulas/${slug}`;
}
// Lab ids follow the original "lab-NN" convention (NN = order, zero-padded).
export function labId(order: number): string {
  return `lab-${String(order).padStart(2, "0")}`;
}

export const SOURCE_LABEL = SOURCE_LABEL_HE; // re-export for admin UI

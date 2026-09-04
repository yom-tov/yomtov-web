import subjectsRaw from "@/content/subjects.json";
import examsRaw from "@/content/exams.json";
import assignmentsRaw from "@/content/assignments.json";
import labsRaw from "@/content/labs.json";
import searchIndexRaw from "@/content/search-index.json";
import type {
  Subject,
  Exam,
  Assignment,
  Lab,
  SubjectId,
  ExamSource,
  SearchItem,
} from "@/types/content";

export const subjects = subjectsRaw as Subject[];
export const exams = examsRaw as Exam[];
export const assignments = assignmentsRaw as Assignment[];
export const labs = labsRaw as Lab[];
export const searchIndex = searchIndexRaw as SearchItem[];

export function getSubject(id: SubjectId): Subject | undefined {
  return subjects.find((s) => s.id === id);
}

export function examsFor(subject: SubjectId, source: ExamSource): Exam[] {
  return exams.filter((e) => e.subject === subject && e.source === source);
}

export function assignmentsFor(subject: SubjectId): Assignment[] {
  return assignments.filter((a) => a.subject === subject);
}

export function findExam(
  subject: SubjectId,
  source: ExamSource,
  slug: string
): Exam | undefined {
  return exams.find(
    (e) => e.subject === subject && e.source === source && e.slug === slug
  );
}

export function findAssignment(
  subject: SubjectId,
  slug: string
): Assignment | undefined {
  return assignments.find((a) => a.subject === subject && a.slug === slug);
}

export function recentExams(limit = 6): Exam[] {
  return exams
    .slice()
    .filter((e) => e.year != null)
    .sort((a, b) => (b.year || 0) - (a.year || 0))
    .slice(0, limit);
}

export function counts() {
  return {
    exams: exams.length,
    mahatExams: exams.filter((e) => e.source === "mahat").length,
    ministryExams: exams.filter((e) => e.source === "education").length,
    assignments: assignments.length,
    labs: labs.length,
    subjects: subjects.length,
  };
}

const SEASON_HE: Record<string, string> = {
  summer: "קיץ",
  spring: "אביב",
  winter: "חורף",
  fall: "סתיו",
};
const VERSION_HE: Record<string, string> = {
  a: "מועד א",
  b: "מועד ב",
  combined: "מועד א/ב",
};

export function examSubtitle(exam: Exam): string {
  const parts: string[] = [];
  if (exam.year) parts.push(String(exam.year));
  if (exam.season && SEASON_HE[exam.season]) parts.push(SEASON_HE[exam.season]);
  if (exam.version && VERSION_HE[exam.version]) parts.push(VERSION_HE[exam.version]);
  return parts.join(" · ");
}

export function formatSize(bytes: number | null | undefined): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export const SUBJECT_TITLE_HE: Record<SubjectId, string> = {
  electricity: "חשמל",
  analog: "אלקטרוניקה תקבילית",
  digital: "אלקטרוניקה ספרתית",
};

export const SOURCE_TITLE_HE: Record<ExamSource, string> = {
  mahat: 'מבחני מה"ט',
  education: "מבחני משרד החינוך",
};

export const SOURCE_SLUG: Record<ExamSource, string> = {
  mahat: "mahat-exams",
  education: "ministry-exams",
};

export function sourceFromSlug(slug: string): ExamSource | null {
  if (slug === "mahat-exams") return "mahat";
  if (slug === "ministry-exams") return "education";
  return null;
}

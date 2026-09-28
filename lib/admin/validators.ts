import { z } from "zod";
import { SUBJECT_ICON_NAMES } from "@/lib/subject-icons";

const currentYear = new Date().getFullYear();

const subjectSchema = z.enum(["electricity", "analog", "digital", "math", "physics"]);
const sourceSchema = z.enum(["mahat", "education", "technician", "electrical-systems"]);
const seasonSchema = z.enum(["summer", "spring", "winter", "fall"]).nullable();
const versionSchema = z.enum(["a", "b", "combined"]).nullable();

// A file reference produced by our FileUpload component after a successful
// upload to Vercel Blob. The server action fetches the URL and commits the
// binary to GitHub, then deletes the blob.
const blobRefSchema = z.object({
  url: z.string().url().refine((u) => {
    try {
      const { protocol, hostname } = new URL(u);
      return protocol === "https:" && hostname.endsWith(".blob.vercel-storage.com");
    } catch {
      return false;
    }
  }, "Not a Vercel Blob URL"),
  sizeBytes: z.number().int().positive().max(30 * 1024 * 1024, "Max 30 MB"),
  pathname: z.string(),
});

export const ExamCreateSchema = z.object({
  subject: subjectSchema,
  source: sourceSchema,
  title: z.string().min(1).max(200),
  year: z.number().int().min(1990).max(currentYear + 2).nullable(),
  season: seasonSchema,
  version: versionSchema,
  topic: z.string().max(100).nullable().optional(),
  exam: blobRefSchema,
  solution: blobRefSchema.nullable().optional(),
});
export type ExamCreateInput = z.infer<typeof ExamCreateSchema>;

// Update: files are optional (empty = keep existing).
export const ExamUpdateSchema = z.object({
  subject: subjectSchema,
  source: sourceSchema,
  title: z.string().min(1).max(200),
  year: z.number().int().min(1990).max(currentYear + 2).nullable(),
  season: seasonSchema,
  version: versionSchema,
  topic: z.string().max(100).nullable().optional(),
  exam: blobRefSchema.nullable().optional(),
  solution: blobRefSchema.nullable().optional(),
  // Explicit deletes for the solution
  deleteSolution: z.boolean().optional(),
});
export type ExamUpdateInput = z.infer<typeof ExamUpdateSchema>;

export const AssignmentCreateSchema = z.object({
  subject: subjectSchema,
  title: z.string().min(1).max(200),
  topic: z.string().max(100).nullable().optional(),
  slug: z.string().regex(/^[a-z0-9\-]{2,60}$/, "Slug: 2-60 chars a-z 0-9 -").optional(),
  files: z.array(blobRefSchema).min(1).max(6),
});
export type AssignmentCreateInput = z.infer<typeof AssignmentCreateSchema>;

// keep = indexes of the current files to keep, in their new order; new
// uploads are appended after them. The first file is the exercise, the rest
// are (password-locked) solutions.
export const AssignmentUpdateSchema = z
  .object({
    subject: subjectSchema,
    title: z.string().min(1).max(200),
    topic: z.string().max(100).nullable().optional(),
    keep: z.array(z.number().int().min(0)).max(6),
    files: z.array(blobRefSchema).max(6).default([]),
  })
  .refine((d) => d.keep.length + d.files.length >= 1, "צריך לפחות קובץ אחד")
  .refine((d) => d.keep.length + d.files.length <= 6, "עד 6 קבצים למטלה");
export type AssignmentUpdateInput = z.infer<typeof AssignmentUpdateSchema>;

export const SubjectUpdateSchema = z.object({
  hebrewTitle: z.string().min(1).max(80),
  description: z.string().min(1).max(500),
  icon: z.enum(SUBJECT_ICON_NAMES),
  color: z.string().min(3).max(120),
});
export type SubjectUpdateInput = z.infer<typeof SubjectUpdateSchema>;

export const LabCreateSchema = z.object({
  slug: z.string().regex(/^[a-z0-9\-]{2,60}$/),
  title: z.string().min(1).max(200),
  youtubeId: z.string().min(5).max(20),
});
export type LabCreateInput = z.infer<typeof LabCreateSchema>;

export const LabUpdateSchema = z.object({
  title: z.string().min(1).max(200),
  youtubeId: z.string().min(5).max(20),
});
export type LabUpdateInput = z.infer<typeof LabUpdateSchema>;

export const FormulaCreateSchema = z.object({
  subject: subjectSchema,
  title: z.string().min(1).max(200),
  slug: z.string().regex(/^[a-z0-9-]{2,60}$/, "Slug: 2-60 chars a-z 0-9 -").optional(),
  file: blobRefSchema,
});
export type FormulaCreateInput = z.infer<typeof FormulaCreateSchema>;

export const FormulaUpdateSchema = z.object({
  title: z.string().min(1).max(200),
  file: blobRefSchema.nullable().optional(),
});
export type FormulaUpdateInput = z.infer<typeof FormulaUpdateSchema>;

export const HiddenKindSchema = z.enum(["exam", "assignment", "formula", "lab", "subject"]);
export type HiddenKind = z.infer<typeof HiddenKindSchema>;

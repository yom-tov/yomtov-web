import { z } from "zod";

const currentYear = new Date().getFullYear();

const subjectSchema = z.enum(["electricity", "analog", "digital"]);
const sourceSchema = z.enum(["mahat", "education"]);
const seasonSchema = z.enum(["summer", "spring", "winter", "fall"]).nullable();
const versionSchema = z.enum(["a", "b", "combined"]).nullable();

// A file reference produced by our FileUpload component after a successful
// upload to Vercel Blob. The server action fetches the URL and commits the
// binary to GitHub, then deletes the blob.
const blobRefSchema = z.object({
  url: z.string().url().refine(
    (u) => u.includes(".blob.vercel-storage.com") || u.includes(".public.blob.vercel-storage.com"),
    "Not a Vercel Blob URL"
  ),
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

export const AssignmentUpdateSchema = z.object({
  subject: subjectSchema,
  title: z.string().min(1).max(200),
  topic: z.string().max(100).nullable().optional(),
  files: z.array(blobRefSchema).max(6).optional(),
  keepExistingFiles: z.boolean().default(true),
});
export type AssignmentUpdateInput = z.infer<typeof AssignmentUpdateSchema>;

export const SubjectUpdateSchema = z.object({
  hebrewTitle: z.string().min(1).max(80),
  description: z.string().min(1).max(500),
  icon: z.enum(["Zap", "CircuitBoard", "Binary", "Beaker", "Calculator", "ClipboardCheck"]),
  color: z.string().min(3).max(120),
});
export type SubjectUpdateInput = z.infer<typeof SubjectUpdateSchema>;

export const LabCreateSchema = z.object({
  slug: z.string().regex(/^[a-z0-9\-]{2,60}$/),
  title: z.string().min(1).max(200),
  description: z.string().max(500).optional(),
  files: z.array(blobRefSchema).min(1).max(6),
});
export type LabCreateInput = z.infer<typeof LabCreateSchema>;

export const LabUpdateSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(500).optional(),
  files: z.array(blobRefSchema).max(6).optional(),
  keepExistingFiles: z.boolean().default(true),
});
export type LabUpdateInput = z.infer<typeof LabUpdateSchema>;

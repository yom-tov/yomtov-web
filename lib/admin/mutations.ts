// High-level admin mutations. Each function:
//   1) Reads the current relevant content files from GitHub
//   2) Fetches any newly-uploaded PDFs from Vercel Blob
//   3) Builds a FileWrite[] describing all changes
//   4) Commits them atomically via commitFiles()
//   5) Deletes the transient blobs
//
// The atomic-commit contract means the site never sees a state where the
// JSON knows about a PDF that isn't in the tree yet, or vice-versa.

import { del } from "@vercel/blob";
import type {
  Exam,
  Assignment,
  Lab,
  Subject,
  SubjectId,
  ExamSource,
} from "@/types/content";
import { commitFiles, type FileWrite, type CommitResult } from "./github";
import {
  buildSearchIndex,
  stringifyJson,
  examPdfPath,
  assignmentPdfPath,
  readExams,
  readAssignments,
  readSubjects,
  readLabs,
  examId as buildExamId,
  assignmentId as buildAssignmentId,
  labId as buildLabId,
  CONTENT_PATHS,
} from "./content-io";
import { examSlug, assignmentSlug } from "./slug";
import type {
  ExamCreateInput,
  ExamUpdateInput,
  AssignmentCreateInput,
  AssignmentUpdateInput,
  SubjectUpdateInput,
  LabCreateInput,
  LabUpdateInput,
} from "./validators";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
async function fetchBlob(url: string): Promise<Uint8Array> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch blob ${url}: ${res.status}`);
  const buf = await res.arrayBuffer();
  return new Uint8Array(buf);
}

async function cleanupBlobs(urls: string[]): Promise<void> {
  // Best-effort — we don't want a failing blob delete to make the mutation
  // look failed. If they leak, they'll expire eventually.
  await Promise.allSettled(urls.map((u) => del(u)));
}

// ---------------------------------------------------------------------------
// Exams
// ---------------------------------------------------------------------------
export async function createExam(input: ExamCreateInput): Promise<CommitResult> {
  const [{ data: exams }, { data: assignments }] = await Promise.all([
    readExams(),
    readAssignments(),
  ]);

  const slug = examSlug({
    year: input.year,
    season: input.season,
    version: input.version,
    title: input.title,
  });

  // Reject duplicate slug within the same subject/source bucket
  const dup = exams.find(
    (e) => e.subject === input.subject && e.source === input.source && e.slug === slug
  );
  if (dup) {
    throw new Error(`DUPLICATE: an exam with slug "${slug}" already exists under ${input.subject}/${input.source}`);
  }

  const id = buildExamId(input.subject, input.source, slug);
  const examFilePath = examPdfPath({ subject: input.subject, source: input.source, slug }, "exam");
  const solutionFilePath = input.solution
    ? examPdfPath({ subject: input.subject, source: input.source, slug }, "solution")
    : null;

  // Fetch PDFs from Blob
  const examBytes = await fetchBlob(input.exam.url);
  const solutionBytes = input.solution ? await fetchBlob(input.solution.url) : null;

  const newExam: Exam = {
    id,
    slug,
    subject: input.subject,
    source: input.source,
    title: input.title,
    year: input.year,
    season: input.season,
    version: input.version,
    topic: input.topic ?? null,
    exam: {
      url: "",
      path: "/" + examFilePath.replace(/^public\//, ""),
      sizeBytes: input.exam.sizeBytes,
      id: input.exam.pathname,
    },
    solution: input.solution
      ? {
          url: "",
          path: "/" + (solutionFilePath as string).replace(/^public\//, ""),
          sizeBytes: input.solution.sizeBytes,
          id: input.solution.pathname,
        }
      : null,
    originalListUrl: "",
    originalDetailUrl: null,
  };

  const nextExams = [...exams, newExam];
  const searchIndex = buildSearchIndex(nextExams, assignments);

  const writes: FileWrite[] = [
    { path: examFilePath, kind: "binary", content: examBytes },
    { path: CONTENT_PATHS.exams, kind: "text", content: stringifyJson(nextExams) },
    { path: CONTENT_PATHS.searchIndex, kind: "text", content: stringifyJson(searchIndex) },
  ];
  if (solutionBytes && solutionFilePath) {
    writes.push({ path: solutionFilePath, kind: "binary", content: solutionBytes });
  }

  const commit = await commitFiles(writes, `admin: add ${input.source} exam ${slug}`);
  await cleanupBlobs(
    [input.exam.url, input.solution?.url].filter((u): u is string => Boolean(u))
  );
  return commit;
}

export async function updateExam(id: string, input: ExamUpdateInput): Promise<CommitResult> {
  const [{ data: exams }, { data: assignments }] = await Promise.all([
    readExams(),
    readAssignments(),
  ]);
  const idx = exams.findIndex((e) => e.id === id);
  if (idx === -1) throw new Error(`NOT_FOUND: exam ${id}`);
  const cur = exams[idx];

  // For MVP the slug follows year/season/version — if any changed we need to
  // move files. To keep it safe we require slug stays the same on update.
  // (Delete + re-create if you need a rename.)
  const newSlug = examSlug({
    year: input.year,
    season: input.season,
    version: input.version,
    title: input.title,
  });
  if (newSlug !== cur.slug) {
    throw new Error(
      `SLUG_CHANGE: changing year/season/version alters the slug (${cur.slug} → ${newSlug}). Delete this exam and create a new one instead.`
    );
  }
  if (input.subject !== cur.subject || input.source !== cur.source) {
    throw new Error("SUBJECT_OR_SOURCE_CHANGE: not supported; delete + recreate.");
  }

  const examFilePath = examPdfPath(cur, "exam");
  const solutionFilePath = examPdfPath(cur, "solution");

  // Compose the updated exam entry
  const updated: Exam = {
    ...cur,
    title: input.title,
    year: input.year,
    season: input.season,
    version: input.version,
    topic: input.topic ?? null,
  };

  const writes: FileWrite[] = [];
  const blobsToDelete: string[] = [];

  // Exam file replacement
  if (input.exam) {
    const bytes = await fetchBlob(input.exam.url);
    writes.push({ path: examFilePath, kind: "binary", content: bytes });
    updated.exam = {
      ...cur.exam,
      sizeBytes: input.exam.sizeBytes,
      id: input.exam.pathname,
    };
    blobsToDelete.push(input.exam.url);
  }

  // Solution: replace, delete, or leave alone
  if (input.deleteSolution && cur.solution) {
    writes.push({ path: solutionFilePath, kind: "delete" });
    updated.solution = null;
  } else if (input.solution) {
    const bytes = await fetchBlob(input.solution.url);
    writes.push({ path: solutionFilePath, kind: "binary", content: bytes });
    updated.solution = {
      url: "",
      path: "/" + solutionFilePath.replace(/^public\//, ""),
      sizeBytes: input.solution.sizeBytes,
      id: input.solution.pathname,
    };
    blobsToDelete.push(input.solution.url);
  }

  const nextExams = [...exams];
  nextExams[idx] = updated;
  const searchIndex = buildSearchIndex(nextExams, assignments);

  writes.push({ path: CONTENT_PATHS.exams, kind: "text", content: stringifyJson(nextExams) });
  writes.push({ path: CONTENT_PATHS.searchIndex, kind: "text", content: stringifyJson(searchIndex) });

  const commit = await commitFiles(writes, `admin: update ${cur.source} exam ${cur.slug}`);
  await cleanupBlobs(blobsToDelete);
  return commit;
}

export async function deleteExam(id: string): Promise<CommitResult> {
  const [{ data: exams }, { data: assignments }] = await Promise.all([
    readExams(),
    readAssignments(),
  ]);
  const idx = exams.findIndex((e) => e.id === id);
  if (idx === -1) throw new Error(`NOT_FOUND: exam ${id}`);
  const cur = exams[idx];

  const nextExams = exams.filter((_, i) => i !== idx);
  const searchIndex = buildSearchIndex(nextExams, assignments);

  const writes: FileWrite[] = [
    { path: examPdfPath(cur, "exam"), kind: "delete" },
    { path: CONTENT_PATHS.exams, kind: "text", content: stringifyJson(nextExams) },
    { path: CONTENT_PATHS.searchIndex, kind: "text", content: stringifyJson(searchIndex) },
  ];
  if (cur.solution) {
    writes.push({ path: examPdfPath(cur, "solution"), kind: "delete" });
  }

  return commitFiles(writes, `admin: delete ${cur.source} exam ${cur.slug}`);
}

// ---------------------------------------------------------------------------
// Assignments
// ---------------------------------------------------------------------------
export async function createAssignment(input: AssignmentCreateInput): Promise<CommitResult> {
  const [{ data: exams }, { data: assignments }] = await Promise.all([
    readExams(),
    readAssignments(),
  ]);
  const slug =
    input.slug ??
    assignmentSlug({ englishHint: null, title: input.title });
  const dup = assignments.find((a) => a.subject === input.subject && a.slug === slug);
  if (dup) throw new Error(`DUPLICATE: assignment slug "${slug}" already exists`);

  const id = buildAssignmentId(input.subject, slug);
  const writes: FileWrite[] = [];
  const blobsToDelete: string[] = [];
  const filesForJson: Assignment["files"] = [];

  for (let i = 0; i < input.files.length; i++) {
    const f = input.files[i];
    const p = assignmentPdfPath({ subject: input.subject, slug }, i);
    const bytes = await fetchBlob(f.url);
    writes.push({ path: p, kind: "binary", content: bytes });
    filesForJson.push({
      url: "",
      path: "/" + p.replace(/^public\//, ""),
      sizeBytes: f.sizeBytes,
      id: f.pathname,
    });
    blobsToDelete.push(f.url);
  }

  const newA: Assignment = {
    id,
    slug,
    subject: input.subject,
    title: input.title,
    topic: input.topic ?? null,
    files: filesForJson,
    originalListUrl: "",
    originalDetailUrl: null,
  };
  const nextAssignments = [...assignments, newA];
  const searchIndex = buildSearchIndex(exams, nextAssignments);

  writes.push({ path: CONTENT_PATHS.assignments, kind: "text", content: stringifyJson(nextAssignments) });
  writes.push({ path: CONTENT_PATHS.searchIndex, kind: "text", content: stringifyJson(searchIndex) });

  const commit = await commitFiles(writes, `admin: add assignment ${slug}`);
  await cleanupBlobs(blobsToDelete);
  return commit;
}

export async function updateAssignment(id: string, input: AssignmentUpdateInput): Promise<CommitResult> {
  const [{ data: exams }, { data: assignments }] = await Promise.all([
    readExams(),
    readAssignments(),
  ]);
  const idx = assignments.findIndex((a) => a.id === id);
  if (idx === -1) throw new Error(`NOT_FOUND: assignment ${id}`);
  const cur = assignments[idx];

  if (input.subject !== cur.subject) {
    throw new Error("SUBJECT_CHANGE: not supported; delete + recreate.");
  }

  const writes: FileWrite[] = [];
  const blobsToDelete: string[] = [];
  const filesForJson: Assignment["files"] = input.keepExistingFiles ? [...cur.files] : [];

  if (!input.keepExistingFiles) {
    // Wipe existing files from repo
    cur.files.forEach((f, i) => {
      writes.push({ path: assignmentPdfPath(cur, i), kind: "delete" });
    });
  }

  if (input.files && input.files.length) {
    const startIdx = filesForJson.length;
    for (let i = 0; i < input.files.length; i++) {
      const f = input.files[i];
      const targetIdx = startIdx + i;
      const p = assignmentPdfPath(cur, targetIdx);
      const bytes = await fetchBlob(f.url);
      writes.push({ path: p, kind: "binary", content: bytes });
      filesForJson.push({
        url: "",
        path: "/" + p.replace(/^public\//, ""),
        sizeBytes: f.sizeBytes,
        id: f.pathname,
      });
      blobsToDelete.push(f.url);
    }
  }

  const updated: Assignment = {
    ...cur,
    title: input.title,
    topic: input.topic ?? null,
    files: filesForJson,
  };
  const nextAssignments = [...assignments];
  nextAssignments[idx] = updated;
  const searchIndex = buildSearchIndex(exams, nextAssignments);

  writes.push({ path: CONTENT_PATHS.assignments, kind: "text", content: stringifyJson(nextAssignments) });
  writes.push({ path: CONTENT_PATHS.searchIndex, kind: "text", content: stringifyJson(searchIndex) });

  const commit = await commitFiles(writes, `admin: update assignment ${cur.slug}`);
  await cleanupBlobs(blobsToDelete);
  return commit;
}

export async function deleteAssignment(id: string): Promise<CommitResult> {
  const [{ data: exams }, { data: assignments }] = await Promise.all([
    readExams(),
    readAssignments(),
  ]);
  const idx = assignments.findIndex((a) => a.id === id);
  if (idx === -1) throw new Error(`NOT_FOUND: assignment ${id}`);
  const cur = assignments[idx];
  const nextAssignments = assignments.filter((_, i) => i !== idx);
  const searchIndex = buildSearchIndex(exams, nextAssignments);
  const writes: FileWrite[] = [
    ...cur.files.map((_, i) => ({
      path: assignmentPdfPath(cur, i),
      kind: "delete" as const,
    })),
    { path: CONTENT_PATHS.assignments, kind: "text", content: stringifyJson(nextAssignments) },
    { path: CONTENT_PATHS.searchIndex, kind: "text", content: stringifyJson(searchIndex) },
  ];
  return commitFiles(writes, `admin: delete assignment ${cur.slug}`);
}

// ---------------------------------------------------------------------------
// Subjects (edit only — the 3 IDs are fixed)
// ---------------------------------------------------------------------------
export async function updateSubject(id: SubjectId, input: SubjectUpdateInput): Promise<CommitResult> {
  const { data: subjects } = await readSubjects();
  const idx = subjects.findIndex((s) => s.id === id);
  if (idx === -1) throw new Error(`NOT_FOUND: subject ${id}`);
  const cur = subjects[idx];
  const updated: Subject = { ...cur, ...input };
  const nextSubjects = [...subjects];
  nextSubjects[idx] = updated;
  const writes: FileWrite[] = [
    { path: CONTENT_PATHS.subjects, kind: "text", content: stringifyJson(nextSubjects) },
  ];
  return commitFiles(writes, `admin: update subject ${id}`);
}

// ---------------------------------------------------------------------------
// Labs
// ---------------------------------------------------------------------------
function labPdfPath(slug: string, idx: number): string {
  const suffix = idx === 0 ? ".pdf" : `-${idx + 1}.pdf`;
  return `public/pdfs/labs/${slug}${suffix}`;
}

export async function createLab(input: LabCreateInput): Promise<CommitResult> {
  const { data: labs } = await readLabs();
  if (labs.find((l) => l.slug === input.slug)) {
    throw new Error(`DUPLICATE: lab slug "${input.slug}" already exists`);
  }
  const writes: FileWrite[] = [];
  const blobsToDelete: string[] = [];
  const filesForJson: Lab["files"] = [];
  for (let i = 0; i < input.files.length; i++) {
    const f = input.files[i];
    const p = labPdfPath(input.slug, i);
    const bytes = await fetchBlob(f.url);
    writes.push({ path: p, kind: "binary", content: bytes });
    filesForJson.push({
      url: "",
      path: "/" + p.replace(/^public\//, ""),
      sizeBytes: f.sizeBytes,
      id: f.pathname,
    });
    blobsToDelete.push(f.url);
  }
  const newLab: Lab = {
    id: buildLabId(input.slug),
    slug: input.slug,
    title: input.title,
    description: input.description,
    files: filesForJson,
  };
  const nextLabs = [...labs, newLab];
  writes.push({ path: CONTENT_PATHS.labs, kind: "text", content: stringifyJson(nextLabs) });
  const commit = await commitFiles(writes, `admin: add lab ${input.slug}`);
  await cleanupBlobs(blobsToDelete);
  return commit;
}

export async function updateLab(id: string, input: LabUpdateInput): Promise<CommitResult> {
  const { data: labs } = await readLabs();
  const idx = labs.findIndex((l) => l.id === id);
  if (idx === -1) throw new Error(`NOT_FOUND: lab ${id}`);
  const cur = labs[idx];

  const writes: FileWrite[] = [];
  const blobsToDelete: string[] = [];
  const filesForJson: Lab["files"] = input.keepExistingFiles ? [...cur.files] : [];

  if (!input.keepExistingFiles) {
    cur.files.forEach((_, i) => {
      writes.push({ path: labPdfPath(cur.slug, i), kind: "delete" });
    });
  }

  if (input.files && input.files.length) {
    const startIdx = filesForJson.length;
    for (let i = 0; i < input.files.length; i++) {
      const f = input.files[i];
      const targetIdx = startIdx + i;
      const p = labPdfPath(cur.slug, targetIdx);
      const bytes = await fetchBlob(f.url);
      writes.push({ path: p, kind: "binary", content: bytes });
      filesForJson.push({
        url: "",
        path: "/" + p.replace(/^public\//, ""),
        sizeBytes: f.sizeBytes,
        id: f.pathname,
      });
      blobsToDelete.push(f.url);
    }
  }

  const updated: Lab = {
    ...cur,
    title: input.title,
    description: input.description,
    files: filesForJson,
  };
  const nextLabs = [...labs];
  nextLabs[idx] = updated;

  writes.push({ path: CONTENT_PATHS.labs, kind: "text", content: stringifyJson(nextLabs) });
  const commit = await commitFiles(writes, `admin: update lab ${cur.slug}`);
  await cleanupBlobs(blobsToDelete);
  return commit;
}

export async function deleteLab(id: string): Promise<CommitResult> {
  const { data: labs } = await readLabs();
  const idx = labs.findIndex((l) => l.id === id);
  if (idx === -1) throw new Error(`NOT_FOUND: lab ${id}`);
  const cur = labs[idx];
  const nextLabs = labs.filter((_, i) => i !== idx);
  const writes: FileWrite[] = [
    ...cur.files.map((_, i) => ({
      path: labPdfPath(cur.slug, i),
      kind: "delete" as const,
    })),
    { path: CONTENT_PATHS.labs, kind: "text", content: stringifyJson(nextLabs) },
  ];
  return commitFiles(writes, `admin: delete lab ${cur.slug}`);
}

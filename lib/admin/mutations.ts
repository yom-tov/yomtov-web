// High-level admin mutations. Each function:
//   1) Reads the current relevant content files from GitHub
//   2) Fetches any newly-uploaded PDFs from Vercel Blob
//   3) Uploads PDFs to Cloudflare R2 (not git — saves deployment storage)
//   4) Commits JSON-only changes atomically via commitFiles()
//   5) Deletes the transient blobs

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
import { uploadToR2, deleteFromR2, gitPathToR2Key } from "./r2";
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

  // Fetch PDFs from Blob and upload to R2
  const examBytes = await fetchBlob(input.exam.url);
  await uploadToR2(gitPathToR2Key(examFilePath), examBytes);

  if (input.solution && solutionFilePath) {
    const solutionBytes = await fetchBlob(input.solution.url);
    await uploadToR2(gitPathToR2Key(solutionFilePath), solutionBytes);
  }

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
    { path: CONTENT_PATHS.exams, kind: "text", content: stringifyJson(nextExams) },
    { path: CONTENT_PATHS.searchIndex, kind: "text", content: stringifyJson(searchIndex) },
  ];

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

  const blobsToDelete: string[] = [];

  // Exam file replacement — upload to R2
  if (input.exam) {
    const bytes = await fetchBlob(input.exam.url);
    await uploadToR2(gitPathToR2Key(examFilePath), bytes);
    updated.exam = {
      ...cur.exam,
      sizeBytes: input.exam.sizeBytes,
      id: input.exam.pathname,
    };
    blobsToDelete.push(input.exam.url);
  }

  // Solution: replace (upload to R2), delete (from R2), or leave alone
  if (input.deleteSolution && cur.solution) {
    await deleteFromR2(gitPathToR2Key(solutionFilePath));
    updated.solution = null;
  } else if (input.solution) {
    const bytes = await fetchBlob(input.solution.url);
    await uploadToR2(gitPathToR2Key(solutionFilePath), bytes);
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

  const writes: FileWrite[] = [
    { path: CONTENT_PATHS.exams, kind: "text", content: stringifyJson(nextExams) },
    { path: CONTENT_PATHS.searchIndex, kind: "text", content: stringifyJson(searchIndex) },
  ];

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

  // Delete PDFs from R2
  await deleteFromR2(gitPathToR2Key(examPdfPath(cur, "exam")));
  if (cur.solution) {
    await deleteFromR2(gitPathToR2Key(examPdfPath(cur, "solution")));
  }

  const writes: FileWrite[] = [
    { path: CONTENT_PATHS.exams, kind: "text", content: stringifyJson(nextExams) },
    { path: CONTENT_PATHS.searchIndex, kind: "text", content: stringifyJson(searchIndex) },
  ];

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
  const blobsToDelete: string[] = [];
  const filesForJson: Assignment["files"] = [];

  // Upload PDFs to R2
  for (let i = 0; i < input.files.length; i++) {
    const f = input.files[i];
    const p = assignmentPdfPath({ subject: input.subject, slug }, i);
    const bytes = await fetchBlob(f.url);
    await uploadToR2(gitPathToR2Key(p), bytes);
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

  const writes: FileWrite[] = [
    { path: CONTENT_PATHS.assignments, kind: "text", content: stringifyJson(nextAssignments) },
    { path: CONTENT_PATHS.searchIndex, kind: "text", content: stringifyJson(searchIndex) },
  ];

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

  const blobsToDelete: string[] = [];
  const filesForJson: Assignment["files"] = input.keepExistingFiles ? [...cur.files] : [];

  if (!input.keepExistingFiles) {
    // Delete existing files from R2
    await Promise.allSettled(
      cur.files.map((_, i) => deleteFromR2(gitPathToR2Key(assignmentPdfPath(cur, i)))),
    );
  }

  if (input.files && input.files.length) {
    const startIdx = filesForJson.length;
    for (let i = 0; i < input.files.length; i++) {
      const f = input.files[i];
      const targetIdx = startIdx + i;
      const p = assignmentPdfPath(cur, targetIdx);
      const bytes = await fetchBlob(f.url);
      await uploadToR2(gitPathToR2Key(p), bytes);
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

  const writes: FileWrite[] = [
    { path: CONTENT_PATHS.assignments, kind: "text", content: stringifyJson(nextAssignments) },
    { path: CONTENT_PATHS.searchIndex, kind: "text", content: stringifyJson(searchIndex) },
  ];

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

  // Delete PDFs from R2
  await Promise.allSettled(
    cur.files.map((_, i) => deleteFromR2(gitPathToR2Key(assignmentPdfPath(cur, i)))),
  );

  const writes: FileWrite[] = [
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
// Labs (YouTube videos — no file blobs involved)
// ---------------------------------------------------------------------------
export async function createLab(input: LabCreateInput): Promise<CommitResult> {
  const { data: labs } = await readLabs();
  if (labs.find((l) => l.slug === input.slug)) {
    throw new Error(`DUPLICATE: lab slug "${input.slug}" already exists`);
  }
  const maxOrder = labs.reduce((m, l) => Math.max(m, l.order), 0);
  const newLab: Lab = {
    id: buildLabId(input.slug),
    slug: input.slug,
    title: input.title,
    youtubeId: input.youtubeId,
    order: maxOrder + 1,
  };
  const nextLabs = [newLab, ...labs];
  const writes: FileWrite[] = [
    { path: CONTENT_PATHS.labs, kind: "text", content: stringifyJson(nextLabs) },
  ];
  return commitFiles(writes, `admin: add lab ${input.slug}`);
}

export async function updateLab(id: string, input: LabUpdateInput): Promise<CommitResult> {
  const { data: labs } = await readLabs();
  const idx = labs.findIndex((l) => l.id === id);
  if (idx === -1) throw new Error(`NOT_FOUND: lab ${id}`);
  const cur = labs[idx];
  const updated: Lab = { ...cur, title: input.title, youtubeId: input.youtubeId };
  const nextLabs = [...labs];
  nextLabs[idx] = updated;
  const writes: FileWrite[] = [
    { path: CONTENT_PATHS.labs, kind: "text", content: stringifyJson(nextLabs) },
  ];
  return commitFiles(writes, `admin: update lab ${cur.slug}`);
}

export async function deleteLab(id: string): Promise<CommitResult> {
  const { data: labs } = await readLabs();
  const idx = labs.findIndex((l) => l.id === id);
  if (idx === -1) throw new Error(`NOT_FOUND: lab ${id}`);
  const cur = labs[idx];
  const nextLabs = labs.filter((_, i) => i !== idx);
  const writes: FileWrite[] = [
    { path: CONTENT_PATHS.labs, kind: "text", content: stringifyJson(nextLabs) },
  ];
  return commitFiles(writes, `admin: delete lab ${cur.slug}`);
}

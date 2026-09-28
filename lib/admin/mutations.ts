// High-level admin mutations for the content that lives in GitHub (JSON).
// Each function:
//   1) Reads the current relevant content files from GitHub
//   2) Fetches any newly-uploaded PDFs from Vercel Blob
//   3) Uploads/copies PDFs in Cloudflare R2 (not git — saves deployment storage)
//   4) Commits the JSON changes atomically via commitFiles()
//   5) Only after a successful commit: deletes replaced/removed R2 files and
//      the transient blobs. If the commit fails, the live JSON still points
//      at files that still exist.

import { del } from "@vercel/blob";
import type { Exam, Assignment, Formula, Lab, Subject, SubjectId, FileRef } from "@/types/content";
import { commitFiles, type FileWrite, type CommitResult } from "./github";
import {
  buildSearchIndex,
  stringifyJson,
  examPdfPath,
  readIndexedContent,
  readSubjects,
  readLabs,
  examId as buildExamId,
  assignmentId as buildAssignmentId,
  formulaId as buildFormulaId,
  labId as buildLabId,
  CONTENT_PATHS,
} from "./content-io";
import { uploadToR2, deleteFromR2, copyInR2, gitPathToR2Key, storedPathToR2Key } from "./r2";
import { examSlug, assignmentSlug } from "./slug";
import type {
  ExamCreateInput,
  ExamUpdateInput,
  AssignmentCreateInput,
  AssignmentUpdateInput,
  FormulaCreateInput,
  FormulaUpdateInput,
  SubjectUpdateInput,
  LabCreateInput,
  LabUpdateInput,
  HiddenKind,
} from "./validators";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
async function fetchBlob(url: string): Promise<Uint8Array> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch blob ${url}: ${res.status}`);
  return new Uint8Array(await res.arrayBuffer());
}

async function cleanupBlobs(urls: string[]): Promise<void> {
  // Best-effort — we don't want a failing blob delete to make the mutation
  // look failed. If they leak, they'll expire eventually.
  await Promise.allSettled(urls.map((u) => del(u)));
}

/** Best-effort deletion of R2 objects that are no longer referenced. */
async function cleanupR2(keys: string[]): Promise<void> {
  await Promise.allSettled([...new Set(keys)].map((k) => deleteFromR2(k)));
}

/** "/pdfs/x.pdf" for a git-style "public/pdfs/x.pdf" path, with a cache-busting version. */
function publicPath(gitPath: string, version?: number): string {
  const p = "/" + gitPath.replace(/^public\//, "");
  return version ? `${p}?v=${version}` : p;
}

function searchIndexWrite(exams: Exam[], assignments: Assignment[], formulas: Formula[]): FileWrite {
  return {
    path: CONTENT_PATHS.searchIndex,
    kind: "text",
    content: stringifyJson(buildSearchIndex(exams, assignments, formulas)),
  };
}

// ---------------------------------------------------------------------------
// Exams
// ---------------------------------------------------------------------------
export async function createExam(input: ExamCreateInput): Promise<CommitResult> {
  const { exams, assignments, formulas } = await readIndexedContent();

  const slug = examSlug({ year: input.year, season: input.season, version: input.version, title: input.title });
  const dup = exams.find((e) => e.subject === input.subject && e.source === input.source && e.slug === slug);
  if (dup) {
    throw new Error(`DUPLICATE: an exam with slug "${slug}" already exists under ${input.subject}/${input.source}`);
  }

  const key = { subject: input.subject, source: input.source, slug };
  const examFilePath = examPdfPath(key, "exam");
  const solutionFilePath = input.solution ? examPdfPath(key, "solution") : null;

  await uploadToR2(gitPathToR2Key(examFilePath), await fetchBlob(input.exam.url));
  if (input.solution && solutionFilePath) {
    await uploadToR2(gitPathToR2Key(solutionFilePath), await fetchBlob(input.solution.url));
  }

  const newExam: Exam = {
    id: buildExamId(input.subject, input.source, slug),
    slug,
    subject: input.subject,
    source: input.source,
    title: input.title,
    year: input.year,
    season: input.season,
    version: input.version,
    topic: input.topic ?? null,
    exam: { url: "", path: publicPath(examFilePath), sizeBytes: input.exam.sizeBytes, id: input.exam.pathname },
    solution:
      input.solution && solutionFilePath
        ? { url: "", path: publicPath(solutionFilePath), sizeBytes: input.solution.sizeBytes, id: input.solution.pathname }
        : null,
    originalListUrl: "",
    originalDetailUrl: null,
  };

  const nextExams = [...exams, newExam];
  const commit = await commitFiles(
    [
      { path: CONTENT_PATHS.exams, kind: "text", content: stringifyJson(nextExams) },
      searchIndexWrite(nextExams, assignments, formulas),
    ],
    `admin: add ${input.source} exam ${slug}`,
  );
  await cleanupBlobs([input.exam.url, input.solution?.url].filter((u): u is string => Boolean(u)));
  return commit;
}

export async function updateExam(id: string, input: ExamUpdateInput): Promise<CommitResult> {
  const { exams, assignments, formulas } = await readIndexedContent();
  const idx = exams.findIndex((e) => e.id === id);
  if (idx === -1) throw new Error(`NOT_FOUND: exam ${id}`);
  const cur = exams[idx];

  // Year/season/version define the slug; subject/source the folder. Changing
  // any of them moves the PDFs to their new R2 keys (copy now, delete the old
  // keys only after the commit succeeded).
  const newSlug = examSlug({ year: input.year, season: input.season, version: input.version, title: input.title });
  const moved = newSlug !== cur.slug || input.subject !== cur.subject || input.source !== cur.source;
  const target = { subject: input.subject, source: input.source, slug: moved ? newSlug : cur.slug };
  if (
    moved &&
    exams.some((e, i) => i !== idx && e.subject === target.subject && e.source === target.source && e.slug === target.slug)
  ) {
    throw new Error(`DUPLICATE: an exam with slug "${target.slug}" already exists under ${target.subject}/${target.source}`);
  }

  const oldExamKey = storedPathToR2Key(cur.exam.path);
  const oldSolutionKey = cur.solution ? storedPathToR2Key(cur.solution.path) : null;
  const newExamGitPath = examPdfPath(target, "exam");
  const newSolutionGitPath = examPdfPath(target, "solution");
  const version = Date.now();

  const updated: Exam = {
    ...cur,
    id: buildExamId(target.subject, target.source, target.slug),
    slug: target.slug,
    subject: target.subject,
    source: target.source,
    title: input.title,
    year: input.year,
    season: input.season,
    version: input.version,
    topic: input.topic ?? null,
  };

  const blobsToDelete: string[] = [];
  const r2ToDelete: string[] = [];

  // Exam file: replace (new upload) or move (copy to the new key).
  if (input.exam) {
    await uploadToR2(gitPathToR2Key(newExamGitPath), await fetchBlob(input.exam.url));
    updated.exam = {
      ...cur.exam,
      path: publicPath(newExamGitPath, version),
      sizeBytes: input.exam.sizeBytes,
      id: input.exam.pathname,
    };
    blobsToDelete.push(input.exam.url);
  } else if (moved) {
    await copyInR2(oldExamKey, gitPathToR2Key(newExamGitPath));
    updated.exam = { ...cur.exam, path: publicPath(newExamGitPath) };
  }
  if (moved) r2ToDelete.push(oldExamKey);

  // Solution: delete, replace, move, or leave alone.
  if (input.deleteSolution && cur.solution) {
    updated.solution = null;
    if (oldSolutionKey) r2ToDelete.push(oldSolutionKey);
  } else if (input.solution) {
    await uploadToR2(gitPathToR2Key(newSolutionGitPath), await fetchBlob(input.solution.url));
    updated.solution = {
      url: "",
      path: publicPath(newSolutionGitPath, version),
      sizeBytes: input.solution.sizeBytes,
      id: input.solution.pathname,
    };
    blobsToDelete.push(input.solution.url);
    if (moved && oldSolutionKey) r2ToDelete.push(oldSolutionKey);
  } else if (moved && cur.solution && oldSolutionKey) {
    await copyInR2(oldSolutionKey, gitPathToR2Key(newSolutionGitPath));
    updated.solution = { ...cur.solution, path: publicPath(newSolutionGitPath) };
    r2ToDelete.push(oldSolutionKey);
  }

  const nextExams = [...exams];
  nextExams[idx] = updated;
  const commit = await commitFiles(
    [
      { path: CONTENT_PATHS.exams, kind: "text", content: stringifyJson(nextExams) },
      searchIndexWrite(nextExams, assignments, formulas),
    ],
    moved
      ? `admin: move ${cur.source} exam ${cur.slug} → ${target.source}/${target.slug}`
      : `admin: update ${cur.source} exam ${cur.slug}`,
  );
  // Never delete a key the updated exam still points to.
  const stillUsed = new Set([updated.exam.path, updated.solution?.path].filter(Boolean).map((p) => storedPathToR2Key(p!)));
  await Promise.all([cleanupBlobs(blobsToDelete), cleanupR2(r2ToDelete.filter((k) => !stillUsed.has(k)))]);
  return commit;
}

export async function deleteExam(id: string): Promise<CommitResult> {
  const { exams, assignments, formulas } = await readIndexedContent();
  const cur = exams.find((e) => e.id === id);
  if (!cur) throw new Error(`NOT_FOUND: exam ${id}`);
  const nextExams = exams.filter((e) => e.id !== id);

  const commit = await commitFiles(
    [
      { path: CONTENT_PATHS.exams, kind: "text", content: stringifyJson(nextExams) },
      searchIndexWrite(nextExams, assignments, formulas),
    ],
    `admin: delete ${cur.source} exam ${cur.slug}`,
  );
  await cleanupR2([cur.exam.path, cur.solution?.path].filter((p): p is string => Boolean(p)).map(storedPathToR2Key));
  return commit;
}

// ---------------------------------------------------------------------------
// Assignments
// ---------------------------------------------------------------------------
function newAssignmentFilePath(subject: SubjectId, slug: string, existing: string[], first: boolean): string {
  // The first file keeps the classic "<slug>.pdf" name when free; later files
  // get a short unique suffix so they never overwrite an existing (cached) key.
  const base = `public/pdfs/assignments/${subject}/${slug}`;
  const taken = new Set(existing.map(storedPathToR2Key));
  if (first && !taken.has(gitPathToR2Key(`${base}.pdf`))) return `${base}.pdf`;
  let p: string;
  do {
    p = `${base}-${Math.random().toString(36).slice(2, 8)}.pdf`;
  } while (taken.has(gitPathToR2Key(p)));
  return p;
}

export async function createAssignment(input: AssignmentCreateInput): Promise<CommitResult> {
  const { exams, assignments, formulas } = await readIndexedContent();
  const slug = input.slug ?? assignmentSlug({ englishHint: null, title: input.title });
  if (assignments.find((a) => a.subject === input.subject && a.slug === slug)) {
    throw new Error(`DUPLICATE: assignment slug "${slug}" already exists`);
  }

  const files: FileRef[] = [];
  for (const f of input.files) {
    const p = newAssignmentFilePath(input.subject, slug, files.map((x) => x.path), files.length === 0);
    await uploadToR2(gitPathToR2Key(p), await fetchBlob(f.url));
    files.push({ url: "", path: publicPath(p), sizeBytes: f.sizeBytes, id: f.pathname });
  }

  const newA: Assignment = {
    id: buildAssignmentId(input.subject, slug),
    slug,
    subject: input.subject,
    title: input.title,
    topic: input.topic ?? null,
    files,
    originalListUrl: "",
    originalDetailUrl: null,
  };
  const nextAssignments = [...assignments, newA];
  const commit = await commitFiles(
    [
      { path: CONTENT_PATHS.assignments, kind: "text", content: stringifyJson(nextAssignments) },
      searchIndexWrite(exams, nextAssignments, formulas),
    ],
    `admin: add assignment ${slug}`,
  );
  await cleanupBlobs(input.files.map((f) => f.url));
  return commit;
}

export async function updateAssignment(id: string, input: AssignmentUpdateInput): Promise<CommitResult> {
  const { exams, assignments, formulas } = await readIndexedContent();
  const idx = assignments.findIndex((a) => a.id === id);
  if (idx === -1) throw new Error(`NOT_FOUND: assignment ${id}`);
  const cur = assignments[idx];
  const movedSubject = input.subject !== cur.subject;
  if (movedSubject && assignments.some((a) => a.subject === input.subject && a.slug === cur.slug)) {
    throw new Error(`DUPLICATE: assignment slug "${cur.slug}" already exists in ${input.subject}`);
  }

  const r2ToDelete: string[] = [];
  const kept = input.keep.map((i) => {
    const f = cur.files[i];
    if (!f) throw new Error(`BAD_INDEX: file ${i}`);
    return f;
  });
  // Files the admin removed.
  cur.files.forEach((f, i) => {
    if (!input.keep.includes(i)) r2ToDelete.push(storedPathToR2Key(f.path));
  });

  // Moving to another subject: copy kept files to the new folder.
  const files: FileRef[] = [];
  for (const f of kept) {
    if (!movedSubject) {
      files.push(f);
      continue;
    }
    const fileName = storedPathToR2Key(f.path).split("/").pop()!;
    const p = `public/pdfs/assignments/${input.subject}/${fileName}`;
    await copyInR2(storedPathToR2Key(f.path), gitPathToR2Key(p));
    files.push({ ...f, path: publicPath(p) });
    r2ToDelete.push(storedPathToR2Key(f.path));
  }

  // New uploads, appended.
  for (const f of input.files) {
    const p = newAssignmentFilePath(input.subject, cur.slug, files.map((x) => x.path), files.length === 0);
    await uploadToR2(gitPathToR2Key(p), await fetchBlob(f.url));
    files.push({ url: "", path: publicPath(p), sizeBytes: f.sizeBytes, id: f.pathname });
  }

  const updated: Assignment = {
    ...cur,
    id: buildAssignmentId(input.subject, cur.slug),
    subject: input.subject,
    title: input.title,
    topic: input.topic ?? null,
    files,
  };
  const nextAssignments = [...assignments];
  nextAssignments[idx] = updated;
  const commit = await commitFiles(
    [
      { path: CONTENT_PATHS.assignments, kind: "text", content: stringifyJson(nextAssignments) },
      searchIndexWrite(exams, nextAssignments, formulas),
    ],
    `admin: update assignment ${cur.slug}`,
  );
  // Never delete a key the updated item still points to.
  const stillUsed = new Set(files.map((f) => storedPathToR2Key(f.path)));
  await Promise.all([
    cleanupBlobs(input.files.map((f) => f.url)),
    cleanupR2(r2ToDelete.filter((k) => !stillUsed.has(k))),
  ]);
  return commit;
}

export async function deleteAssignment(id: string): Promise<CommitResult> {
  const { exams, assignments, formulas } = await readIndexedContent();
  const cur = assignments.find((a) => a.id === id);
  if (!cur) throw new Error(`NOT_FOUND: assignment ${id}`);
  const nextAssignments = assignments.filter((a) => a.id !== id);
  const commit = await commitFiles(
    [
      { path: CONTENT_PATHS.assignments, kind: "text", content: stringifyJson(nextAssignments) },
      searchIndexWrite(exams, nextAssignments, formulas),
    ],
    `admin: delete assignment ${cur.slug}`,
  );
  await cleanupR2(cur.files.map((f) => storedPathToR2Key(f.path)));
  return commit;
}

// ---------------------------------------------------------------------------
// Formulas (formula sheets / summaries)
// ---------------------------------------------------------------------------
// The original sheets live in the repo under public/pdfs/formulas (served by
// the site itself); sheets uploaded from the admin go to R2 under
// pdfs/formula-sheets, which getAssetUrl() serves from the CDN.
function formulaPdfPath(subject: SubjectId, slug: string): string {
  return `public/pdfs/formula-sheets/${subject}/${slug}.pdf`;
}

/** Removes a formula file wherever it lives (git for originals, R2 otherwise). */
function formulaFileRemoval(path: string): { git?: FileWrite; r2?: string } {
  const clean = path.replace(/\?.*$/, "");
  if (clean.startsWith("/pdfs/formulas/")) return { git: { path: `public${clean}`, kind: "delete" } };
  return { r2: storedPathToR2Key(clean) };
}

export async function createFormula(input: FormulaCreateInput): Promise<CommitResult> {
  const { exams, assignments, formulas } = await readIndexedContent();
  const slug = input.slug ?? assignmentSlug({ englishHint: null, title: input.title });
  if (formulas.find((f) => f.subject === input.subject && f.slug === slug)) {
    throw new Error(`DUPLICATE: formula slug "${slug}" already exists`);
  }
  const p = formulaPdfPath(input.subject, slug);
  await uploadToR2(gitPathToR2Key(p), await fetchBlob(input.file.url));
  const newF: Formula = {
    id: buildFormulaId(input.subject, slug),
    slug,
    subject: input.subject,
    title: input.title,
    files: [{ url: "", path: publicPath(p), sizeBytes: input.file.sizeBytes, id: slug }],
  };
  const nextFormulas = [...formulas, newF];
  const commit = await commitFiles(
    [
      { path: CONTENT_PATHS.formulas, kind: "text", content: stringifyJson(nextFormulas) },
      searchIndexWrite(exams, assignments, nextFormulas),
    ],
    `admin: add formula ${slug}`,
  );
  await cleanupBlobs([input.file.url]);
  return commit;
}

export async function updateFormula(id: string, input: FormulaUpdateInput): Promise<CommitResult> {
  const { exams, assignments, formulas } = await readIndexedContent();
  const idx = formulas.findIndex((f) => f.id === id);
  if (idx === -1) throw new Error(`NOT_FOUND: formula ${id}`);
  const cur = formulas[idx];
  const updated: Formula = { ...cur, title: input.title };
  const extraWrites: FileWrite[] = [];
  const r2ToDelete: string[] = [];

  if (input.file) {
    const p = formulaPdfPath(cur.subject, cur.slug);
    await uploadToR2(gitPathToR2Key(p), await fetchBlob(input.file.url));
    const newPath = publicPath(p, Date.now());
    const old = cur.files[0]?.path;
    if (old && storedPathToR2Key(old) !== storedPathToR2Key(newPath)) {
      const removal = formulaFileRemoval(old);
      if (removal.git) extraWrites.push(removal.git);
      if (removal.r2) r2ToDelete.push(removal.r2);
    }
    updated.files = [{ url: "", path: newPath, sizeBytes: input.file.sizeBytes, id: cur.slug }];
  }

  const nextFormulas = [...formulas];
  nextFormulas[idx] = updated;
  const commit = await commitFiles(
    [
      { path: CONTENT_PATHS.formulas, kind: "text", content: stringifyJson(nextFormulas) },
      searchIndexWrite(exams, assignments, nextFormulas),
      ...extraWrites,
    ],
    `admin: update formula ${cur.slug}`,
  );
  await Promise.all([cleanupBlobs(input.file ? [input.file.url] : []), cleanupR2(r2ToDelete)]);
  return commit;
}

export async function deleteFormula(id: string): Promise<CommitResult> {
  const { exams, assignments, formulas } = await readIndexedContent();
  const cur = formulas.find((f) => f.id === id);
  if (!cur) throw new Error(`NOT_FOUND: formula ${id}`);
  const nextFormulas = formulas.filter((f) => f.id !== id);
  const removals = cur.files.map((f) => formulaFileRemoval(f.path));
  const commit = await commitFiles(
    [
      { path: CONTENT_PATHS.formulas, kind: "text", content: stringifyJson(nextFormulas) },
      searchIndexWrite(exams, assignments, nextFormulas),
      ...removals.flatMap((r) => (r.git ? [r.git] : [])),
    ],
    `admin: delete formula ${cur.slug}`,
  );
  await cleanupR2(removals.flatMap((r) => (r.r2 ? [r.r2] : [])));
  return commit;
}

// ---------------------------------------------------------------------------
// Hide / show (any JSON content type)
// ---------------------------------------------------------------------------
function withHidden<T extends { id: string; hidden?: boolean }>(list: T[], id: string, hidden: boolean, kind: string): T[] {
  if (!list.some((x) => x.id === id)) throw new Error(`NOT_FOUND: ${kind} ${id}`);
  return list.map((x) => {
    if (x.id !== id) return x;
    const next = { ...x };
    if (hidden) next.hidden = true;
    else delete next.hidden;
    return next;
  });
}

export async function setHidden(kind: HiddenKind, id: string, hidden: boolean): Promise<CommitResult> {
  const message = `admin: ${hidden ? "hide" : "show"} ${kind} ${id}`;
  if (kind === "subject") {
    const { data: subjects } = await readSubjects();
    const next = withHidden(subjects, id, hidden, kind);
    return commitFiles([{ path: CONTENT_PATHS.subjects, kind: "text", content: stringifyJson(next) }], message);
  }
  if (kind === "lab") {
    const { data: labs } = await readLabs();
    const next = withHidden(labs, id, hidden, kind);
    return commitFiles([{ path: CONTENT_PATHS.labs, kind: "text", content: stringifyJson(next) }], message);
  }

  const { exams, assignments, formulas } = await readIndexedContent();
  const nextExams = kind === "exam" ? withHidden(exams, id, hidden, kind) : exams;
  const nextAssignments = kind === "assignment" ? withHidden(assignments, id, hidden, kind) : assignments;
  const nextFormulas = kind === "formula" ? withHidden(formulas, id, hidden, kind) : formulas;
  const [path, list] =
    kind === "exam"
      ? [CONTENT_PATHS.exams, nextExams]
      : kind === "assignment"
        ? [CONTENT_PATHS.assignments, nextAssignments]
        : [CONTENT_PATHS.formulas, nextFormulas];
  return commitFiles(
    [
      { path, kind: "text", content: stringifyJson(list) },
      searchIndexWrite(nextExams, nextAssignments, nextFormulas),
    ],
    message,
  );
}

// ---------------------------------------------------------------------------
// Subjects (edit only — adding a subject needs new routes)
// ---------------------------------------------------------------------------
export async function updateSubject(id: SubjectId, input: SubjectUpdateInput): Promise<CommitResult> {
  const { data: subjects } = await readSubjects();
  const idx = subjects.findIndex((s) => s.id === id);
  if (idx === -1) throw new Error(`NOT_FOUND: subject ${id}`);
  const updated: Subject = { ...subjects[idx], ...input };
  const nextSubjects = [...subjects];
  nextSubjects[idx] = updated;
  return commitFiles(
    [{ path: CONTENT_PATHS.subjects, kind: "text", content: stringifyJson(nextSubjects) }],
    `admin: update subject ${id}`,
  );
}

// ---------------------------------------------------------------------------
// Labs (YouTube videos — no file blobs involved). Higher `order` = shown first.
// ---------------------------------------------------------------------------
function sortLabs(labs: Lab[]): Lab[] {
  return [...labs].sort((a, b) => b.order - a.order);
}

export async function createLab(input: LabCreateInput): Promise<CommitResult> {
  const { data: labs } = await readLabs();
  if (labs.find((l) => l.slug === input.slug)) {
    throw new Error(`DUPLICATE: lab slug "${input.slug}" already exists`);
  }
  const maxOrder = labs.reduce((m, l) => Math.max(m, l.order), 0);
  let id = buildLabId(maxOrder + 1);
  while (labs.some((l) => l.id === id)) id = `${id}-${Math.random().toString(36).slice(2, 5)}`;
  const newLab: Lab = { id, slug: input.slug, title: input.title, youtubeId: input.youtubeId, order: maxOrder + 1 };
  return commitFiles(
    [{ path: CONTENT_PATHS.labs, kind: "text", content: stringifyJson(sortLabs([newLab, ...labs])) }],
    `admin: add lab ${input.slug}`,
  );
}

export async function updateLab(id: string, input: LabUpdateInput): Promise<CommitResult> {
  const { data: labs } = await readLabs();
  const idx = labs.findIndex((l) => l.id === id);
  if (idx === -1) throw new Error(`NOT_FOUND: lab ${id}`);
  const nextLabs = [...labs];
  nextLabs[idx] = { ...labs[idx], title: input.title, youtubeId: input.youtubeId };
  return commitFiles(
    [{ path: CONTENT_PATHS.labs, kind: "text", content: stringifyJson(nextLabs) }],
    `admin: update lab ${labs[idx].slug}`,
  );
}

/** ids in the desired display order (first = top of the page). */
export async function reorderLabs(ids: string[]): Promise<CommitResult> {
  const { data: labs } = await readLabs();
  if (ids.length !== labs.length || !labs.every((l) => ids.includes(l.id))) {
    throw new Error("CONFLICT: the lab list changed — reload and try again");
  }
  const n = ids.length;
  const nextLabs = ids.map((id, i) => ({ ...labs.find((l) => l.id === id)!, order: n - i }));
  return commitFiles(
    [{ path: CONTENT_PATHS.labs, kind: "text", content: stringifyJson(nextLabs) }],
    "admin: reorder labs",
  );
}

export async function deleteLab(id: string): Promise<CommitResult> {
  const { data: labs } = await readLabs();
  const cur = labs.find((l) => l.id === id);
  if (!cur) throw new Error(`NOT_FOUND: lab ${id}`);
  return commitFiles(
    [{ path: CONTENT_PATHS.labs, kind: "text", content: stringifyJson(labs.filter((l) => l.id !== id)) }],
    `admin: delete lab ${cur.slug}`,
  );
}

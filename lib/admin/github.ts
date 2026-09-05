// Thin wrapper around Octokit for admin mutations.
//
// Every write goes through `commitFiles(files, message)` which uses the
// Git Data API (blob → tree → commit → updateRef) so multiple file changes
// land as ONE atomic commit. That means: a PDF binary + updated JSON index
// arrive on `main` together, and Vercel's build fires once, not per-file.

import { Octokit } from "@octokit/rest";

const OWNER = process.env.GITHUB_REPO_OWNER ?? "yom-tov";
const REPO = process.env.GITHUB_REPO_NAME ?? "yomtov-web";
const BRANCH = process.env.GITHUB_BRANCH ?? "main";

function client(): Octokit {
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw new Error("GITHUB_TOKEN is not set");
  return new Octokit({ auth: token });
}

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------
export interface ReadResult {
  content: string; // decoded UTF-8
  sha: string;
}

export async function readFile(path: string): Promise<ReadResult | null> {
  const gh = client();
  try {
    const res = await gh.rest.repos.getContent({
      owner: OWNER,
      repo: REPO,
      path,
      ref: BRANCH,
    });
    // We only ever read individual files, never directories
    if (Array.isArray(res.data) || res.data.type !== "file") return null;
    const content = Buffer.from(res.data.content, res.data.encoding as BufferEncoding).toString("utf8");
    return { content, sha: res.data.sha };
  } catch (err: unknown) {
    if (err && typeof err === "object" && "status" in err && (err as { status: number }).status === 404) {
      return null;
    }
    throw err;
  }
}

export async function readJson<T>(path: string): Promise<{ data: T; sha: string } | null> {
  const r = await readFile(path);
  if (!r) return null;
  return { data: JSON.parse(r.content) as T, sha: r.sha };
}

// ---------------------------------------------------------------------------
// Writes — atomic multi-file commit
// ---------------------------------------------------------------------------
export type FileWrite =
  | { path: string; kind: "text"; content: string }
  | { path: string; kind: "binary"; content: Uint8Array | Buffer }
  | { path: string; kind: "delete" };

export interface CommitResult {
  sha: string;
  url: string; // github.com URL for the commit
}

export async function commitFiles(files: FileWrite[], message: string): Promise<CommitResult> {
  if (files.length === 0) throw new Error("commitFiles: no files supplied");
  const gh = client();

  // 1) HEAD sha of the branch
  const ref = await gh.rest.git.getRef({ owner: OWNER, repo: REPO, ref: `heads/${BRANCH}` });
  const baseSha = ref.data.object.sha;

  // 2) Get the base tree sha
  const baseCommit = await gh.rest.git.getCommit({ owner: OWNER, repo: REPO, commit_sha: baseSha });
  const baseTreeSha = baseCommit.data.tree.sha;

  // 3) Upload each non-delete file as a blob
  const treeEntries: Array<{
    path: string;
    mode: "100644";
    type: "blob";
    sha: string | null; // null = delete
  }> = [];

  for (const f of files) {
    if (f.kind === "delete") {
      treeEntries.push({ path: f.path, mode: "100644", type: "blob", sha: null });
      continue;
    }
    const content =
      f.kind === "text"
        ? Buffer.from(f.content, "utf8").toString("base64")
        : Buffer.from(f.content).toString("base64");
    const blob = await gh.rest.git.createBlob({
      owner: OWNER,
      repo: REPO,
      content,
      encoding: "base64",
    });
    treeEntries.push({ path: f.path, mode: "100644", type: "blob", sha: blob.data.sha });
  }

  // 4) Create a new tree on top of the base tree
  const tree = await gh.rest.git.createTree({
    owner: OWNER,
    repo: REPO,
    base_tree: baseTreeSha,
    tree: treeEntries,
  });

  // 5) Create the commit
  const commit = await gh.rest.git.createCommit({
    owner: OWNER,
    repo: REPO,
    message,
    tree: tree.data.sha,
    parents: [baseSha],
  });

  // 6) Fast-forward the branch — if HEAD moved in the meantime, this fails
  //    with 422, which becomes our conflict signal.
  try {
    await gh.rest.git.updateRef({
      owner: OWNER,
      repo: REPO,
      ref: `heads/${BRANCH}`,
      sha: commit.data.sha,
      force: false,
    });
  } catch (err: unknown) {
    if (err && typeof err === "object" && "status" in err && (err as { status: number }).status === 422) {
      throw new Error(
        "CONFLICT: main advanced while this commit was being prepared. Please reload and try again."
      );
    }
    throw err;
  }

  return {
    sha: commit.data.sha,
    url: `https://github.com/${OWNER}/${REPO}/commit/${commit.data.sha}`,
  };
}

// ---------------------------------------------------------------------------
// Recent commits (for admin dashboard's activity feed)
// ---------------------------------------------------------------------------
export interface CommitSummary {
  sha: string;
  message: string;
  author: string;
  date: string; // ISO
  url: string;
}

export async function recentCommits(limit = 10): Promise<CommitSummary[]> {
  const gh = client();
  const res = await gh.rest.repos.listCommits({
    owner: OWNER,
    repo: REPO,
    sha: BRANCH,
    per_page: limit,
  });
  return res.data.map((c) => ({
    sha: c.sha,
    message: c.commit.message.split("\n")[0].slice(0, 120),
    author: c.commit.author?.name ?? c.author?.login ?? "unknown",
    date: c.commit.author?.date ?? new Date().toISOString(),
    url: c.html_url,
  }));
}

export const REPO_INFO = { owner: OWNER, repo: REPO, branch: BRANCH };

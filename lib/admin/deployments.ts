// Vercel REST client for the admin panel (deploy-status pill, health checks).
// Uses VERCEL_TOKEN + VERCEL_PROJECT_ID + VERCEL_TEAM_ID env vars.

export type DeploymentState = "READY" | "BUILDING" | "QUEUED" | "ERROR" | "CANCELED" | "INITIALIZING";

export interface DeploymentSummary {
  id: string;
  url: string;
  state: DeploymentState;
  createdAt: number; // ms
  readyAt?: number; // ms, when the build finished
  target?: string | null;
  commitSha?: string;
  commitMessage?: string;
  commitRef?: string;
  inspectorUrl?: string;
}

export class VercelApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export function vercelConfigured(): boolean {
  return Boolean(process.env.VERCEL_TOKEN && process.env.VERCEL_PROJECT_ID);
}

async function vercel(path: string, init?: RequestInit): Promise<Response> {
  const token = process.env.VERCEL_TOKEN;
  const team = process.env.VERCEL_TEAM_ID;
  if (!token) throw new Error("VERCEL_TOKEN is not set");
  const sep = path.includes("?") ? "&" : "?";
  const url = `https://api.vercel.com${path}${team ? `${sep}teamId=${team}` : ""}`;
  return fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });
}

async function vercelJson<T>(path: string, signal?: AbortSignal): Promise<T> {
  const res = await vercel(path, { signal });
  if (!res.ok) {
    throw new VercelApiError(res.status, `Vercel API ${res.status}: ${await res.text().catch(() => "")}`);
  }
  return (await res.json()) as T;
}

interface RawDeployment {
  uid: string;
  url: string;
  state: DeploymentState;
  created: number;
  ready?: number;
  target?: string | null;
  inspectorUrl?: string;
  meta?: {
    githubCommitSha?: string;
    githubCommitMessage?: string;
    githubCommitRef?: string;
  };
}

function toSummary(d: RawDeployment): DeploymentSummary {
  return {
    id: d.uid,
    url: d.url,
    state: d.state,
    createdAt: d.created,
    readyAt: d.ready,
    target: d.target ?? null,
    commitSha: d.meta?.githubCommitSha,
    commitMessage: d.meta?.githubCommitMessage?.split("\n")[0].slice(0, 200),
    commitRef: d.meta?.githubCommitRef,
    inspectorUrl: d.inspectorUrl,
  };
}

export async function listDeployments(
  opts: { limit?: number; target?: "production" | "preview"; signal?: AbortSignal } = {},
): Promise<DeploymentSummary[]> {
  const projectId = process.env.VERCEL_PROJECT_ID;
  if (!projectId) throw new Error("VERCEL_PROJECT_ID is not set");
  const params = new URLSearchParams({ projectId, limit: String(opts.limit ?? 20) });
  if (opts.target) params.set("target", opts.target);
  const json = await vercelJson<{ deployments?: RawDeployment[] }>(`/v6/deployments?${params}`, opts.signal);
  return (json.deployments ?? []).map(toSummary);
}

export async function getLatestDeployment(): Promise<DeploymentSummary | null> {
  const [d] = await listDeployments({ limit: 1, target: "production" });
  return d ?? null;
}

export interface TeamSummary {
  name?: string;
  plan?: string;
  /** Present when Vercel has blocked the team (e.g. usage limits exceeded). */
  softBlock?: { blockedAt?: number; reason?: string } | null;
}

export async function getTeam(signal?: AbortSignal): Promise<TeamSummary | null> {
  const teamId = process.env.VERCEL_TEAM_ID;
  if (!teamId) return null;
  // The team id is passed in the path; vercel() also appends ?teamId, which
  // the endpoint ignores.
  const json = await vercelJson<{
    name?: string;
    billing?: { plan?: string } | null;
    softBlock?: { blockedAt?: number; reason?: string } | null;
  }>(`/v2/teams/${encodeURIComponent(teamId)}`, signal);
  return { name: json.name, plan: json.billing?.plan, softBlock: json.softBlock ?? null };
}

export interface DomainConfig {
  misconfigured: boolean;
  configuredBy?: string | null;
}

export async function getDomainConfig(domain: string, signal?: AbortSignal): Promise<DomainConfig> {
  const json = await vercelJson<{ misconfigured?: boolean; configuredBy?: string | null }>(
    `/v6/domains/${encodeURIComponent(domain)}/config`,
    signal,
  );
  return { misconfigured: Boolean(json.misconfigured), configuredBy: json.configuredBy ?? null };
}

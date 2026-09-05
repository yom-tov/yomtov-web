// Vercel REST client for the deploy-status pill in the admin panel.
// Uses VERCEL_TOKEN + VERCEL_PROJECT_ID + VERCEL_TEAM_ID env vars.

export interface DeploymentSummary {
  id: string;
  url: string;
  state: "READY" | "BUILDING" | "QUEUED" | "ERROR" | "CANCELED" | "INITIALIZING";
  createdAt: number; // ms
  commitSha?: string;
  commitMessage?: string;
  inspectorUrl?: string;
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

interface RawDeployment {
  uid: string;
  url: string;
  state: DeploymentSummary["state"];
  created: number;
  inspectorUrl?: string;
  meta?: {
    githubCommitSha?: string;
    githubCommitMessage?: string;
  };
}

export async function getLatestDeployment(): Promise<DeploymentSummary | null> {
  const projectId = process.env.VERCEL_PROJECT_ID;
  if (!projectId) throw new Error("VERCEL_PROJECT_ID is not set");
  const res = await vercel(
    `/v6/deployments?projectId=${encodeURIComponent(projectId)}&limit=1&target=production`
  );
  if (!res.ok) {
    throw new Error(`Vercel API ${res.status}: ${await res.text().catch(() => "")}`);
  }
  const json = (await res.json()) as { deployments?: RawDeployment[] };
  const d = json.deployments?.[0];
  if (!d) return null;
  return {
    id: d.uid,
    url: d.url,
    state: d.state,
    createdAt: d.created,
    commitSha: d.meta?.githubCommitSha,
    commitMessage: d.meta?.githubCommitMessage?.split("\n")[0].slice(0, 200),
    inspectorUrl: d.inspectorUrl,
  };
}

// Geometry for the architecture diagram (viewBox 980 × 580). Right-to-left
// reading order: the visitor starts on the right, the site (Vercel) sits in
// the middle and the services it talks to are arranged around it.
import type { DiagramNodeId } from "@/lib/admin/architecture";
import type { Status } from "@/components/admin/ui/primitives";

export const VIEW_W = 980;
export const VIEW_H = 580;
const NODE_W = 156;
const NODE_H = 64;

export const POS: Record<DiagramNodeId, { x: number; y: number; w?: number; h?: number }> = {
  visitor: { x: 880, y: 290 },
  namecheap: { x: 690, y: 290 },
  vercel: { x: 470, y: 290, w: 200, h: 86 },
  admin: { x: 690, y: 90 },
  github: { x: 470, y: 90 },
  neon: { x: 260, y: 90 },
  mux: { x: 130, y: 225 },
  r2: { x: 130, y: 360 },
  blob: { x: 260, y: 492 },
  resend: { x: 470, y: 492 },
  youtube: { x: 690, y: 492 },
  simulators: { x: 880, y: 492 },
};

export const BASE_EDGES: [DiagramNodeId, DiagramNodeId][] = [
  ["visitor", "namecheap"],
  ["namecheap", "vercel"],
  ["admin", "vercel"],
  ["vercel", "github"],
  ["vercel", "neon"],
  ["vercel", "mux"],
  ["vercel", "r2"],
  ["vercel", "blob"],
  ["vercel", "resend"],
  ["visitor", "youtube"],
  ["visitor", "simulators"],
];

export const PEOPLE: Record<"visitor" | "admin", { name: string; tagline: string; color: string }> = {
  visitor: { name: "גולש / תלמיד", tagline: "בדפדפן או בטלפון", color: "#0EA5E9" },
  admin: { name: "אתה", tagline: "פאנל הניהול", color: "#8B5CF6" },
};

export const STATUS_FILL: Record<Status, string> = {
  ok: "#10b981",
  warn: "#f59e0b",
  error: "#f43f5e",
  unknown: "#94a3b8",
};

export function nodeSize(id: DiagramNodeId) {
  const p = POS[id];
  return { w: p.w ?? NODE_W, h: p.h ?? NODE_H };
}

/** Point where the ray from the node centre towards (tx,ty) leaves the node box. */
function boundaryPoint(id: DiagramNodeId, tx: number, ty: number, pad = 6) {
  const { x, y } = POS[id];
  const { w, h } = nodeSize(id);
  const dx = tx - x;
  const dy = ty - y;
  if (dx === 0 && dy === 0) return { x, y };
  const sx = (w / 2 + pad) / Math.abs(dx || 1e-9);
  const sy = (h / 2 + pad) / Math.abs(dy || 1e-9);
  const s = Math.min(sx, sy);
  return { x: x + dx * s, y: y + dy * s };
}

export function edgeKey(a: DiagramNodeId, b: DiagramNodeId) {
  return [a, b].sort().join("|");
}
const BASE_KEYS = new Set(BASE_EDGES.map(([a, b]) => edgeKey(a, b)));

/** Straight path for base edges, a gentle curve for flow-only connections. */
export function edgePath(from: DiagramNodeId, to: DiagramNodeId) {
  const a = POS[from];
  const b = POS[to];
  if (BASE_KEYS.has(edgeKey(from, to))) {
    const p1 = boundaryPoint(from, b.x, b.y);
    const p2 = boundaryPoint(to, a.x, a.y);
    return `M ${p1.x} ${p1.y} L ${p2.x} ${p2.y}`;
  }
  const mx = (a.x + b.x) / 2;
  const my = (a.y + b.y) / 2;
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  const bend = Math.min(140, len * 0.28);
  const cx = mx + (-dy / len) * bend;
  const cy = my + (dx / len) * bend;
  const p1 = boundaryPoint(from, cx, cy);
  const p2 = boundaryPoint(to, cx, cy);
  return `M ${p1.x} ${p1.y} Q ${cx} ${cy} ${p2.x} ${p2.y}`;
}

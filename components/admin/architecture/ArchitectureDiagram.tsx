"use client";

import { useEffect, useMemo, useState } from "react";
import { clsx } from "clsx";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import type { DiagramNodeId, Flow } from "@/lib/admin/architecture";
import { STATUS_LABEL_HE, StatusDot } from "@/components/admin/ui/primitives";
import { BASE_EDGES, PEOPLE, POS, STATUS_FILL, VIEW_H, VIEW_W, edgeKey, edgePath, nodeSize } from "./layout";
import { ServicePanel, type DiagramService } from "./ServicePanel";

const STEP_MS = 3800;

export function ArchitectureDiagram({ services, flows }: { services: DiagramService[]; flows: Flow[] }) {
  const byId = useMemo(
    () => Object.fromEntries(services.map((s) => [s.id, s])) as Record<string, DiagramService>,
    [services],
  );
  const [selected, setSelected] = useState<DiagramNodeId | null>(null);
  const [flowId, setFlowId] = useState<string | null>(null);
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);

  const flow = flows.find((f) => f.id === flowId) ?? null;

  // Auto-advance while playing.
  useEffect(() => {
    if (!playing || !flow) return;
    const t = setTimeout(() => {
      if (step < flow.steps.length - 1) setStep((s) => s + 1);
      else setPlaying(false);
    }, STEP_MS);
    return () => clearTimeout(t);
  }, [playing, step, flow]);

  const toggleFlow = (id: string) => {
    if (flowId === id) {
      setFlowId(null);
      setPlaying(false);
      return;
    }
    setFlowId(id);
    setStep(0);
    setPlaying(true);
    setSelected(null);
  };

  const current = flow?.steps[step] ?? null;
  const doneSteps = flow ? flow.steps.slice(0, step) : [];
  const activeNodes = new Set<DiagramNodeId>(current ? [current.from, current.to] : []);
  const involved = new Set<DiagramNodeId>(flow ? flow.steps.flatMap((s) => [s.from, s.to]) : []);
  const nodes = Object.keys(POS) as DiagramNodeId[];

  return (
    <div className="space-y-4">
      {/* Flow picker */}
      <div className="rounded-2xl border border-border bg-surface p-4">
        <div className="mb-3 text-sm font-bold text-text">איך זה עובד? בחר תרחיש וצפה בו צעד אחר צעד</div>
        <div className="flex flex-wrap gap-2">
          {flows.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => toggleFlow(f.id)}
              aria-pressed={flowId === f.id}
              className={clsx(
                "rounded-xl border px-3 py-2 text-sm font-semibold transition-colors",
                flowId === f.id
                  ? "border-primary-500 bg-primary-600 text-white"
                  : "border-border bg-surface text-text hover:bg-surface-2",
              )}
            >
              <span className="me-1.5">{f.emoji}</span>
              {f.title}
            </button>
          ))}
        </div>

        {flow && current && (
          <div className="mt-4 rounded-xl border border-primary-200 bg-primary-50/60 p-4 dark:border-primary-500/30 dark:bg-primary-500/10">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-xs font-bold text-primary-700 dark:text-primary-200">
                שלב {step + 1} מתוך {flow.steps.length}
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => {
                    setPlaying(false);
                    setStep((s) => Math.max(0, s - 1));
                  }}
                  disabled={step === 0}
                  className="rounded-lg p-1.5 text-text-muted hover:bg-surface disabled:opacity-30"
                  aria-label="השלב הקודם"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!playing && step === flow.steps.length - 1) setStep(0);
                    setPlaying((p) => !p);
                  }}
                  className="rounded-lg p-1.5 text-text-muted hover:bg-surface"
                  aria-label={playing ? "עצור" : "נגן"}
                >
                  {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPlaying(false);
                    setStep((s) => Math.min(flow.steps.length - 1, s + 1));
                  }}
                  disabled={step === flow.steps.length - 1}
                  className="rounded-lg p-1.5 text-text-muted hover:bg-surface disabled:opacity-30"
                  aria-label="השלב הבא"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
              </div>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-text" aria-live="polite">
              {current.text}
            </p>
            <div className="mt-3 h-1 overflow-hidden rounded-full bg-primary-100 dark:bg-primary-500/20">
              <div
                className="h-full rounded-full bg-primary-600 transition-all"
                style={{ width: `${((step + 1) / flow.steps.length) * 100}%` }}
              />
            </div>
            {step === flow.steps.length - 1 && (
              <p className="mt-3 text-xs font-semibold text-primary-800 dark:text-primary-100">💡 {flow.takeaway}</p>
            )}
          </div>
        )}
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_260px]">
        {/* Diagram */}
        <div className="min-w-0 rounded-2xl border border-border bg-surface p-2">
          <div className="overflow-x-auto">
            <svg
              viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
              className="h-auto w-full min-w-[640px]"
              role="img"
              aria-label="תרשים השירותים של האתר והקשרים ביניהם"
            >
              <defs>
                <marker id="arch-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--primary-500)" />
                </marker>
                <marker id="arch-arrow-muted" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--primary-300)" />
                </marker>
              </defs>

              {/* Base connections */}
              {BASE_EDGES.map(([a, b]) => {
                const dim = flow && !(involved.has(a) && involved.has(b));
                const sel = selected && (a === selected || b === selected);
                return (
                  <path
                    key={edgeKey(a, b)}
                    d={edgePath(a, b)}
                    fill="none"
                    stroke={sel ? "var(--primary-400)" : "var(--border-strong)"}
                    strokeWidth={sel ? 2.5 : 1.5}
                    opacity={dim ? 0.25 : 1}
                  />
                );
              })}

              {/* Steps already shown in the current flow */}
              {doneSteps.map((s, i) => (
                <path
                  key={`done-${i}`}
                  d={edgePath(s.from, s.to)}
                  fill="none"
                  stroke="var(--primary-300)"
                  strokeWidth={2.5}
                  markerEnd="url(#arch-arrow-muted)"
                />
              ))}

              {/* Current step */}
              {current && (
                <path
                  d={edgePath(current.from, current.to)}
                  fill="none"
                  stroke="var(--primary-500)"
                  strokeWidth={4}
                  className="arch-edge-active"
                  markerEnd="url(#arch-arrow)"
                />
              )}

              {/* Nodes */}
              {nodes.map((id) => {
                const p = POS[id];
                const { w, h } = nodeSize(id);
                const person = id === "visitor" || id === "admin" ? PEOPLE[id] : null;
                const svc = person ? null : byId[id];
                const isVercel = id === "vercel";
                const name = isVercel ? "האתר (Vercel)" : (person?.name ?? svc?.name ?? id);
                const tagline = isVercel ? "השרת שמריץ את הכל" : (person?.tagline ?? svc?.tagline ?? "");
                const color = person?.color ?? svc?.color ?? "#64748b";
                const isActive = activeNodes.has(id);
                const isSelected = selected === id;
                const dim = flow && !involved.has(id);
                const status = svc?.status ?? null;
                return (
                  <g
                    key={id}
                    transform={`translate(${p.x - w / 2} ${p.y - h / 2})`}
                    onClick={() => {
                      if (!person) setSelected(isSelected ? null : id);
                    }}
                    className={person ? undefined : "cursor-pointer"}
                    opacity={dim ? 0.35 : 1}
                  >
                    <rect
                      width={w}
                      height={h}
                      rx={16}
                      fill="var(--surface)"
                      stroke={isActive ? "var(--primary-500)" : isSelected ? "var(--primary-400)" : "var(--border)"}
                      strokeWidth={isActive || isSelected ? 3 : 1.5}
                    />
                    <rect x={w - 7} y={10} width={4} height={h - 20} rx={2} fill={color} />
                    <text
                      x={w / 2}
                      y={isVercel ? h / 2 - 6 : h / 2 - 4}
                      textAnchor="middle"
                      fontSize={isVercel ? 19 : 15}
                      fontWeight={800}
                      fill="var(--text)"
                    >
                      {name}
                    </text>
                    <text
                      x={w / 2}
                      y={isVercel ? h / 2 + 18 : h / 2 + 16}
                      textAnchor="middle"
                      fontSize={12}
                      fill="var(--text-muted)"
                    >
                      {tagline}
                    </text>
                    {status && (
                      <circle cx={16} cy={16} r={6} fill={STATUS_FILL[status]}>
                        <title>{STATUS_LABEL_HE[status]}</title>
                      </circle>
                    )}
                  </g>
                );
              })}
            </svg>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-3 pb-2 pt-1 text-[11px] text-text-subtle">
            <span className="inline-flex items-center gap-1.5">
              <StatusDot status="ok" pulse={false} /> תקין
            </span>
            <span className="inline-flex items-center gap-1.5">
              <StatusDot status="warn" pulse={false} /> דורש תשומת לב
            </span>
            <span className="inline-flex items-center gap-1.5">
              <StatusDot status="error" pulse={false} /> תקלה
            </span>
            <span className="inline-flex items-center gap-1.5">
              <StatusDot status="unknown" pulse={false} /> לא נבדק
            </span>
            <span>· לחץ על שירות כדי לקרוא עליו</span>
          </div>
        </div>

        <ServicePanel service={selected ? byId[selected] : null} onClose={() => setSelected(null)} />
      </div>

      {/* Keyboard / screen-reader friendly list of the same services */}
      <div className="sr-only">
        <h3>רשימת השירותים</h3>
        <ul>
          {services.map((s) => (
            <li key={s.id}>
              <button type="button" onClick={() => setSelected(s.id)}>
                {s.name}: {s.tagline}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

import { ExternalLink, X } from "lucide-react";
import type { ServiceInfo } from "@/lib/admin/architecture";
import { STATUS_LABEL_HE, StatusDot, type Status } from "@/components/admin/ui/primitives";

export interface DiagramService extends ServiceInfo {
  status: Status | null;
  statusSummary: string | null;
  plan: string | null;
  cost: string | null;
}

export function ServicePanel({ service, onClose }: { service: DiagramService | null; onClose: () => void }) {
  if (!service) {
    return (
      <div className="rounded-2xl border border-dashed border-border-strong bg-surface p-5 text-sm text-text-muted">
        <div className="mb-2 text-base font-bold text-text">לחץ על שירות בתרשים</div>
        כל ריבוע בתרשים הוא שירות חיצוני שהאתר נשען עליו. לחיצה עליו תסביר מה הוא עושה, מה נשמר בו ומה קורה אם הוא
        נופל.
        <div className="mt-3 text-xs text-text-subtle">או בחר תרחיש למעלה כדי לראות איך השירותים עובדים ביחד.</div>
      </div>
    );
  }
  return (
    <div className="rounded-2xl border border-border bg-surface p-5">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full" style={{ background: service.color }} />
            <h3 className="text-lg font-extrabold text-text">{service.name}</h3>
          </div>
          <div className="text-xs text-text-muted">{service.tagline}</div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-1 text-text-subtle hover:bg-surface-2"
          aria-label="סגור"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {service.status && (
        <div className="mt-3 flex items-start gap-2 rounded-xl bg-surface-2 px-3 py-2 text-xs">
          <StatusDot status={service.status} className="mt-0.5" />
          <span className="text-text">{service.statusSummary ?? STATUS_LABEL_HE[service.status]}</span>
        </div>
      )}

      <dl className="mt-4 space-y-3 text-sm">
        <div>
          <dt className="text-xs font-bold text-text-subtle">מה זה?</dt>
          <dd className="mt-0.5 leading-relaxed text-text">{service.whatItIs}</dd>
        </div>
        <div>
          <dt className="text-xs font-bold text-text-subtle">למה אנחנו צריכים את זה?</dt>
          <dd className="mt-0.5 leading-relaxed text-text">{service.whyWeUseIt}</dd>
        </div>
        <div>
          <dt className="text-xs font-bold text-text-subtle">מה נשמר שם?</dt>
          <dd className="mt-1">
            <ul className="list-disc space-y-0.5 ps-5 text-text">
              {service.whatLivesThere.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
          </dd>
        </div>
        <div>
          <dt className="text-xs font-bold text-text-subtle">מה קורה אם הוא נופל?</dt>
          <dd className="mt-0.5 leading-relaxed text-text">{service.ifItFails}</dd>
        </div>
        {(service.plan || service.cost) && (
          <div>
            <dt className="text-xs font-bold text-text-subtle">תוכנית ועלות</dt>
            <dd className="mt-0.5 text-text">
              {service.plan}
              {service.cost ? ` · ${service.cost}` : ""}
            </dd>
          </div>
        )}
      </dl>

      <a
        href={service.dashboardUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary-700 hover:underline dark:text-primary-200"
      >
        {service.dashboardLabel}
        <ExternalLink className="h-3.5 w-3.5" />
      </a>
    </div>
  );
}

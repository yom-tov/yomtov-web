"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Search, X, CheckCircle, XCircle, ShieldAlert, ShieldCheck, Clock, Play, Download } from "lucide-react";

interface UserRow {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  institution: string | null;
  emailVerified: boolean;
  active: boolean;
  createdAt: Date;
  purchaseCount: number;
  lastSeen: Date | null;
  videosWatched: number;
}

export function UsersListClient({ items }: { items: UserRow[] }) {
  const [q, setQ] = useState("");
  const [verifiedFilter, setVerifiedFilter] = useState<"" | "yes" | "no">("");
  const [activeFilter, setActiveFilter] = useState<"" | "yes" | "no">("");

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return items.filter((u) => {
      if (verifiedFilter === "yes" && !u.emailVerified) return false;
      if (verifiedFilter === "no" && u.emailVerified) return false;
      if (activeFilter === "yes" && !u.active) return false;
      if (activeFilter === "no" && u.active) return false;
      if (needle) {
        const hay =
          `${u.firstName} ${u.lastName} ${u.email} ${u.phone ?? ""} ${u.institution ?? ""}`.toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      return true;
    });
  }, [items, q, verifiedFilter, activeFilter]);

  const clearFilters = () => {
    setQ("");
    setVerifiedFilter("");
    setActiveFilter("");
  };
  const activeFilters =
    Number(!!q) + Number(!!verifiedFilter) + Number(!!activeFilter);

  return (
    <div>
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-text">משתמשים</h1>
          <p className="text-sm text-text-muted num">
            {filtered.length} מוצגים · {items.length} סה״כ
          </p>
        </div>
        <a
          href="/api/admin/users-export"
          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-white px-3 py-2 text-xs font-semibold text-text-muted hover:border-primary-300 hover:text-primary-700"
        >
          <Download className="h-3.5 w-3.5" />
          ייצוא CSV
        </a>
      </div>

      <div className="mb-4 rounded-2xl border border-border bg-surface p-3">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[220px]">
            <label className="flex items-center gap-2 rounded-xl border border-border bg-white px-3 py-2 focus-within:border-primary-500">
              <Search className="h-4 w-4 text-text-subtle" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="חיפוש לפי שם / מייל / טלפון"
                className="flex-1 bg-transparent text-sm text-text placeholder:text-text-subtle focus:outline-none"
              />
            </label>
          </div>
          <F label="אימות מייל">
            <select
              value={verifiedFilter}
              onChange={(e) =>
                setVerifiedFilter(e.target.value as "" | "yes" | "no")
              }
              className="select"
            >
              <option value="">הכל</option>
              <option value="yes">מאומת</option>
              <option value="no">לא מאומת</option>
            </select>
          </F>
          <F label="סטטוס">
            <select
              value={activeFilter}
              onChange={(e) =>
                setActiveFilter(e.target.value as "" | "yes" | "no")
              }
              className="select"
            >
              <option value="">הכל</option>
              <option value="yes">פעיל</option>
              <option value="no">חסום</option>
            </select>
          </F>
          {activeFilters > 0 && (
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex items-center gap-1 rounded-lg border border-border bg-white px-3 py-2 text-xs text-text-muted hover:text-text"
            >
              <X className="h-3.5 w-3.5" />
              נקה ({activeFilters})
            </button>
          )}
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border bg-surface">
        <table className="w-full min-w-[700px] text-sm">
          <thead className="bg-surface-2/60 text-right">
            <tr>
              <Th>שם</Th>
              <Th>מייל</Th>
              <Th>טלפון</Th>
              <Th>מוסד</Th>
              <Th>אימות</Th>
              <Th>סטטוס</Th>
              <Th>רכישות</Th>
              <Th>סרטונים</Th>
              <Th>נראה לאחרונה</Th>
              <Th>הרשמה</Th>
              <Th className="w-0">פעולות</Th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((u) => (
              <tr
                key={u.id}
                className="border-t border-border hover:bg-surface-2/40"
              >
                <Td>
                  <span className="font-semibold text-text">
                    {u.firstName} {u.lastName}
                  </span>
                </Td>
                <Td>
                  <span className="text-text-muted">{u.email}</span>
                </Td>
                <Td className="num">{u.phone || "-"}</Td>
                <Td>{u.institution || "-"}</Td>
                <Td>
                  {u.emailVerified ? (
                    <CheckCircle className="h-4 w-4 text-emerald-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-amber-500" />
                  )}
                </Td>
                <Td>
                  {u.active ? (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
                      <ShieldCheck className="h-3.5 w-3.5" /> פעיל
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-700">
                      <ShieldAlert className="h-3.5 w-3.5" /> חסום
                    </span>
                  )}
                </Td>
                <Td className="num">{u.purchaseCount}</Td>
                <Td className="num">
                  {u.videosWatched > 0 ? (
                    <span className="inline-flex items-center gap-1 text-xs text-primary-700">
                      <Play className="h-3 w-3" /> {u.videosWatched}
                    </span>
                  ) : (
                    <span className="text-text-subtle">-</span>
                  )}
                </Td>
                <Td className="num text-text-subtle text-[11px]">
                  {u.lastSeen ? (
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatLastSeen(new Date(u.lastSeen))}
                    </span>
                  ) : (
                    "-"
                  )}
                </Td>
                <Td className="num text-text-subtle">
                  {new Date(u.createdAt).toLocaleDateString("he-IL")}
                </Td>
                <Td>
                  <Link
                    href={`/admin/users/${u.id}`}
                    className="inline-flex items-center gap-1 rounded-lg border border-border bg-white px-2 py-1.5 text-xs text-text-muted hover:border-primary-300 hover:text-primary-700"
                  >
                    צפה
                  </Link>
                </Td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={11}
                  className="px-4 py-10 text-center text-sm text-text-subtle"
                >
                  אין משתמשים
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <style jsx>{`
        .select {
          height: 36px;
          padding: 0 10px;
          border-radius: 8px;
          border: 1px solid var(--border);
          background: white;
          color: var(--text);
          font-size: 13px;
        }
        .select:focus {
          outline: none;
          border-color: var(--primary-500);
        }
      `}</style>
    </div>
  );
}

function formatLastSeen(date: Date): string {
  const now = Date.now();
  const diff = now - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "עכשיו";
  if (mins < 60) return `לפני ${mins} דק'`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `לפני ${hours} שע'`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `לפני ${days} ימים`;
  if (days < 30) return `לפני ${Math.floor(days / 7)} שבועות`;
  return date.toLocaleDateString("he-IL");
}

function Th({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <th className={`px-3 py-2.5 text-xs font-bold text-text-muted ${className}`}>
      {children}
    </th>
  );
}
function Td({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <td className={`px-3 py-2.5 align-top ${className}`}>{children}</td>
  );
}
function F({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-0.5">
      <span className="text-[10px] font-semibold text-text-subtle">
        {label}
      </span>
      {children}
    </label>
  );
}

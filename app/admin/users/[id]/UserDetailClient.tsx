"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
  ArrowLeft,
  ShieldCheck,
  ShieldAlert,
  CheckCircle,
  XCircle,
  Plus,
  Ban,
  Loader2,
} from "lucide-react";
import {
  grantAccessAction,
  revokeAccessAction,
  toggleUserActiveAction,
} from "../actions";

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  institution: string | null;
  emailVerified: boolean;
  active: boolean;
  createdAt: Date;
}

interface Purchase {
  purchaseId: string;
  packageId: string;
  packageTitle: string;
  packageSlug: string;
  grantedAt: Date;
  expiresAt: Date | null;
  revokedAt: Date | null;
  status: string;
  paymentMethod: string | null;
  paymentNote: string | null;
  adminNotes: string | null;
}

interface AvailablePackage {
  id: string;
  title: string;
}

export function UserDetailClient({
  user,
  purchases,
  allPackages,
}: {
  user: User;
  purchases: Purchase[];
  allPackages: AvailablePackage[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [selectedPackage, setSelectedPackage] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [paymentNote, setPaymentNote] = useState("");
  const [adminNotes, setAdminNotes] = useState("");

  const handleGrant = () => {
    if (!selectedPackage) return;
    startTransition(async () => {
      const res = await grantAccessAction({
        userId: user.id,
        packageId: selectedPackage,
        expiresAt: expiresAt || null,
        paymentMethod: paymentMethod || null,
        paymentNote: paymentNote || null,
        adminNotes: adminNotes || null,
      });
      if (res.ok) {
        toast.success("הגישה ניתנה בהצלחה");
        setSelectedPackage("");
        setExpiresAt("");
        setPaymentMethod("");
        setPaymentNote("");
        setAdminNotes("");
        router.refresh();
      } else {
        toast.error(res.error ?? "שגיאה");
      }
    });
  };

  const handleRevoke = (purchaseId: string) => {
    startTransition(async () => {
      const res = await revokeAccessAction(purchaseId);
      if (res.ok) {
        toast.success("הגישה נשללה");
        router.refresh();
      } else {
        toast.error(res.error ?? "שגיאה");
      }
    });
  };

  const handleToggleActive = () => {
    startTransition(async () => {
      const res = await toggleUserActiveAction(user.id, !user.active);
      if (res.ok) {
        toast.success(user.active ? "המשתמש נחסם" : "המשתמש הופעל");
        router.refresh();
      } else {
        toast.error(res.error ?? "שגיאה");
      }
    });
  };

  const fmtDate = (d: Date | null) =>
    d ? new Date(d).toLocaleDateString("he-IL") : "-";

  return (
    <div className="max-w-4xl space-y-6">
      <Link
        href="/admin/users"
        className="inline-flex items-center gap-1 text-sm text-text-muted hover:text-primary-700"
      >
        <ArrowLeft className="h-4 w-4" />
        חזרה לרשימת המשתמשים
      </Link>

      {/* User info card */}
      <div className="rounded-2xl border border-border bg-surface p-5">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-extrabold text-text">
              {user.firstName} {user.lastName}
            </h1>
            <p className="mt-1 text-sm text-text-muted">{user.email}</p>
          </div>
          <button
            type="button"
            onClick={handleToggleActive}
            disabled={pending}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold ${
              user.active
                ? "border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
                : "border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
            }`}
          >
            {pending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : user.active ? (
              <Ban className="h-3.5 w-3.5" />
            ) : (
              <ShieldCheck className="h-3.5 w-3.5" />
            )}
            {user.active ? "חסום משתמש" : "הפעל משתמש"}
          </button>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <InfoItem label="טלפון" value={user.phone || "-"} />
          <InfoItem label="מוסד" value={user.institution || "-"} />
          <InfoItem
            label="אימות מייל"
            value={
              <span className="inline-flex items-center gap-1">
                {user.emailVerified ? (
                  <>
                    <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />{" "}
                    מאומת
                  </>
                ) : (
                  <>
                    <XCircle className="h-3.5 w-3.5 text-amber-500" /> לא
                    מאומת
                  </>
                )}
              </span>
            }
          />
          <InfoItem
            label="סטטוס"
            value={
              <span className="inline-flex items-center gap-1">
                {user.active ? (
                  <>
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />{" "}
                    פעיל
                  </>
                ) : (
                  <>
                    <ShieldAlert className="h-3.5 w-3.5 text-rose-600" />{" "}
                    חסום
                  </>
                )}
              </span>
            }
          />
          <InfoItem
            label="הרשמה"
            value={new Date(user.createdAt).toLocaleDateString("he-IL")}
          />
        </div>
      </div>

      {/* Purchases */}
      <div className="rounded-2xl border border-border bg-surface p-5">
        <h2 className="text-lg font-bold text-text">רכישות</h2>

        {purchases.length > 0 ? (
          <div className="mt-3 overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead className="bg-surface-2/60 text-right">
                <tr>
                  <th className="px-3 py-2 text-xs font-bold text-text-muted">
                    חבילה
                  </th>
                  <th className="px-3 py-2 text-xs font-bold text-text-muted">
                    תאריך הענקה
                  </th>
                  <th className="px-3 py-2 text-xs font-bold text-text-muted">
                    תפוגה
                  </th>
                  <th className="px-3 py-2 text-xs font-bold text-text-muted">
                    סטטוס
                  </th>
                  <th className="px-3 py-2 text-xs font-bold text-text-muted">
                    תשלום
                  </th>
                  <th className="px-3 py-2 text-xs font-bold text-text-muted w-0">
                    פעולות
                  </th>
                </tr>
              </thead>
              <tbody>
                {purchases.map((p) => (
                  <tr
                    key={p.purchaseId}
                    className="border-t border-border hover:bg-surface-2/40"
                  >
                    <td className="px-3 py-2 font-semibold text-text">
                      {p.packageTitle}
                    </td>
                    <td className="px-3 py-2 num text-text-muted">
                      {fmtDate(p.grantedAt)}
                    </td>
                    <td className="px-3 py-2 num text-text-muted">
                      {fmtDate(p.expiresAt)}
                    </td>
                    <td className="px-3 py-2">
                      <StatusBadge status={p.status} />
                    </td>
                    <td className="px-3 py-2 text-text-muted">
                      {p.paymentMethod || "-"}
                    </td>
                    <td className="px-3 py-2">
                      {p.status === "active" && (
                        <button
                          type="button"
                          onClick={() => handleRevoke(p.purchaseId)}
                          disabled={pending}
                          className="inline-flex items-center gap-1 rounded-lg border border-border bg-white px-2 py-1.5 text-xs text-text-muted hover:border-rose-300 hover:text-rose-700"
                        >
                          <Ban className="h-3.5 w-3.5" /> שלול
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-3 text-sm text-text-subtle">
            למשתמש זה אין רכישות עדיין.
          </p>
        )}

        {/* Grant access form */}
        <div className="mt-5 rounded-xl border border-primary-200 bg-primary-50/40 p-4">
          <h3 className="text-sm font-bold text-primary-800">
            <Plus className="inline h-4 w-4" /> הענק גישה לחבילה
          </h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1">
              <span className="text-[10px] font-semibold text-text-subtle">
                חבילה
              </span>
              <select
                value={selectedPackage}
                onChange={(e) => setSelectedPackage(e.target.value)}
                className="h-9 rounded-lg border border-border bg-white px-3 text-sm text-text focus:border-primary-500 focus:outline-none"
              >
                <option value="">בחר חבילה...</option>
                {allPackages.map((pkg) => (
                  <option key={pkg.id} value={pkg.id}>
                    {pkg.title}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[10px] font-semibold text-text-subtle">
                תאריך תפוגה (אופציונלי)
              </span>
              <input
                type="date"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                className="h-9 rounded-lg border border-border bg-white px-3 text-sm text-text focus:border-primary-500 focus:outline-none"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[10px] font-semibold text-text-subtle">
                אמצעי תשלום
              </span>
              <input
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="h-9 rounded-lg border border-border bg-white px-3 text-sm text-text focus:border-primary-500 focus:outline-none"
                placeholder="Bit / העברה / מזומן"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[10px] font-semibold text-text-subtle">
                הערת תשלום
              </span>
              <input
                value={paymentNote}
                onChange={(e) => setPaymentNote(e.target.value)}
                className="h-9 rounded-lg border border-border bg-white px-3 text-sm text-text focus:border-primary-500 focus:outline-none"
                placeholder="מספר אסמכתא וכד׳"
              />
            </label>
            <label className="flex flex-col gap-1 sm:col-span-2">
              <span className="text-[10px] font-semibold text-text-subtle">
                הערות אדמין (פנימיות)
              </span>
              <input
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                className="h-9 rounded-lg border border-border bg-white px-3 text-sm text-text focus:border-primary-500 focus:outline-none"
                placeholder="הערות פנימיות..."
              />
            </label>
          </div>
          <button
            type="button"
            onClick={handleGrant}
            disabled={!selectedPackage || pending}
            className="mt-3 inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary-600 px-4 text-xs font-semibold text-white hover:bg-primary-700 disabled:opacity-50"
          >
            {pending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Plus className="h-3.5 w-3.5" />
            )}
            הענק גישה
          </button>
        </div>
      </div>
    </div>
  );
}

function InfoItem({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div>
      <div className="text-[10px] font-semibold text-text-subtle">{label}</div>
      <div className="mt-0.5 text-sm text-text">{value}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    active: { label: "פעיל", cls: "bg-emerald-50 text-emerald-700" },
    revoked: { label: "נשלל", cls: "bg-rose-50 text-rose-700" },
    expired: { label: "פג תוקף", cls: "bg-amber-50 text-amber-700" },
  };
  const { label, cls } = map[status] ?? {
    label: status,
    cls: "bg-surface-2 text-text-muted",
  };
  return (
    <span
      className={`inline-block rounded-md px-2 py-0.5 text-xs font-semibold ${cls}`}
    >
      {label}
    </span>
  );
}

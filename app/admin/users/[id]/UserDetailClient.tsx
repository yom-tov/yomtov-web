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
  Mail,
  Play,
  Eye,
  Clock,
  BarChart3,
  Video,
} from "lucide-react";
import {
  grantAccessAction,
  revokeAccessAction,
  toggleUserActiveAction,
  resendVerificationAction,
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

interface VideoProgressRow {
  videoId: string;
  positionSeconds: number;
  durationSeconds: number | null;
  updatedAt: Date;
}

interface VideoInfo {
  videoId: string;
  videoTitle: string;
  videoDuration: number | null;
  packageId: string;
  displayOrder: number;
}

interface PackageInfo {
  id: string;
  title: string;
  slug: string;
}

interface PromoView {
  id: string;
  videoId: string | null;
  createdAt: Date;
}

interface ActivityRow {
  id: string;
  eventType: string;
  videoId: string | null;
  metadata: string | null;
  createdAt: Date;
}

type Tab = "info" | "activity";

export function UserDetailClient({
  user,
  purchases,
  allPackages,
  videoProgress,
  allVideos,
  packagesInfo,
  promoViews,
  recentActivity,
}: {
  user: User;
  purchases: Purchase[];
  allPackages: AvailablePackage[];
  videoProgress: VideoProgressRow[];
  allVideos: VideoInfo[];
  packagesInfo: PackageInfo[];
  promoViews: PromoView[];
  recentActivity: ActivityRow[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [tab, setTab] = useState<Tab>("info");

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

  const handleResendVerification = () => {
    startTransition(async () => {
      const res = await resendVerificationAction(user.id);
      if (res.ok) {
        toast.success("מייל אימות נשלח בהצלחה");
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

  const fmtDateTime = (d: Date) =>
    new Date(d).toLocaleString("he-IL", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

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
                    <button
                      type="button"
                      onClick={handleResendVerification}
                      disabled={pending}
                      className="mr-1 inline-flex items-center gap-1 rounded-md border border-primary-200 bg-primary-50 px-2 py-0.5 text-[10px] font-semibold text-primary-700 hover:bg-primary-100"
                    >
                      {pending ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Mail className="h-3 w-3" />
                      )}
                      שלח שוב
                    </button>
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

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl border border-border bg-surface-2/60 p-1">
        <TabButton
          active={tab === "info"}
          onClick={() => setTab("info")}
          icon={<ShieldCheck className="h-4 w-4" />}
          label="רכישות וגישה"
        />
        <TabButton
          active={tab === "activity"}
          onClick={() => setTab("activity")}
          icon={<BarChart3 className="h-4 w-4" />}
          label="צפייה ופעילות"
        />
      </div>

      {tab === "info" && (
        <PurchasesTab
          purchases={purchases}
          allPackages={allPackages}
          pending={pending}
          selectedPackage={selectedPackage}
          setSelectedPackage={setSelectedPackage}
          expiresAt={expiresAt}
          setExpiresAt={setExpiresAt}
          paymentMethod={paymentMethod}
          setPaymentMethod={setPaymentMethod}
          paymentNote={paymentNote}
          setPaymentNote={setPaymentNote}
          adminNotes={adminNotes}
          setAdminNotes={setAdminNotes}
          handleGrant={handleGrant}
          handleRevoke={handleRevoke}
          fmtDate={fmtDate}
        />
      )}

      {tab === "activity" && (
        <ActivityTab
          videoProgress={videoProgress}
          allVideos={allVideos}
          packagesInfo={packagesInfo}
          promoViews={promoViews}
          recentActivity={recentActivity}
          fmtDateTime={fmtDateTime}
        />
      )}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
        active
          ? "bg-surface text-text shadow-sm"
          : "text-text-muted hover:text-text"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function PurchasesTab({
  purchases,
  allPackages,
  pending,
  selectedPackage,
  setSelectedPackage,
  expiresAt,
  setExpiresAt,
  paymentMethod,
  setPaymentMethod,
  paymentNote,
  setPaymentNote,
  adminNotes,
  setAdminNotes,
  handleGrant,
  handleRevoke,
  fmtDate,
}: {
  purchases: Purchase[];
  allPackages: AvailablePackage[];
  pending: boolean;
  selectedPackage: string;
  setSelectedPackage: (v: string) => void;
  expiresAt: string;
  setExpiresAt: (v: string) => void;
  paymentMethod: string;
  setPaymentMethod: (v: string) => void;
  paymentNote: string;
  setPaymentNote: (v: string) => void;
  adminNotes: string;
  setAdminNotes: (v: string) => void;
  handleGrant: () => void;
  handleRevoke: (id: string) => void;
  fmtDate: (d: Date | null) => string;
}) {
  return (
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
  );
}

function ActivityTab({
  videoProgress,
  allVideos,
  packagesInfo,
  promoViews,
  recentActivity,
  fmtDateTime,
}: {
  videoProgress: { videoId: string; positionSeconds: number; durationSeconds: number | null; updatedAt: Date }[];
  allVideos: { videoId: string; videoTitle: string; videoDuration: number | null; packageId: string; displayOrder: number }[];
  packagesInfo: { id: string; title: string; slug: string }[];
  promoViews: { id: string; videoId: string | null; createdAt: Date }[];
  recentActivity: { id: string; eventType: string; videoId: string | null; metadata: string | null; createdAt: Date }[];
  fmtDateTime: (d: Date) => string;
}) {
  const progressMap = new Map(videoProgress.map((p) => [p.videoId, p]));
  const videoTitleMap = new Map(allVideos.map((v) => [v.videoId, v.videoTitle]));

  const packageMap = new Map<string, { videoId: string; videoTitle: string; videoDuration: number | null; displayOrder: number }[]>();
  for (const v of allVideos) {
    const list = packageMap.get(v.packageId) || [];
    list.push(v);
    packageMap.set(v.packageId, list);
  }

  const totalWatched = videoProgress.reduce((sum, p) => sum + p.positionSeconds, 0);
  const videosStarted = videoProgress.length;
  const lastActive = videoProgress.length > 0
    ? new Date(Math.max(...videoProgress.map((p) => new Date(p.updatedAt).getTime())))
    : null;

  const videosCompleted = videoProgress.filter((p) => {
    if (!p.durationSeconds || p.durationSeconds === 0) return false;
    return p.positionSeconds / p.durationSeconds >= 0.9;
  }).length;

  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h} שעות ${m} דקות`;
    return `${m} דקות`;
  };

  return (
    <div className="space-y-5">
      {/* Summary stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          icon={<Play className="h-4 w-4 text-primary-600" />}
          label="סרטונים שנצפו"
          value={String(videosStarted)}
        />
        <StatCard
          icon={<CheckCircle className="h-4 w-4 text-emerald-600" />}
          label="סרטונים שהושלמו"
          value={String(videosCompleted)}
        />
        <StatCard
          icon={<Clock className="h-4 w-4 text-amber-600" />}
          label="זמן צפייה כולל"
          value={formatDuration(totalWatched)}
        />
        <StatCard
          icon={<Eye className="h-4 w-4 text-fuchsia-600" />}
          label="צפיות בפרומו"
          value={String(promoViews.length)}
        />
      </div>

      {lastActive && (
        <p className="text-xs text-text-muted">
          פעילות אחרונה: {fmtDateTime(lastActive)}
        </p>
      )}

      {/* Per-course breakdown */}
      <div className="rounded-2xl border border-border bg-surface p-5">
        <h2 className="text-lg font-bold text-text">התקדמות לפי קורס</h2>

        {packagesInfo.length === 0 ? (
          <p className="mt-3 text-sm text-text-subtle">אין קורסים במערכת.</p>
        ) : (
          <div className="mt-4 space-y-5">
            {packagesInfo.map((pkg) => {
              const courseVideos = packageMap.get(pkg.id) || [];
              if (courseVideos.length === 0) return null;

              const watchedInCourse = courseVideos.filter((v) => progressMap.has(v.videoId)).length;
              const coursePercent = courseVideos.length > 0
                ? Math.round((watchedInCourse / courseVideos.length) * 100)
                : 0;

              return (
                <div key={pkg.id} className="rounded-xl border border-border p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-text">{pkg.title}</h3>
                    <span className="num text-xs font-semibold text-text-muted">
                      {watchedInCourse}/{courseVideos.length} סרטונים
                    </span>
                  </div>

                  {/* Course progress bar */}
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface-2">
                    <div
                      className="h-full rounded-full bg-primary-500 transition-all"
                      style={{ width: `${coursePercent}%` }}
                    />
                  </div>
                  <p className="mt-1 text-[10px] text-text-subtle num">
                    {coursePercent}% מהקורס
                  </p>

                  {/* Video list */}
                  <div className="mt-3 space-y-1.5">
                    {courseVideos.map((v) => {
                      const prog = progressMap.get(v.videoId);
                      const duration = prog?.durationSeconds ?? v.videoDuration ?? 0;
                      const position = prog?.positionSeconds ?? 0;
                      const percent = duration > 0 ? Math.min(100, Math.round((position / duration) * 100)) : 0;
                      const isCompleted = percent >= 90;
                      const hasStarted = !!prog;

                      return (
                        <div key={v.videoId} className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-surface-2/50">
                          <div className="flex h-6 w-6 shrink-0 items-center justify-center">
                            {isCompleted ? (
                              <CheckCircle className="h-4 w-4 text-emerald-500" />
                            ) : hasStarted ? (
                              <Play className="h-4 w-4 text-primary-500" />
                            ) : (
                              <Video className="h-4 w-4 text-text-subtle" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className={`truncate text-xs font-medium ${hasStarted ? "text-text" : "text-text-muted"}`}>
                              {v.videoTitle}
                            </p>
                            {hasStarted && (
                              <div className="mt-1 flex items-center gap-2">
                                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-2">
                                  <div
                                    className={`h-full rounded-full transition-all ${
                                      isCompleted ? "bg-emerald-500" : "bg-primary-400"
                                    }`}
                                    style={{ width: `${percent}%` }}
                                  />
                                </div>
                                <span className="num shrink-0 text-[10px] text-text-subtle">
                                  {percent}%
                                </span>
                              </div>
                            )}
                          </div>
                          {hasStarted && duration > 0 && (
                            <span className="num shrink-0 text-[10px] text-text-subtle">
                              {formatDuration(position)} / {formatDuration(duration)}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Promo views */}
      {promoViews.length > 0 && (
        <div className="rounded-2xl border border-border bg-surface p-5">
          <h2 className="text-lg font-bold text-text">
            <Eye className="inline h-4 w-4 text-fuchsia-600" /> צפיות בפרומו
          </h2>
          <div className="mt-3 overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead className="bg-surface-2/60 text-right">
                <tr>
                  <th className="px-3 py-2 text-xs font-bold text-text-muted">סרטון</th>
                  <th className="px-3 py-2 text-xs font-bold text-text-muted">תאריך</th>
                </tr>
              </thead>
              <tbody>
                {promoViews.map((pv) => (
                  <tr key={pv.id} className="border-t border-border hover:bg-surface-2/40">
                    <td className="px-3 py-2 text-text">
                      {pv.videoId ? (videoTitleMap.get(pv.videoId) ?? pv.videoId.slice(0, 8)) : "-"}
                    </td>
                    <td className="px-3 py-2 num text-text-muted">
                      {fmtDateTime(pv.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Recent activity */}
      {recentActivity.length > 0 && (
        <div className="rounded-2xl border border-border bg-surface p-5">
          <h2 className="text-lg font-bold text-text">פעילות אחרונה</h2>
          <div className="mt-3 space-y-2">
            {recentActivity.map((act) => (
              <div
                key={act.id}
                className="flex items-center gap-3 rounded-lg border border-border px-3 py-2"
              >
                <ActivityIcon eventType={act.eventType} />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-text">
                    <ActivityLabel eventType={act.eventType} metadata={act.metadata} />
                    {act.videoId && (
                      <span className="text-text-muted">
                        {" — "}
                        {videoTitleMap.get(act.videoId) ?? act.videoId.slice(0, 8)}
                      </span>
                    )}
                  </p>
                </div>
                <span className="num shrink-0 text-[10px] text-text-subtle">
                  {fmtDateTime(act.createdAt)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {videoProgress.length === 0 && promoViews.length === 0 && recentActivity.length === 0 && (
        <div className="rounded-2xl border border-border bg-surface p-8 text-center">
          <BarChart3 className="mx-auto h-8 w-8 text-text-subtle" />
          <p className="mt-2 text-sm text-text-muted">
            אין נתוני צפייה או פעילות למשתמש זה עדיין.
          </p>
        </div>
      )}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-3">
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-[10px] font-semibold text-text-subtle">{label}</span>
      </div>
      <p className="mt-1 text-lg font-extrabold text-text num">{value}</p>
    </div>
  );
}

function ActivityIcon({ eventType }: { eventType: string }) {
  switch (eventType) {
    case "promo_view":
      return <Eye className="h-3.5 w-3.5 text-fuchsia-500" />;
    case "promo_watch_duration":
      return <Clock className="h-3.5 w-3.5 text-fuchsia-400" />;
    case "video_start":
      return <Play className="h-3.5 w-3.5 text-primary-500" />;
    case "login":
      return <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />;
    default:
      return <Clock className="h-3.5 w-3.5 text-text-subtle" />;
  }
}

function ActivityLabel({ eventType, metadata }: { eventType: string; metadata?: string | null }) {
  switch (eventType) {
    case "promo_view":
      return "צפייה בפרומו";
    case "promo_watch_duration": {
      const secs = metadata ? JSON.parse(metadata)?.durationSeconds : null;
      if (secs) {
        const m = Math.floor(secs / 60);
        const s = secs % 60;
        return `צפייה בפרומו — ${m > 0 ? `${m} דק' ` : ""}${s} שנ'`;
      }
      return "משך צפייה בפרומו";
    }
    case "video_start":
      return "צפייה בסרטון";
    case "login":
      return "כניסה למערכת";
    default:
      return eventType;
  }
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

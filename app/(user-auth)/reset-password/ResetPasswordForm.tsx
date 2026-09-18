"use client";

import { useActionState } from "react";
import { Loader2, Lock, Save } from "lucide-react";
import { resetPasswordAction } from "./actions";

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, formAction, pending] = useActionState(
    resetPasswordAction,
    null,
  );
  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="token" value={token} />
      <label className="flex flex-col gap-1">
        <span className="text-xs font-semibold text-text-subtle">
          סיסמה חדשה
        </span>
        <div className="flex items-center gap-2 rounded-xl border border-border-strong bg-white px-3 py-2.5 focus-within:border-primary-500 dark:bg-surface-2">
          <Lock className="h-4 w-4 text-primary-500" />
          <input
            name="password"
            type="password"
            autoComplete="new-password"
            required
            autoFocus
            placeholder="לפחות 8 תווים, אות וספרה"
            className="w-full bg-transparent text-sm text-text placeholder:text-text-subtle focus:outline-none"
            disabled={pending}
          />
        </div>
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-xs font-semibold text-text-subtle">
          אימות סיסמה
        </span>
        <div className="flex items-center gap-2 rounded-xl border border-border-strong bg-white px-3 py-2.5 focus-within:border-primary-500 dark:bg-surface-2">
          <Lock className="h-4 w-4 text-primary-500" />
          <input
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
            placeholder="הזן שוב"
            className="w-full bg-transparent text-sm text-text placeholder:text-text-subtle focus:outline-none"
            disabled={pending}
          />
        </div>
      </label>
      {state?.error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:border-rose-800 dark:bg-rose-950/30 dark:text-rose-300">
          {state.error}
        </div>
      )}
      {state?.success && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300">
          {state.success}
        </div>
      )}
      <button
        type="submit"
        disabled={pending}
        className="mt-1 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-l from-primary-700 to-primary-500 px-4 text-sm font-semibold text-white shadow-md hover:brightness-105 disabled:opacity-60"
      >
        {pending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Save className="h-4 w-4" />
        )}
        {pending ? "שומר…" : "שמור סיסמה"}
      </button>
    </form>
  );
}

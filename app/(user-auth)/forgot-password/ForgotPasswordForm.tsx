"use client";

import { useActionState } from "react";
import { Loader2, Mail, Send } from "lucide-react";
import { forgotPasswordAction } from "./actions";

export function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState(
    forgotPasswordAction,
    null,
  );
  return (
    <form action={formAction} className="flex flex-col gap-3">
      <label className="flex flex-col gap-1">
        <span className="text-xs font-semibold text-text-subtle">
          דואר אלקטרוני
        </span>
        <div className="flex items-center gap-2 rounded-xl border border-border-strong bg-white px-3 py-2.5 focus-within:border-primary-500 dark:bg-surface-2">
          <Mail className="h-4 w-4 text-primary-500" />
          <input
            name="email"
            type="email"
            autoComplete="email"
            required
            autoFocus
            dir="ltr"
            className="w-full bg-transparent text-sm text-text placeholder:text-text-subtle focus:outline-none"
            placeholder="your@email.com"
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
          <Send className="h-4 w-4" />
        )}
        {pending ? "שולח…" : "שלח קישור"}
      </button>
    </form>
  );
}

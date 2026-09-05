"use client";

import { useActionState } from "react";
import { KeyRound, Loader2, LogIn } from "lucide-react";
import { loginAction } from "./actions";

export function LoginForm({ next }: { next: string }) {
  const [state, formAction, pending] = useActionState(loginAction, null);
  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="next" value={next} />
      <label className="flex flex-col gap-1">
        <span className="text-xs font-semibold text-text-subtle">סיסמה</span>
        <div className="flex items-center gap-2 rounded-xl border border-border-strong bg-white px-3 py-2.5 focus-within:border-primary-500">
          <KeyRound className="h-4 w-4 text-primary-500" />
          <input
            name="password"
            type="password"
            autoComplete="current-password"
            required
            autoFocus
            className="w-full bg-transparent text-sm text-text placeholder:text-text-subtle focus:outline-none"
            placeholder="הזן סיסמה"
            disabled={pending}
          />
        </div>
      </label>
      {state?.error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
          {state.error}
        </div>
      )}
      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-l from-primary-700 to-primary-500 px-4 text-sm font-semibold text-white shadow-md hover:brightness-105 disabled:opacity-60"
      >
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
        {pending ? "מזדהה…" : "כניסה"}
      </button>
    </form>
  );
}

"use client";

import { useActionState } from "react";
import { Loader2, UserPlus, Mail, Lock, User, Phone, Building } from "lucide-react";
import { registerAction, type RegisterState } from "./actions";

export function RegisterForm() {
  const [state, formAction, pending] = useActionState<RegisterState | null, FormData>(
    registerAction,
    null,
  );

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3">
        <Field
          name="firstName"
          label="שם פרטי"
          icon={<User className="h-4 w-4 text-primary-500" />}
          required
          disabled={pending}
          error={state?.fieldErrors?.firstName}
        />
        <Field
          name="lastName"
          label="שם משפחה"
          icon={<User className="h-4 w-4 text-primary-500" />}
          required
          disabled={pending}
          error={state?.fieldErrors?.lastName}
        />
      </div>
      <Field
        name="email"
        label="דואר אלקטרוני"
        type="email"
        icon={<Mail className="h-4 w-4 text-primary-500" />}
        required
        disabled={pending}
        autoComplete="email"
        error={state?.fieldErrors?.email}
      />
      <Field
        name="password"
        label="סיסמה"
        type="password"
        icon={<Lock className="h-4 w-4 text-primary-500" />}
        required
        disabled={pending}
        autoComplete="new-password"
        placeholder="לפחות 8 תווים, אות וספרה"
        error={state?.fieldErrors?.password}
      />
      <Field
        name="confirmPassword"
        label="אימות סיסמה"
        type="password"
        icon={<Lock className="h-4 w-4 text-primary-500" />}
        required
        disabled={pending}
        autoComplete="new-password"
        error={state?.fieldErrors?.confirmPassword}
      />
      <Field
        name="phone"
        label="טלפון (לא חובה)"
        type="tel"
        icon={<Phone className="h-4 w-4 text-primary-500" />}
        disabled={pending}
        dir="ltr"
        error={state?.fieldErrors?.phone}
      />
      <Field
        name="institution"
        label="מוסד לימודים (לא חובה)"
        icon={<Building className="h-4 w-4 text-primary-500" />}
        disabled={pending}
        error={state?.fieldErrors?.institution}
      />

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
          <UserPlus className="h-4 w-4" />
        )}
        {pending ? "נרשם…" : "הרשמה"}
      </button>
    </form>
  );
}

function Field({
  name,
  label,
  type = "text",
  icon,
  required,
  disabled,
  autoComplete,
  placeholder,
  dir,
  error,
}: {
  name: string;
  label: string;
  type?: string;
  icon: React.ReactNode;
  required?: boolean;
  disabled?: boolean;
  autoComplete?: string;
  placeholder?: string;
  dir?: string;
  error?: string;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs font-semibold text-text-subtle">{label}</span>
      <div className="flex items-center gap-2 rounded-xl border border-border-strong bg-white px-3 py-2.5 focus-within:border-primary-500 dark:bg-surface-2">
        {icon}
        <input
          name={name}
          type={type}
          required={required}
          disabled={disabled}
          autoComplete={autoComplete}
          placeholder={placeholder}
          dir={dir}
          className="w-full bg-transparent text-sm text-text placeholder:text-text-subtle focus:outline-none"
        />
      </div>
      {error && (
        <span className="text-xs text-rose-600 dark:text-rose-400">
          {error}
        </span>
      )}
    </label>
  );
}

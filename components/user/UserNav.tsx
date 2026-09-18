"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { User, LogOut } from "lucide-react";

interface UserInfo {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export function UserNav() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/user/me")
      .then((r) => r.json())
      .then((data) => {
        setUser(data.user ?? null);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  if (!loaded) return null;

  if (!user) {
    return (
      <Link
        href="/login"
        className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-white px-3 py-1.5 text-xs font-semibold text-text hover:border-primary-400 hover:text-primary-700 transition-colors"
      >
        <User className="h-3.5 w-3.5" />
        כניסה
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 rounded-lg border border-primary-200 bg-primary-50 px-3 py-1.5 text-xs font-semibold text-primary-700 hover:bg-primary-100 transition-colors"
      >
        <User className="h-3.5 w-3.5" />
        {user.firstName}
      </Link>
      <form action="/logout" method="post">
        <button
          type="submit"
          className="rounded-lg p-1.5 text-text-subtle hover:bg-rose-50 hover:text-rose-700 transition-colors"
          aria-label="התנתק"
        >
          <LogOut className="h-3.5 w-3.5" />
        </button>
      </form>
    </div>
  );
}

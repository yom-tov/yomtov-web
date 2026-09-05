import Link from "next/link";
import { ArrowLeft, Search } from "lucide-react";

export default function NotFound() {
  return (
    <div className="container-page py-24 text-center">
      <div className="mx-auto max-w-md">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-primary-50 text-primary-700 dark:bg-primary-500/15 dark:text-primary-300">
          <Search className="h-7 w-7" />
        </div>
        <h1 className="mt-6 text-3xl font-extrabold text-text">
          העמוד לא נמצא
        </h1>
        <p className="mt-2 text-text-muted">
          הקישור שהובלת אליו לא קיים במאגר. אולי הוא הוסר או שיש טעות בכתובת.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700"
          >
            לדף הבית
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <Link
            href="/search"
            className="inline-flex items-center gap-1.5 rounded-xl border border-border px-4 py-2 text-sm font-semibold text-text hover:bg-surface-2"
          >
            <Search className="h-4 w-4" />
            חיפוש
          </Link>
        </div>
      </div>
    </div>
  );
}

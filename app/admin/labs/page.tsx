import Link from "next/link";
import { readLabs } from "@/lib/admin/content-io";
import { LabsListClient } from "./LabsListClient";

export const dynamic = "force-dynamic";

export default async function AdminLabsPage() {
  const { data } = await readLabs();
  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-text">מעבדות</h1>
          <p className="text-sm text-text-muted num">{data.length} סה״כ</p>
        </div>
        <Link
          href="/admin/labs/new"
          className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-l from-primary-700 to-primary-500 px-4 py-2 text-sm font-semibold text-white shadow-md hover:brightness-105"
        >
          + מעבדה חדשה
        </Link>
      </div>
      <LabsListClient items={data} />
    </>
  );
}

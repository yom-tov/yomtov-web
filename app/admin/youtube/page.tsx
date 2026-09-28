import { connection } from "next/server";
import { asc } from "drizzle-orm";
import { MonitorPlay } from "lucide-react";
import { db } from "@/lib/db";
import { youtubeVideos } from "@/lib/db/schema";
import { COLLECTIONS } from "@/lib/site-content/youtube";
import { PageHeader } from "@/components/admin/ui/primitives";
import { YoutubeManager } from "@/components/admin/youtube/YoutubeManager";

export const dynamic = "force-dynamic";

export default async function YoutubeAdminPage({ searchParams }: { searchParams: Promise<{ c?: string }> }) {
  await connection();
  const { c } = await searchParams;
  const rows = await db
    .select({
      id: youtubeVideos.id,
      collection: youtubeVideos.collection,
      youtubeId: youtubeVideos.youtubeId,
      title: youtubeVideos.title,
      description: youtubeVideos.description,
      isShort: youtubeVideos.isShort,
      hidden: youtubeVideos.hidden,
    })
    .from(youtubeVideos)
    .orderBy(asc(youtubeVideos.displayOrder), asc(youtubeVideos.createdAt));

  const initial = COLLECTIONS.some((x) => x.id === c) ? c! : COLLECTIONS[0].id;

  return (
    <div className="max-w-5xl">
      <PageHeader
        icon={<MonitorPlay className="h-5 w-5" />}
        title="סרטוני YouTube ו-Shorts"
        description="הסרטונים החינמיים שמוטמעים באתר. מוסיפים בהדבקת קישור, גוררים כדי לסדר, ולוחצים על העין כדי להסתיר. כל שינוי מופיע באתר מיד. סרטוני המעבדה נערכים בעמוד &quot;מעבדות&quot;."
      />
      <YoutubeManager collections={COLLECTIONS} rows={rows} initialCollection={initial} />
    </div>
  );
}

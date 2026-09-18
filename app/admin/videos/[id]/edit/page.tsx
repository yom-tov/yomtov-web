import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { videos } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { VideoForm } from "@/components/admin/VideoForm";

export const dynamic = "force-dynamic";

export default async function EditVideoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [video] = await db
    .select()
    .from(videos)
    .where(eq(videos.id, id))
    .limit(1);

  if (!video) notFound();

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-extrabold text-text">עריכת סרטון</h1>
      <p className="mt-1 text-sm text-text-muted num">{video.title}</p>
      <div className="mt-6">
        <VideoForm mode="edit" initial={video} />
      </div>
    </div>
  );
}

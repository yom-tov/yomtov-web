import { VideoForm } from "@/components/admin/VideoForm";

export default function NewVideoPage() {
  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-extrabold text-text">סרטון חדש</h1>
      <p className="mt-1 text-sm text-text-muted">
        הזן את פרטי הסרטון מ-Mux. ודא שה-Asset ID וה-Playback ID נכונים.
      </p>
      <div className="mt-6">
        <VideoForm mode="create" />
      </div>
    </div>
  );
}

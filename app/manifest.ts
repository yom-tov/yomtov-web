import type { MetadataRoute } from "next";

// Next.js's manifest file convention — auto-served at /manifest.webmanifest
// and linked from <head> automatically, no extra wiring needed. This is
// what makes "הוסף למסך הבית" (Add to Home Screen) on Android/Chrome install
// a real app icon + splash instead of a bare browser shortcut.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "אבי יומטוביאן - פשוט להבין!",
    short_name: "אבי יומטוביאן",
    description:
      "מאגר מקצועי של מבחני מה\"ט ומשרד החינוך, מטלות, מעבדות ומחשבונים לסטודנטים ללימודי חשמל ואלקטרוניקה.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    dir: "rtl",
    lang: "he",
    background_color: "#F7F8FA",
    theme_color: "#1E3AA8",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      {
        src: "/icons/maskable-icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}

import type { Metadata, Viewport } from "next";
import { Heebo } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ThemeScript } from "@/components/layout/ThemeScript";
import { AccessibilityScript } from "@/components/layout/AccessibilityScript";
import { AccessibilityWidget } from "@/components/layout/AccessibilityWidget";

const heebo = Heebo({
  variable: "--font-heebo",
  subsets: ["hebrew", "latin"],
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://yomtov-web.vercel.app"),
  title: {
    default: "אבי יומטוביאן - פשוט להבין! מבחנים, מטלות ומעבדות לחשמל ואלקטרוניקה",
    template: "%s | אבי יומטוביאן",
  },
  description:
    "מאגר מקצועי של מבחני מה\"ט ומשרד החינוך, מטלות, מעבדות ומחשבונים לסטודנטים ללימודי חשמל, אלקטרוניקה תקבילית ואלקטרוניקה ספרתית. אבי יומטוביאן - פשוט להבין!",
  applicationName: "אבי יומטוביאן",
  keywords: [
    "אבי יומטוביאן",
    "מבחני מה\"ט",
    "מבחני משרד החינוך",
    "חשמל",
    "אלקטרוניקה תקבילית",
    "אלקטרוניקה ספרתית",
    "מעבדות",
    "פתרונות מבחנים",
    "טכנאי הנדסאי",
  ],
  openGraph: {
    type: "website",
    locale: "he_IL",
    title: "אבי יומטוביאן - פשוט להבין!",
    description:
      "מאגר מקצועי של מבחני מה\"ט ומשרד החינוך, מטלות, מעבדות ומחשבונים לסטודנטים ללימודי חשמל ואלקטרוניקה.",
    siteName: "אבי יומטוביאן",
  },
  robots: { index: true, follow: true },
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "אבי יומטוביאן",
  },
};

// Separate from `metadata` since Next.js 14+ — themeColor/colorScheme moved
// out of the Metadata object into their own export.
export const viewport: Viewport = {
  themeColor: "#1E3AA8",
  colorScheme: "light",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="he"
      dir="rtl"
      className={`${heebo.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <ThemeScript />
        <AccessibilityScript />
      </head>
      <body className="min-h-full flex flex-col bg-bg text-text">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:right-4 focus:z-50 focus:rounded-lg focus:bg-primary-600 focus:px-4 focus:py-2 focus:text-white"
        >
          דלג לתוכן הראשי
        </a>
        <Header />
        <main id="main" className="flex-1">
          {children}
        </main>
        <Footer />
        <AccessibilityWidget />
        <Analytics />
      </body>
    </html>
  );
}

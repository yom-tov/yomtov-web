import type { Metadata } from "next";
import { Heebo } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

const heebo = Heebo({
  variable: "--font-heebo",
  subsets: ["hebrew", "latin"],
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://yomtov-web.vercel.app"),
  title: {
    default: "יומטוב — מבחנים, מטלות ומעבדות לחשמל ואלקטרוניקה",
    template: "%s | יומטוב",
  },
  description:
    "מאגר מקצועי של מבחני מה\"ט ומשרד החינוך, מטלות, מעבדות ומחשבונים לסטודנטים ללימודי חשמל, אלקטרוניקה תקבילית ואלקטרוניקה ספרתית.",
  applicationName: "יומטוב",
  keywords: [
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
    title: "יומטוב — מבחנים, מטלות ומעבדות לחשמל ואלקטרוניקה",
    description:
      "מאגר מקצועי של מבחני מה\"ט ומשרד החינוך, מטלות, מעבדות ומחשבונים לסטודנטים ללימודי חשמל ואלקטרוניקה.",
    siteName: "יומטוב",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="he"
      dir="rtl"
      className={`${heebo.variable} h-full antialiased`}
    >
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
      </body>
    </html>
  );
}

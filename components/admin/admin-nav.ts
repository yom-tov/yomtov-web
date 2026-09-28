import {
  LayoutDashboard,
  Activity,
  Network,
  FileText,
  NotebookPen,
  Sigma,
  Beaker,
  Palette,
  Package,
  Video,
  MonitorPlay,
  PenLine,
  Contact,
  Users,
  Settings,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  exact?: boolean;
  /** Show the open-alerts counter next to this item. */
  alerts?: boolean;
}

export interface NavGroup {
  title: string;
  items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    title: "סקירה",
    items: [
      { href: "/admin", label: "לוח בקרה", icon: LayoutDashboard, exact: true },
      { href: "/admin/health", label: "מצב המערכת", icon: Activity, alerts: true },
      { href: "/admin/architecture", label: "ארכיטקטורה", icon: Network },
    ],
  },
  {
    title: "תוכן לימודי",
    items: [
      { href: "/admin/exams", label: "מבחנים", icon: FileText },
      { href: "/admin/assignments", label: "מטלות", icon: NotebookPen },
      { href: "/admin/formulas", label: "נוסחאונים", icon: Sigma },
      { href: "/admin/labs", label: "מעבדות", icon: Beaker },
      { href: "/admin/subjects", label: "קטגוריות", icon: Palette },
    ],
  },
  {
    title: "קורסים וסרטונים",
    items: [
      { href: "/admin/packages", label: "קורסים", icon: Package },
      { href: "/admin/videos", label: "סרטוני קורס", icon: Video },
      { href: "/admin/youtube", label: "YouTube ו-Shorts", icon: MonitorPlay },
    ],
  },
  {
    title: "האתר",
    items: [
      { href: "/admin/site", label: "טקסטים ודפים", icon: PenLine, exact: true },
      { href: "/admin/site/global", label: "פרטי קשר ותפריט", icon: Contact },
    ],
  },
  {
    title: "ניהול",
    items: [
      { href: "/admin/users", label: "משתמשים", icon: Users },
      { href: "/admin/settings", label: "הגדרות", icon: Settings },
    ],
  },
];

// Bottom bar on phones: the most used destinations. Everything else is one
// tap away in the "more" sheet.
export const MOBILE_PRIMARY: NavItem[] = [
  NAV_GROUPS[0].items[0],
  NAV_GROUPS[0].items[1],
  NAV_GROUPS[1].items[0],
  NAV_GROUPS[4].items[0],
];

export function isActive(pathname: string, item: NavItem): boolean {
  if (item.exact) return pathname === item.href;
  return pathname === item.href || pathname.startsWith(item.href + "/");
}

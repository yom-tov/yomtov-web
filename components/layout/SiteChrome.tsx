"use client";

import { usePathname } from "next/navigation";

// The public site's chrome (header, footer, accessibility widget, cookie
// banner). The admin panel has its own shell, so we drop the public chrome
// on /admin routes. Server components are passed in as props, so they are
// still rendered on the server.
export function SiteChrome({
  header,
  footer,
  extras,
  children,
}: {
  header: React.ReactNode;
  footer: React.ReactNode;
  extras: React.ReactNode;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAdmin = pathname === "/admin" || pathname.startsWith("/admin/");

  // The admin layout renders its own <main>, so avoid nesting landmarks.
  if (isAdmin) {
    return (
      <div id="main" className="flex-1">
        {children}
      </div>
    );
  }

  return (
    <>
      {header}
      <main id="main" className="flex-1">
        {children}
      </main>
      {footer}
      {extras}
    </>
  );
}

"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/components/nextbar";
import Sidebar from "@/components/sidebar";
import ScrollToTop from "@/components/scroll-to-top";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (pathname.startsWith("/giris")) {
    return <main className="min-h-full">{children}</main>;
  }

  if (pathname === "/" || pathname === "/kayit") {
    return (
      <>
        <ScrollToTop />
        <Navbar />
        <div className="flex-1 overflow-y-auto">{children}</div>
      </>
    );
  }

  return (
    <>
      <ScrollToTop />
      <Navbar />
      <div className="flex h-full overflow-hidden">
        <div className="h-full shrink-0 overflow-y-auto">
          <Sidebar />
        </div>
        <main className="h-full flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </>
  );
}

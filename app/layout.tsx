import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";
import { MobileNav } from "@/components/layout/MobileNav";
import { MobileHeader } from "@/components/layout/MobileHeader";
import { cn } from "@/lib/utils";

import { ScrollToTop } from "@/components/ui/ScrollToTop";

export const metadata: Metadata = {
  title: "We-Trend",
  description: "AI 기반 IT/Trend 공유 플랫폼",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased bg-background">
        <div className="flex min-h-screen">
          <Sidebar />
          <div className="flex-1 flex flex-col min-h-screen md:pl-[240px]">
            <MobileHeader />
            <main className="flex-1 w-full max-w-2xl mx-auto pt-14 md:pt-0 p-4 pb-20 md:pb-4">
              {children}
            </main>
            <MobileNav />
          </div>
        </div>
        <ScrollToTop />
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { Geist, Geist_Mono, Nanum_Myeongjo } from "next/font/google";
import "./globals.css";

import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

import { Header } from "@/components/header";
import { Toaster } from "@/components/ui/sonner";

/* 본문 산세리프 — Geist */
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/* 제목용 한글 세리프 — Nanum Myeongjo (우아한 고딕·명조 조합) */
const nanumMyeongjo = Nanum_Myeongjo({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["400", "700", "800"],
  /* 라틴 서브셋만 프리로드해 빌드 안정성 유지 */
  preload: true,
  display: "swap",
});

export const metadata: Metadata = {
  title: "도토리의 집들이",
  description: "도토리의 내집마련 집들이 초대 — 참여 신청과 방명록을 한 곳에서.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} ${nanumMyeongjo.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background">
        <Header />
        <div className="flex-1">{children}</div>
        <Toaster richColors position="top-center" />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}

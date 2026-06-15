import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SpeedInsights } from "@vercel/speed-insights/next";
import Sidebar from "@/components/layout/Sidebar";
import Providers from "./providers";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Academy Management",
  description: "Student records, fees, attendance and results",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-slate-100 text-slate-900`}>
        <div className="flex h-[100dvh] overflow-hidden">
          <Sidebar />
          <main className="flex-1 overflow-y-auto min-w-0 overscroll-y-contain [-webkit-overflow-scrolling:touch] pb-16 sm:pb-0">
            <Providers>{children}</Providers>
          </main>
          <SpeedInsights />
        </div>
      </body>
    </html>
  );
}
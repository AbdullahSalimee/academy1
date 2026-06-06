"use client";
import { useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";

export default function Providers({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const prevPathname = useRef<string | null>(null);

  // On every pathname change, wait for page to settle then refresh server data
  useEffect(() => {
    if (prevPathname.current !== null && prevPathname.current !== pathname) {
      // Small delay so the new page renders first, then we refresh stale data
      const t = setTimeout(() => router.refresh(), 100);
      return () => clearTimeout(t);
    }
    prevPathname.current = pathname;
  }, [pathname, router]);

  // Refresh when tab becomes visible again
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") router.refresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [router]);

  // Refresh when window regains focus
  useEffect(() => {
    window.addEventListener("focus", () => router.refresh());
    return () => window.removeEventListener("focus", () => router.refresh());
  }, [router]);

  return <>{children}</>;
}

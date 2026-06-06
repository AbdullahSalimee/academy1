"use client";
import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

export default function Providers({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Refresh data every time you switch back to this tab
    const handler = () => {
      if (document.visibilityState === "visible") {
        router.refresh();
      }
    };
    document.addEventListener("visibilitychange", handler);
    return () => document.removeEventListener("visibilitychange", handler);
  }, [router]);

  // Also refresh after every navigation (handles create/update flows)
  useEffect(() => {
    router.refresh();
  }, [pathname]);

  return <>{children}</>;
}

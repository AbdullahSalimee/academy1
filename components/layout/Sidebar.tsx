"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Wallet,
  ClipboardList,
  BarChart3,
  BookOpen,
  CalendarCheck,
  Menu,
  X,
} from "lucide-react";
import clsx from "clsx";
import { useState, useEffect } from "react";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/students", label: "Students", icon: Users },
  { href: "/attendance", label: "Attendance", icon: CalendarCheck },
  { href: "/fees", label: "Fees", icon: Wallet },
  { href: "/tests", label: "Tests", icon: ClipboardList },
  { href: "/results", label: "Results", icon: BarChart3 },
  { href: "/classes", label: "Classes", icon: BookOpen },
];

export default function Sidebar() {
  const path = usePathname();
  const [open, setOpen] = useState(false);

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setOpen(false);
  }, [path]);

  const NavLinks = () => (
    <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
      {nav.map(({ href, label, icon: Icon }) => {
        const active = path.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={clsx(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
              active
                ? "bg-blue-600 text-white"
                : "text-slate-400 hover:bg-slate-800 hover:text-white",
            )}
          >
            <Icon size={17} />
            {label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="sm:hidden fixed top-0 left-0 right-0 z-40 bg-slate-900 px-4 py-3 flex items-center justify-between border-b border-slate-700">
        <span className="font-display font-bold text-white text-base">
          Academy{" "}
          <span className="text-blue-400 font-normal text-sm">Management</span>
        </span>
        <button
          onClick={() => setOpen(!open)}
          className="text-slate-300 hover:text-white p-1"
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile overlay */}
      {open && (
        <div
          className="sm:hidden fixed inset-0 z-30 bg-black/50"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={clsx(
          "sm:hidden fixed top-0 left-0 z-40 h-full w-64 bg-slate-900 flex flex-col transition-transform duration-200",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="px-5 py-4 mt-14 border-b border-slate-700">
          <span className="text-xs text-slate-500 uppercase tracking-wider">
            Navigation
          </span>
        </div>
        <NavLinks />
        <div className="px-3 py-4 border-t border-slate-700">
          <div className="text-xs text-slate-500 px-3">Academy v1.0</div>
        </div>
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden sm:flex w-56 bg-slate-900 flex-col h-full shrink-0">
        <div className="px-5 py-5 border-b border-slate-700">
          <span className="font-display font-bold text-white text-lg leading-tight">
            Academy
            <br />
            <span className="text-blue-400 text-sm font-normal">
              Management
            </span>
          </span>
        </div>
        <NavLinks />
        <div className="px-3 py-4 border-t border-slate-700">
          <div className="text-xs text-slate-500 px-3">Academy v1.0</div>
        </div>
      </aside>
    </>
  );
}

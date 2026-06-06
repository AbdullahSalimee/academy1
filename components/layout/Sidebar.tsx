"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Wallet,
  ClipboardList,
  BarChart3,
  BookOpen,
  CalendarCheck,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";

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
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const handleLogout = async () => {
    await fetch("/api/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  const NavLinks = ({ onClick }: { onClick?: () => void }) => (
    <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
      {nav.map(({ href, label, icon: Icon }) => {
        const active = path.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            onClick={onClick}
            className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all ${
              active
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-400 hover:bg-slate-800 hover:text-white"
            }`}
          >
            <Icon size={18} />
            {label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* Mobile bottom tab bar */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900 border-t border-slate-700 flex items-center justify-around px-1 py-2">
        {nav.slice(0, 5).map(({ href, label, icon: Icon }) => {
          const active = path.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg min-w-0 ${
                active ? "text-blue-400" : "text-slate-500"
              }`}
            >
              <Icon size={20} />
              <span className="text-[10px] font-medium truncate">{label}</span>
            </Link>
          );
        })}
        <button
          onClick={() => setOpen(true)}
          className="flex flex-col items-center gap-0.5 px-2 py-1 text-slate-500"
        >
          <Menu size={20} />
          <span className="text-[10px] font-medium">More</span>
        </button>
      </div>

      {/* Mobile drawer (for extra nav items + logout) */}
      {open && (
        <>
          <div
            className="sm:hidden fixed inset-0 z-50 bg-black/60"
            onClick={() => setOpen(false)}
          />
          <div className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-slate-900 rounded-t-2xl p-4 space-y-2">
            <div className="flex items-center justify-between mb-3">
              <span className="text-white font-semibold">More Options</span>
              <button onClick={() => setOpen(false)} className="text-slate-400">
                <X size={20} />
              </button>
            </div>
            {nav.slice(5).map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-300 hover:bg-slate-800"
              >
                <Icon size={18} />
                <span className="text-sm font-medium">{label}</span>
              </Link>
            ))}
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10"
            >
              <LogOut size={18} />
              <span className="text-sm font-medium">Sign Out</span>
            </button>
          </div>
        </>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden sm:flex w-56 bg-slate-900 flex-col h-full shrink-0">
        <div className="px-5 py-5 border-b border-slate-700">
          <span className="font-bold text-white text-lg leading-tight">
            🏫 Academy
            <br />
            <span className="text-blue-400 text-xs font-normal">
              Management System
            </span>
          </span>
        </div>
        <NavLinks />
        <div className="px-3 py-3 border-t border-slate-700">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-red-400 text-sm font-medium transition-colors"
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}

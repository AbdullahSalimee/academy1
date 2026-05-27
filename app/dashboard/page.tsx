import { supabase } from "@/lib/supabase";
import {
  Users,
  Wallet,
  ClipboardList,
  BookOpen,
  CalendarCheck,
} from "lucide-react";
import { MONTHS } from "@/types";
import Link from "next/link";

export const dynamic = "force-dynamic";

async function getStats() {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const today = now.toISOString().split("T")[0];

  const [students, classes, tests, fees] = await Promise.all([
    supabase
      .from("students")
      .select("id", { count: "exact", head: true })
      .eq("is_active", true),
    supabase.from("classes").select("id", { count: "exact", head: true }),
    supabase.from("tests").select("id", { count: "exact", head: true }),
    supabase
      .from("fees")
      .select("amount, paid")
      .eq("month", month)
      .eq("year", year),
  ]);

  const feeData = fees.data || [];
  const totalDue = feeData.reduce((s, f) => s + (f.paid ? 0 : f.amount), 0);
  const totalCollected = feeData.reduce(
    (s, f) => s + (f.paid ? f.amount : 0),
    0,
  );

  return {
    students: students.count || 0,
    classes: classes.count || 0,
    tests: tests.count || 0,
    totalDue,
    totalCollected,
    month: MONTHS[month - 1],
    year,
    today,
  };
}

export default async function DashboardPage() {
  const stats = await getStats();

  const cards = [
    {
      label: "Active Students",
      value: stats.students,
      icon: Users,
      color: "bg-blue-500",
      href: "/students",
    },
    {
      label: "Total Classes",
      value: stats.classes,
      icon: BookOpen,
      color: "bg-violet-500",
      href: "/classes",
    },
    {
      label: "Total Tests",
      value: stats.tests,
      icon: ClipboardList,
      color: "bg-amber-500",
      href: "/tests",
    },
    {
      label: `Collected (${stats.month})`,
      value: `Rs. ${stats.totalCollected.toLocaleString()}`,
      icon: Wallet,
      color: "bg-green-500",
      href: "/fees",
    },
    {
      label: `Due (${stats.month})`,
      value: `Rs. ${stats.totalDue.toLocaleString()}`,
      icon: Wallet,
      color: "bg-red-500",
      href: "/fees",
    },
  ];

  return (
    <div className="pt-14 sm:pt-0">
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {stats.month} {stats.year}
          </p>
        </div>
        <Link href={`/attendance?date=${stats.today}`} className="btn-primary">
          <CalendarCheck size={16} /> Take Attendance
        </Link>
      </div>

      <div className="p-4 sm:p-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mb-6 sm:mb-8">
          {cards.map((c) => (
            <Link
              key={c.label}
              href={c.href}
              className="card p-4 sm:p-5 hover:shadow-md transition-shadow"
            >
              <div
                className={`${c.color} w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center mb-3`}
              >
                <c.icon size={18} className="text-white" />
              </div>
              <div className="text-xl sm:text-2xl font-bold font-display text-slate-900 truncate">
                {c.value}
              </div>
              <div className="text-xs text-slate-500 mt-1 leading-tight">
                {c.label}
              </div>
            </Link>
          ))}
        </div>

        <div className="card p-5 sm:p-6">
          <h2 className="font-display font-semibold text-slate-800 mb-3">
            Quick Actions
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              {
                href: "/attendance",
                label: "📋 Take Attendance",
                color: "bg-blue-50 text-blue-700 border-blue-200",
              },
              {
                href: "/students/new",
                label: "👤 Add Student",
                color: "bg-green-50 text-green-700 border-green-200",
              },
              {
                href: "/fees",
                label: "💰 Manage Fees",
                color: "bg-amber-50 text-amber-700 border-amber-200",
              },
              {
                href: "/tests/new",
                label: "📝 Create Test",
                color: "bg-violet-50 text-violet-700 border-violet-200",
              },
            ].map((a) => (
              <Link
                key={a.href}
                href={a.href}
                className={`${a.color} border rounded-lg px-3 py-3 text-sm font-medium text-center hover:opacity-80 transition-opacity`}
              >
                {a.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
  
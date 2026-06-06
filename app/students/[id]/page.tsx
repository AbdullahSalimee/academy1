import { supabase } from "@/lib/supabase";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Phone,
  MapPin,
  Calendar,
  Banknote,
  TrendingUp,
  Edit,
} from "lucide-react";
import { MONTHS } from "@/types";

export const dynamic = "force-dynamic";

export default async function StudentDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { data: student } = await supabase
    .from("students")
    .select("*, classes(name, section)")
    .eq("id", params.id)
    .single();
  if (!student) return notFound();

  // Fetch fees with their payments
  const { data: fees } = await supabase
    .from("fees")
    .select("*, fee_payments(*)")
    .eq("student_id", params.id)
    .order("year", { ascending: false })
    .order("month", { ascending: false });

  const { data: marks } = await supabase
    .from("marks")
    .select("*, tests(name, test_date, total_marks, subjects(name))")
    .eq("student_id", params.id)
    .order("created_at", { ascending: false });

  const { data: attData } = await supabase
    .from("attendance")
    .select("status")
    .eq("student_id", params.id);

  const feeList = fees || [];
  const markList = marks || [];
  const attList = attData || [];

  // Fee stats (accounting for partial payments)
  const totalPaid = feeList.reduce((s, f) => {
    const payments = (f.fee_payments || []) as any[];
    return (
      s + payments.reduce((ps: number, p: any) => ps + Number(p.amount_paid), 0)
    );
  }, 0);
  const totalDue = feeList.reduce(
    (s, f) => s + (!f.paid ? Number(f.amount) : 0),
    0,
  );

  // Attendance stats
  const present = attList.filter((a: any) => a.status === "present").length;
  const attPct =
    attList.length > 0 ? Math.round((present / attList.length) * 100) : null;

  // Test stats
  const validMarks = markList.filter(
    (m: any) => !m.is_absent && m.obtained_marks != null,
  );
  const avgPct =
    validMarks.length > 0
      ? Math.round(
          validMarks.reduce(
            (s: number, m: any) =>
              s + (Number(m.obtained_marks) / m.tests?.total_marks) * 100,
            0,
          ) / validMarks.length,
        )
      : null;

  const cls = student.classes as any;

  return (
    <div className="pb-20 sm:pb-0">
      <div className="page-header">
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/students" className="text-slate-400 shrink-0">
            <ArrowLeft size={20} />
          </Link>
          <div className="min-w-0">
            <h1 className="page-title truncate">{student.name}</h1>
            <p className="text-xs text-slate-500">
              {cls?.name} {cls?.section}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/students/${params.id}/analytics`}
            className="btn-secondary btn-sm"
          >
            <TrendingUp size={14} /> Analytics
          </Link>
          <Link
            href={`/students/${params.id}/edit`}
            className="btn-primary btn-sm"
          >
            <Edit size={14} /> Edit
          </Link>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-2">
          <div className="card p-3 text-center">
            <div
              className={`text-xl font-bold ${avgPct != null ? (avgPct >= 50 ? "text-emerald-600" : "text-red-500") : "text-slate-400"}`}
            >
              {avgPct != null ? `${avgPct}%` : "—"}
            </div>
            <div className="text-xs text-slate-500 mt-0.5">Avg Score</div>
          </div>
          <div className="card p-3 text-center">
            <div
              className={`text-xl font-bold ${attPct != null ? (attPct >= 75 ? "text-emerald-600" : "text-amber-500") : "text-slate-400"}`}
            >
              {attPct != null ? `${attPct}%` : "—"}
            </div>
            <div className="text-xs text-slate-500 mt-0.5">Attendance</div>
          </div>
          <div className="card p-3 text-center">
            <div
              className={`text-xl font-bold ${totalDue > 0 ? "text-red-500" : "text-emerald-600"}`}
            >
              {totalDue > 0 ? `Rs.${(totalDue / 1000).toFixed(1)}k` : "✓ Clear"}
            </div>
            <div className="text-xs text-slate-500 mt-0.5">Fee Due</div>
          </div>
        </div>

        {/* Profile info */}
        <div className="card p-4 space-y-3">
          <h2 className="font-semibold text-slate-800 text-sm">Profile</h2>
          {student.father_name && (
            <InfoRow
              icon={<UserIcon />}
              label="Father"
              value={student.father_name}
            />
          )}
          {student.phone && (
            <InfoRow
              icon={<Phone size={14} />}
              label="Phone"
              value={student.phone}
            />
          )}
          {student.address && (
            <InfoRow
              icon={<MapPin size={14} />}
              label="Address"
              value={student.address}
            />
          )}
          <InfoRow
            icon={<Calendar size={14} />}
            label="Admitted"
            value={new Date(student.admission_date).toLocaleDateString("en-PK")}
          />
          <InfoRow
            icon={<Banknote size={14} />}
            label="Monthly Fee"
            value={`Rs. ${Number(student.default_monthly_fee).toLocaleString()}`}
          />
        </div>

        {/* Fee record */}
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <h2 className="font-semibold text-slate-800 text-sm">Fee Record</h2>
            <div className="flex gap-2 text-xs">
              <span className="text-emerald-600 font-medium">
                Paid: Rs.{totalPaid.toLocaleString()}
              </span>
              {totalDue > 0 && (
                <span className="text-red-500 font-medium">
                  Due: Rs.{totalDue.toLocaleString()}
                </span>
              )}
            </div>
          </div>
          {feeList.length === 0 ? (
            <div className="p-6 text-center text-slate-400 text-sm">
              No fee records yet.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {feeList.slice(0, 12).map((f: any) => {
                const payments = f.fee_payments || [];
                const amtPaid = payments.reduce(
                  (s: number, p: any) => s + Number(p.amount_paid),
                  0,
                );
                const isPartial = !f.paid && amtPaid > 0;
                return (
                  <div
                    key={f.id}
                    className="flex items-center justify-between px-4 py-3"
                  >
                    <div>
                      <div className="text-sm font-medium text-slate-800">
                        {MONTHS[f.month - 1]} {f.year}
                      </div>
                      <div className="text-xs text-slate-400">
                        Rs. {Number(f.amount).toLocaleString()}
                        {isPartial && (
                          <span className="text-amber-600">
                            {" "}
                            · Rs.{amtPaid.toLocaleString()} paid
                          </span>
                        )}
                      </div>
                    </div>
                    {f.paid ? (
                      <span className="badge-green">Paid</span>
                    ) : isPartial ? (
                      <span className="badge-amber">Partial</span>
                    ) : (
                      <span className="badge-red">Unpaid</span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Test results */}
        <div className="card overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100">
            <h2 className="font-semibold text-slate-800 text-sm">
              Test Results
            </h2>
          </div>
          {markList.length === 0 ? (
            <div className="p-6 text-center text-slate-400 text-sm">
              No results yet.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {markList.slice(0, 10).map((m: any) => {
                const pct = m.is_absent
                  ? null
                  : Math.round((m.obtained_marks / m.tests?.total_marks) * 100);
                return (
                  <div
                    key={m.id}
                    className="flex items-center justify-between px-4 py-3"
                  >
                    <div>
                      <div className="text-sm font-medium text-slate-800">
                        {m.tests?.name}
                      </div>
                      <div className="text-xs text-slate-400">
                        {m.tests?.subjects?.name} ·{" "}
                        {new Date(m.tests?.test_date).toLocaleDateString(
                          "en-PK",
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      {m.is_absent ? (
                        <span className="badge-red">Absent</span>
                      ) : (
                        <>
                          <div className="text-sm font-bold text-slate-800">
                            {m.obtained_marks}/{m.tests?.total_marks}
                          </div>
                          <div
                            className={`text-xs font-semibold ${pct! >= 50 ? "text-emerald-600" : "text-red-500"}`}
                          >
                            {pct}%
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="text-slate-400 mt-0.5 shrink-0">{icon}</span>
      <div className="min-w-0">
        <div className="text-xs text-slate-400">{label}</div>
        <div className="text-sm text-slate-800 font-medium">{value}</div>
      </div>
    </div>
  );
}

function UserIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

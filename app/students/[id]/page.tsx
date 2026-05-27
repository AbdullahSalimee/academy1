import { supabase } from "@/lib/supabase";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  User,
  Phone,
  MapPin,
  Calendar,
  Banknote,
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

  const { data: fees } = await supabase
    .from("fees")
    .select("*")
    .eq("student_id", params.id)
    .order("year", { ascending: false })
    .order("month", { ascending: false });

  // Get marks with test info
  const { data: marks } = await supabase
    .from("marks")
    .select("*, tests(name, test_date, total_marks, subjects(name))")
    .eq("student_id", params.id)
    .order("created_at", { ascending: false });

  const feeList = fees || [];
  const markList = marks || [];

  const totalPaid = feeList.reduce(
    (s, f) => s + (f.paid ? Number(f.amount) : 0),
    0,
  );
  const totalDue = feeList.reduce(
    (s, f) => s + (!f.paid ? Number(f.amount) : 0),
    0,
  );

  const cls = student.classes as any;

  return (
    <div className="pt-14 sm:pt-0">
      <div className="page-header">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href="/students"
            className="text-slate-400 hover:text-slate-700 shrink-0"
          >
            <ArrowLeft size={18} />
          </Link>
          <div className="min-w-0">
            <h1 className="page-title truncate">{student.name}</h1>
            <p className="text-sm text-slate-500">
              {cls?.name} {cls?.section}
            </p>
          </div>
        </div>
        <Link
          href={`/students/${params.id}/edit`}
          className="btn-secondary btn-sm shrink-0"
        >
          Edit
        </Link>
      </div>

      <div className="p-4 sm:p-6 space-y-5 sm:space-y-6">
        {/* Profile card */}
        <div className="card p-4 sm:p-5 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <InfoItem
            icon={<User size={14} />}
            label="Father's Name"
            value={student.father_name || "—"}
          />
          <InfoItem
            icon={<Phone size={14} />}
            label="Phone"
            value={student.phone || "—"}
          />
          <InfoItem
            icon={<Calendar size={14} />}
            label="Admitted"
            value={new Date(student.admission_date).toLocaleDateString("en-PK")}
          />
          <InfoItem
            icon={<Banknote size={14} />}
            label="Monthly Fee"
            value={`Rs. ${Number(student.default_monthly_fee).toLocaleString()}`}
          />
          {student.address && (
            <div className="col-span-2 flex items-start gap-2">
              <MapPin size={14} className="text-slate-400 mt-0.5 shrink-0" />
              <div>
                <div className="text-xs text-slate-500">Address</div>
                <div className="text-sm font-medium">{student.address}</div>
              </div>
            </div>
          )}
        </div>

        {/* Fee record */}
        <section>
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <h2 className="font-display font-semibold text-slate-800">
              Fee Record
            </h2>
            <div className="flex gap-3 text-xs sm:text-sm flex-wrap">
              <span className="text-green-600 font-medium">
                Paid: Rs. {totalPaid.toLocaleString()}
              </span>
              <span className="text-red-600 font-medium">
                Due: Rs. {totalDue.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Mobile */}
          <div className="sm:hidden space-y-2">
            {feeList.length === 0 && (
              <div className="card p-6 text-center text-slate-400 text-sm">
                No fee records yet.
              </div>
            )}
            {feeList.map((f) => (
              <div
                key={f.id}
                className="card p-3 flex justify-between items-center"
              >
                <div>
                  <div className="text-sm font-medium">
                    {MONTHS[f.month - 1]} {f.year}
                  </div>
                  <div className="text-xs text-slate-500">
                    Rs. {Number(f.amount).toLocaleString()}
                  </div>
                </div>
                {f.paid ? (
                  <span className="badge-green">Paid</span>
                ) : (
                  <span className="badge-red">Unpaid</span>
                )}
              </div>
            ))}
          </div>

          {/* Desktop */}
          <div className="hidden sm:block card overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="table-th">Month</th>
                  <th className="table-th">Year</th>
                  <th className="table-th">Amount</th>
                  <th className="table-th">Status</th>
                  <th className="table-th">Paid Date</th>
                  <th className="table-th">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {feeList.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="table-td text-center text-slate-400 py-6"
                    >
                      No fee records yet.
                    </td>
                  </tr>
                )}
                {feeList.map((f) => (
                  <tr key={f.id} className="hover:bg-slate-50">
                    <td className="table-td">{MONTHS[f.month - 1]}</td>
                    <td className="table-td">{f.year}</td>
                    <td className="table-td font-medium">
                      Rs. {Number(f.amount).toLocaleString()}
                    </td>
                    <td className="table-td">
                      {f.paid ? (
                        <span className="badge-green">Paid</span>
                      ) : (
                        <span className="badge-red">Unpaid</span>
                      )}
                    </td>
                    <td className="table-td">
                      {f.paid_date
                        ? new Date(f.paid_date).toLocaleDateString("en-PK")
                        : "—"}
                    </td>
                    <td className="table-td text-slate-500">
                      {f.notes || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Test Results */}
        <section>
          <h2 className="font-display font-semibold text-slate-800 mb-3">
            Test Results
          </h2>

          {/* Mobile */}
          <div className="sm:hidden space-y-2">
            {markList.length === 0 && (
              <div className="card p-6 text-center text-slate-400 text-sm">
                No results yet.
              </div>
            )}
            {markList.map((m: any) => {
              const pct = m.is_absent
                ? null
                : Math.round((m.obtained_marks / m.tests?.total_marks) * 100);
              return (
                <div key={m.id} className="card p-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-sm font-medium">{m.tests?.name}</div>
                      <div className="text-xs text-slate-500">
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
                          <div className="text-sm font-bold">
                            {m.obtained_marks}/{m.tests?.total_marks}
                          </div>
                          <div
                            className={`text-xs font-medium ${pct! >= 50 ? "text-green-600" : "text-red-500"}`}
                          >
                            {pct}%
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop */}
          <div className="hidden sm:block card overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="table-th">Test</th>
                  <th className="table-th">Subject</th>
                  <th className="table-th">Date</th>
                  <th className="table-th">Marks</th>
                  <th className="table-th">Out of</th>
                  <th className="table-th">%</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {markList.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="table-td text-center text-slate-400 py-6"
                    >
                      No results yet.
                    </td>
                  </tr>
                )}
                {markList.map((m: any) => {
                  const pct = m.is_absent
                    ? null
                    : Math.round(
                        (m.obtained_marks / m.tests?.total_marks) * 100,
                      );
                  return (
                    <tr key={m.id} className="hover:bg-slate-50">
                      <td className="table-td font-medium">{m.tests?.name}</td>
                      <td className="table-td">{m.tests?.subjects?.name}</td>
                      <td className="table-td">
                        {new Date(m.tests?.test_date).toLocaleDateString(
                          "en-PK",
                        )}
                      </td>
                      <td className="table-td">
                        {m.is_absent ? (
                          <span className="badge-red">Absent</span>
                        ) : (
                          m.obtained_marks
                        )}
                      </td>
                      <td className="table-td">{m.tests?.total_marks}</td>
                      <td className="table-td">
                        {pct === null ? (
                          "—"
                        ) : (
                          <span
                            className={
                              pct >= 50
                                ? "text-green-600 font-medium"
                                : "text-red-600 font-medium"
                            }
                          >
                            {pct}%
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}

function InfoItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-slate-400 mt-0.5 shrink-0">{icon}</span>
      <div className="min-w-0">
        <div className="text-xs text-slate-500">{label}</div>
        <div className="text-sm font-medium truncate">{value}</div>
      </div>
    </div>
  );
}

import { supabase } from "@/lib/supabase";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

function TestDetailSkeleton() {
  return (
    <div className="p-4 sm:p-6 space-y-5">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl p-4 text-center bg-slate-50 animate-pulse">
            <div className="h-6 w-10 bg-slate-200 rounded mx-auto mb-2" />
            <div className="h-3 w-16 bg-slate-100 rounded mx-auto" />
          </div>
        ))}
      </div>
      <div className="card p-6 animate-pulse">
        <div className="h-4 w-32 bg-slate-200 rounded" />
      </div>
    </div>
  );
}

async function TestDetailContent({ id }: { id: string }) {
  const [{ data: test }, { data: marks }] = await Promise.all([
    supabase
      .from("tests")
      .select("*, classes(name, section), subjects(name)")
      .eq("id", id)
      .single(),
    supabase
      .from("marks")
      .select("*, students(name)")
      .eq("test_id", id)
      .order("obtained_marks", { ascending: false }),
  ]);

  if (!test) return notFound();

  const markList = marks || [];
  const present = markList.filter(
    (m) => !m.is_absent && m.obtained_marks != null,
  );
  const avg = present.length
    ? Math.round(
        present.reduce((s, m) => s + Number(m.obtained_marks), 0) /
          present.length,
      )
    : null;
  const highest = present.length
    ? Math.max(...present.map((m) => Number(m.obtained_marks)))
    : null;

  const cls = test.classes as any;
  const sub = test.subjects as any;

  return (
    <>
      <div className="page-header">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href="/tests"
            prefetch={false}
            className="text-slate-400 hover:text-slate-700 shrink-0"
          >
            <ArrowLeft size={18} />
          </Link>
          <div className="min-w-0">
            <h1 className="page-title truncate">{test.name}</h1>
            <p className="text-sm text-slate-500">
              {sub?.name} · {cls?.name} {cls?.section}
            </p>
          </div>
        </div>
        <Link
          href={`/tests/${id}/marks`}
          prefetch={false}
          className="btn-primary btn-sm shrink-0"
        >
          Enter Marks
        </Link>
      </div>

      <div className="p-4 sm:p-6 space-y-5">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            {
              label: "Total Students",
              value: markList.length,
              color: "bg-slate-50 text-slate-800",
            },
            {
              label: "Class Average",
              value: avg ?? "—",
              color: "bg-green-50 text-green-700",
            },
            {
              label: "Highest Marks",
              value: highest ?? "—",
              color: "bg-blue-50 text-blue-700",
            },
            {
              label: "Absent",
              value: markList.filter((m) => m.is_absent).length,
              color: "bg-red-50 text-red-700",
            },
          ].map((s) => (
            <div
              key={s.label}
              className={`${s.color} rounded-xl p-4 text-center`}
            >
              <div
                className={`text-2xl font-bold font-display ${s.color.includes("slate") ? "" : s.color.split(" ")[1]}`}
              >
                {s.value}
              </div>
              <div className="text-xs text-slate-500 mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="card overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="table-th w-8">Rank</th>
                <th className="table-th">Student</th>
                <th className="table-th">Marks</th>
                <th className="table-th hidden sm:table-cell">%</th>
                <th className="table-th">Grade</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {markList.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="table-td text-center text-slate-400 py-8"
                  >
                    No marks entered yet.
                  </td>
                </tr>
              )}
              {markList.map((m: any, idx) => {
                const pct =
                  m.is_absent || m.obtained_marks == null
                    ? null
                    : Math.round(
                        (Number(m.obtained_marks) / test.total_marks) * 100,
                      );
                const grade =
                  pct == null
                    ? "—"
                    : pct >= 90
                      ? "A+"
                      : pct >= 80
                        ? "A"
                        : pct >= 70
                          ? "B"
                          : pct >= 60
                            ? "C"
                            : pct >= 50
                              ? "D"
                              : "F";
                return (
                  <tr key={m.id} className="hover:bg-slate-50">
                    <td className="table-td text-center text-slate-400 text-xs">
                      {m.is_absent ? "—" : idx + 1}
                    </td>
                    <td className="table-td font-medium">{m.students?.name}</td>
                    <td className="table-td">
                      {m.is_absent ? (
                        <span className="badge-red">Absent</span>
                      ) : (
                        `${m.obtained_marks}/${test.total_marks}`
                      )}
                    </td>
                    <td className="table-td hidden sm:table-cell">
                      {pct == null ? "—" : `${pct}%`}
                    </td>
                    <td className="table-td font-bold font-display text-lg">
                      <span
                        className={
                          grade === "F"
                            ? "text-red-600"
                            : grade === "A+" || grade === "A"
                              ? "text-green-600"
                              : "text-blue-600"
                        }
                      >
                        {grade}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

export default function TestDetailPage({
  params,
}: {
  params: { id: string };
}) {
  return (
    <div className="pt-14 sm:pt-0">
      <Suspense fallback={<TestDetailSkeleton />}>
        <TestDetailContent id={params.id} />
      </Suspense>
    </div>
  );
}
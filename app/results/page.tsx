import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { BarChart3 } from "lucide-react";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

function SelectorSkeleton() {
  return (
    <div className="px-4 py-3 bg-white border-b border-slate-200 flex gap-2">
      <div className="input flex-1 h-9 bg-slate-100 animate-pulse rounded-lg" />
      <div className="btn-primary btn-sm opacity-50 w-16" />
    </div>
  );
}

function ResultsSkeleton() {
  return (
    <div className="p-4 space-y-4">
      <div className="card p-4 animate-pulse">
        <div className="h-4 w-40 bg-slate-200 rounded mb-2" />
        <div className="h-3 w-56 bg-slate-100 rounded mb-4" />
        <div className="grid grid-cols-4 gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl p-3 text-center bg-slate-50">
              <div className="h-5 w-8 bg-slate-200 rounded mx-auto mb-1" />
              <div className="h-3 w-12 bg-slate-100 rounded mx-auto" />
            </div>
          ))}
        </div>
      </div>
      <div className="card p-6 animate-pulse">
        <div className="h-4 w-24 bg-slate-200 rounded" />
      </div>
    </div>
  );
}

async function TestSelector({ testId }: { testId?: string }) {
  const { data: tests } = await supabase
    .from("tests")
    .select("*, subjects(name), classes(name, section)")
    .order("test_date", { ascending: false });

  return (
    <form className="px-4 py-3 bg-white border-b border-slate-200 flex gap-2">
      <select
        name="test_id"
        defaultValue={testId || ""}
        className="input flex-1"
      >
        <option value="">Select a test to view results...</option>
        {(tests || []).map((t: any) => (
          <option key={t.id} value={t.id}>
            {t.name} · {t.subjects?.name} · {t.classes?.name}
          </option>
        ))}
      </select>
      <button type="submit" className="btn-primary btn-sm">
        <BarChart3 size={14} /> Show
      </button>
    </form>
  );
}

async function ResultsContent({ testId }: { testId: string }) {
  const { data: t } = await supabase
    .from("tests")
    .select("*, subjects(name), classes(name, section)")
    .eq("id", testId)
    .single();
  const selectedTest: any = t;

  const { data } = await supabase
    .from("marks")
    .select("*, students(name, id)")
    .eq("test_id", testId)
    .order("obtained_marks", { ascending: false });

  const results = (data || []).map((m: any) => ({
    ...m,
    student_name: m.students?.name,
    student_id: m.students?.id,
  }));

  const present = results.filter(
    (r) => !r.is_absent && r.obtained_marks != null,
  );
  const avg = present.length
    ? Math.round(
        present.reduce((s, r) => s + Number(r.obtained_marks), 0) /
          present.length,
      )
    : null;
  const highest = present.length
    ? Math.max(...present.map((r) => Number(r.obtained_marks)))
    : null;
  const passing = present.filter(
    (r) => Number(r.obtained_marks) / (selectedTest?.total_marks || 100) >= 0.5,
  ).length;

  const getGrade = (pct: number) =>
    pct >= 90
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

  if (!selectedTest) return null;

  return (
    <div className="p-4 space-y-4">
      {/* Test info + stats */}
      <div className="card p-4">
        <h2 className="font-bold text-slate-900 mb-0.5">
          {selectedTest.name}
        </h2>
        <p className="text-xs text-slate-400 mb-4">
          {selectedTest.subjects?.name} · {selectedTest.classes?.name}{" "}
          {selectedTest.classes?.section} ·{" "}
          {new Date(selectedTest.test_date).toLocaleDateString("en-PK")} ·{" "}
          {selectedTest.total_marks} marks
        </p>
        <div className="grid grid-cols-4 gap-2">
          {[
            {
              label: "Total",
              value: results.length,
              color: "bg-slate-50 text-slate-800",
            },
            {
              label: "Average",
              value:
                avg != null
                  ? `${Math.round((avg / selectedTest.total_marks) * 100)}%`
                  : "—",
              color: "bg-emerald-50 text-emerald-700",
            },
            {
              label: "Highest",
              value: highest ?? "—",
              color: "bg-blue-50 text-blue-700",
            },
            {
              label: "Pass",
              value: passing,
              color: "bg-amber-50 text-amber-700",
            },
          ].map((s) => (
            <div
              key={s.label}
              className={`${s.color} rounded-xl p-3 text-center`}
            >
              <div className="text-xl font-bold">{s.value}</div>
              <div className="text-xs opacity-70 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Results list */}
      <div className="card overflow-hidden">
        {results.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            No marks entered.{" "}
            <Link
              href={`/tests/${testId}/marks`}
              prefetch={false}
              className="text-blue-600"
            >
              Enter marks →
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {results.map((r, idx) => {
              const pct =
                r.is_absent || r.obtained_marks == null
                  ? null
                  : Math.round(
                      (Number(r.obtained_marks) /
                        selectedTest.total_marks) *
                        100,
                    );
              const grade = pct == null ? "—" : getGrade(pct);
              return (
                <div
                  key={r.id}
                  className="flex items-center gap-3 px-4 py-3"
                >
                  <span className="text-xs text-slate-300 w-5 font-mono">
                    {r.is_absent ? "—" : idx + 1}
                  </span>
                  <Link
                    href={`/students/${r.student_id}`}
                    prefetch={false}
                    className="flex-1 text-sm font-medium text-slate-800 hover:text-blue-600 truncate"
                  >
                    {r.student_name}
                  </Link>
                  <div className="flex items-center gap-2 shrink-0">
                    {r.is_absent ? (
                      <span className="badge-red">Absent</span>
                    ) : (
                      <>
                        <span className="text-xs text-slate-400">
                          {r.obtained_marks}/{selectedTest.total_marks}
                        </span>
                        {/* Mini progress bar */}
                        <div className="w-12 h-1.5 bg-slate-100 rounded-full overflow-hidden hidden sm:block">
                          <div
                            className={`h-full rounded-full ${pct! >= 50 ? "bg-emerald-500" : "bg-red-400"}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span
                          className={`text-xs font-semibold ${pct! >= 50 ? "text-emerald-600" : "text-red-500"}`}
                        >
                          {pct}%
                        </span>
                      </>
                    )}
                    <span
                      className={`w-7 text-center font-bold text-sm ${
                        grade === "F"
                          ? "text-red-600"
                          : grade.startsWith("A")
                            ? "text-emerald-600"
                            : "text-blue-600"
                      }`}
                    >
                      {grade}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ResultsPage({
  searchParams,
}: {
  searchParams: { test_id?: string };
}) {
  const testId = searchParams.test_id;

  return (
    <div className="pb-20 sm:pb-0">
      <div className="page-header">
        <h1 className="page-title">Results</h1>
      </div>

      <Suspense fallback={<SelectorSkeleton />}>
        <TestSelector testId={testId} />
      </Suspense>

      <div>
        {!testId && (
          <div className="p-4">
            <div className="card p-10 text-center text-slate-400">
              <BarChart3 className="mx-auto mb-2 opacity-30" size={32} />
              <p>Select a test above to view results.</p>
            </div>
          </div>
        )}

        {testId && (
          <Suspense key={testId} fallback={<ResultsSkeleton />}>
            <ResultsContent testId={testId} />
          </Suspense>
        )}
      </div>
    </div>
  );
}
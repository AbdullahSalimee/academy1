import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

function ListSkeleton() {
  return (
    <div className="p-4 sm:p-6">
      <div className="sm:hidden space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="card p-4 animate-pulse space-y-2">
            <div className="h-4 w-2/3 bg-slate-200 rounded" />
            <div className="h-3 w-1/2 bg-slate-100 rounded" />
          </div>
        ))}
      </div>
      <div className="hidden sm:block card p-6 animate-pulse">
        <div className="h-4 w-32 bg-slate-200 rounded" />
      </div>
    </div>
  );
}

async function TestsList() {
  const { data: tests } = await supabase
    .from("tests")
    .select("*, classes(name, section), subjects(name)")
    .order("test_date", { ascending: false });

  return (
    <div className="p-4 sm:p-6">
      {/* Mobile */}
      <div className="sm:hidden space-y-3">
        {(tests || []).length === 0 && (
          <div className="card p-8 text-center text-slate-400">
            No tests yet. Create your first test.
          </div>
        )}
        {(tests || []).map((t: any) => (
          <div key={t.id} className="card p-4">
            <div className="flex justify-between items-start mb-2">
              <div className="font-semibold text-slate-900 text-sm">
                {t.name}
              </div>
              <span className="badge-blue">{t.subjects?.name}</span>
            </div>
            <div className="text-xs text-slate-500 mb-3">
              {t.classes?.name} {t.classes?.section} ·{" "}
              {new Date(t.test_date).toLocaleDateString("en-PK")} ·{" "}
              {t.total_marks} marks
            </div>
            <div className="flex gap-3">
              <Link
                href={`/tests/${t.id}/marks`}
                prefetch={false}
                className="text-blue-600 text-xs font-medium"
              >
                Enter Marks →
              </Link>
              <Link
                href={`/tests/${t.id}`}
                prefetch={false}
                className="text-slate-400 text-xs font-medium"
              >
                View
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop */}
      <div className="hidden sm:block card overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="table-th">Test Name</th>
              <th className="table-th">Subject</th>
              <th className="table-th">Class</th>
              <th className="table-th">Date</th>
              <th className="table-th">Total Marks</th>
              <th className="table-th">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {(tests || []).length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="table-td text-center text-slate-400 py-10"
                >
                  No tests yet.
                </td>
              </tr>
            )}
            {(tests || []).map((t: any) => (
              <tr key={t.id} className="hover:bg-slate-50">
                <td className="table-td font-medium text-slate-900">
                  {t.name}
                </td>
                <td className="table-td">
                  <span className="badge-blue">{t.subjects?.name}</span>
                </td>
                <td className="table-td">
                  {t.classes?.name} {t.classes?.section}
                </td>
                <td className="table-td">
                  {new Date(t.test_date).toLocaleDateString("en-PK")}
                </td>
                <td className="table-td">{t.total_marks}</td>
                <td className="table-td">
                  <Link
                    href={`/tests/${t.id}/marks`}
                    prefetch={false}
                    className="text-blue-600 hover:text-blue-800 text-xs font-medium mr-3"
                  >
                    Enter Marks →
                  </Link>
                  <Link
                    href={`/tests/${t.id}`}
                    prefetch={false}
                    className="text-slate-400 hover:text-slate-600 text-xs font-medium"
                  >
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function TestsPage() {
  return (
    <div className="pt-14 sm:pt-0">
      <div className="page-header">
        <h1 className="page-title">Tests</h1>
        <Link href="/tests/new" prefetch={false} className="btn-primary">
          <Plus size={16} />{" "}
          <span className="hidden sm:inline">Create Test</span>
          <span className="sm:hidden">New</span>
        </Link>
      </div>

      <Suspense fallback={<ListSkeleton />}>
        <TestsList />
      </Suspense>
    </div>
  );
}
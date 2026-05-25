import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { BarChart3 } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function ResultsPage({
  searchParams,
}: {
  searchParams: { test_id?: string; class_id?: string }
}) {
  const { data: classes } = await supabase.from('classes').select('*').order('name')
  const { data: tests } = await supabase
    .from('tests')
    .select('*, subjects(name), classes(name, section)')
    .order('test_date', { ascending: false })

  const testId = searchParams.test_id
  const classId = searchParams.class_id

  let results: any[] = []
  let selectedTest: any = null

  if (testId) {
    const { data: t } = await supabase
      .from('tests')
      .select('*, subjects(name), classes(name, section)')
      .eq('id', testId)
      .single()
    selectedTest = t

    const { data } = await supabase
      .from('test_results')
      .select('*')
      .eq('test_id', testId)
      .order('obtained_marks', { ascending: false })

    results = data || []
  }

  // Class-level average
  const present = results.filter((r) => !r.is_absent && r.obtained_marks != null)
  const avg = present.length
    ? Math.round(present.reduce((s, r) => s + r.obtained_marks, 0) / present.length)
    : null
  const highest = present.length ? Math.max(...present.map((r) => r.obtained_marks)) : null
  const passing = present.filter((r) => (r.obtained_marks / (selectedTest?.total_marks || 100)) >= 0.5).length

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Results</h1>
      </div>

      {/* Filters */}
      <div className="px-6 py-4 bg-white border-b border-slate-200">
        <form className="flex flex-wrap gap-3">
          <select name="class_id" defaultValue={classId || ''} className="input w-44">
            <option value="">All Classes</option>
            {classes?.map((c) => (
              <option key={c.id} value={c.id}>{c.name} {c.section}</option>
            ))}
          </select>
          <select name="test_id" defaultValue={testId || ''} className="input w-64">
            <option value="">Select a test...</option>
            {(tests || []).map((t: any) => (
              <option key={t.id} value={t.id}>
                {t.name} · {t.subjects?.name} · {t.classes?.name} {t.classes?.section}
              </option>
            ))}
          </select>
          <button type="submit" className="btn-primary">
            <BarChart3 size={15} /> Show Results
          </button>
        </form>
      </div>

      <div className="p-6">
        {!testId && (
          <div className="card p-10 text-center text-slate-400">
            Select a test above to view results.
          </div>
        )}

        {testId && selectedTest && (
          <div className="space-y-5">
            {/* Test summary */}
            <div className="card p-5">
              <h2 className="font-display font-bold text-slate-800 text-lg mb-1">{selectedTest.name}</h2>
              <p className="text-sm text-slate-500 mb-4">
                {selectedTest.subjects?.name} · {selectedTest.classes?.name} {selectedTest.classes?.section} ·{' '}
                {new Date(selectedTest.test_date).toLocaleDateString('en-PK')} ·{' '}
                Total Marks: {selectedTest.total_marks}
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-slate-50 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold font-display text-slate-800">{results.length}</div>
                  <div className="text-xs text-slate-500 mt-0.5">Total Students</div>
                </div>
                <div className="bg-green-50 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold font-display text-green-700">{avg ?? '—'}</div>
                  <div className="text-xs text-slate-500 mt-0.5">Class Average</div>
                </div>
                <div className="bg-blue-50 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold font-display text-blue-700">{highest ?? '—'}</div>
                  <div className="text-xs text-slate-500 mt-0.5">Highest Marks</div>
                </div>
                <div className="bg-amber-50 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold font-display text-amber-700">{passing}</div>
                  <div className="text-xs text-slate-500 mt-0.5">Passing (≥50%)</div>
                </div>
              </div>
            </div>

            {/* Results table */}
            <div className="card overflow-hidden">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="table-th w-10">Rank</th>
                    <th className="table-th">Student Name</th>
                    <th className="table-th">Marks</th>
                    <th className="table-th">Out of</th>
                    <th className="table-th">Percentage</th>
                    <th className="table-th">Grade</th>
                    <th className="table-th">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {results.length === 0 && (
                    <tr>
                      <td colSpan={7} className="table-td text-center text-slate-400 py-8">
                        No marks entered for this test yet.{' '}
                        <Link href={`/tests/${testId}/marks`} className="text-blue-600 hover:underline">
                          Enter marks →
                        </Link>
                      </td>
                    </tr>
                  )}
                  {results.map((r, idx) => {
                    const pct = r.is_absent || r.obtained_marks == null
                      ? null
                      : Math.round((r.obtained_marks / selectedTest.total_marks) * 100)
                    const grade = pct == null ? '—'
                      : pct >= 90 ? 'A+'
                      : pct >= 80 ? 'A'
                      : pct >= 70 ? 'B'
                      : pct >= 60 ? 'C'
                      : pct >= 50 ? 'D'
                      : 'F'
                    return (
                      <tr key={r.id} className="hover:bg-slate-50">
                        <td className="table-td text-center text-slate-400 text-xs">
                          {r.is_absent ? '—' : idx + 1}
                        </td>
                        <td className="table-td font-medium text-slate-900">
                          <Link href={`/students/${r.student_id}`} className="hover:text-blue-600">
                            {r.student_name}
                          </Link>
                        </td>
                        <td className="table-td font-semibold">
                          {r.is_absent ? <span className="badge-red">Absent</span> : r.obtained_marks}
                        </td>
                        <td className="table-td">{selectedTest.total_marks}</td>
                        <td className="table-td">
                          {pct == null ? '—' : (
                            <div className="flex items-center gap-2">
                              <div className="w-20 bg-slate-200 rounded-full h-1.5">
                                <div
                                  className={`h-1.5 rounded-full ${pct >= 50 ? 'bg-green-500' : 'bg-red-500'}`}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                              <span className={`text-sm font-medium ${pct >= 50 ? 'text-green-600' : 'text-red-500'}`}>
                                {pct}%
                              </span>
                            </div>
                          )}
                        </td>
                        <td className="table-td">
                          <span className={`font-bold font-display text-lg ${
                            grade === 'A+' || grade === 'A' ? 'text-green-600'
                            : grade === 'B' || grade === 'C' ? 'text-blue-600'
                            : grade === 'D' ? 'text-amber-600'
                            : grade === 'F' ? 'text-red-600'
                            : 'text-slate-400'
                          }`}>
                            {grade}
                          </span>
                        </td>
                        <td className="table-td">
                          {r.is_absent ? '—' : pct != null && pct >= 50
                            ? <span className="badge-green">Pass</span>
                            : <span className="badge-red">Fail</span>
                          }
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

import { supabase } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { MONTHS, MONTHS_SHORT } from '@/types'
import { Suspense } from 'react'

export const dynamic = 'force-dynamic'

function AnalyticsSkeleton() {
  return (
    <div className="p-4 space-y-4">
      <div className="grid grid-cols-3 gap-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="card p-3 text-center animate-pulse">
            <div className="h-6 w-10 bg-slate-200 rounded mx-auto mb-2" />
            <div className="h-3 w-14 bg-slate-100 rounded mx-auto" />
          </div>
        ))}
      </div>
      <div className="card p-4 animate-pulse space-y-2">
        <div className="h-4 w-32 bg-slate-200 rounded" />
        <div className="h-3 w-full bg-slate-100 rounded" />
        <div className="h-3 w-full bg-slate-100 rounded" />
        <div className="h-3 w-2/3 bg-slate-100 rounded" />
      </div>
      <div className="card p-6 animate-pulse">
        <div className="h-4 w-24 bg-slate-200 rounded" />
      </div>
    </div>
  )
}

async function AnalyticsContent({ id }: { id: string }) {
  const { data: student } = await supabase
    .from('students').select('*, classes(name, section)').eq('id', id).single()
  if (!student) return notFound()

  const [{ data: marks }, { data: fees }, { data: attData }] = await Promise.all([
    supabase
      .from('marks').select('*, tests(name, test_date, total_marks, subjects(name))')
      .eq('student_id', id).order('created_at', { ascending: true }),
    supabase
      .from('fees').select('*, fee_payments(*)').eq('student_id', id)
      .order('year').order('month'),
    supabase
      .from('attendance').select('status, date').eq('student_id', id)
      .order('date', { ascending: false }).limit(90),
  ])

  const markList = (marks || []) as any[]
  const feeList = (fees || []) as any[]
  const attList = (attData || []) as any[]

  // Test performance trend
  const testTrend = markList
    .filter(m => !m.is_absent && m.obtained_marks != null)
    .map(m => ({
      name: m.tests?.name,
      subject: m.tests?.subjects?.name,
      date: m.tests?.test_date,
      pct: Math.round((Number(m.obtained_marks) / m.tests?.total_marks) * 100),
      marks: Number(m.obtained_marks),
      total: m.tests?.total_marks,
    }))

  const avgPct = testTrend.length > 0
    ? Math.round(testTrend.reduce((s, t) => s + t.pct, 0) / testTrend.length)
    : null

  // Trend direction (compare first half vs second half)
  let trendDir: 'up' | 'down' | 'stable' | null = null
  if (testTrend.length >= 4) {
    const half = Math.floor(testTrend.length / 2)
    const firstHalf = testTrend.slice(0, half).reduce((s, t) => s + t.pct, 0) / half
    const secondHalf = testTrend.slice(-half).reduce((s, t) => s + t.pct, 0) / half
    const diff = secondHalf - firstHalf
    trendDir = diff > 5 ? 'up' : diff < -5 ? 'down' : 'stable'
  }

  // Attendance breakdown (last 90 days)
  const presentCount = attList.filter(a => a.status === 'present').length
  const absentCount = attList.filter(a => a.status === 'absent').length
  const lateCount = attList.filter(a => a.status === 'late').length
  const attPct = attList.length > 0 ? Math.round((presentCount / attList.length) * 100) : null

  // Fee payment history
  const feeStats = feeList.map(f => {
    const payments = (f.fee_payments || []) as any[]
    const amtPaid = payments.reduce((s: number, p: any) => s + Number(p.amount_paid), 0)
    return {
      label: `${MONTHS_SHORT[f.month - 1]} ${f.year}`,
      due: Number(f.amount),
      paid: amtPaid,
      status: f.paid ? 'paid' : amtPaid > 0 ? 'partial' : 'unpaid',
    }
  })

  const totalFeeDue = feeStats.reduce((s, f) => s + f.due, 0)
  const totalFeePaid = feeStats.reduce((s, f) => s + f.paid, 0)

  const cls = student.classes as any

  return (
    <>
      <div className="page-header">
        <div className="flex items-center gap-3 min-w-0">
          <Link href={`/students/${id}`} prefetch={false} className="text-slate-400 shrink-0"><ArrowLeft size={20} /></Link>
          <div className="min-w-0">
            <h1 className="page-title truncate">{student.name}</h1>
            <p className="text-xs text-slate-500">{cls?.name} {cls?.section} · Analytics</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">

        {/* Overview cards */}
        <div className="grid grid-cols-3 gap-2">
          <div className="card p-3 text-center">
            <div className={`text-xl font-bold ${avgPct != null ? (avgPct >= 50 ? 'text-emerald-600' : 'text-red-500') : 'text-slate-400'}`}>
              {avgPct != null ? `${avgPct}%` : '—'}
            </div>
            <div className="text-xs text-slate-500 mt-0.5">Avg Score</div>
          </div>
          <div className="card p-3 text-center">
            <div className={`text-xl font-bold ${attPct != null ? (attPct >= 75 ? 'text-emerald-600' : attPct >= 60 ? 'text-amber-500' : 'text-red-500') : 'text-slate-400'}`}>
              {attPct != null ? `${attPct}%` : '—'}
            </div>
            <div className="text-xs text-slate-500 mt-0.5">Attendance</div>
          </div>
          <div className="card p-3 text-center">
            <div className={`text-xl font-bold ${totalFeeDue > totalFeePaid ? 'text-red-500' : 'text-emerald-600'}`}>
              {totalFeeDue > 0 ? `${Math.round((totalFeePaid / totalFeeDue) * 100)}%` : '—'}
            </div>
            <div className="text-xs text-slate-500 mt-0.5">Fee Paid</div>
          </div>
        </div>

        {/* Performance trend */}
        <div className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-slate-800 text-sm">Test Performance</h2>
            {trendDir && (
              <span className={`badge-${trendDir === 'up' ? 'green' : trendDir === 'down' ? 'red' : 'slate'}`}>
                {trendDir === 'up' ? '📈 Improving' : trendDir === 'down' ? '📉 Declining' : '➡️ Stable'}
              </span>
            )}
          </div>
          {testTrend.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-4">No test data yet.</p>
          ) : (
            <div className="space-y-2">
              {testTrend.slice(-8).map((t, i) => (
                <div key={i}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-600 truncate max-w-[60%]">{t.name}</span>
                    <span className={`font-semibold ${t.pct >= 50 ? 'text-emerald-600' : 'text-red-500'}`}>{t.pct}%</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${t.pct >= 80 ? 'bg-emerald-500' : t.pct >= 50 ? 'bg-blue-500' : 'bg-red-400'}`}
                      style={{ width: `${t.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
          {testTrend.length > 0 && (
            <div className="mt-3 pt-3 border-t border-slate-100 flex gap-4 text-xs text-slate-500">
              <span>Tests: <strong className="text-slate-700">{markList.length}</strong></span>
              <span>Absent: <strong className="text-slate-700">{markList.filter(m => m.is_absent).length}</strong></span>
              {avgPct != null && <span>Best: <strong className="text-slate-700">{Math.max(...testTrend.map(t => t.pct))}%</strong></span>}
            </div>
          )}
        </div>

        {/* Attendance breakdown */}
        <div className="card p-4">
          <h2 className="font-semibold text-slate-800 text-sm mb-3">Attendance (Last 90 days)</h2>
          {attList.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-4">No attendance data.</p>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-2 mb-3">
                <div className="bg-emerald-50 rounded-xl p-3 text-center">
                  <div className="text-xl font-bold text-emerald-700">{presentCount}</div>
                  <div className="text-xs text-emerald-600">Present</div>
                </div>
                <div className="bg-red-50 rounded-xl p-3 text-center">
                  <div className="text-xl font-bold text-red-600">{absentCount}</div>
                  <div className="text-xs text-red-500">Absent</div>
                </div>
                <div className="bg-amber-50 rounded-xl p-3 text-center">
                  <div className="text-xl font-bold text-amber-600">{lateCount}</div>
                  <div className="text-xs text-amber-500">Late</div>
                </div>
              </div>
              {/* Visual bar */}
              {attList.length > 0 && (
                <div>
                  <div className="flex h-3 rounded-full overflow-hidden">
                    <div className="bg-emerald-500" style={{ width: `${(presentCount / attList.length) * 100}%` }} />
                    <div className="bg-amber-400" style={{ width: `${(lateCount / attList.length) * 100}%` }} />
                    <div className="bg-red-400" style={{ width: `${(absentCount / attList.length) * 100}%` }} />
                  </div>
                  <div className="flex gap-3 mt-2 text-xs text-slate-500">
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> Present</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block" /> Late</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400 inline-block" /> Absent</span>
                  </div>
                </div>
              )}
              {attPct != null && attPct < 75 && (
                <div className="mt-3 p-2 bg-red-50 border border-red-100 rounded-lg text-xs text-red-600">
                  ⚠️ Attendance is below 75%. Action may be required.
                </div>
              )}
            </>
          )}
        </div>

        {/* Fee history */}
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <h2 className="font-semibold text-slate-800 text-sm">Fee History</h2>
            {totalFeeDue > 0 && (
              <span className="text-xs text-slate-500">
                Rs.{totalFeePaid.toLocaleString()} / Rs.{totalFeeDue.toLocaleString()}
              </span>
            )}
          </div>
          {feeStats.length === 0 ? (
            <div className="p-6 text-center text-slate-400 text-sm">No fee records yet.</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {feeStats.slice(-12).reverse().map((f, i) => (
                <div key={i} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <div className="text-sm font-medium text-slate-800">{f.label}</div>
                    <div className="text-xs text-slate-400">
                      Due: Rs.{f.due.toLocaleString()}
                      {f.paid > 0 && f.status !== 'paid' && ` · Paid: Rs.${f.paid.toLocaleString()}`}
                    </div>
                  </div>
                  <span className={
                    f.status === 'paid' ? 'badge-green' :
                    f.status === 'partial' ? 'badge-amber' : 'badge-red'
                  }>
                    {f.status === 'paid' ? 'Paid' : f.status === 'partial' ? 'Partial' : 'Unpaid'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export default function StudentAnalyticsPage({ params }: { params: { id: string } }) {
  return (
    <div className="pb-20 sm:pb-0">
      <Suspense fallback={<AnalyticsSkeleton />}>
        <AnalyticsContent id={params.id} />
      </Suspense>
    </div>
  )
}
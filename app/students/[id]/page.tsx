import { supabase } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, User, Phone, MapPin, Calendar, Banknote } from 'lucide-react'
import { MONTHS } from '@/types'

export const dynamic = 'force-dynamic'

export default async function StudentDetailPage({ params }: { params: { id: string } }) {
  const { data: student } = await supabase
    .from('student_details')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!student) return notFound()

  // Get fee records
  const { data: fees } = await supabase
    .from('fees')
    .select('*')
    .eq('student_id', params.id)
    .order('year', { ascending: false })
    .order('month', { ascending: false })

  // Get test results
  const { data: results } = await supabase
    .from('test_results')
    .select('*')
    .eq('student_id', params.id)
    .order('test_date', { ascending: false })

  const feeList = fees || []
  const resultList = results || []

  const totalPaid = feeList.reduce((s, f) => s + (f.paid ? f.amount : 0), 0)
  const totalDue = feeList.reduce((s, f) => s + (!f.paid ? f.amount : 0), 0)

  return (
    <div>
      <div className="page-header">
        <div className="flex items-center gap-3">
          <Link href="/students" className="text-slate-400 hover:text-slate-700">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="page-title">{student.name}</h1>
            <p className="text-sm text-slate-500">
              {student.class_name} {student.class_section}
            </p>
          </div>
        </div>
        <Link href={`/students/${params.id}/edit`} className="btn-secondary">Edit</Link>
      </div>

      <div className="p-6 space-y-6">
        {/* Profile card */}
        <div className="card p-5 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex items-start gap-2">
            <User size={15} className="text-slate-400 mt-0.5" />
            <div>
              <div className="text-xs text-slate-500">Father's Name</div>
              <div className="text-sm font-medium">{student.father_name || '—'}</div>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Phone size={15} className="text-slate-400 mt-0.5" />
            <div>
              <div className="text-xs text-slate-500">Phone</div>
              <div className="text-sm font-medium">{student.phone || '—'}</div>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Calendar size={15} className="text-slate-400 mt-0.5" />
            <div>
              <div className="text-xs text-slate-500">Admitted</div>
              <div className="text-sm font-medium">
                {new Date(student.admission_date).toLocaleDateString('en-PK')}
              </div>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Banknote size={15} className="text-slate-400 mt-0.5" />
            <div>
              <div className="text-xs text-slate-500">Default Monthly Fee</div>
              <div className="text-sm font-medium">Rs. {Number(student.default_monthly_fee).toLocaleString()}</div>
            </div>
          </div>
          {student.address && (
            <div className="flex items-start gap-2 col-span-2">
              <MapPin size={15} className="text-slate-400 mt-0.5" />
              <div>
                <div className="text-xs text-slate-500">Address</div>
                <div className="text-sm font-medium">{student.address}</div>
              </div>
            </div>
          )}
        </div>

        {/* Fee summary */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display font-semibold text-slate-800">Fee Record</h2>
            <div className="flex gap-4 text-sm">
              <span className="text-green-600 font-medium">Paid: Rs. {totalPaid.toLocaleString()}</span>
              <span className="text-red-600 font-medium">Due: Rs. {totalDue.toLocaleString()}</span>
            </div>
          </div>
          <div className="card overflow-hidden">
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
                    <td colSpan={6} className="table-td text-center text-slate-400 py-6">No fee records yet.</td>
                  </tr>
                )}
                {feeList.map((f) => (
                  <tr key={f.id} className="hover:bg-slate-50">
                    <td className="table-td">{MONTHS[f.month - 1]}</td>
                    <td className="table-td">{f.year}</td>
                    <td className="table-td font-medium">Rs. {Number(f.amount).toLocaleString()}</td>
                    <td className="table-td">
                      {f.paid ? <span className="badge-green">Paid</span> : <span className="badge-red">Unpaid</span>}
                    </td>
                    <td className="table-td">
                      {f.paid_date ? new Date(f.paid_date).toLocaleDateString('en-PK') : '—'}
                    </td>
                    <td className="table-td text-slate-500">{f.notes || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Test Results */}
        <div>
          <h2 className="font-display font-semibold text-slate-800 mb-3">Test Results</h2>
          <div className="card overflow-hidden">
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
                {resultList.length === 0 && (
                  <tr>
                    <td colSpan={6} className="table-td text-center text-slate-400 py-6">No results yet.</td>
                  </tr>
                )}
                {resultList.map((r) => {
                  const pct = r.is_absent ? null : Math.round((r.obtained_marks / r.total_marks) * 100)
                  return (
                    <tr key={r.id} className="hover:bg-slate-50">
                      <td className="table-td font-medium">{r.test_name}</td>
                      <td className="table-td">{r.subject_name}</td>
                      <td className="table-td">{new Date(r.test_date).toLocaleDateString('en-PK')}</td>
                      <td className="table-td">
                        {r.is_absent ? <span className="badge-red">Absent</span> : r.obtained_marks}
                      </td>
                      <td className="table-td">{r.total_marks}</td>
                      <td className="table-td">
                        {pct === null ? '—' : (
                          <span className={pct >= 50 ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                            {pct}%
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

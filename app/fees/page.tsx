'use client'
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { Class, Fee, MONTHS } from '@/types'
import { CheckCircle, RefreshCw } from 'lucide-react'

interface FeeWithStudent extends Fee {
  students: { name: string; class_id: string }
}

export default function FeesPage() {
  const now = new Date()
  const [classes, setClasses] = useState<Class[]>([])
  const [fees, setFees] = useState<FeeWithStudent[]>([])
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [filters, setFilters] = useState({
    class_id: '',
    month: String(now.getMonth() + 1),
    year: String(now.getFullYear()),
    paid: '',
  })

  useEffect(() => {
    supabase.from('classes').select('*').order('name').then(({ data }) => setClasses(data || []))
  }, [])

  const loadFees = useCallback(async () => {
    setLoading(true)
    let query = supabase
      .from('fees')
      .select('*, students(name, class_id)')
      .eq('month', parseInt(filters.month))
      .eq('year', parseInt(filters.year))
      .order('paid')

    if (filters.paid !== '') query = query.eq('paid', filters.paid === 'true')

    const { data } = await query
    let list = (data || []) as FeeWithStudent[]

    if (filters.class_id) {
      list = list.filter((f) => f.students?.class_id === filters.class_id)
    }

    setFees(list)
    setLoading(false)
  }, [filters])

  useEffect(() => { loadFees() }, [loadFees])

  const markPaid = async (fee: FeeWithStudent) => {
    await supabase.from('fees').update({
      paid: true,
      paid_date: new Date().toISOString().split('T')[0],
    }).eq('id', fee.id)
    loadFees()
  }

  const markUnpaid = async (fee: FeeWithStudent) => {
    await supabase.from('fees').update({ paid: false, paid_date: null }).eq('id', fee.id)
    loadFees()
  }

  const generateFees = async () => {
    setGenerating(true)
    const { data } = await supabase.rpc('generate_monthly_fees', {
      p_year: parseInt(filters.year),
      p_month: parseInt(filters.month),
    })
    alert(`Generated ${data} new fee records.`)
    setGenerating(false)
    loadFees()
  }

  const totalPaid = fees.reduce((s, f) => s + (f.paid ? f.amount : 0), 0)
  const totalDue = fees.reduce((s, f) => s + (!f.paid ? f.amount : 0), 0)

  const set = (k: string, v: string) => setFilters((f) => ({ ...f, [k]: v }))

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Fee Management</h1>
        <button onClick={generateFees} disabled={generating} className="btn-primary">
          <RefreshCw size={15} className={generating ? 'animate-spin' : ''} />
          {generating ? 'Generating...' : 'Generate Monthly Fees'}
        </button>
      </div>

      {/* Filters */}
      <div className="px-6 py-4 bg-white border-b border-slate-200 flex flex-wrap gap-3">
        <select className="input w-40" value={filters.month} onChange={(e) => set('month', e.target.value)}>
          {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
        </select>
        <select className="input w-28" value={filters.year} onChange={(e) => set('year', e.target.value)}>
          {[2023, 2024, 2025, 2026].map((y) => <option key={y}>{y}</option>)}
        </select>
        <select className="input w-44" value={filters.class_id} onChange={(e) => set('class_id', e.target.value)}>
          <option value="">All Classes</option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>{c.name} {c.section}</option>
          ))}
        </select>
        <select className="input w-32" value={filters.paid} onChange={(e) => set('paid', e.target.value)}>
          <option value="">All Status</option>
          <option value="false">Unpaid</option>
          <option value="true">Paid</option>
        </select>
      </div>

      {/* Summary */}
      <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex gap-6 text-sm">
        <span className="text-slate-600">Total records: <strong>{fees.length}</strong></span>
        <span className="text-green-600">Collected: <strong>Rs. {totalPaid.toLocaleString()}</strong></span>
        <span className="text-red-600">Due: <strong>Rs. {totalDue.toLocaleString()}</strong></span>
      </div>

      {/* Table */}
      <div className="p-6">
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="table-th">Student</th>
                <th className="table-th">Month</th>
                <th className="table-th">Amount (Rs.)</th>
                <th className="table-th">Status</th>
                <th className="table-th">Paid Date</th>
                <th className="table-th">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && (
                <tr><td colSpan={6} className="table-td text-center text-slate-400 py-8">Loading...</td></tr>
              )}
              {!loading && fees.length === 0 && (
                <tr>
                  <td colSpan={6} className="table-td text-center text-slate-400 py-8">
                    No fee records. Click &quot;Generate Monthly Fees&quot; to create them.
                  </td>
                </tr>
              )}
              {fees.map((f) => (
                <tr key={f.id} className={`hover:bg-slate-50 transition-colors ${!f.paid ? 'bg-red-50/30' : ''}`}>
                  <td className="table-td font-medium text-slate-900">{f.students?.name}</td>
                  <td className="table-td">{MONTHS[f.month - 1]} {f.year}</td>
                  <td className="table-td font-medium">Rs. {Number(f.amount).toLocaleString()}</td>
                  <td className="table-td">
                    {f.paid ? <span className="badge-green">Paid</span> : <span className="badge-red">Unpaid</span>}
                  </td>
                  <td className="table-td text-slate-500">
                    {f.paid_date ? new Date(f.paid_date).toLocaleDateString('en-PK') : '—'}
                  </td>
                  <td className="table-td">
                    {!f.paid ? (
                      <button
                        onClick={() => markPaid(f)}
                        className="flex items-center gap-1 text-xs text-green-600 hover:text-green-800 font-medium"
                      >
                        <CheckCircle size={13} /> Mark Paid
                      </button>
                    ) : (
                      <button
                        onClick={() => markUnpaid(f)}
                        className="text-xs text-slate-400 hover:text-red-600 font-medium"
                      >
                        Undo
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

import { supabase } from '@/lib/supabase'
import { Users, Wallet, ClipboardList, BookOpen } from 'lucide-react'
import { MONTHS } from '@/types'

async function getStats() {
  const now = new Date()
  const month = now.getMonth() + 1
  const year = now.getFullYear()

  const [students, classes, tests, fees] = await Promise.all([
    supabase.from('students').select('id', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('classes').select('id', { count: 'exact', head: true }),
    supabase.from('tests').select('id', { count: 'exact', head: true }),
    supabase.from('fees').select('amount, paid').eq('month', month).eq('year', year),
  ])

  const feeData = fees.data || []
  const totalDue = feeData.reduce((s, f) => s + (f.paid ? 0 : f.amount), 0)
  const totalCollected = feeData.reduce((s, f) => s + (f.paid ? f.amount : 0), 0)

  return {
    students: students.count || 0,
    classes: classes.count || 0,
    tests: tests.count || 0,
    totalDue,
    totalCollected,
    month: MONTHS[month - 1],
    year,
  }
}

export default async function DashboardPage() {
  const stats = await getStats()

  const cards = [
    { label: 'Active Students', value: stats.students, icon: Users, color: 'bg-blue-500' },
    { label: 'Total Classes', value: stats.classes, icon: BookOpen, color: 'bg-violet-500' },
    { label: 'Total Tests', value: stats.tests, icon: ClipboardList, color: 'bg-amber-500' },
    {
      label: `Fees Collected (${stats.month})`,
      value: `Rs. ${stats.totalCollected.toLocaleString()}`,
      icon: Wallet,
      color: 'bg-green-500',
    },
    {
      label: `Fees Due (${stats.month})`,
      value: `Rs. ${stats.totalDue.toLocaleString()}`,
      icon: Wallet,
      color: 'bg-red-500',
    },
  ]

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="text-sm text-slate-500 mt-0.5">{stats.month} {stats.year}</p>
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-8">
          {cards.map((c) => (
            <div key={c.label} className="card p-5">
              <div className={`${c.color} w-10 h-10 rounded-lg flex items-center justify-center mb-3`}>
                <c.icon size={20} className="text-white" />
              </div>
              <div className="text-2xl font-bold font-display text-slate-900">{c.value}</div>
              <div className="text-xs text-slate-500 mt-1">{c.label}</div>
            </div>
          ))}
        </div>

        <div className="card p-6">
          <h2 className="font-display font-semibold text-slate-800 mb-2">Quick Start</h2>
          <ul className="text-sm text-slate-600 space-y-1 list-disc list-inside">
            <li>Go to <strong>Classes</strong> to set up your class list and assign subjects</li>
            <li>Go to <strong>Students</strong> to admit new students</li>
            <li>Go to <strong>Fees</strong> to generate and manage monthly fees</li>
            <li>Go to <strong>Tests</strong> to create a test and enter marks</li>
            <li>Go to <strong>Results</strong> to view student performance</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

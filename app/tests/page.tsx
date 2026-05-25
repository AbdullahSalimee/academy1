import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { Plus } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function TestsPage() {
  const { data: tests } = await supabase
    .from('tests')
    .select('*, classes(name, section), subjects(name)')
    .order('test_date', { ascending: false })

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Tests</h1>
        <Link href="/tests/new" className="btn-primary">
          <Plus size={16} /> Create Test
        </Link>
      </div>

      <div className="p-6">
        <div className="card overflow-hidden">
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
                  <td colSpan={6} className="table-td text-center text-slate-400 py-10">
                    No tests yet. Create your first test.
                  </td>
                </tr>
              )}
              {(tests || []).map((t: any) => (
                <tr key={t.id} className="hover:bg-slate-50">
                  <td className="table-td font-medium text-slate-900">{t.name}</td>
                  <td className="table-td">
                    <span className="badge-blue">{t.subjects?.name}</span>
                  </td>
                  <td className="table-td">{t.classes?.name} {t.classes?.section}</td>
                  <td className="table-td">{new Date(t.test_date).toLocaleDateString('en-PK')}</td>
                  <td className="table-td">{t.total_marks}</td>
                  <td className="table-td">
                    <Link
                      href={`/tests/${t.id}/marks`}
                      className="text-blue-600 hover:text-blue-800 text-xs font-medium mr-3"
                    >
                      Enter Marks →
                    </Link>
                    <Link
                      href={`/tests/${t.id}`}
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
    </div>
  )
}

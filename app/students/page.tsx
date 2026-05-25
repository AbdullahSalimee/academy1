import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { Plus, Search } from 'lucide-react'
import { StudentDetails } from '@/types'

export const dynamic = 'force-dynamic'

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: { class_id?: string; search?: string; active?: string }
}) {
  const classId = searchParams.class_id
  const search = searchParams.search || ''
  const showInactive = searchParams.active === 'false'

  // Get classes for filter dropdown
  const { data: classes } = await supabase
    .from('classes')
    .select('id, name, section')
    .order('name')

  // Get students
  let query = supabase
    .from('student_details')
    .select('*')
    .order('name')

  if (!showInactive) query = query.eq('is_active', true)
  if (classId) query = query.eq('class_id', classId)
  if (search) query = query.ilike('name', `%${search}%`)

  const { data: students } = await query
  const list: StudentDetails[] = students || []

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Students</h1>
        <Link href="/students/new" className="btn-primary">
          <Plus size={16} /> Add Student
        </Link>
      </div>

      {/* Filters */}
      <div className="px-6 py-4 bg-white border-b border-slate-200 flex flex-wrap gap-3">
        <form className="flex gap-3 flex-wrap">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              name="search"
              defaultValue={search}
              placeholder="Search student..."
              className="input pl-9 w-48"
            />
          </div>
          <select name="class_id" defaultValue={classId || ''} className="input w-44">
            <option value="">All Classes</option>
            {classes?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} {c.section}
              </option>
            ))}
          </select>
          <button type="submit" className="btn-primary">Filter</button>
          <Link href="/students" className="btn-secondary">Reset</Link>
        </form>
      </div>

      {/* Table */}
      <div className="p-6">
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="table-th">Student Name</th>
                <th className="table-th">Father Name</th>
                <th className="table-th">Class</th>
                <th className="table-th">Admission Date</th>
                <th className="table-th">Monthly Fee</th>
                <th className="table-th">Status</th>
                <th className="table-th">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {list.length === 0 && (
                <tr>
                  <td colSpan={7} className="table-td text-center text-slate-400 py-10">
                    No students found.
                  </td>
                </tr>
              )}
              {list.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                  <td className="table-td font-medium text-slate-900">{s.name}</td>
                  <td className="table-td">{s.father_name || '—'}</td>
                  <td className="table-td">
                    {s.class_name} {s.class_section}
                  </td>
                  <td className="table-td">
                    {new Date(s.admission_date).toLocaleDateString('en-PK')}
                  </td>
                  <td className="table-td">Rs. {Number(s.default_monthly_fee).toLocaleString()}</td>
                  <td className="table-td">
                    {s.is_active ? (
                      <span className="badge-green">Active</span>
                    ) : (
                      <span className="badge-red">Inactive</span>
                    )}
                  </td>
                  <td className="table-td">
                    <Link
                      href={`/students/${s.id}`}
                      className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                    >
                      View →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-4 py-3 border-t border-slate-100 text-xs text-slate-500">
            {list.length} student(s)
          </div>
        </div>
      </div>
    </div>
  )
}

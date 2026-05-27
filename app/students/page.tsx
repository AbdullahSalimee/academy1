import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { Plus } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: { class_id?: string; search?: string; active?: string };
}) {
  const classId = searchParams.class_id;
  const search = searchParams.search || "";
  const showInactive = searchParams.active === "false";

  const { data: classes } = await supabase
    .from("classes")
    .select("id, name, section")
    .order("name");

  let query = supabase
    .from("students")
    .select("*, classes(name, section)")
    .order("name");

  if (!showInactive) query = query.eq("is_active", true);
  if (classId) query = query.eq("class_id", classId);
  if (search) query = query.ilike("name", `%${search}%`);

  const { data: students, error } = await query;
  const list = students || [];

  return (
    <div className="pt-14 sm:pt-0">
      <div className="page-header">
        <h1 className="page-title">Students</h1>
        <Link href="/students/new" className="btn-primary">
          <Plus size={16} /> Add Student
        </Link>
      </div>

      {/* Filters */}
      <div className="px-4 sm:px-6 py-3 sm:py-4 bg-white border-b border-slate-200">
        <form className="flex flex-wrap gap-2">
          <input
            name="search"
            defaultValue={search}
            placeholder="Search student..."
            className="input flex-1 min-w-[140px]"
          />
          <select
            name="class_id"
            defaultValue={classId || ""}
            className="input w-36"
          >
            <option value="">All Classes</option>
            {classes?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} {c.section}
              </option>
            ))}
          </select>
          <select
            name="active"
            defaultValue={showInactive ? "false" : "true"}
            className="input w-28"
          >
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
          <button type="submit" className="btn-primary btn-sm">
            Filter
          </button>
          <Link href="/students" className="btn-secondary btn-sm">
            Reset
          </Link>
        </form>
      </div>

      <div className="p-4 sm:p-6">
        {/* Mobile card list */}
        <div className="sm:hidden space-y-3">
          {list.length === 0 && (
            <div className="card p-8 text-center text-slate-400">
              No students found.
            </div>
          )}
          {list.map((s: any) => (
            <div key={s.id} className="card p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div className="font-semibold text-slate-900">{s.name}</div>
                  <div className="text-xs text-slate-500">
                    {s.father_name || "—"}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {s.is_active ? (
                    <span className="badge-green">Active</span>
                  ) : (
                    <span className="badge-red">Inactive</span>
                  )}
                  <Link
                    href={`/students/${s.id}`}
                    className="text-blue-600 text-xs font-medium"
                  >
                    View →
                  </Link>
                </div>
              </div>
              <div className="flex gap-4 text-xs text-slate-600 mt-2">
                <span>
                  📚 {s.classes?.name} {s.classes?.section}
                </span>
                <span>
                  💰 Rs. {Number(s.default_monthly_fee).toLocaleString()}
                </span>
              </div>
              {s.phone && (
                <div className="text-xs text-slate-500 mt-1">📞 {s.phone}</div>
              )}
            </div>
          ))}
        </div>

        {/* Desktop table */}
        <div className="hidden sm:block card overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="table-th">Student Name</th>
                <th className="table-th">Father Name</th>
                <th className="table-th">Class</th>
                <th className="table-th">Admission</th>
                <th className="table-th">Monthly Fee</th>
                <th className="table-th">Status</th>
                <th className="table-th">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {list.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="table-td text-center text-slate-400 py-10"
                  >
                    No students found.
                  </td>
                </tr>
              )}
              {list.map((s: any) => (
                <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                  <td className="table-td font-medium text-slate-900">
                    {s.name}
                  </td>
                  <td className="table-td">{s.father_name || "—"}</td>
                  <td className="table-td">
                    {s.classes?.name} {s.classes?.section}
                  </td>
                  <td className="table-td">
                    {new Date(s.admission_date).toLocaleDateString("en-PK")}
                  </td>
                  <td className="table-td">
                    Rs. {Number(s.default_monthly_fee).toLocaleString()}
                  </td>
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
  );
}

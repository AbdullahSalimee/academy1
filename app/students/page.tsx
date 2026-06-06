import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { Plus, Search } from "lucide-react";

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
  if (!showInactive) query = query.neq("is_active", false);
  if (classId) query = query.eq("class_id", classId);
  if (search) query = query.ilike("name", `%${search}%`);

  const { data: students } = await query;
  const list = students || [];

  return (
    <div className="pb-20 sm:pb-0">
      <div className="page-header">
        <h1 className="page-title">Students</h1>
        <Link href="/students/new" className="btn-primary btn-sm">
          <Plus size={15} /> Add
        </Link>
      </div>

      {/* Filters */}
      <form className="px-4 py-3 bg-white border-b border-slate-200 space-y-2">
        <div className="flex gap-2">
          <input
            name="search"
            defaultValue={search}
            placeholder="Search by name..."
            className="input flex-1"
          />
          <button type="submit" className="btn-primary btn-sm shrink-0">
            <Search size={14} />
          </button>
        </div>
        <div className="flex gap-2">
          <select
            name="class_id"
            defaultValue={classId || ""}
            className="input flex-1"
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
          <Link href="/students" className="btn-secondary btn-sm shrink-0">
            Reset
          </Link>
        </div>
      </form>

      <div className="p-4 space-y-2">
        <p className="text-xs text-slate-400 font-medium">
          {list.length} student{list.length !== 1 ? "s" : ""}
        </p>

        {list.length === 0 && (
          <div className="card p-10 text-center text-slate-400">
            <Users className="mx-auto mb-2 opacity-30" size={32} />
            <p>No students found.</p>
            <Link
              href="/students/new"
              className="text-blue-600 text-sm mt-2 inline-block"
            >
              Add first student →
            </Link>
          </div>
        )}

        {list.map((s: any) => (
          <Link
            key={s.id}
            href={`/students/${s.id}`}
            className="card p-4 flex items-center gap-3 active:scale-[0.98] transition-transform block"
          >
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
              <span className="text-blue-700 font-bold text-sm">
                {s.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-slate-900 truncate">
                {s.name}
              </div>
              <div className="text-xs text-slate-500 truncate">
                {s.classes?.name} {s.classes?.section}{" "}
                {s.father_name ? `· ${s.father_name}` : ""}
              </div>
            </div>
            <div className="flex flex-col items-end gap-1 shrink-0">
              <span className={s.is_active ? "badge-green" : "badge-red"}>
                {s.is_active ? "Active" : "Left"}
              </span>
              <span className="text-xs text-slate-400">
                Rs. {Number(s.default_monthly_fee).toLocaleString()}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function Users({ className, size }: any) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

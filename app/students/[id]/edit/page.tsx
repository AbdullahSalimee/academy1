"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Class } from "@/types";
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";

export default function EditStudentPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    father_name: "",
    phone: "",
    address: "",
    class_id: "",
    admission_date: "",
    default_monthly_fee: "",
    is_active: true,
  });

  useEffect(() => {
    Promise.all([
      supabase.from("students").select("*").eq("id", params.id).single(),
      supabase.from("classes").select("*").order("name"),
    ]).then(([{ data: s }, { data: cls }]) => {
      if (s)
        setForm({
          name: s.name,
          father_name: s.father_name || "",
          phone: s.phone || "",
          address: s.address || "",
          class_id: s.class_id,
          admission_date: s.admission_date,
          default_monthly_fee: String(s.default_monthly_fee),
          is_active: s.is_active,
        });
      setClasses(cls || []);
    });
  }, [params.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const { error: err } = await supabase
      .from("students")
      .update({
        name: form.name.trim(),
        father_name: form.father_name.trim() || null,
        phone: form.phone.trim() || null,
        address: form.address.trim() || null,
        class_id: form.class_id,
        admission_date: form.admission_date,
        default_monthly_fee: parseFloat(form.default_monthly_fee),
        is_active: form.is_active,
      })
      .eq("id", params.id);
    if (err) {
      setError(err.message);
      setLoading(false);
    } else {
      router.refresh();
      router.push(`/students/${params.id}`);
    }
  };

  const set = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="pb-20 sm:pb-0">
      <div className="page-header">
        <div className="flex items-center gap-3">
          <Link href={`/students/${params.id}`} className="text-slate-400">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="page-title">Edit Student</h1>
        </div>
      </div>
      <div className="p-4 max-w-lg mx-auto">
        <div className="card p-5">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Student Name *</label>
              <input
                className="input"
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
              />
            </div>
            <div>
              <label className="label">Father's Name</label>
              <input
                className="input"
                value={form.father_name}
                onChange={(e) => set("father_name", e.target.value)}
              />
            </div>
            <div>
              <label className="label">Class *</label>
              <select
                className="input"
                value={form.class_id}
                onChange={(e) => set("class_id", e.target.value)}
              >
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.section}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Monthly Fee (Rs.) *</label>
                <input
                  type="number"
                  className="input"
                  value={form.default_monthly_fee}
                  onChange={(e) => set("default_monthly_fee", e.target.value)}
                  min="0"
                />
              </div>
              <div>
                <label className="label">Phone</label>
                <input
                  className="input"
                  value={form.phone}
                  onChange={(e) => set("phone", e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="label">Address</label>
              <textarea
                className="input h-20 resize-none"
                value={form.address}
                onChange={(e) => set("address", e.target.value)}
              />
            </div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) => set("is_active", e.target.checked)}
                className="w-4 h-4 rounded"
              />
              <span className="text-sm font-medium text-slate-700">
                Active Student
              </span>
            </label>
            <div className="flex gap-3 pt-1">
              <button
                type="submit"
                disabled={loading}
                className="btn-primary flex-1 justify-center"
              >
                <Save size={15} /> {loading ? "Saving..." : "Save Changes"}
              </button>
              <Link href={`/students/${params.id}`} className="btn-secondary">
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

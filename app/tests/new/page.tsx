"use client";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Class, Subject } from "@/types";
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";

export default function NewTestPage() {
  const router = useRouter();
  const [classes, setClasses] = useState<Class[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "",
    test_date: new Date().toISOString().split("T")[0],
    class_id: "",
    subject_id: "",
    total_marks: "100",
  });

  useEffect(() => {
    Promise.all([
      supabase.from("classes").select("*").order("name"),
      supabase.from("subjects").select("*").order("name"),
    ]).then(([cls, sub]) => {
      setClasses(cls.data || []);
      setSubjects(sub.data || []);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!form.name || !form.class_id || !form.subject_id || !form.test_date) {
      setError("All fields are required.");
      setLoading(false);
      return;
    }

    const { data, error: err } = await supabase
      .from("tests")
      .insert({
        name: form.name.trim(),
        test_date: form.test_date,
        class_id: form.class_id,
        subject_id: form.subject_id,
        total_marks: parseInt(form.total_marks),
      })
      .select()
      .single();

    if (err) {
      setError(err.message);
      setLoading(false);
    } else router.push(`/tests/${data.id}/marks`);
  };

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const classOptions = useMemo(
    () =>
      classes.map((c) => (
        <option key={c.id} value={c.id}>
          {c.name} {c.section}
        </option>
      )),
    [classes],
  );

  const subjectOptions = useMemo(
    () =>
      subjects.map((s) => (
        <option key={s.id} value={s.id}>
          {s.name}
        </option>
      )),
    [subjects],
  );

  return (
    <div className="pt-14 sm:pt-0">
      <div className="page-header">
        <div className="flex items-center gap-3">
          <Link href="/tests" prefetch={false} className="text-slate-400 hover:text-slate-700">
            <ArrowLeft size={18} />
          </Link>
          <h1 className="page-title">Create New Test</h1>
        </div>
      </div>

      <div className="p-4 sm:p-6 max-w-xl">
        <div className="card p-5 sm:p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Test Name *</label>
              <input
                className="input"
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="e.g. Monthly Test April 2025"
                autoComplete="off"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Class *</label>
                <select
                  className="input"
                  value={form.class_id}
                  onChange={(e) => set("class_id", e.target.value)}
                >
                  <option value="">Select class...</option>
                  {classOptions}
                </select>
              </div>
              <div>
                <label className="label">Subject *</label>
                <select
                  className="input"
                  value={form.subject_id}
                  onChange={(e) => set("subject_id", e.target.value)}
                >
                  <option value="">Select subject...</option>
                  {subjectOptions}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Test Date *</label>
                <input
                  type="date"
                  className="input"
                  value={form.test_date}
                  onChange={(e) => set("test_date", e.target.value)}
                />
              </div>
              <div>
                <label className="label">Total Marks *</label>
                <input
                  type="number"
                  inputMode="numeric"
                  className="input"
                  value={form.total_marks}
                  onChange={(e) => set("total_marks", e.target.value)}
                  min="1"
                />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="btn-primary flex-1 sm:flex-none justify-center"
              >
                <Save size={15} />{" "}
                {loading ? "Creating..." : "Create & Enter Marks"}
              </button>
              <Link href="/tests" prefetch={false} className="btn-secondary">
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
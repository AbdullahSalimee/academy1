"use client";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Class, Subject } from "@/types";
import { Plus, Trash2 } from "lucide-react";

export default function ClassesPage() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [newClass, setNewClass] = useState({ name: "", section: "" });
  const [newSubject, setNewSubject] = useState("");

  const load = useCallback(async () => {
    const [cls, sub] = await Promise.all([
      supabase.from("classes").select("*").order("name"),
      supabase.from("subjects").select("*").order("name"),
    ]);
    setClasses(cls.data || []);
    setSubjects(sub.data || []);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const addClass = async () => {
    if (!newClass.name) return;
    await supabase
      .from("classes")
      .insert({
        name: newClass.name.trim(),
        section: newClass.section.trim() || null,
      });
    setNewClass({ name: "", section: "" });
    load();
  };

  const deleteClass = async (id: string) => {
    if (
      !confirm("Delete this class? Students assigned to it will be affected.")
    )
      return;
    await supabase.from("classes").delete().eq("id", id);
    load();
  };

  const addSubject = async () => {
    if (!newSubject.trim()) return;
    await supabase.from("subjects").insert({ name: newSubject.trim() });
    setNewSubject("");
    load();
  };

  const deleteSubject = async (id: string) => {
    if (!confirm("Delete this subject?")) return;
    await supabase.from("subjects").delete().eq("id", id);
    load();
  };

  return (
    <div className="pb-20 sm:pb-0">
      <div className="page-header">
        <h1 className="page-title">Classes & Subjects</h1>
      </div>

      <div className="p-4 space-y-4">
        {/* Classes */}
        <div className="card p-4">
          <h2 className="font-semibold text-slate-800 mb-3">Classes</h2>
          <div className="flex gap-2 mb-3">
            <input
              className="input flex-1"
              placeholder="Class name (e.g. Grade 5)"
              value={newClass.name}
              onChange={(e) =>
                setNewClass((f) => ({ ...f, name: e.target.value }))
              }
              onKeyDown={(e) => e.key === "Enter" && addClass()}
              autoComplete="off"
            />
            <input
              className="input w-16"
              placeholder="Sec"
              value={newClass.section}
              onChange={(e) =>
                setNewClass((f) => ({ ...f, section: e.target.value }))
              }
              autoComplete="off"
            />
            <button onClick={addClass} className="btn-primary btn-sm shrink-0">
              <Plus size={16} />
            </button>
          </div>
          <div className="space-y-1">
            {classes.length === 0 && (
              <p className="text-sm text-slate-400 text-center py-4">
                No classes yet. Add your first class above.
              </p>
            )}
            {classes.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-slate-50"
              >
                <span className="text-sm font-medium text-slate-800">
                  {c.name}{" "}
                  {c.section && (
                    <span className="text-slate-400 font-normal">
                      ({c.section})
                    </span>
                  )}
                </span>
                <button
                  onClick={() => deleteClass(c.id)}
                  className="text-slate-300 hover:text-red-500 transition-colors p-1"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Subjects */}
        <div className="card p-4">
          <h2 className="font-semibold text-slate-800 mb-3">Subjects</h2>
          <div className="flex gap-2 mb-3">
            <input
              className="input flex-1"
              placeholder="Subject name (e.g. Mathematics)"
              value={newSubject}
              onChange={(e) => setNewSubject(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addSubject()}
              autoComplete="off"
            />
            <button
              onClick={addSubject}
              className="btn-primary btn-sm shrink-0"
            >
              <Plus size={16} />
            </button>
          </div>
          <div className="space-y-1">
            {subjects.length === 0 && (
              <p className="text-sm text-slate-400 text-center py-4">
                No subjects yet.
              </p>
            )}
            {subjects.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-slate-50"
              >
                <span className="text-sm font-medium text-slate-800">
                  {s.name}
                </span>
                <button
                  onClick={() => deleteSubject(s.id)}
                  className="text-slate-300 hover:text-red-500 transition-colors p-1"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Workflow tip */}
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 text-sm text-blue-700">
          <p className="font-semibold mb-1">📌 Getting Started</p>
          <ol className="space-y-1 text-xs list-decimal list-inside text-blue-600">
            <li>Create your classes here first (e.g. Grade 5 A, Grade 6 B)</li>
            <li>Add subjects (e.g. Maths, English, Science)</li>
            <li>Go to Students and add students to each class</li>
            <li>Use Fees → Generate to create monthly fee records</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
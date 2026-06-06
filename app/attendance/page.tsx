"use client";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Class } from "@/types";
import { Save, CheckCircle, ChevronLeft, ChevronRight } from "lucide-react";

type AttStatus = "present" | "absent" | "late";
interface StudentAtt {
  student_id: string;
  name: string;
  status: AttStatus;
}

function formatDate(d: Date) {
  return d.toISOString().split("T")[0];
}

export default function AttendancePage() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [date, setDate] = useState(formatDate(new Date()));
  const [rows, setRows] = useState<StudentAtt[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    supabase
      .from("classes")
      .select("*")
      .order("name")
      .then(({ data }) => {
        setClasses(data || []);
        if (data && data.length > 0) setSelectedClass(data[0].id);
      });
  }, []);

  const load = useCallback(async () => {
    if (!selectedClass || !date) return;
    setLoading(true);
    setSaved(false);
    const [{ data: students }, { data: existing }] = await Promise.all([
      supabase
        .from("students")
        .select("id, name")
        .eq("class_id", selectedClass)
        .eq("is_active", true)
        .order("name"),
      supabase
        .from("attendance")
        .select("*")
        .eq("class_id", selectedClass)
        .eq("date", date),
    ]);
    const existingMap: Record<string, any> = {};
    (existing || []).forEach((a: any) => {
      existingMap[a.student_id] = a;
    });
    setRows(
      (students || []).map((s) => ({
        student_id: s.id,
        name: s.name,
        status: (existingMap[s.id]?.status as AttStatus) || "present",
      })),
    );
    setLoading(false);
  }, [selectedClass, date]);

  useEffect(() => {
    load();
  }, [load]);

  const setStatus = (idx: number, status: AttStatus) => {
    setRows((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], status };
      return next;
    });
    setSaved(false);
  };

  const markAll = (status: AttStatus) => {
    setRows((prev) => prev.map((r) => ({ ...r, status })));
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    await supabase
      .from("attendance")
      .delete()
      .eq("class_id", selectedClass)
      .eq("date", date);
    if (rows.length > 0) {
      await supabase.from("attendance").insert(
        rows.map((r) => ({
          student_id: r.student_id,
          class_id: selectedClass,
          date,
          status: r.status,
        })),
      );
    }
    setSaved(true);
    setSaving(false);
  };

  const changeDate = (days: number) => {
    const d = new Date(date + "T00:00:00");
    d.setDate(d.getDate() + days);
    setDate(formatDate(d));
  };

  const present = rows.filter((r) => r.status === "present").length;
  const absent = rows.filter((r) => r.status === "absent").length;
  const late = rows.filter((r) => r.status === "late").length;

  const statusColors: Record<
    AttStatus,
    { btn: string; row: string; label: string }
  > = {
    present: { btn: "bg-emerald-500 text-white", row: "", label: "P" },
    absent: { btn: "bg-red-500 text-white", row: "bg-red-50/60", label: "A" },
    late: { btn: "bg-amber-500 text-white", row: "bg-amber-50/60", label: "L" },
  };

  return (
    <div className="pb-20 sm:pb-0">
      <div className="page-header">
        <h1 className="page-title">Attendance</h1>
        <div className="flex items-center gap-2">
          {saved && (
            <span className="text-emerald-600 text-xs font-medium flex items-center gap-1">
              <CheckCircle size={13} /> Saved
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={saving || rows.length === 0}
            className="btn-primary btn-sm"
          >
            <Save size={14} /> {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="px-4 py-3 bg-white border-b border-slate-200 space-y-2">
        {/* Date navigation */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => changeDate(-1)}
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50"
          >
            <ChevronLeft size={16} />
          </button>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="input flex-1 text-center"
          />
          <button
            onClick={() => changeDate(1)}
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50"
          >
            <ChevronRight size={16} />
          </button>
        </div>
        {/* Class + bulk */}
        <div className="flex gap-2">
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="input flex-1"
          >
            <option value="">Select class...</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} {c.section}
              </option>
            ))}
          </select>
          <button
            onClick={() => markAll("present")}
            className="px-3 py-2 rounded-xl border border-emerald-200 text-emerald-700 text-xs font-semibold bg-emerald-50"
          >
            All P
          </button>
          <button
            onClick={() => markAll("absent")}
            className="px-3 py-2 rounded-xl border border-red-200 text-red-700 text-xs font-semibold bg-red-50"
          >
            All A
          </button>
        </div>
      </div>

      {/* Summary */}
      {rows.length > 0 && (
        <div className="px-4 py-2 bg-slate-50 border-b border-slate-200 flex gap-4 text-xs font-medium">
          <span className="text-emerald-600">✅ {present}</span>
          <span className="text-red-500">❌ {absent}</span>
          <span className="text-amber-500">⏰ {late}</span>
          <span className="text-slate-400 ml-auto">{rows.length} students</span>
        </div>
      )}

      <div className="p-4">
        {!selectedClass && (
          <div className="card p-10 text-center text-slate-400">
            Select a class to take attendance.
          </div>
        )}
        {selectedClass && loading && (
          <div className="card p-10 text-center text-slate-400">
            Loading students...
          </div>
        )}
        {selectedClass && !loading && rows.length === 0 && (
          <div className="card p-10 text-center text-slate-400">
            No active students in this class.
          </div>
        )}
        {selectedClass && !loading && rows.length > 0 && (
          <div className="space-y-2">
            {rows.map((row, idx) => (
              <div
                key={row.student_id}
                className={`card flex items-center gap-3 px-4 py-3 ${statusColors[row.status].row}`}
              >
                <span className="text-xs text-slate-400 w-5 shrink-0 font-mono">
                  {idx + 1}
                </span>
                <span className="flex-1 text-sm font-medium text-slate-900 truncate">
                  {row.name}
                </span>
                <div className="flex gap-1 shrink-0">
                  {(["present", "absent", "late"] as AttStatus[]).map((s) => (
                    <button
                      key={s}
                      onClick={() => setStatus(idx, s)}
                      className={`w-9 h-9 rounded-xl text-sm font-bold transition-all ${
                        row.status === s
                          ? statusColors[s].btn
                          : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                      }`}
                    >
                      {statusColors[s].label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            {/* Bottom save */}
            <button
              onClick={handleSave}
              disabled={saving}
              className="btn-primary w-full justify-center mt-2"
            >
              <Save size={15} /> {saving ? "Saving..." : "Save Attendance"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

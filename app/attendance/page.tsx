"use client";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Class } from "@/types";
import {
  CheckCircle,
  XCircle,
  Clock,
  Save,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

type AttStatus = "present" | "absent" | "late";

interface StudentAtt {
  student_id: string;
  name: string;
  status: AttStatus;
  existing_id: string | null;
}

function formatDate(d: Date) {
  return d.toISOString().split("T")[0];
}

function displayDate(dateStr: string) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-PK", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function AttendancePage() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [date, setDate] = useState(formatDate(new Date()));
  const [rows, setRows] = useState<StudentAtt[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [summary, setSummary] = useState({ present: 0, absent: 0, late: 0 });

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

    const { data: students } = await supabase
      .from("students")
      .select("id, name")
      .eq("class_id", selectedClass)
      .eq("is_active", true)
      .order("name");

    // Try to load existing attendance from attendance table
    // Falls back gracefully if table doesn't exist yet
    let existingMap: Record<string, any> = {};
    try {
      const { data: existing } = await supabase
        .from("attendance")
        .select("*")
        .eq("class_id", selectedClass)
        .eq("date", date);
      (existing || []).forEach((a: any) => {
        existingMap[a.student_id] = a;
      });
    } catch {}

    setRows(
      (students || []).map((s) => ({
        student_id: s.id,
        name: s.name,
        status: (existingMap[s.id]?.status as AttStatus) || "present",
        existing_id: existingMap[s.id]?.id || null,
      })),
    );

    setLoading(false);
  }, [selectedClass, date]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const p = rows.filter((r) => r.status === "present").length;
    const a = rows.filter((r) => r.status === "absent").length;
    const l = rows.filter((r) => r.status === "late").length;
    setSummary({ present: p, absent: a, late: l });
  }, [rows]);

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
    try {
      // Upsert attendance records
      const records = rows.map((r) => ({
        student_id: r.student_id,
        class_id: selectedClass,
        date,
        status: r.status,
      }));

      // Delete existing and re-insert (simpler than upsert without knowing IDs)
      await supabase
        .from("attendance")
        .delete()
        .eq("class_id", selectedClass)
        .eq("date", date);

      if (records.length > 0) {
        await supabase.from("attendance").insert(records);
      }

      setSaved(true);
      load();
    } catch (e) {
      alert(
        "Could not save. Make sure the attendance table exists in your database.",
      );
    }
    setSaving(false);
  };

  const changeDate = (days: number) => {
    const d = new Date(date + "T00:00:00");
    d.setDate(d.getDate() + days);
    setDate(formatDate(d));
  };

  const StatusBtn = ({
    status,
    current,
    onClick,
    label,
  }: {
    status: AttStatus;
    current: AttStatus;
    onClick: () => void;
    label: string;
  }) => {
    const styles: Record<AttStatus, string> = {
      present:
        current === "present"
          ? "bg-green-500 text-white border-green-500"
          : "border-slate-200 text-slate-400 hover:border-green-300 hover:text-green-600",
      absent:
        current === "absent"
          ? "bg-red-500 text-white border-red-500"
          : "border-slate-200 text-slate-400 hover:border-red-300 hover:text-red-600",
      late:
        current === "late"
          ? "bg-amber-500 text-white border-amber-500"
          : "border-slate-200 text-slate-400 hover:border-amber-300 hover:text-amber-600",
    };
    return (
      <button
        onClick={onClick}
        className={`px-2 sm:px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${styles[status]}`}
      >
        {label}
      </button>
    );
  };

  return (
    <div className="pt-14 sm:pt-0">
      <div className="page-header">
        <h1 className="page-title">Attendance</h1>
        <div className="flex items-center gap-2">
          {saved && (
            <span className="text-green-600 text-xs font-medium flex items-center gap-1">
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
      <div className="px-4 sm:px-6 py-3 bg-white border-b border-slate-200 space-y-3">
        {/* Date picker row */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => changeDate(-1)}
            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600"
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
            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Class + bulk actions */}
        <div className="flex flex-wrap gap-2 items-center">
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="input flex-1 min-w-[160px]"
          >
            <option value="">Select class...</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} {c.section}
              </option>
            ))}
          </select>
          <div className="flex gap-1.5 shrink-0">
            <button
              onClick={() => markAll("present")}
              className="px-2 py-1.5 rounded-lg border border-green-200 text-green-700 text-xs font-medium hover:bg-green-50"
            >
              All Present
            </button>
            <button
              onClick={() => markAll("absent")}
              className="px-2 py-1.5 rounded-lg border border-red-200 text-red-700 text-xs font-medium hover:bg-red-50"
            >
              All Absent
            </button>
          </div>
        </div>
      </div>

      {/* Summary bar */}
      {rows.length > 0 && (
        <div className="px-4 sm:px-6 py-2.5 bg-slate-50 border-b border-slate-200 flex gap-4 text-xs sm:text-sm font-medium">
          <span className="text-green-600">✅ Present: {summary.present}</span>
          <span className="text-red-600">❌ Absent: {summary.absent}</span>
          <span className="text-amber-600">⏰ Late: {summary.late}</span>
          <span className="text-slate-500 ml-auto">{rows.length} students</span>
        </div>
      )}

      <div className="p-4 sm:p-6">
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
            No active students in this class.{" "}
            <a href="/students/new" className="text-blue-600 hover:underline">
              Add students →
            </a>
          </div>
        )}

        {selectedClass && !loading && rows.length > 0 && (
          <>
            <p className="text-xs text-slate-500 mb-3">{displayDate(date)}</p>

            {/* Mobile layout */}
            <div className="sm:hidden space-y-2">
              {rows.map((row, idx) => (
                <div
                  key={row.student_id}
                  className={`card p-3 flex items-center justify-between gap-3 ${
                    row.status === "absent"
                      ? "border-red-200 bg-red-50/40"
                      : row.status === "late"
                        ? "border-amber-200 bg-amber-50/40"
                        : ""
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xs text-slate-400 w-5 shrink-0">
                      {idx + 1}
                    </span>
                    <span className="text-sm font-medium text-slate-900 truncate">
                      {row.name}
                    </span>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <StatusBtn
                      status="present"
                      current={row.status}
                      onClick={() => setStatus(idx, "present")}
                      label="P"
                    />
                    <StatusBtn
                      status="absent"
                      current={row.status}
                      onClick={() => setStatus(idx, "absent")}
                      label="A"
                    />
                    <StatusBtn
                      status="late"
                      current={row.status}
                      onClick={() => setStatus(idx, "late")}
                      label="L"
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop table */}
            <div className="hidden sm:block card overflow-hidden">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="table-th w-10">#</th>
                    <th className="table-th">Student Name</th>
                    <th className="table-th">Status</th>
                    <th className="table-th w-40">Mark</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.map((row, idx) => (
                    <tr
                      key={row.student_id}
                      className={`transition-colors ${
                        row.status === "absent"
                          ? "bg-red-50/40"
                          : row.status === "late"
                            ? "bg-amber-50/40"
                            : "hover:bg-slate-50"
                      }`}
                    >
                      <td className="table-td text-slate-400 text-xs">
                        {idx + 1}
                      </td>
                      <td className="table-td font-medium text-slate-900">
                        {row.name}
                      </td>
                      <td className="table-td">
                        {row.status === "present" && (
                          <span className="badge-green flex items-center gap-1 w-fit">
                            <CheckCircle size={11} /> Present
                          </span>
                        )}
                        {row.status === "absent" && (
                          <span className="badge-red flex items-center gap-1 w-fit">
                            <XCircle size={11} /> Absent
                          </span>
                        )}
                        {row.status === "late" && (
                          <span className="badge-amber flex items-center gap-1 w-fit">
                            <Clock size={11} /> Late
                          </span>
                        )}
                      </td>
                      <td className="table-td">
                        <div className="flex gap-1.5">
                          <StatusBtn
                            status="present"
                            current={row.status}
                            onClick={() => setStatus(idx, "present")}
                            label="Present"
                          />
                          <StatusBtn
                            status="absent"
                            current={row.status}
                            onClick={() => setStatus(idx, "absent")}
                            label="Absent"
                          />
                          <StatusBtn
                            status="late"
                            current={row.status}
                            onClick={() => setStatus(idx, "late")}
                            label="Late"
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="px-4 py-3 border-t border-slate-100 flex justify-between items-center">
                <span className="text-xs text-slate-500">
                  {rows.length} students
                </span>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="btn-primary btn-sm"
                >
                  <Save size={13} /> {saving ? "Saving..." : "Save Attendance"}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

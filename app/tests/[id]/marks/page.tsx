"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { ArrowLeft, Save, CheckCircle } from "lucide-react";

interface StudentRow {
  student_id: string;
  name: string;
  obtained_marks: string;
  is_absent: boolean;
  existing_id: string | null;
}

export default function MarksEntryPage() {
  const { id: testId } = useParams<{ id: string }>();
  const [test, setTest] = useState<any>(null);
  const [rows, setRows] = useState<StudentRow[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    async function load() {
      const { data: t } = await supabase
        .from("tests")
        .select("*, classes(name, section), subjects(name)")
        .eq("id", testId)
        .single();
      setTest(t);

      const { data: students } = await supabase
        .from("students")
        .select("id, name")
        .eq("class_id", t.class_id)
        .eq("is_active", true)
        .order("name");

      const { data: existingMarks } = await supabase
        .from("marks")
        .select("*")
        .eq("test_id", testId);

      const markMap: Record<string, any> = {};
      (existingMarks || []).forEach((m) => {
        markMap[m.student_id] = m;
      });

      setRows(
        (students || []).map((s) => ({
          student_id: s.id,
          name: s.name,
          obtained_marks:
            markMap[s.id]?.obtained_marks != null
              ? String(markMap[s.id].obtained_marks)
              : "",
          is_absent: markMap[s.id]?.is_absent || false,
          existing_id: markMap[s.id]?.id || null,
        })),
      );
    }
    load();
  }, [testId]);

  const updateRow = useCallback(
    (idx: number, field: keyof StudentRow, value: any) => {
      setRows((prev) => {
        const next = [...prev];
        next[idx] = { ...next[idx], [field]: value };
        return next;
      });
      setSaved(false);
    },
    [],
  );

  const handleKeyDown = (e: React.KeyboardEvent, idx: number) => {
    if (e.key === "Enter" || e.key === "Tab") {
      e.preventDefault();
      inputRefs.current[idx + 1]?.focus();
    }
  };

  const handleSave = async () => {
    setSaving(true);
    const toInsert: any[] = [];
    const toUpdate: any[] = [];

    rows.forEach((r) => {
      const marksValue = r.is_absent
        ? null
        : r.obtained_marks === ""
          ? null
          : parseFloat(r.obtained_marks);
      const record = {
        test_id: testId,
        student_id: r.student_id,
        obtained_marks: marksValue,
        is_absent: r.is_absent,
      };
      if (r.existing_id) toUpdate.push({ ...record, id: r.existing_id });
      else toInsert.push(record);
    });

    if (toInsert.length > 0) await supabase.from("marks").insert(toInsert);
    for (const u of toUpdate) {
      await supabase
        .from("marks")
        .update({ obtained_marks: u.obtained_marks, is_absent: u.is_absent })
        .eq("id", u.id);
    }

    setSaving(false);
    setSaved(true);

    const { data: refreshed } = await supabase
      .from("marks")
      .select("*")
      .eq("test_id", testId);
    const map: Record<string, any> = {};
    (refreshed || []).forEach((m) => {
      map[m.student_id] = m;
    });
    setRows((prev) =>
      prev.map((r) => ({
        ...r,
        existing_id: map[r.student_id]?.id || r.existing_id,
      })),
    );
  };

  if (!test)
    return <div className="pt-14 sm:pt-0 p-8 text-slate-400">Loading...</div>;

  const totalMarks = test.total_marks;
  const entered = rows.filter(
    (r) => r.obtained_marks !== "" || r.is_absent,
  ).length;

  return (
    <div className="pt-14 sm:pt-0">
      <div className="page-header">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href="/tests"
            className="text-slate-400 hover:text-slate-700 shrink-0"
          >
            <ArrowLeft size={18} />
          </Link>
          <div className="min-w-0">
            <h1 className="page-title truncate">{test.name}</h1>
            <p className="text-xs sm:text-sm text-slate-500">
              {test.subjects?.name} · {test.classes?.name}{" "}
              {test.classes?.section} · {totalMarks} marks
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {saved && (
            <span className="flex items-center gap-1 text-green-600 text-xs font-medium">
              <CheckCircle size={13} /> Saved
            </span>
          )}
          <span className="text-xs text-slate-500 hidden sm:inline">
            {entered}/{rows.length}
          </span>
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary btn-sm"
          >
            <Save size={14} /> {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>

      <div className="px-4 sm:px-6 py-2 bg-blue-50 border-b border-blue-100 text-xs text-blue-700">
        💡 Press{" "}
        <kbd className="bg-white border border-blue-200 rounded px-1">
          Enter
        </kbd>{" "}
        or{" "}
        <kbd className="bg-white border border-blue-200 rounded px-1">Tab</kbd>{" "}
        to move to next student.
      </div>

      <div className="p-4 sm:p-6">
        {/* Mobile layout */}
        <div className="sm:hidden space-y-2">
          {rows.map((row, idx) => {
            const pct =
              row.is_absent || row.obtained_marks === ""
                ? null
                : Math.round(
                    (parseFloat(row.obtained_marks) / totalMarks) * 100,
                  );
            return (
              <div
                key={row.student_id}
                className={`card p-3 ${row.is_absent ? "bg-slate-50" : ""}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-sm text-slate-900">
                    {idx + 1}. {row.name}
                  </span>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={row.is_absent}
                      onChange={(e) => {
                        updateRow(idx, "is_absent", e.target.checked);
                        if (e.target.checked)
                          updateRow(idx, "obtained_marks", "");
                      }}
                      className="w-3.5 h-3.5"
                    />
                    <span className="text-xs text-slate-500">Absent</span>
                  </label>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min="0"
                    max={totalMarks}
                    disabled={row.is_absent}
                    value={row.obtained_marks}
                    onChange={(e) =>
                      updateRow(idx, "obtained_marks", e.target.value)
                    }
                    className="input w-24 disabled:bg-slate-100 disabled:text-slate-400"
                    placeholder={`/ ${totalMarks}`}
                  />
                  {pct !== null && (
                    <span
                      className={`text-sm font-semibold ${pct >= 50 ? "text-green-600" : "text-red-500"}`}
                    >
                      {pct}%
                    </span>
                  )}
                  {row.is_absent && <span className="badge-red">Absent</span>}
                </div>
              </div>
            );
          })}
        </div>

        {/* Desktop table */}
        <div className="hidden sm:block card overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="table-th w-8">#</th>
                <th className="table-th">Student Name</th>
                <th className="table-th w-44">Marks (/{totalMarks})</th>
                <th className="table-th w-28">Absent</th>
                <th className="table-th w-20">%</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((row, idx) => {
                const pct =
                  row.is_absent || row.obtained_marks === ""
                    ? null
                    : Math.round(
                        (parseFloat(row.obtained_marks) / totalMarks) * 100,
                      );
                return (
                  <tr
                    key={row.student_id}
                    className={`transition-colors ${row.is_absent ? "bg-slate-50" : "hover:bg-blue-50/30"}`}
                  >
                    <td className="table-td text-slate-400 text-xs">
                      {idx + 1}
                    </td>
                    <td className="table-td font-medium text-slate-900">
                      {row.name}
                    </td>
                    <td className="table-td">
                      <input
                        ref={(el) => {
                          inputRefs.current[idx] = el;
                        }}
                        type="number"
                        min="0"
                        max={totalMarks}
                        disabled={row.is_absent}
                        value={row.obtained_marks}
                        onChange={(e) =>
                          updateRow(idx, "obtained_marks", e.target.value)
                        }
                        onKeyDown={(e) => handleKeyDown(e, idx)}
                        className="w-28 border border-slate-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-100 disabled:text-slate-400"
                        placeholder="—"
                      />
                    </td>
                    <td className="table-td">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={row.is_absent}
                          onChange={(e) => {
                            updateRow(idx, "is_absent", e.target.checked);
                            if (e.target.checked)
                              updateRow(idx, "obtained_marks", "");
                          }}
                          className="w-4 h-4 rounded"
                        />
                        <span className="text-xs text-slate-500">Absent</span>
                      </label>
                    </td>
                    <td className="table-td">
                      {row.is_absent ? (
                        <span className="text-xs text-slate-400">—</span>
                      ) : pct === null ? (
                        <span className="text-xs text-slate-300">—</span>
                      ) : (
                        <span
                          className={`text-sm font-semibold ${pct >= 50 ? "text-green-600" : "text-red-500"}`}
                        >
                          {pct}%
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="px-4 py-3 border-t border-slate-100 flex justify-between items-center">
            <span className="text-xs text-slate-500">
              {rows.length} students · {entered} entered
            </span>
            <button
              onClick={handleSave}
              disabled={saving}
              className="btn-primary btn-sm"
            >
              <Save size={13} /> {saving ? "Saving..." : "Save All Marks"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Class, Fee, MONTHS } from "@/types";
import { CheckCircle, RefreshCw } from "lucide-react";

interface FeeWithStudent extends Fee {
  students: { name: string; class_id: string };
}

export default function FeesPage() {
  const now = new Date();
  const [classes, setClasses] = useState<Class[]>([]);
  const [fees, setFees] = useState<FeeWithStudent[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [filters, setFilters] = useState({
    class_id: "",
    month: String(now.getMonth() + 1),
    year: String(now.getFullYear()),
    paid: "",
  });

  useEffect(() => {
    supabase
      .from("classes")
      .select("*")
      .order("name")
      .then(({ data }) => setClasses(data || []));
  }, []);

  const loadFees = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from("fees")
      .select("*, students(name, class_id)")
      .eq("month", parseInt(filters.month))
      .eq("year", parseInt(filters.year))
      .order("paid");

    if (filters.paid !== "") query = query.eq("paid", filters.paid === "true");

    const { data } = await query;
    let list = (data || []) as FeeWithStudent[];
    if (filters.class_id)
      list = list.filter((f) => f.students?.class_id === filters.class_id);
    setFees(list);
    setLoading(false);
  }, [filters]);

  useEffect(() => {
    loadFees();
  }, [loadFees]);

  const markPaid = async (fee: FeeWithStudent) => {
    await supabase
      .from("fees")
      .update({ paid: true, paid_date: new Date().toISOString().split("T")[0] })
      .eq("id", fee.id);
    loadFees();
  };

  const markUnpaid = async (fee: FeeWithStudent) => {
    await supabase
      .from("fees")
      .update({ paid: false, paid_date: null })
      .eq("id", fee.id);
    loadFees();
  };

  const generateFees = async () => {
    setGenerating(true);
    try {
      const { data } = await supabase.rpc("generate_monthly_fees", {
        p_year: parseInt(filters.year),
        p_month: parseInt(filters.month),
      });
      alert(`Generated ${data} new fee records.`);
    } catch {
      alert(
        "Could not generate fees. Make sure the generate_monthly_fees function exists in Supabase.",
      );
    }
    setGenerating(false);
    loadFees();
  };

  const totalPaid = fees.reduce(
    (s, f) => s + (f.paid ? Number(f.amount) : 0),
    0,
  );
  const totalDue = fees.reduce(
    (s, f) => s + (!f.paid ? Number(f.amount) : 0),
    0,
  );
  const set = (k: string, v: string) => setFilters((f) => ({ ...f, [k]: v }));

  return (
    <div className="pt-14 sm:pt-0">
      <div className="page-header">
        <h1 className="page-title">Fee Management</h1>
        <button
          onClick={generateFees}
          disabled={generating}
          className="btn-primary btn-sm"
        >
          <RefreshCw size={14} className={generating ? "animate-spin" : ""} />
          <span className="hidden sm:inline">
            {generating ? "Generating..." : "Generate Fees"}
          </span>
          <span className="sm:hidden">Generate</span>
        </button>
      </div>

      {/* Filters */}
      <div className="px-4 sm:px-6 py-3 bg-white border-b border-slate-200 flex flex-wrap gap-2">
        <select
          className="input w-32"
          value={filters.month}
          onChange={(e) => set("month", e.target.value)}
        >
          {MONTHS.map((m, i) => (
            <option key={m} value={i + 1}>
              {m}
            </option>
          ))}
        </select>
        <select
          className="input w-24"
          value={filters.year}
          onChange={(e) => set("year", e.target.value)}
        >
          {[2023, 2024, 2025, 2026].map((y) => (
            <option key={y}>{y}</option>
          ))}
        </select>
        <select
          className="input flex-1 min-w-[120px]"
          value={filters.class_id}
          onChange={(e) => set("class_id", e.target.value)}
        >
          <option value="">All Classes</option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} {c.section}
            </option>
          ))}
        </select>
        <select
          className="input w-28"
          value={filters.paid}
          onChange={(e) => set("paid", e.target.value)}
        >
          <option value="">All</option>
          <option value="false">Unpaid</option>
          <option value="true">Paid</option>
        </select>
      </div>

      {/* Summary */}
      <div className="px-4 sm:px-6 py-2.5 bg-slate-50 border-b border-slate-200 flex flex-wrap gap-3 sm:gap-6 text-xs sm:text-sm">
        <span className="text-slate-600">
          Records: <strong>{fees.length}</strong>
        </span>
        <span className="text-green-600">
          Collected: <strong>Rs. {totalPaid.toLocaleString()}</strong>
        </span>
        <span className="text-red-600">
          Due: <strong>Rs. {totalDue.toLocaleString()}</strong>
        </span>
      </div>

      <div className="p-4 sm:p-6">
        {/* Mobile cards */}
        <div className="sm:hidden space-y-2">
          {loading && (
            <div className="card p-8 text-center text-slate-400">
              Loading...
            </div>
          )}
          {!loading && fees.length === 0 && (
            <div className="card p-8 text-center text-slate-400 text-sm">
              No fee records. Click &quot;Generate Fees&quot; to create them.
            </div>
          )}
          {!loading &&
            fees.map((f) => (
              <div
                key={f.id}
                className={`card p-3 flex items-center justify-between gap-3 ${!f.paid ? "border-red-200" : ""}`}
              >
                <div className="min-w-0">
                  <div className="font-medium text-sm text-slate-900 truncate">
                    {f.students?.name}
                  </div>
                  <div className="text-xs text-slate-500">
                    {MONTHS[f.month - 1]} {f.year} · Rs.{" "}
                    {Number(f.amount).toLocaleString()}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {f.paid ? (
                    <span className="badge-green">Paid</span>
                  ) : (
                    <span className="badge-red">Due</span>
                  )}
                  {!f.paid ? (
                    <button
                      onClick={() => markPaid(f)}
                      className="text-green-600 hover:text-green-800"
                    >
                      <CheckCircle size={18} />
                    </button>
                  ) : (
                    <button
                      onClick={() => markUnpaid(f)}
                      className="text-xs text-slate-400 hover:text-red-600"
                    >
                      Undo
                    </button>
                  )}
                </div>
              </div>
            ))}
        </div>

        {/* Desktop table */}
        <div className="hidden sm:block card overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="table-th">Student</th>
                <th className="table-th">Month</th>
                <th className="table-th">Amount (Rs.)</th>
                <th className="table-th">Status</th>
                <th className="table-th">Paid Date</th>
                <th className="table-th">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && (
                <tr>
                  <td
                    colSpan={6}
                    className="table-td text-center text-slate-400 py-8"
                  >
                    Loading...
                  </td>
                </tr>
              )}
              {!loading && fees.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="table-td text-center text-slate-400 py-8"
                  >
                    No fee records. Click &quot;Generate Fees&quot; to create
                    them.
                  </td>
                </tr>
              )}
              {fees.map((f) => (
                <tr
                  key={f.id}
                  className={`hover:bg-slate-50 transition-colors ${!f.paid ? "bg-red-50/30" : ""}`}
                >
                  <td className="table-td font-medium text-slate-900">
                    {f.students?.name}
                  </td>
                  <td className="table-td">
                    {MONTHS[f.month - 1]} {f.year}
                  </td>
                  <td className="table-td font-medium">
                    Rs. {Number(f.amount).toLocaleString()}
                  </td>
                  <td className="table-td">
                    {f.paid ? (
                      <span className="badge-green">Paid</span>
                    ) : (
                      <span className="badge-red">Unpaid</span>
                    )}
                  </td>
                  <td className="table-td text-slate-500">
                    {f.paid_date
                      ? new Date(f.paid_date).toLocaleDateString("en-PK")
                      : "—"}
                  </td>
                  <td className="table-td">
                    {!f.paid ? (
                      <button
                        onClick={() => markPaid(f)}
                        className="flex items-center gap-1 text-xs text-green-600 hover:text-green-800 font-medium"
                      >
                        <CheckCircle size={13} /> Mark Paid
                      </button>
                    ) : (
                      <button
                        onClick={() => markUnpaid(f)}
                        className="text-xs text-slate-400 hover:text-red-600 font-medium"
                      >
                        Undo
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

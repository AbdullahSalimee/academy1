"use client";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Class, MONTHS } from "@/types";
import { RefreshCw, CheckCircle, Plus, X, CreditCard } from "lucide-react";

interface FeeRow {
  id: string;
  student_id: string;
  month: number;
  year: number;
  amount: number;
  paid: boolean;
  paid_date: string | null;
  notes: string | null;
  fee_payments: Array<{
    id: string;
    amount_paid: number;
    payment_date: string;
    payment_method: string;
    notes: string | null;
  }>;
  students: { name: string; class_id: string };
}

export default function FeesPage() {
  const now = new Date();
  const [classes, setClasses] = useState<Class[]>([]);
  const [fees, setFees] = useState<FeeRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [filters, setFilters] = useState({
    class_id: "",
    month: String(now.getMonth() + 1),
    year: String(now.getFullYear()),
    paid: "",
  });
  // Payment modal state
  const [payModal, setPayModal] = useState<{ fee: FeeRow | null }>({
    fee: null,
  });
  const [payForm, setPayForm] = useState({
    amount: "",
    method: "cash",
    notes: "",
  });
  const [paying, setPaying] = useState(false);

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
      .select("*, students(name, class_id), fee_payments(*)")
      .eq("month", parseInt(filters.month))
      .eq("year", parseInt(filters.year))
      .order("paid")
      .order("created_at", { ascending: true });

    if (filters.paid !== "") query = query.eq("paid", filters.paid === "true");

    const { data } = await query;
    let list = (data || []) as FeeRow[];
    if (filters.class_id)
      list = list.filter((f) => f.students?.class_id === filters.class_id);
    setFees(list);
    setLoading(false);
  }, [filters]);

  useEffect(() => {
    loadFees();
  }, [loadFees]);

  const openPayModal = (fee: FeeRow) => {
    const payments = fee.fee_payments || [];
    const alreadyPaid = payments.reduce((s, p) => s + Number(p.amount_paid), 0);
    const remaining = Math.max(0, Number(fee.amount) - alreadyPaid);
    setPayForm({ amount: String(remaining), method: "cash", notes: "" });
    setPayModal({ fee });
  };

  const submitPayment = async () => {
    if (!payModal.fee || !payForm.amount) return;
    setPaying(true);
    const amt = parseFloat(payForm.amount);
    if (isNaN(amt) || amt <= 0) {
      setPaying(false);
      return;
    }

    await supabase.from("fee_payments").insert({
      fee_id: payModal.fee.id,
      amount_paid: amt,
      payment_date: new Date().toISOString().split("T")[0],
      payment_method: payForm.method,
      notes: payForm.notes || null,
    });

    setPaying(false);
    setPayModal({ fee: null });
    loadFees();
  };

  const undoPayment = async (feeId: string) => {
    if (!confirm("Remove last payment for this month?")) return;
    // Delete the most recent payment
    const fee = fees.find((f) => f.id === feeId);
    if (!fee) return;
    const payments = [...(fee.fee_payments || [])].sort((a, b) =>
      b.payment_date.localeCompare(a.payment_date),
    );
    if (payments.length === 0) return;
    await supabase.from("fee_payments").delete().eq("id", payments[0].id);
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
        "Could not generate fees. Make sure the generate_monthly_fees function exists.",
      );
    }
    setGenerating(false);
    loadFees();
  };

  const set = (k: string, v: string) => setFilters((f) => ({ ...f, [k]: v }));

  const totalPaid = fees.reduce((s, f) => {
    return (
      s +
      (f.fee_payments || []).reduce((ps, p) => ps + Number(p.amount_paid), 0)
    );
  }, 0);
  const totalDue = fees.reduce(
    (s, f) => s + (!f.paid ? Number(f.amount) : 0),
    0,
  );

  return (
    <div className="pb-20 sm:pb-0">
      <div className="page-header">
        <h1 className="page-title">Fees</h1>
        <button
          onClick={generateFees}
          disabled={generating}
          className="btn-primary btn-sm"
        >
          <RefreshCw size={14} className={generating ? "animate-spin" : ""} />
          {generating ? "Generating..." : "Generate"}
        </button>
      </div>

      {/* Filters */}
      <div className="px-4 py-3 bg-white border-b border-slate-200 space-y-2">
        <div className="flex gap-2">
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
            className="input w-24"
            value={filters.paid}
            onChange={(e) => set("paid", e.target.value)}
          >
            <option value="">All</option>
            <option value="false">Unpaid</option>
            <option value="true">Paid</option>
          </select>
        </div>
        <select
          className="input w-full"
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
      </div>

      {/* Summary */}
      <div className="px-4 py-2 bg-slate-50 border-b border-slate-200 flex gap-4 text-xs font-medium">
        <span className="text-slate-500">{fees.length} records</span>
        <span className="text-emerald-600">
          Collected: Rs.{totalPaid.toLocaleString()}
        </span>
        <span className="text-red-500">
          Due: Rs.{totalDue.toLocaleString()}
        </span>
      </div>

      {/* Fee list */}
      <div className="p-4 space-y-2">
        {loading && (
          <div className="card p-8 text-center text-slate-400">Loading...</div>
        )}
        {!loading && fees.length === 0 && (
          <div className="card p-10 text-center text-slate-400">
            <p className="mb-2">No fee records.</p>
            <button
              onClick={generateFees}
              className="text-blue-600 text-sm font-medium"
            >
              Generate fees for {MONTHS[parseInt(filters.month) - 1]} →
            </button>
          </div>
        )}
        {!loading &&
          fees.map((f) => {
            const payments = f.fee_payments || [];
            const amtPaid = payments.reduce(
              (s, p) => s + Number(p.amount_paid),
              0,
            );
            const remaining = Number(f.amount) - amtPaid;
            const isPartial = !f.paid && amtPaid > 0;

            return (
              <div
                key={f.id}
                className={`card p-4 ${!f.paid && !isPartial ? "border-red-100" : isPartial ? "border-amber-100" : ""}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-slate-900 truncate">
                      {f.students?.name}
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      Total: Rs.{Number(f.amount).toLocaleString()}
                      {amtPaid > 0 && (
                        <span className="text-emerald-600">
                          {" "}
                          · Paid: Rs.{amtPaid.toLocaleString()}
                        </span>
                      )}
                      {!f.paid && remaining > 0 && (
                        <span className="text-red-500">
                          {" "}
                          · Due: Rs.{remaining.toLocaleString()}
                        </span>
                      )}
                    </div>
                    {/* Payment history mini */}
                    {payments.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {payments.map((p) => (
                          <span
                            key={p.id}
                            className="text-[10px] bg-slate-100 text-slate-500 rounded px-1.5 py-0.5"
                          >
                            Rs.{Number(p.amount_paid).toLocaleString()} ·{" "}
                            {p.payment_date}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    {f.paid ? (
                      <span className="badge-green">Paid</span>
                    ) : isPartial ? (
                      <span className="badge-amber">Partial</span>
                    ) : (
                      <span className="badge-red">Unpaid</span>
                    )}
                    <div className="flex gap-2">
                      {!f.paid && (
                        <button
                          onClick={() => openPayModal(f)}
                          className="flex items-center gap-1 text-xs text-blue-600 font-semibold hover:text-blue-800"
                        >
                          <CreditCard size={12} /> Pay
                        </button>
                      )}
                      {payments.length > 0 && (
                        <button
                          onClick={() => undoPayment(f.id)}
                          className="text-xs text-slate-400 hover:text-red-500 font-medium"
                        >
                          Undo
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
      </div>

      {/* Payment modal */}
      {payModal.fee && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/60"
            onClick={() => setPayModal({ fee: null })}
          />
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl p-5 space-y-4 sm:max-w-sm sm:mx-auto sm:rounded-2xl sm:bottom-auto sm:top-1/2 sm:-translate-y-1/2">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900">Record Payment</h3>
              <button
                onClick={() => setPayModal({ fee: null })}
                className="text-slate-400"
              >
                <X size={20} />
              </button>
            </div>
            <div className="bg-slate-50 rounded-xl p-3 text-sm">
              <div className="font-medium text-slate-800">
                {payModal.fee.students?.name}
              </div>
              <div className="text-slate-500 text-xs">
                {MONTHS[payModal.fee.month - 1]} {payModal.fee.year} · Total:
                Rs.{Number(payModal.fee.amount).toLocaleString()}
              </div>
            </div>
            <div>
              <label className="label">Amount Received (Rs.) *</label>
              <input
                type="number"
                className="input"
                value={payForm.amount}
                onChange={(e) =>
                  setPayForm((f) => ({ ...f, amount: e.target.value }))
                }
                placeholder="Enter amount"
                min="1"
                autoFocus
              />
              <p className="text-xs text-slate-400 mt-1">
                Can be partial (less) or advance (more than due).
              </p>
            </div>
            <div>
              <label className="label">Payment Method</label>
              <select
                className="input"
                value={payForm.method}
                onChange={(e) =>
                  setPayForm((f) => ({ ...f, method: e.target.value }))
                }
              >
                <option value="cash">Cash</option>
                <option value="bank">Bank Transfer</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="label">Notes (optional)</label>
              <input
                className="input"
                value={payForm.notes}
                onChange={(e) =>
                  setPayForm((f) => ({ ...f, notes: e.target.value }))
                }
                placeholder="e.g. Paid 2 months advance"
              />
            </div>
            <button
              onClick={submitPayment}
              disabled={paying || !payForm.amount}
              className="btn-primary w-full justify-center"
            >
              <CheckCircle size={15} />{" "}
              {paying ? "Saving..." : "Confirm Payment"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

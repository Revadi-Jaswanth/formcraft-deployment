/**
 * Condition / Rule Builder — visual UI to create show/hide/require rules
 * with both Form Builder and Interactive Diagram Flow Graph representations.
 */
import { useState } from "react";
import { Plus, Trash2, GitBranch, ArrowRight, LayoutList, Network } from "lucide-react";
import { useConditions, useAddCondition, useDeleteCondition } from "@/hooks/useConditions";
import { CONDITION_OPERATORS, CONDITION_ACTIONS } from "@/lib/fieldTypes";
import Spinner from "@/components/ui/Spinner";
import RuleVisualizerGraph from "./RuleVisualizerGraph";

export default function ConditionBuilder({ formId, fields }) {
  const { data: conditions = [], isLoading } = useConditions(formId);
  const addCondition = useAddCondition(formId);
  const deleteCondition = useDeleteCondition(formId);

  const [activeTab, setActiveTab] = useState("diagram"); // "builder" | "diagram"

  const [form, setForm] = useState({
    source_field_id: "",
    operator: "equals",
    value: "",
    action: "show",
    target_field_id: "",
  });

  if (fields.length < 2) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center gap-3">
        <GitBranch className="w-10 h-10 text-slate-600" />
        <p className="font-medium text-slate-400">Need at least 2 fields</p>
        <p className="text-sm text-slate-600">
          Add more fields to the form before creating conditional rules.
        </p>
      </div>
    );
  }

  const noValueOperators = ["is_empty", "is_not_empty"];

  const handleAdd = () => {
    if (!form.source_field_id || !form.target_field_id) return;
    addCondition.mutate(
      {
        source_field_id: form.source_field_id,
        operator: form.operator,
        value: noValueOperators.includes(form.operator) ? null : form.value,
        action: form.action,
        target_field_id: form.target_field_id,
      },
      { onSuccess: () => setForm((f) => ({ ...f, value: "" })) }
    );
  };

  return (
    <div className="space-y-6 max-w-4xl animate-fade-in">
      {/* Header & View Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-slate-100 text-lg">Conditional Logic & Rule Flow</h3>
          <p className="text-slate-400 text-xs mt-0.5">
            Define dynamic show/hide/require dependencies between form fields.
          </p>
        </div>

        {/* Tab View Switcher */}
        <div className="flex items-center p-1 bg-surface-900 border border-surface-800 rounded-xl shrink-0">
          <button
            onClick={() => setActiveTab("diagram")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "diagram"
                ? "bg-brand-500 text-white shadow"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Network className="w-3.5 h-3.5" />
            Flow Graph
          </button>
          <button
            onClick={() => setActiveTab("builder")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "builder"
                ? "bg-brand-500 text-white shadow"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <LayoutList className="w-3.5 h-3.5" />
            Rule List
          </button>
        </div>
      </div>

      {/* ── Add Rule Form Panel ────────────────────────────────────── */}
      <div className="card p-5 space-y-4 border border-surface-800 bg-surface-900/60 backdrop-blur-md">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold uppercase tracking-wider text-brand-400">
            Create Conditional Rule
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
          {/* When field */}
          <div>
            <label className="label text-xs font-semibold">When Trigger Field</label>
            <select
              className="select text-xs py-2"
              value={form.source_field_id}
              onChange={(e) => setForm((f) => ({ ...f, source_field_id: e.target.value }))}
            >
              <option value="">Select field…</option>
              {fields.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.label}
                </option>
              ))}
            </select>
          </div>

          {/* Operator */}
          <div>
            <label className="label text-xs font-semibold">Operator</label>
            <select
              className="select text-xs py-2"
              value={form.operator}
              onChange={(e) => setForm((f) => ({ ...f, operator: e.target.value }))}
            >
              {CONDITION_OPERATORS.map((op) => (
                <option key={op.value} value={op.value}>
                  {op.label}
                </option>
              ))}
            </select>
          </div>

          {/* Value */}
          <div>
            <label className="label text-xs font-semibold">Compare Value</label>
            {(() => {
              const srcField = fields.find((f) => f.id === form.source_field_id);
              const opts = srcField?.options || [];
              if (opts.length > 0 && !noValueOperators.includes(form.operator)) {
                return (
                  <select
                    className="select text-xs py-2"
                    value={form.value}
                    onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))}
                  >
                    <option value="">Select option…</option>
                    {opts.map((opt) => (
                      <option key={opt.id || opt.value} value={opt.value}>
                        {opt.label} ({opt.value})
                      </option>
                    ))}
                  </select>
                );
              }
              return (
                <input
                  className="input text-xs py-2"
                  placeholder={
                    noValueOperators.includes(form.operator) ? "(not needed)" : "Enter value..."
                  }
                  value={form.value}
                  disabled={noValueOperators.includes(form.operator)}
                  onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))}
                />
              );
            })()}
          </div>

          {/* Action */}
          <div>
            <label className="label text-xs font-semibold">Then Action</label>
            <select
              className="select text-xs py-2"
              value={form.action}
              onChange={(e) => setForm((f) => ({ ...f, action: e.target.value }))}
            >
              {CONDITION_ACTIONS.map((a) => (
                <option key={a.value} value={a.value}>
                  {a.label}
                </option>
              ))}
            </select>
          </div>

          {/* Target field */}
          <div>
            <label className="label text-xs font-semibold font-semibold">Target Field</label>
            <select
              className="select text-xs py-2"
              value={form.target_field_id}
              onChange={(e) => setForm((f) => ({ ...f, target_field_id: e.target.value }))}
            >
              <option value="">Select field…</option>
              {fields
                .filter((f) => f.id !== form.source_field_id)
                .map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.label}
                  </option>
                ))}
            </select>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            className="btn-primary text-xs py-2 px-4 flex items-center gap-2"
            onClick={handleAdd}
            disabled={!form.source_field_id || !form.target_field_id || addCondition.isPending}
          >
            {addCondition.isPending ? <Spinner size="xs" /> : <Plus className="w-4 h-4" />}
            Add Condition Rule
          </button>
        </div>
      </div>

      {/* ── Active Rules Display (Diagram or List View) ────────────────────────────────── */}
      {isLoading ? (
        <div className="py-12 flex justify-center">
          <Spinner />
        </div>
      ) : activeTab === "diagram" ? (
        <RuleVisualizerGraph
          conditions={conditions}
          fields={fields}
          onDelete={(id) => deleteCondition.mutate(id)}
        />
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Rule List ({conditions.length})
            </p>
          </div>

          {conditions.length === 0 ? (
            <div className="card px-5 py-8 text-center text-slate-500 text-sm">
              No conditional rules configured. Create a rule above.
            </div>
          ) : (
            <div className="space-y-2">
              {conditions.map((cond) => {
                const srcField = fields.find((f) => f.id === cond.source_field_id);
                const tgtField = fields.find((f) => f.id === cond.target_field_id);
                const op = CONDITION_OPERATORS.find((o) => o.value === cond.operator);
                const action = CONDITION_ACTIONS.find((a) => a.value === cond.action);

                return (
                  <div
                    key={cond.id}
                    className="flex items-center gap-3 p-4 card border border-surface-800 bg-surface-900/40 hover:border-surface-750 transition-colors group"
                  >
                    <GitBranch className="w-4 h-4 text-brand-400 shrink-0" />
                    <div className="flex-1 flex flex-wrap items-center gap-1.5 text-xs">
                      <span className="font-bold text-slate-200">
                        {srcField?.label ?? "Unknown Field"}
                      </span>
                      <span className="text-slate-500 font-medium">{op?.label}</span>
                      {cond.value && (
                        <span className="px-2 py-0.5 bg-surface-800 rounded font-mono text-slate-300">
                          "{cond.value}"
                        </span>
                      )}
                      <ArrowRight className="w-3.5 h-3.5 text-slate-600" />
                      <span
                        className={`font-bold ${
                          cond.action === "show"
                            ? "text-emerald-400"
                            : cond.action === "hide"
                            ? "text-amber-400"
                            : cond.action === "require"
                            ? "text-rose-400"
                            : "text-purple-400"
                        }`}
                      >
                        {action?.label}
                      </span>
                      <span className="text-slate-500">→</span>
                      <span className="font-bold text-slate-200">
                        {tgtField?.label ?? "Unknown Field"}
                      </span>
                    </div>
                    <button
                      className="p-1.5 text-slate-500 hover:text-red-400 rounded-lg hover:bg-red-500/10 transition-colors"
                      onClick={() => deleteCondition.mutate(cond.id)}
                      title="Delete Rule"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

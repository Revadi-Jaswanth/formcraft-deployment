/**
 * Condition Builder — visual UI to create show/hide/require rules.
 */
import { useState } from "react";
import { Plus, Trash2, GitBranch, ArrowRight } from "lucide-react";
import { useConditions, useAddCondition, useDeleteCondition } from "@/hooks/useConditions";
import { CONDITION_OPERATORS, CONDITION_ACTIONS, getFieldLabel } from "@/lib/fieldTypes";
import Spinner from "@/components/ui/Spinner";

export default function ConditionBuilder({ formId, fields }) {
  const { data: conditions = [], isLoading } = useConditions(formId);
  const addCondition = useAddCondition(formId);
  const deleteCondition = useDeleteCondition(formId);

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
          Add more fields to the form before creating conditions.
        </p>
      </div>
    );
  }

  const noValueOperators = ["is_empty", "is_not_empty"];

  const handleAdd = () => {
    if (!form.source_field_id || !form.target_field_id) return;
    addCondition.mutate({
      source_field_id: form.source_field_id,
      operator: form.operator,
      value: noValueOperators.includes(form.operator) ? null : form.value,
      action: form.action,
      target_field_id: form.target_field_id,
    }, { onSuccess: () => setForm((f) => ({ ...f, value: "" })) });
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h3 className="font-semibold text-slate-100 text-lg">Conditional Logic</h3>
        <p className="text-slate-400 text-sm mt-1">
          Define rules to show, hide, or require fields based on other field values.
        </p>
      </div>

      {/* ── Add rule form ────────────────────────────────────── */}
      <div className="card p-5 space-y-4">
        <p className="text-sm font-medium text-slate-300">Add New Rule</p>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-5 items-end">
          {/* When field */}
          <div>
            <label className="label text-xs">When field</label>
            <select
              className="select text-xs"
              value={form.source_field_id}
              onChange={(e) => setForm((f) => ({ ...f, source_field_id: e.target.value }))}
            >
              <option value="">Select field…</option>
              {fields.map((f) => (
                <option key={f.id} value={f.id}>{f.label}</option>
              ))}
            </select>
          </div>

          {/* Operator */}
          <div>
            <label className="label text-xs">Operator</label>
            <select
              className="select text-xs"
              value={form.operator}
              onChange={(e) => setForm((f) => ({ ...f, operator: e.target.value }))}
            >
              {CONDITION_OPERATORS.map((op) => (
                <option key={op.value} value={op.value}>{op.label}</option>
              ))}
            </select>
          </div>

          {/* Value */}
          <div>
            <label className="label text-xs">Value</label>
            <input
              className="input text-xs"
              placeholder={noValueOperators.includes(form.operator) ? "(not needed)" : "Compare value"}
              value={form.value}
              disabled={noValueOperators.includes(form.operator)}
              onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))}
            />
          </div>

          {/* Action */}
          <div>
            <label className="label text-xs">Then action</label>
            <select
              className="select text-xs"
              value={form.action}
              onChange={(e) => setForm((f) => ({ ...f, action: e.target.value }))}
            >
              {CONDITION_ACTIONS.map((a) => (
                <option key={a.value} value={a.value}>{a.label}</option>
              ))}
            </select>
          </div>

          {/* Target field */}
          <div>
            <label className="label text-xs">Target field</label>
            <select
              className="select text-xs"
              value={form.target_field_id}
              onChange={(e) => setForm((f) => ({ ...f, target_field_id: e.target.value }))}
            >
              <option value="">Select field…</option>
              {fields
                .filter((f) => f.id !== form.source_field_id)
                .map((f) => (
                  <option key={f.id} value={f.id}>{f.label}</option>
                ))}
            </select>
          </div>
        </div>

        <button
          className="btn-primary btn-sm"
          onClick={handleAdd}
          disabled={!form.source_field_id || !form.target_field_id || addCondition.isPending}
        >
          {addCondition.isPending ? <Spinner size="xs" /> : <Plus className="w-3.5 h-3.5" />}
          Add Rule
        </button>
      </div>

      {/* ── Existing rules ────────────────────────────────── */}
      <div>
        <p className="text-sm font-medium text-slate-400 mb-3">
          {conditions.length} Rule{conditions.length !== 1 ? "s" : ""}
        </p>

        {isLoading ? (
          <Spinner />
        ) : conditions.length === 0 ? (
          <div className="card px-5 py-8 text-center text-slate-500 text-sm">
            No conditions yet. Add a rule above.
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
                  className="flex items-center gap-3 p-4 card group"
                >
                  <GitBranch className="w-4 h-4 text-brand-400 shrink-0" />
                  <div className="flex-1 flex flex-wrap items-center gap-1.5 text-sm">
                    <span className="font-medium text-slate-300">
                      {srcField?.label ?? "Unknown"}
                    </span>
                    <span className="text-slate-500">{op?.label}</span>
                    {cond.value && (
                      <span className="px-2 py-0.5 bg-surface-800 rounded text-xs text-slate-300">
                        {cond.value}
                      </span>
                    )}
                    <ArrowRight className="w-3.5 h-3.5 text-slate-600" />
                    <span
                      className={`font-medium ${
                        cond.action === "show"
                          ? "text-emerald-400"
                          : cond.action === "hide"
                          ? "text-orange-400"
                          : cond.action === "require"
                          ? "text-red-400"
                          : "text-slate-400"
                      }`}
                    >
                      {action?.label}
                    </span>
                    <span className="text-slate-500">→</span>
                    <span className="font-medium text-slate-300">
                      {tgtField?.label ?? "Unknown"}
                    </span>
                  </div>
                  <button
                    className="btn-icon opacity-0 group-hover:opacity-100 hover:text-red-400"
                    onClick={() => deleteCondition.mutate(cond.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

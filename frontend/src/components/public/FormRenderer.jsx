/**
 * FormRenderer — the actual form UI used by both:
 *   1. PublicForm page (real submission)
 *   2. PreviewModal (no submission, isPreview=true)
 *
 * Implements client-side conditional logic (show/hide fields).
 */
import { useState, useMemo } from "react";
import { Star, Upload, CheckSquare } from "lucide-react";
import { getFieldIcon, getFieldLabel } from "@/lib/fieldTypes";

export default function FormRenderer({ form, isPreview = false, onSubmit, submitting }) {
  const [values, setValues] = useState({});
  const [errors, setErrors] = useState({});

  const settings = form.settings || {};
  const conditions = form.conditions || [];

  // ── Evaluate conditions to determine field visibility ────────
  const visibleFieldIds = useMemo(() => {
    const hidden = new Set();
    for (const cond of conditions) {
      const srcValue = values[cond.source_field_id] ?? "";
      const matches = evaluateCondition(cond, srcValue);
      if (matches && cond.action === "hide") hidden.add(cond.target_field_id);
      if (!matches && cond.action === "show") hidden.add(cond.target_field_id);
    }
    return new Set(form.fields.map((f) => f.id).filter((id) => !hidden.has(id)));
  }, [values, conditions, form.fields]);

  const visibleFields = form.fields.filter((f) => visibleFieldIds.has(f.id));

  const setValue = (fieldId, value) => {
    setValues((v) => ({ ...v, [fieldId]: value }));
    setErrors((e) => ({ ...e, [fieldId]: null }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isPreview) return;

    // Basic required-field validation
    const newErrors = {};
    for (const field of visibleFields) {
      if (field.is_required && !values[field.id]) {
        newErrors[field.id] = "This field is required";
      }
    }
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const responses = visibleFields.map((f) => ({
      field_id: f.id,
      value: values[f.id] ?? null,
    }));
    onSubmit?.(responses);
  };

  const totalFields = visibleFields.length;

  return (
    <div className="bg-surface-900 rounded-2xl border border-surface-800 shadow-card overflow-hidden">
      {/* Form header */}
      <div className="px-8 pt-8 pb-6 bg-gradient-to-b from-brand-600/10 to-transparent border-b border-surface-800">
        <h1 className="text-2xl font-bold text-slate-100">{form.title}</h1>
        {form.description && (
          <p className="text-slate-400 mt-2 text-sm">{form.description}</p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="px-8 py-6 space-y-6">
        {visibleFields.map((field, idx) => (
          <FieldInput
            key={field.id}
            field={field}
            value={values[field.id]}
            error={errors[field.id]}
            onChange={(v) => setValue(field.id, v)}
          />
        ))}

        {!isPreview && (
          <div className="pt-4">
            <button
              type="submit"
              className="btn-primary btn-lg w-full justify-center"
              disabled={submitting}
            >
              {submitting ? "Submitting…" : settings.submit_button_text || "Submit"}
            </button>
          </div>
        )}

        {isPreview && (
          <div className="text-center py-4">
            <p className="text-xs text-slate-500">
              Preview mode — submission disabled
            </p>
          </div>
        )}
      </form>
    </div>
  );
}

function FieldInput({ field, value, error, onChange }) {
  const isRequired = field.is_required;
  const config = field.config || {};

  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-slate-200">
        {field.label}
        {isRequired && <span className="ml-1 text-red-400">*</span>}
      </label>
      {field.description && (
        <p className="text-xs text-slate-500">{field.description}</p>
      )}

      {/* ── Render based on type ───────────────────────────── */}
      {field.field_type === "text" && (
        <input
          className={`input ${error ? "input-error" : ""}`}
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder || ""}
          minLength={config.min_length}
          maxLength={config.max_length}
        />
      )}

      {field.field_type === "textarea" && (
        <textarea
          className={`textarea ${error ? "input-error" : ""}`}
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder || ""}
          rows={config.rows || 4}
        />
      )}

      {field.field_type === "number" && (
        <input
          className={`input ${error ? "input-error" : ""}`}
          type="number"
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder || "0"}
          min={config.min_value}
          max={config.max_value}
          step={config.integer_only ? 1 : undefined}
        />
      )}

      {field.field_type === "email" && (
        <input
          className={`input ${error ? "input-error" : ""}`}
          type="email"
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder || "you@example.com"}
        />
      )}

      {field.field_type === "phone" && (
        <input
          className={`input ${error ? "input-error" : ""}`}
          type="tel"
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder || "+1 (555) 000-0000"}
        />
      )}

      {field.field_type === "date" && (
        <input
          className={`input ${error ? "input-error" : ""}`}
          type={config.include_time ? "datetime-local" : "date"}
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          min={config.min_date}
          max={config.max_date}
        />
      )}

      {field.field_type === "dropdown" && (
        <select
          className={`select ${error ? "input-error" : ""}`}
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="">Choose an option…</option>
          {field.options?.map((opt) => (
            <option key={opt.id} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      )}

      {field.field_type === "multi_checkbox" && (
        <div className="space-y-2">
          {field.options?.map((opt) => {
            const selected = (value || "").split(",").filter(Boolean);
            const checked = selected.includes(opt.value);
            return (
              <label
                key={opt.id}
                className="flex items-center gap-2.5 cursor-pointer group"
              >
                <input
                  type="checkbox"
                  className="checkbox"
                  checked={checked}
                  onChange={() => {
                    const next = checked
                      ? selected.filter((v) => v !== opt.value)
                      : [...selected, opt.value];
                    onChange(next.join(","));
                  }}
                />
                <span className="text-sm text-slate-300 group-hover:text-slate-100 transition-colors">
                  {opt.label}
                </span>
              </label>
            );
          })}
        </div>
      )}

      {field.field_type === "rating" && (
        <RatingInput
          scale={config.scale || 5}
          value={value ? Number(value) : 0}
          onChange={(v) => onChange(String(v))}
          lowLabel={config.low_label}
          highLabel={config.high_label}
        />
      )}

      {field.field_type === "file_upload" && (
        <div
          className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors
                      ${error ? "border-red-500/50" : "border-surface-700 hover:border-brand-500/50"}`}
        >
          <Upload className="w-8 h-8 text-slate-600 mx-auto mb-2" />
          <p className="text-sm text-slate-400">Click or drag files here</p>
          <p className="text-xs text-slate-600 mt-1">
            Max {config.max_size_mb || 10} MB
          </p>
          <input
            type="file"
            className="absolute inset-0 opacity-0 cursor-pointer"
            multiple={config.multiple}
            onChange={(e) => onChange(e.target.files[0]?.name || "")}
          />
        </div>
      )}

      {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
    </div>
  );
}

function RatingInput({ scale, value, onChange, lowLabel, highLabel }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1">
        {Array.from({ length: scale }, (_, i) => i + 1).map((n) => (
          <button
            key={n}
            type="button"
            className={`w-9 h-9 transition-all duration-100 ${
              n <= (hovered || value) ? "text-yellow-400 scale-110" : "text-slate-700"
            }`}
            onMouseEnter={() => setHovered(n)}
            onMouseLeave={() => setHovered(0)}
            onClick={() => onChange(n)}
          >
            <Star className="w-full h-full fill-current" />
          </button>
        ))}
      </div>
      {(lowLabel || highLabel) && (
        <div className="flex justify-between text-xs text-slate-500">
          <span>{lowLabel}</span>
          <span>{highLabel}</span>
        </div>
      )}
    </div>
  );
}

function evaluateCondition(cond, value) {
  const v = String(value ?? "").toLowerCase();
  const cv = String(cond.value ?? "").toLowerCase();
  switch (cond.operator) {
    case "equals": return v === cv;
    case "not_equals": return v !== cv;
    case "contains": return v.includes(cv);
    case "not_contains": return !v.includes(cv);
    case "greater_than": return Number(v) > Number(cv);
    case "less_than": return Number(v) < Number(cv);
    case "is_empty": return !value || v === "";
    case "is_not_empty": return !!value && v !== "";
    case "in": return cv.split(",").map((s) => s.trim()).includes(v);
    default: return false;
  }
}

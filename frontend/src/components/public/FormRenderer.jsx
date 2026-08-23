/**
 * FormRenderer — production-grade dynamic form renderer.
 *
 * Highlights:
 *   - Modular FieldFactory registry (no inline switch statements).
 *   - React Hook Form + Zod dynamic schema validation.
 *   - Real-time conditional rule evaluation (show/hide/require/disable).
 *   - Empty state when no fields exist.
 *   - Progress bar indicator (if enabled in form settings).
 *   - Sticky mobile submit bar for enhanced UX on small screens.
 */
import { useState, useMemo, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { buildZodSchema } from "@/lib/buildZodSchema";
import FieldFactory from "./fields/FieldFactory";
import { FileSpreadsheet } from "lucide-react";

export default function FormRenderer({
  form,
  isPreview = false,
  onSubmit,
  submitting = false,
}) {
  const settings = form.settings || {};
  const conditions = form.conditions || [];
  const fields = form.fields || [];

  // Default initial values map
  const defaultValues = useMemo(() => {
    const vals = {};
    for (const f of fields) {
      vals[f.id] = "";
    }
    return vals;
  }, [fields]);

  // Track values for live conditional evaluation
  const [formValues, setFormValues] = useState(defaultValues);

  // Evaluate conditional rules locally to compute states per field
  const fieldStates = useMemo(() => {
    const states = {};
    for (const f of fields) {
      states[f.id] = { visible: true, required: f.is_required, disabled: false };
    }

    for (const cond of conditions) {
      const srcValue = formValues[cond.source_field_id] ?? "";
      const matches = evaluateCondition(cond, srcValue);

      const targetState = states[cond.target_field_id];
      if (targetState) {
        if (matches && cond.action === "hide") targetState.visible = false;
        if (!matches && cond.action === "show") targetState.visible = false;
        if (matches && cond.action === "require") targetState.required = true;
        if (matches && cond.action === "disable") targetState.disabled = true;
      }
    }

    return states;
  }, [formValues, conditions, fields]);

  // Visible fields filter
  const visibleFields = useMemo(() => {
    return fields.filter((f) => fieldStates[f.id]?.visible);
  }, [fields, fieldStates]);

  // Build Zod validation schema
  const schema = useMemo(() => {
    return buildZodSchema(fields, fieldStates);
  }, [fields, fieldStates]);

  // React Hook Form
  const {
    control,
    handleSubmit,
    watch,
    setError,
    formState: { errors, touchedFields },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues,
    mode: "onBlur",
  });

  // Watch form fields live for conditional rule evaluation
  useEffect(() => {
    const subscription = watch((value) => {
      setFormValues(value);
    });
    return () => subscription.unsubscribe();
  }, [watch]);

  // Calculate form completion progress percentage
  const progressPercent = useMemo(() => {
    if (visibleFields.length === 0) return 0;
    const filledCount = visibleFields.filter((f) => {
      const val = formValues[f.id];
      return val !== undefined && val !== null && String(val).trim() !== "";
    }).length;
    return Math.round((filledCount / visibleFields.length) * 100);
  }, [visibleFields, formValues]);

  // Handle Form Submit
  const onFormSubmit = (data) => {
    if (isPreview) return;

    // Filter responses to only include visible fields
    const responses = visibleFields.map((f) => ({
      field_id: f.id,
      value: data[f.id] !== undefined && data[f.id] !== null ? String(data[f.id]) : null,
    }));

    onSubmit?.(responses, setError);
  };

  // Empty state when form contains 0 fields
  if (fields.length === 0) {
    return (
      <div className="bg-surface-900 rounded-2xl border border-surface-800 p-12 text-center space-y-4 shadow-card">
        <div className="w-14 h-14 rounded-2xl bg-surface-800 flex items-center justify-center mx-auto text-slate-500">
          <FileSpreadsheet className="w-7 h-7" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-slate-200">No Fields in Form</h3>
          <p className="text-slate-400 text-sm mt-1">
            This form has not been configured with any questions yet.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface-900 rounded-2xl border border-surface-800 shadow-card overflow-hidden transition-all">
      {/* Optional Progress Bar */}
      {settings.show_progress_bar !== false && (
        <div className="w-full bg-surface-800 h-1.5 overflow-hidden">
          <div
            className="bg-gradient-to-r from-brand-500 to-violet-500 h-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
            role="progressbar"
            aria-valuenow={progressPercent}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        </div>
      )}

      {/* Form Header */}
      <div className="px-8 pt-8 pb-6 bg-gradient-to-b from-brand-600/10 to-transparent border-b border-surface-800">
        <h1 className="text-2xl font-bold text-slate-100">{form.title}</h1>
        {form.description && (
          <p className="text-slate-400 mt-2 text-sm leading-relaxed">{form.description}</p>
        )}
      </div>

      <form onSubmit={handleSubmit(onFormSubmit)} className="px-8 py-6 space-y-6">
        {/* Dynamic Field Grid */}
        <div className="space-y-6">
          {visibleFields.map((field) => {
            const state = fieldStates[field.id] || {};
            const isRequired = field.is_required || state.required;
            const fieldError = errors[field.id]?.message;

            return (
              <Controller
                key={field.id}
                name={field.id}
                control={control}
                render={({ field: controllerField }) => (
                  <FieldFactory
                    field={field}
                    controllerField={controllerField}
                    error={fieldError}
                    disabled={state.disabled}
                    isRequired={isRequired}
                  />
                )}
              />
            );
          })}
        </div>

        {/* Submit Button Section */}
        {!isPreview && (
          <div className="pt-4 sticky bottom-4 sm:relative sm:bottom-0">
            <button
              type="submit"
              className="btn-primary btn-lg w-full justify-center shadow-glow font-semibold"
              disabled={submitting}
            >
              {submitting ? "Submitting…" : settings.submit_button_text || "Submit"}
            </button>
          </div>
        )}

        {isPreview && (
          <div className="text-center py-4 border-t border-surface-800/60">
            <p className="text-xs text-slate-500">
              Preview mode — submission disabled
            </p>
          </div>
        )}
      </form>
    </div>
  );
}

function evaluateCondition(cond, value) {
  const v = String(value ?? "").trim().toLowerCase();
  const cv = String(cond.value ?? "").trim().toLowerCase();

  // Normalize spaces & underscores so "Very Good" matches "very_good"
  const vNorm = v.replace(/_/g, " ");
  const cvNorm = cv.replace(/_/g, " ");

  switch (cond.operator) {
    case "equals":
      return v === cv || vNorm === cvNorm;
    case "not_equals":
      return v !== cv && vNorm !== cvNorm;
    case "contains":
      return v.includes(cv) || vNorm.includes(cvNorm);
    case "not_contains":
      return !v.includes(cv) && !vNorm.includes(cvNorm);
    case "greater_than":
      return Number(v) > Number(cv);
    case "less_than":
      return Number(v) < Number(cv);
    case "is_empty":
      return !value || v === "";
    case "is_not_empty":
      return !!value && v !== "";
    case "in": {
      const inList = cvNorm.split(",").map((s) => s.trim());
      return inList.includes(v) || inList.includes(vNorm);
    }
    default:
      return false;
  }
}

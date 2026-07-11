/**
 * Form Builder — Right panel: field configuration editor.
 * Shows different config options based on field_type.
 */
import { useState, useEffect } from "react";
import { X, Plus, Trash2, GripVertical } from "lucide-react";
import { useUpdateField } from "@/hooks/useFields";
import { getFieldLabel, getFieldColor, getFieldIcon } from "@/lib/fieldTypes";

export default function FieldConfigPanel({ formId, field, onClose }) {
  const updateMutation = useUpdateField(formId);

  const [label, setLabel] = useState(field.label);
  const [description, setDescription] = useState(field.description || "");
  const [placeholder, setPlaceholder] = useState(field.placeholder || "");
  const [isRequired, setIsRequired] = useState(field.is_required);
  const [config, setConfig] = useState(field.config || {});
  const [options, setOptions] = useState(field.options || []);
  const [dirty, setDirty] = useState(false);

  // Reset when field changes
  useEffect(() => {
    setLabel(field.label);
    setDescription(field.description || "");
    setPlaceholder(field.placeholder || "");
    setIsRequired(field.is_required);
    setConfig(field.config || {});
    setOptions(field.options || []);
    setDirty(false);
  }, [field.id]);

  const markDirty = () => setDirty(true);

  const handleSave = () => {
    const data = {
      label,
      description: description || null,
      placeholder: placeholder || null,
      is_required: isRequired,
      config,
    };
    const isChoiceType = ["dropdown", "multi_checkbox"].includes(field.field_type);
    if (isChoiceType) {
      data.options = options.map((o, i) => ({
        label: o.label,
        value: o.value || o.label.toLowerCase().replace(/\s+/g, "_"),
        order_index: i,
      }));
    }
    updateMutation.mutate({ fieldId: field.id, data }, { onSuccess: () => setDirty(false) });
  };

  const Icon = getFieldIcon(field.field_type);
  const color = getFieldColor(field.field_type);

  const isChoiceType = ["dropdown", "multi_checkbox"].includes(field.field_type);

  return (
    <aside className="w-72 shrink-0 bg-surface-900 border-l border-surface-800 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-surface-800">
        <div className="flex items-center gap-2">
          <Icon className={`w-4 h-4 ${color}`} />
          <p className="text-sm font-semibold text-slate-200">
            {getFieldLabel(field.field_type)}
          </p>
        </div>
        <button className="btn-icon" onClick={onClose}>
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Label */}
        <div>
          <label className="label">Label *</label>
          <input
            className="input"
            value={label}
            onChange={(e) => { setLabel(e.target.value); markDirty(); }}
            placeholder="Field label"
          />
        </div>

        {/* Description */}
        <div>
          <label className="label">Helper text</label>
          <input
            className="input"
            value={description}
            onChange={(e) => { setDescription(e.target.value); markDirty(); }}
            placeholder="Optional description shown below the field"
          />
        </div>

        {/* Placeholder (not for date, rating, checkbox) */}
        {!["date", "rating", "multi_checkbox", "file_upload"].includes(field.field_type) && (
          <div>
            <label className="label">Placeholder</label>
            <input
              className="input"
              value={placeholder}
              onChange={(e) => { setPlaceholder(e.target.value); markDirty(); }}
              placeholder="Placeholder text"
            />
          </div>
        )}

        {/* Required toggle */}
        <div className="flex items-center justify-between p-3 bg-surface-800 rounded-lg">
          <div>
            <p className="text-sm font-medium text-slate-200">Required</p>
            <p className="text-xs text-slate-500">Respondents must answer</p>
          </div>
          <button
            className={`w-11 h-6 rounded-full transition-all relative ${
              isRequired ? "bg-brand-600" : "bg-surface-700"
            }`}
            onClick={() => { setIsRequired((v) => !v); markDirty(); }}
          >
            <span
              className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${
                isRequired ? "left-5" : "left-0.5"
              }`}
            />
          </button>
        </div>

        {/* ── Type-specific config ─────────────────────────────── */}
        <div className="border-t border-surface-800 pt-4">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
            Configuration
          </p>

          {/* Text / Textarea */}
          {["text", "textarea"].includes(field.field_type) && (
            <div className="space-y-3">
              <ConfigRow
                label="Min length"
                value={config.min_length ?? 0}
                type="number"
                onChange={(v) => { setConfig((c) => ({ ...c, min_length: Number(v) })); markDirty(); }}
              />
              <ConfigRow
                label="Max length"
                value={config.max_length ?? 5000}
                type="number"
                onChange={(v) => { setConfig((c) => ({ ...c, max_length: Number(v) })); markDirty(); }}
              />
              {field.field_type === "textarea" && (
                <ConfigRow
                  label="Rows"
                  value={config.rows ?? 4}
                  type="number"
                  onChange={(v) => { setConfig((c) => ({ ...c, rows: Number(v) })); markDirty(); }}
                />
              )}
            </div>
          )}

          {/* Number */}
          {field.field_type === "number" && (
            <div className="space-y-3">
              <ConfigRow
                label="Min value"
                value={config.min_value ?? ""}
                type="number"
                onChange={(v) => { setConfig((c) => ({ ...c, min_value: v === "" ? null : Number(v) })); markDirty(); }}
                placeholder="No minimum"
              />
              <ConfigRow
                label="Max value"
                value={config.max_value ?? ""}
                type="number"
                onChange={(v) => { setConfig((c) => ({ ...c, max_value: v === "" ? null : Number(v) })); markDirty(); }}
                placeholder="No maximum"
              />
              <div className="flex items-center justify-between">
                <label className="text-xs text-slate-400">Integer only</label>
                <input
                  type="checkbox"
                  className="checkbox"
                  checked={config.integer_only ?? false}
                  onChange={(e) => { setConfig((c) => ({ ...c, integer_only: e.target.checked })); markDirty(); }}
                />
              </div>
            </div>
          )}

          {/* Rating */}
          {field.field_type === "rating" && (
            <div className="space-y-3">
              <ConfigRow
                label="Scale (max)"
                value={config.scale ?? 5}
                type="number"
                onChange={(v) => { setConfig((c) => ({ ...c, scale: Number(v) })); markDirty(); }}
              />
              <ConfigRow
                label="Low label"
                value={config.low_label ?? "Poor"}
                onChange={(v) => { setConfig((c) => ({ ...c, low_label: v })); markDirty(); }}
              />
              <ConfigRow
                label="High label"
                value={config.high_label ?? "Excellent"}
                onChange={(v) => { setConfig((c) => ({ ...c, high_label: v })); markDirty(); }}
              />
            </div>
          )}

          {/* File upload */}
          {field.field_type === "file_upload" && (
            <div className="space-y-3">
              <ConfigRow
                label="Max size (MB)"
                value={config.max_size_mb ?? 10}
                type="number"
                onChange={(v) => { setConfig((c) => ({ ...c, max_size_mb: Number(v) })); markDirty(); }}
              />
              <div className="flex items-center justify-between">
                <label className="text-xs text-slate-400">Allow multiple</label>
                <input
                  type="checkbox"
                  className="checkbox"
                  checked={config.multiple ?? false}
                  onChange={(e) => { setConfig((c) => ({ ...c, multiple: e.target.checked })); markDirty(); }}
                />
              </div>
            </div>
          )}

          {/* Date */}
          {field.field_type === "date" && (
            <div className="space-y-3">
              <ConfigRow
                label="Min date"
                value={config.min_date ?? ""}
                type="date"
                onChange={(v) => { setConfig((c) => ({ ...c, min_date: v || null })); markDirty(); }}
              />
              <ConfigRow
                label="Max date"
                value={config.max_date ?? ""}
                type="date"
                onChange={(v) => { setConfig((c) => ({ ...c, max_date: v || null })); markDirty(); }}
              />
              <div className="flex items-center justify-between">
                <label className="text-xs text-slate-400">Include time</label>
                <input
                  type="checkbox"
                  className="checkbox"
                  checked={config.include_time ?? false}
                  onChange={(e) => { setConfig((c) => ({ ...c, include_time: e.target.checked })); markDirty(); }}
                />
              </div>
            </div>
          )}

          {/* Dropdown / Multi-checkbox: Options */}
          {isChoiceType && (
            <OptionsEditor
              options={options}
              onChange={(opts) => { setOptions(opts); markDirty(); }}
            />
          )}
        </div>
      </div>

      {/* Footer save button */}
      <div className="px-4 py-3 border-t border-surface-800">
        <button
          className="btn-primary w-full justify-center"
          disabled={!dirty || updateMutation.isPending}
          onClick={handleSave}
        >
          {updateMutation.isPending ? "Saving…" : "Save Changes"}
        </button>
      </div>
    </aside>
  );
}

function ConfigRow({ label, value, type = "text", onChange, placeholder }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <label className="text-xs text-slate-400 shrink-0">{label}</label>
      <input
        className="input text-xs text-right w-28"
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}

function OptionsEditor({ options, onChange }) {
  const handleChange = (index, key, value) => {
    const updated = options.map((o, i) => (i === index ? { ...o, [key]: value } : o));
    onChange(updated);
  };

  const handleAdd = () => {
    onChange([
      ...options,
      { label: `Option ${options.length + 1}`, value: `option_${options.length + 1}`, order_index: options.length },
    ]);
  };

  const handleDelete = (index) => {
    onChange(options.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-2">
      <p className="text-xs text-slate-400 font-medium">Options</p>
      {options.map((opt, i) => (
        <div key={i} className="flex items-center gap-1.5">
          <GripVertical className="w-3.5 h-3.5 text-slate-600 shrink-0" />
          <input
            className="input text-xs flex-1"
            value={opt.label}
            onChange={(e) => handleChange(i, "label", e.target.value)}
            placeholder={`Option ${i + 1}`}
          />
          <button
            className="btn-icon"
            onClick={() => handleDelete(i)}
            disabled={options.length <= 1}
          >
            <Trash2 className="w-3 h-3 text-red-400" />
          </button>
        </div>
      ))}
      <button
        className="btn-ghost btn-sm w-full justify-center border border-dashed border-surface-700"
        onClick={handleAdd}
      >
        <Plus className="w-3.5 h-3.5" />
        Add option
      </button>
    </div>
  );
}

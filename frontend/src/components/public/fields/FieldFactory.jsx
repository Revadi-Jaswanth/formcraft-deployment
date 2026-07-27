import React, { useState } from "react";
import { Upload, Star } from "lucide-react";

export default function FieldFactory({ field, controllerField, error, disabled, isRequired }) {
  const { value, onChange } = controllerField;
  const config = field.config || {};

  return (
    <div className="space-y-1.5 opacity-100 transition-opacity duration-200">
      <label className="block text-sm font-medium text-slate-200">
        {field.label}
        {isRequired && <span className="ml-1 text-red-400">*</span>}
      </label>
      {field.description && (
        <p className="text-xs text-slate-500 leading-relaxed">{field.description}</p>
      )}

      {/* ── Render based on type ───────────────────────────── */}
      <div className="relative">
        {field.field_type === "text" && (
          <input
            className={`input ${error ? "input-error" : ""}`}
            value={value || ""}
            disabled={disabled}
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
            disabled={disabled}
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
            disabled={disabled}
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
            disabled={disabled}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder || "you@example.com"}
          />
        )}

        {field.field_type === "phone" && (
          <input
            className={`input ${error ? "input-error" : ""}`}
            type="tel"
            value={value || ""}
            disabled={disabled}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder || "+1 (555) 000-0000"}
          />
        )}

        {field.field_type === "date" && (
          <input
            className={`input ${error ? "input-error" : ""}`}
            type={config.include_time ? "datetime-local" : "date"}
            value={value || ""}
            disabled={disabled}
            onChange={(e) => onChange(e.target.value)}
            min={config.min_date}
            max={config.max_date}
          />
        )}

        {field.field_type === "dropdown" && (
          <select
            className={`select ${error ? "input-error" : ""}`}
            value={value || ""}
            disabled={disabled}
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
          <div className="space-y-2 py-1">
            {field.options?.map((opt) => {
              const selected = (value || "").split(",").filter(Boolean);
              const checked = selected.includes(opt.value);
              return (
                <label
                  key={opt.id}
                  className={`flex items-center gap-2.5 cursor-pointer group ${disabled ? "opacity-50 pointer-events-none" : ""}`}
                >
                  <input
                    type="checkbox"
                    className="checkbox"
                    checked={checked}
                    disabled={disabled}
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
            disabled={disabled}
            onChange={(v) => onChange(String(v))}
            lowLabel={config.low_label}
            highLabel={config.high_label}
          />
        )}

        {field.field_type === "file_upload" && (
          <div
            className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-colors
                        ${error ? "border-red-500/50" : "border-surface-700 hover:border-brand-500/50"}
                        ${disabled ? "opacity-50 pointer-events-none" : ""}`}
          >
            <Upload className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-sm text-slate-400">
              {value ? `File: ${value}` : "Click or drag files here"}
            </p>
            <p className="text-xs text-slate-600 mt-1">
              Max {config.max_size_mb || 10} MB
            </p>
            <input
              type="file"
              className="absolute inset-0 opacity-0 cursor-pointer"
              disabled={disabled}
              multiple={config.multiple}
              onChange={(e) => onChange(e.target.files[0]?.name || "")}
            />
          </div>
        )}
      </div>

      {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
    </div>
  );
}

function RatingInput({ scale, value, onChange, disabled, lowLabel, highLabel }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="space-y-1 py-1">
      <div className="flex items-center gap-1">
        {Array.from({ length: scale }, (_, i) => i + 1).map((n) => (
          <button
            key={n}
            type="button"
            disabled={disabled}
            className={`w-9 h-9 transition-all duration-100 outline-none
              ${n <= (hovered || value) ? "text-yellow-400 scale-110" : "text-slate-700"}
              ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
            onMouseEnter={() => !disabled && setHovered(n)}
            onMouseLeave={() => !disabled && setHovered(0)}
            onClick={() => onChange(n)}
          >
            <Star className="w-full h-full fill-current" />
          </button>
        ))}
      </div>
      {(lowLabel || highLabel) && (
        <div className="flex justify-between text-xs text-slate-500 max-w-[250px] px-1">
          <span>{lowLabel}</span>
          <span>{highLabel}</span>
        </div>
      )}
    </div>
  );
}

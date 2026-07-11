/**
 * Form Builder — Left panel: field type palette.
 * Clicking a type instantly adds a field to the form.
 */
import { FIELD_TYPES } from "@/lib/fieldTypes";
import { useAddField } from "@/hooks/useFields";
import Spinner from "@/components/ui/Spinner";

export default function FieldTypePanel({ formId, fields }) {
  const addField = useAddField(formId);

  const handleAdd = (fieldType) => {
    addField.mutate({
      field_type: fieldType.type,
      label: fieldType.label,
      is_required: false,
      order_index: fields.length,
      config: fieldType.defaultConfig,
      options:
        fieldType.type === "dropdown" || fieldType.type === "multi_checkbox"
          ? [
              { label: "Option 1", value: "option_1", order_index: 0 },
              { label: "Option 2", value: "option_2", order_index: 1 },
            ]
          : [],
    });
  };

  return (
    <aside className="w-56 shrink-0 bg-surface-900 border-r border-surface-800 flex flex-col overflow-hidden">
      <div className="px-4 py-3 border-b border-surface-800">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Field Types
        </p>
      </div>

      <div className="overflow-y-auto flex-1 p-2 space-y-1">
        {FIELD_TYPES.map((ft) => {
          const Icon = ft.icon;
          return (
            <button
              key={ft.type}
              onClick={() => handleAdd(ft)}
              disabled={addField.isPending}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left
                         hover:bg-surface-800 transition-all duration-150 group
                         disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div
                className={`w-7 h-7 rounded-lg bg-surface-800 group-hover:bg-surface-700
                             flex items-center justify-center shrink-0 transition-colors`}
              >
                <Icon className={`w-3.5 h-3.5 ${ft.color}`} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-slate-300 leading-none">{ft.label}</p>
                <p className="text-xs text-slate-600 mt-0.5 truncate">{ft.description}</p>
              </div>
            </button>
          );
        })}
      </div>

      {addField.isPending && (
        <div className="flex justify-center py-2 border-t border-surface-800">
          <Spinner size="sm" />
        </div>
      )}
    </aside>
  );
}

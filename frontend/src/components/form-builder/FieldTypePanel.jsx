/**
 * Form Builder — Left panel: field type palette.
 *
 * Day 2 update: the field-type catalogue is now fetched from the backend
 * via GET /api/v1/field-types.  The static FIELD_TYPES list is kept as a
 * resilient fallback in case the API is temporarily unavailable, and is
 * used to supply the React component (icon) that cannot be serialised over
 * the wire.
 */
import { useQuery } from "@tanstack/react-query";
import { FIELD_TYPES, FIELD_TYPE_MAP } from "@/lib/fieldTypes";
import { formsApi } from "@/services/formsApi";
import { useAddField } from "@/hooks/useFields";
import Spinner from "@/components/ui/Spinner";

export default function FieldTypePanel({ formId, fields }) {
  const addField = useAddField(formId);

  // Fetch the live catalogue from the backend (stale-while-revalidate, 5 min)
  const { data: apiTypes } = useQuery({
    queryKey: ["field-types"],
    queryFn: () => formsApi.getFieldTypes().then((r) => r.data),
    staleTime: 5 * 60 * 1000,
    // Silently fall back to static list on error — no UI disruption
    retry: 1,
  });

  /**
   * Merge the backend catalogue with the local icon/component map.
   * Backend provides: type, label, description, color, supports_options,
   *                   default_config, config_schema
   * Local provides:   icon (React component), defaultConfig (alias)
   *
   * If the API is unavailable the static list is used verbatim.
   */
  const fieldTypes = apiTypes
    ? apiTypes.map((backendType) => {
        const localMeta = FIELD_TYPE_MAP[backendType.type] ?? {};
        return {
          ...backendType,
          // Use backend label/description/color when available
          defaultConfig: backendType.default_config ?? localMeta.defaultConfig ?? {},
          // Icon must come from the local map (React components can't be serialised)
          icon: localMeta.icon,
        };
      })
    : FIELD_TYPES;

  const handleAdd = (fieldType) => {
    addField.mutate({
      field_type: fieldType.type,
      label: fieldType.label,
      is_required: false,
      order_index: fields.length,
      config: fieldType.defaultConfig ?? fieldType.default_config ?? {},
      options:
        fieldType.supports_options ||
        fieldType.type === "dropdown" ||
        fieldType.type === "multi_checkbox" ||
        fieldType.type === "radio"
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
        {apiTypes && (
          <p className="text-[10px] text-slate-600 mt-0.5">
            {apiTypes.length} types available
          </p>
        )}
      </div>

      <div className="overflow-y-auto flex-1 p-2 space-y-1">
        {fieldTypes.map((ft) => {
          const Icon = ft.icon;
          return (
            <button
              key={ft.type}
              onClick={() => handleAdd(ft)}
              disabled={addField.isPending}
              title={ft.description}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left
                         hover:bg-surface-800 transition-all duration-150 group
                         disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div
                className={`w-7 h-7 rounded-lg bg-surface-800 group-hover:bg-surface-700
                             flex items-center justify-center shrink-0 transition-colors`}
              >
                {Icon ? (
                  <Icon className={`w-3.5 h-3.5 ${ft.color}`} />
                ) : (
                  // Fallback when icon mapping is missing for a new backend type
                  <span className={`text-[10px] font-bold ${ft.color}`}>
                    {ft.type.slice(0, 2).toUpperCase()}
                  </span>
                )}
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

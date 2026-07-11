import { Plus } from "lucide-react";

export default function EmptyState({ title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
      <div className="w-16 h-16 rounded-2xl bg-surface-800 flex items-center justify-center">
        <Plus className="w-8 h-8 text-slate-600" />
      </div>
      <div>
        <p className="font-semibold text-slate-300 text-lg">{title}</p>
        <p className="text-slate-500 text-sm mt-1 max-w-xs">{description}</p>
      </div>
      {action && (
        <button className="btn-primary" onClick={action.onClick}>
          <Plus className="w-4 h-4" />
          {action.label}
        </button>
      )}
    </div>
  );
}

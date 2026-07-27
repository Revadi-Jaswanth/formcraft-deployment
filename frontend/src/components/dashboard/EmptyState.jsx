import { Plus, Inbox } from "lucide-react";

export default function EmptyState({ title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center gap-5 border border-dashed border-surface-800 rounded-2xl bg-surface-900/10 backdrop-blur-md">
      <div className="w-14 h-14 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400">
        <Inbox className="w-6 h-6 animate-pulse" />
      </div>
      <div className="space-y-1">
        <h3 className="font-bold text-slate-200 text-base">{title}</h3>
        <p className="text-slate-500 text-xs mt-1 max-w-sm leading-relaxed">
          {description}
        </p>
      </div>
      {action && (
        <button
          onClick={action.onClick}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          {action.label}
        </button>
      )}
    </div>
  );
}

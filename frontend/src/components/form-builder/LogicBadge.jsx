import React from "react";
import { GitBranch } from "lucide-react";

export default function LogicBadge({ rules = [], fieldId }) {
  const triggers = rules.filter((r) => r.source_field_id === fieldId);
  const targets = rules.filter((r) => r.target_field_id === fieldId);

  if (triggers.length === 0 && targets.length === 0) return null;

  return (
    <div className="flex items-center gap-1.5 shrink-0 select-none">
      {triggers.length > 0 && (
        <span
          title={`Triggers ${triggers.length} logical condition(s)`}
          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-brand-500/10 text-brand-400 border border-brand-500/20 text-[10px] font-bold uppercase tracking-wider"
        >
          <GitBranch className="w-3 h-3 text-brand-400" />
          Trigger
        </span>
      )}
      {targets.length > 0 && (
        <span
          title={`Affected by ${targets.length} logical condition(s)`}
          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-violet-500/10 text-violet-400 border border-violet-500/20 text-[10px] font-bold uppercase tracking-wider"
        >
          <GitBranch className="w-3 h-3 text-violet-400" />
          Target
        </span>
      )}
    </div>
  );
}

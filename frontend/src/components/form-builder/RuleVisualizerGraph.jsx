import { GitBranch, ArrowRight, Eye, EyeOff, AlertCircle, ShieldAlert, Sparkles } from "lucide-react";

/**
 * RuleVisualizerGraph — visual diagram / flow graph representation of form conditional rules.
 * Maps Source Fields → Condition Operator & Value → Action Node → Target Fields.
 */
export default function RuleVisualizerGraph({ conditions = [], fields = [], onDelete }) {
  if (conditions.length === 0) {
    return (
      <div className="p-8 text-center rounded-2xl border border-surface-850 bg-surface-900/30 text-slate-500 text-sm space-y-2">
        <GitBranch className="w-8 h-8 text-slate-600 mx-auto" />
        <p className="font-semibold text-slate-400">No Rule Connections Active</p>
        <p className="text-xs text-slate-600">
          Create rules using the form controls above to generate live visual flow diagrams.
        </p>
      </div>
    );
  }

  // Group conditions by source field for a structured flowchart layout
  const groupedBySource = {};
  conditions.forEach((cond) => {
    const srcId = cond.source_field_id;
    if (!groupedBySource[srcId]) {
      groupedBySource[srcId] = [];
    }
    groupedBySource[srcId].push(cond);
  });

  const getActionBadge = (action) => {
    switch (action) {
      case "show":
        return {
          bg: "bg-emerald-500/10 border-emerald-500/30 text-emerald-400",
          icon: Eye,
          label: "SHOW",
        };
      case "hide":
        return {
          bg: "bg-amber-500/10 border-amber-500/30 text-amber-400",
          icon: EyeOff,
          label: "HIDE",
        };
      case "require":
        return {
          bg: "bg-rose-500/10 border-rose-500/30 text-rose-400",
          icon: AlertCircle,
          label: "MAKE REQUIRED",
        };
      case "disable":
        return {
          bg: "bg-purple-500/10 border-purple-500/30 text-purple-400",
          icon: ShieldAlert,
          label: "DISABLE",
        };
      default:
        return {
          bg: "bg-slate-800 border-slate-700 text-slate-300",
          icon: ArrowRight,
          label: action.toUpperCase(),
        };
    };
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-brand-400" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Rule Flow Graph ({conditions.length} Active {conditions.length === 1 ? "Link" : "Links"})
          </h4>
        </div>
      </div>

      <div className="space-y-6">
        {Object.entries(groupedBySource).map(([srcId, conds]) => {
          const srcField = fields.find((f) => f.id === srcId);

          return (
            <div
              key={srcId}
              className="p-5 rounded-2xl border border-surface-800 bg-surface-900/60 backdrop-blur-md space-y-4"
            >
              {/* Source Field Node */}
              <div className="flex items-center gap-3 border-b border-surface-800 pb-3">
                <div className="w-8 h-8 rounded-lg bg-brand-500/10 border border-brand-500/30 flex items-center justify-center text-brand-400 shrink-0">
                  <GitBranch className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-brand-400 block leading-none">
                    Trigger Field
                  </span>
                  <p className="text-sm font-bold text-slate-100 mt-1">
                    {srcField?.label || `Field (${srcId.slice(0, 8)}…)`}
                  </p>
                </div>
              </div>

              {/* Connected Target Rules */}
              <div className="grid grid-cols-1 gap-3 pt-1">
                {conds.map((cond) => {
                  const tgtField = fields.find((f) => f.id === cond.target_field_id);
                  const actionMeta = getActionBadge(cond.action);
                  const ActionIcon = actionMeta.icon;

                  return (
                    <div
                      key={cond.id}
                      className="relative flex flex-col md:flex-row md:items-center justify-between gap-3 p-3.5 rounded-xl border border-surface-800 bg-surface-950/80 hover:border-surface-750 transition-all group"
                    >
                      {/* Left: IF Condition */}
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-xs font-mono font-bold text-slate-500 uppercase px-2 py-0.5 rounded bg-surface-850 shrink-0">
                          IF
                        </span>
                        <div className="text-xs font-medium text-slate-300">
                          <span className="text-slate-400 font-semibold">{cond.operator.replace("_", " ")}</span>
                          {cond.value && (
                            <span className="ml-1.5 px-2 py-0.5 bg-brand-500/10 border border-brand-500/20 text-brand-300 font-mono rounded text-[11px]">
                              "{cond.value}"
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Middle Connector Arrow */}
                      <div className="hidden md:flex items-center justify-center px-2 text-slate-600">
                        <ArrowRight className="w-4 h-4" />
                      </div>

                      {/* Right: THEN Action & Target Node */}
                      <div className="flex items-center gap-3">
                        <span
                          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-bold ${actionMeta.bg}`}
                        >
                          <ActionIcon className="w-3.5 h-3.5" />
                          {actionMeta.label}
                        </span>

                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-surface-800 bg-surface-900 text-xs font-medium text-slate-200">
                          <span className="text-[10px] text-slate-500 uppercase">TARGET:</span>
                          <span className="font-semibold text-slate-100">
                            {tgtField?.label || `Field (${cond.target_field_id.slice(0, 8)}…)`}
                          </span>
                        </div>

                        {onDelete && (
                          <button
                            onClick={() => onDelete(cond.id)}
                            className="p-1.5 text-slate-500 hover:text-red-400 rounded-lg hover:bg-red-500/10 transition-colors ml-auto md:ml-0"
                            title="Delete Rule"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

import { X, Calendar, Globe, Clock, Trash2, ShieldAlert } from "lucide-react";

export default function ResponseDetailsDialog({ submission, fields, isOpen, onClose, onDelete }) {
  if (!isOpen || !submission) return null;

  const getResponseValue = (fieldId) => {
    const rv = submission.response_values?.find((val) => val.field_id === fieldId);
    if (!rv) return <span className="text-slate-600 italic">No answer provided</span>;
    
    try {
      const parsed = JSON.parse(rv.value);
      if (Array.isArray(parsed)) {
        return (
          <div className="flex flex-wrap gap-1.5 mt-1">
            {parsed.map((item, idx) => (
              <span key={idx} className="px-2 py-0.5 rounded bg-surface-850 border border-surface-800 text-[10px] text-slate-300 font-semibold uppercase tracking-wider">
                {item}
              </span>
            ))}
          </div>
        );
      }
      return <p className="text-slate-300 whitespace-pre-wrap">{rv.value}</p>;
    } catch (e) {
      return <p className="text-slate-300 whitespace-pre-wrap">{rv.value}</p>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-surface-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-surface-900 border border-surface-850 rounded-2xl p-6 relative shadow-2xl space-y-6 animate-scale-in max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-surface-850 pb-3 shrink-0">
          <div className="space-y-0.5">
            <h3 className="font-bold text-slate-100 text-sm">Submission Details</h3>
            <p className="font-mono text-[10px] text-brand-400 font-bold">{submission.id}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-500 hover:text-slate-300 hover:bg-surface-800 rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Telemetry metadata Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3.5 bg-surface-950/30 rounded-xl border border-surface-850/50 text-[10px] font-semibold text-slate-500 shrink-0">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-600" />
              <span className="uppercase tracking-wider">Submitted</span>
            </div>
            <p className="text-slate-300">{new Date(submission.submitted_at).toLocaleString()}</p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-slate-600" />
              <span className="uppercase tracking-wider">IP Address</span>
            </div>
            <p className="text-slate-300">{submission.ip_address || "127.0.0.1"}</p>
          </div>
          <div className="space-y-1 col-span-2 sm:col-span-1">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-600" />
              <span className="uppercase tracking-wider">Duration</span>
            </div>
            <p className="text-slate-300">
              {submission.completion_time_seconds ? `${submission.completion_time_seconds}s` : "Unknown"}
            </p>
          </div>
        </div>

        {/* Question-Answer List */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-4 divide-y divide-surface-850/40 text-xs font-semibold">
          {fields.map((field, index) => (
            <div key={field.id} className={`pt-4 ${index === 0 ? "pt-0" : ""}`}>
              <h4 className="text-slate-400 font-bold mb-1.5 flex items-start gap-2">
                <span className="text-brand-400 font-mono">Q{index + 1}.</span>
                <span>{field.label}</span>
              </h4>
              <div className="pl-6 text-[11px] font-medium leading-relaxed">
                {getResponseValue(field.id)}
              </div>
            </div>
          ))}
        </div>

        {/* Footer actions */}
        <div className="pt-3 border-t border-surface-850/60 flex items-center justify-between shrink-0 text-xs">
          <button
            onClick={() => {
              if (confirm("Permanently delete this respondent response? This cannot be undone.")) {
                onDelete(submission.id);
                onClose();
              }
            }}
            className="text-red-400 hover:text-red-300 flex items-center gap-1.5 hover:underline font-bold"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete Entry
          </button>
          <button onClick={onClose} className="btn-secondary py-2 px-4">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

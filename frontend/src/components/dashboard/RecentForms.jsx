import { Link } from "react-router-dom";
import { FileText, ArrowRight, Clock } from "lucide-react";
import StatusBadge from "../ui/StatusBadge";

export default function RecentForms({ forms = [] }) {
  const recent = forms.slice(0, 5); // Limit to top 5 recent forms

  const formatUpdateDate = (dateStr) => {
    if (!dateStr) return "Just now";
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="p-6 rounded-2xl border border-surface-850 bg-surface-900/30 backdrop-blur-md shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-slate-100 text-sm">Recent Forms</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Quick links to your most recently updated form templates
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-surface-850 text-slate-500 font-semibold uppercase tracking-wider">
              <th className="py-3 px-4">Form Title</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Fields</th>
              <th className="py-3 px-4">Submissions</th>
              <th className="py-3 px-4">Last Updated</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-850/40 text-slate-400">
            {recent.map((form) => (
              <tr
                key={form.id}
                className="hover:bg-surface-850/20 hover:text-slate-200 transition-colors group"
              >
                <td className="py-3 px-4 font-medium text-slate-300 group-hover:text-slate-100">
                  <Link
                    to={`/dashboard/forms/${form.id}/builder`}
                    className="flex items-center gap-2 max-w-xs truncate"
                  >
                    <FileText className="w-3.5 h-3.5 text-brand-400 shrink-0" />
                    <span className="truncate">{form.title}</span>
                  </Link>
                </td>
                <td className="py-3 px-4">
                  <StatusBadge status={form.status} />
                </td>
                <td className="py-3 px-4 font-mono">{form.field_count} fields</td>
                <td className="py-3 px-4 font-mono">
                  {form.submission_count} responses
                </td>
                <td className="py-3 px-4 flex items-center gap-1.5 mt-0.5 font-medium">
                  <Clock className="w-3 h-3 text-slate-600" />
                  {formatUpdateDate(form.updated_at)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

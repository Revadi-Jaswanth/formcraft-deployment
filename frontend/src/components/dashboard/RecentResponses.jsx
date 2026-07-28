import { Link } from "react-router-dom";
import { MessageSquare, Calendar, Globe } from "lucide-react";

export default function RecentResponses({ submissions = [], isLoading = false }) {
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
      <div>
        <h3 className="font-bold text-slate-100 text-sm">Recent Submissions</h3>
        <p className="text-xs text-slate-500 mt-0.5">
          Live stream of dynamic submissions received across all public endpoints
        </p>
      </div>

      {isLoading ? (
        <div className="text-center py-6 text-slate-500 text-xs">
          Loading submissions...
        </div>
      ) : !submissions || submissions.length === 0 ? (
        <p className="text-xs text-slate-600 italic py-6 text-center">
          No responses received yet.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-surface-850 text-slate-500 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Submission ID</th>
                <th className="py-3 px-4">Form</th>
                <th className="py-3 px-4">Respondent</th>
                <th className="py-3 px-4">IP Address</th>
                <th className="py-3 px-4">Submitted At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-850/40 text-slate-400">
              {submissions.map((sub) => (
                <tr
                  key={sub.id}
                  className="hover:bg-surface-850/20 hover:text-slate-200 transition-colors group"
                >
                  <td className="py-3 px-4 font-mono text-brand-400 font-semibold">
                    {sub.id.slice(0, 8)}...
                  </td>
                  <td className="py-3 px-4 truncate max-w-44 font-medium text-slate-300">
                    <Link
                      to={`/dashboard/forms/${sub.form_id}/responses`}
                      className="flex items-center gap-2 hover:text-brand-400 transition-colors"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-violet-400 shrink-0" />
                      <span className="truncate">{sub.form_title}</span>
                    </Link>
                  </td>
                  <td className="py-3 px-4 font-medium text-slate-300">
                    {sub.respondent}
                  </td>
                  <td className="py-3 px-4 font-mono flex items-center gap-1.5 mt-0.5">
                    <Globe className="w-3 h-3 text-slate-600" />
                    {sub.ip_address}
                  </td>
                  <td className="py-3 px-4 font-medium">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3 h-3 text-slate-600" />
                      {formatUpdateDate(sub.submitted_at)}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

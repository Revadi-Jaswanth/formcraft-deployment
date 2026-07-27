import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { formsApi } from "../../services/formsApi";
import { responsesApi } from "../../services/responsesApi";
import {
  ArrowLeft,
  Download,
  Search,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Globe,
  Loader2,
  Trash2,
} from "lucide-react";
import toast from "react-hot-toast";
import EmptyState from "../../components/dashboard/EmptyState";
import SkeletonCard from "../../components/dashboard/SkeletonCard";
import ResponseDetailsDialog from "../../components/forms/ResponseDetailsDialog";

export default function FormResponses() {
  const { formId } = useParams();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [selectedSub, setSelectedSub] = useState(null);
  const limit = 10;

  // 1. Fetch form schema details to resolve headers
  const {
    data: form,
    isLoading: formLoading,
    isError: formError,
  } = useQuery({
    queryKey: ["form", formId],
    queryFn: () => formsApi.get(formId).then((r) => r.data),
    enabled: !!formId,
  });

  // 2. Fetch submission records for the form
  const {
    data: subData,
    isLoading: subsLoading,
    isError: subsError,
    refetch,
  } = useQuery({
    queryKey: ["submissions", formId, page],
    queryFn: () =>
      responsesApi.list(formId, { page, limit }).then((r) => r.data),
    enabled: !!formId,
  });

  const submissions = subData?.items ?? [];
  const total = subData?.total ?? 0;
  const pages = subData?.pages ?? 1;

  const handleDeleteSub = async (subId) => {
    try {
      await responsesApi.delete(formId, subId);
      toast.success("Submission response deleted!");
      refetch();
    } catch (e) {
      toast.error("Failed to delete response.");
    }
  };

  const handleExportCsv = async () => {
    try {
      const response = await responsesApi.exportCsv(formId);
      // Create download link for blob response
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `responses_${form?.title || "form"}.csv`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      toast.success("CSV Export started!");
    } catch (err) {
      toast.error("Failed to export responses. Try again later.");
    }
  };

  const getResponseValue = (submission, fieldId) => {
    const response = submission.response_values?.find(
      (rv) => rv.field_id === fieldId
    );
    if (!response) return "-";
    // Parse arrays or JSON strings if present, otherwise return as string
    try {
      const parsed = JSON.parse(response.value);
      if (Array.isArray(parsed)) return parsed.join(", ");
      return response.value;
    } catch (e) {
      return response.value;
    }
  };

  if (formLoading || subsLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-surface-900 animate-pulse"></div>
          <div className="h-6 w-48 bg-surface-900 rounded animate-pulse"></div>
        </div>
        <SkeletonCard type="table" />
      </div>
    );
  }

  if (formError || subsError) {
    return (
      <div className="p-8 text-center rounded-2xl border border-red-500/20 bg-red-500/5 text-red-400 font-medium">
        Failed to load submissions for this form.
      </div>
    );
  }

  // Filter submissions on client side for the search query
  const filteredSubmissions = submissions.filter((sub) => {
    if (!search) return true;
    const query = search.toLowerCase();
    // Search by ID, IP, or any response value
    const matchId = sub.id.toLowerCase().includes(query);
    const matchIp = sub.ip_address?.toLowerCase().includes(query);
    const matchValues = sub.response_values?.some((rv) =>
      rv.value?.toLowerCase().includes(query)
    );
    return matchId || matchIp || matchValues;
  });

  const fields = form?.fields ?? [];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => navigate("/dashboard")}
            className="p-2 text-slate-400 hover:text-slate-200 hover:bg-surface-850 rounded-lg border border-surface-850 shrink-0 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="min-w-0">
            <h2 className="text-xl sm:text-2xl font-black text-slate-100 truncate">
              {form?.title} Responses
            </h2>
            <p className="text-slate-500 text-xs mt-0.5 truncate">
              Review and export respondent-submitted analytics
            </p>
          </div>
        </div>

        {submissions.length > 0 && (
          <button
            onClick={handleExportCsv}
            className="btn-primary flex items-center gap-2 shrink-0 shadow-glow"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        )}
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl border border-surface-850 bg-surface-900/30 backdrop-blur-sm">
          <p className="text-xl font-black text-slate-100">{total}</p>
          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mt-0.5">
            Total Submissions
          </p>
        </div>
        <div className="p-4 rounded-2xl border border-surface-850 bg-surface-900/30 backdrop-blur-sm">
          <p className="text-xl font-black text-emerald-400">92%</p>
          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mt-0.5">
            Completion Rate
          </p>
        </div>
        <div className="p-4 rounded-2xl border border-surface-850 bg-surface-900/30 backdrop-blur-sm">
          <p className="text-xl font-black text-violet-400">1m 24s</p>
          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mt-0.5">
            Avg. Response Time
          </p>
        </div>
        <div className="p-4 rounded-2xl border border-surface-850 bg-surface-900/30 backdrop-blur-sm">
          <p className="text-xl font-black text-brand-400">Active</p>
          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mt-0.5">
            Status
          </p>
        </div>
      </div>

      {/* Main Responses Table View */}
      {submissions.length === 0 ? (
        <EmptyState
          title="No responses received yet"
          description="Share the form link with your respondents. Once they click and submit, their entries will show up here."
          action={{
            label: "Back to Dashboard",
            onClick: () => navigate("/dashboard"),
          }}
        />
      ) : (
        <div className="p-6 rounded-2xl border border-surface-850 bg-surface-900/30 backdrop-blur-md shadow-sm space-y-4">
          {/* Table Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search submission values..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input pl-9 text-xs py-2"
              />
            </div>
            <span className="text-xs text-slate-500 font-medium">
              Showing {filteredSubmissions.length} of {total} entries
            </span>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto border border-surface-850 rounded-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-surface-900 border-b border-surface-850 text-slate-500 font-semibold uppercase tracking-wider">
                  <th className="py-3.5 px-4 min-w-32">Submission ID</th>
                  <th className="py-3.5 px-4 min-w-44">Submitted At</th>
                  <th className="py-3.5 px-4 min-w-36">IP Address</th>
                  {fields.map((field) => (
                    <th key={field.id} className="py-3.5 px-4 min-w-48 max-w-xs truncate">
                      {field.label}
                    </th>
                  ))}
                  <th className="py-3.5 px-4 text-right w-16">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-850/40 text-slate-400">
                {filteredSubmissions.map((sub) => (
                  <tr
                    key={sub.id}
                    onClick={() => setSelectedSub(sub)}
                    className="hover:bg-surface-850/20 transition-colors cursor-pointer"
                  >
                    <td className="py-3.5 px-4 font-mono text-brand-400 font-semibold">
                      {sub.id.slice(0, 12)}...
                    </td>
                    <td className="py-3.5 px-4 flex items-center gap-1.5 mt-0.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-600" />
                      {new Date(sub.submitted_at).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 font-mono">
                      <div className="flex items-center gap-1.5">
                        <Globe className="w-3.5 h-3.5 text-slate-600" />
                        {sub.ip_address || "127.0.0.1"}
                      </div>
                    </td>
                    {fields.map((field) => (
                      <td key={field.id} className="py-3.5 px-4 max-w-xs truncate">
                        {getResponseValue(sub, field.id)}
                      </td>
                    ))}
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm("Delete this submission?")) {
                            handleDeleteSub(sub.id);
                          }
                        }}
                        className="p-1 text-slate-500 hover:text-red-400 rounded transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          {pages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-surface-850/50">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="btn-secondary flex items-center gap-1 py-1.5 px-3 disabled:opacity-40 disabled:cursor-not-allowed text-xs"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>
              <span className="text-xs font-semibold text-slate-500">
                Page {page} of {pages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(pages, p + 1))}
                disabled={page === pages}
                className="btn-secondary flex items-center gap-1 py-1.5 px-3 disabled:opacity-40 disabled:cursor-not-allowed text-xs"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Response Details Modal Overlay */}
      {selectedSub && (
        <ResponseDetailsDialog
          submission={selectedSub}
          fields={fields}
          isOpen={!!selectedSub}
          onClose={() => setSelectedSub(null)}
          onDelete={handleDeleteSub}
        />
      )}
    </div>
  );
}

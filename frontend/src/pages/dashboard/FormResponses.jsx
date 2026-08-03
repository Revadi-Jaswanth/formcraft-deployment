import { useState, useRef, useEffect } from "react";
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
  ChevronDown,
  Calendar,
  Globe,
  Loader2,
  Trash2,
  FileText,
  FileJson,
  CheckCircle2,
} from "lucide-react";
import toast from "react-hot-toast";
import EmptyState from "../../components/dashboard/EmptyState";
import SkeletonCard from "../../components/dashboard/SkeletonCard";
import ResponseDetailsDialog from "../../components/forms/ResponseDetailsDialog";

// ── Export format definitions ─────────────────────────────────────────────────
const EXPORT_FORMATS = [
  {
    value: "csv",
    label: "Export CSV",
    description: "Spreadsheet-compatible, one row per submission",
    icon: FileText,
    ext: ".csv",
    mimeType: "text/csv",
    color: "text-emerald-400",
  },
  {
    value: "json",
    label: "Export JSON",
    description: "Structured data array, ideal for APIs",
    icon: FileJson,
    ext: ".json",
    mimeType: "application/json",
    color: "text-violet-400",
  },
];

// ── Export format dropdown component ─────────────────────────────────────────
function ExportDropdown({ formTitle, formId, disabled }) {
  const [open, setOpen] = useState(false);
  const [exporting, setExporting] = useState(null); // "csv" | "json" | null
  const ref = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleExport = async (format) => {
    setOpen(false);
    setExporting(format);
    try {
      const response = await responsesApi.export(formId, format);
      const blob = new Blob([response.data], {
        type: EXPORT_FORMATS.find((f) => f.value === format)?.mimeType,
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const safeName = (formTitle || "form").replace(/[^a-z0-9]/gi, "_").toLowerCase();
      link.setAttribute("download", `${safeName}_responses.${format}`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success(
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{format.toUpperCase()} export downloaded!</span>
        </div>
      );
    } catch {
      toast.error(`Failed to export as ${format.toUpperCase()}. Try again.`);
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="relative" ref={ref}>
      {/* Trigger button */}
      <button
        onClick={() => setOpen((o) => !o)}
        disabled={disabled || !!exporting}
        className="btn-primary flex items-center gap-2 shrink-0 shadow-glow"
        id="export-dropdown-trigger"
      >
        {exporting ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Download className="w-4 h-4" />
        )}
        {exporting ? `Exporting ${exporting.toUpperCase()}…` : "Export"}
        <ChevronDown
          className={`w-3.5 h-3.5 transition-transform duration-150 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {/* Dropdown panel */}
      {open && (
        <div
          className="absolute right-0 mt-2 w-64 rounded-xl border border-surface-800
                     bg-surface-900/95 backdrop-blur-md shadow-2xl z-50
                     animate-fade-in overflow-hidden"
        >
          <div className="px-3 py-2.5 border-b border-surface-800">
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
              Choose export format
            </p>
          </div>
          {EXPORT_FORMATS.map((fmt) => {
            const Icon = fmt.icon;
            return (
              <button
                key={fmt.value}
                onClick={() => handleExport(fmt.value)}
                className="w-full flex items-start gap-3 px-3 py-3 text-left
                           hover:bg-surface-800 transition-colors group"
                id={`export-format-${fmt.value}`}
              >
                <div className="mt-0.5 w-7 h-7 rounded-lg bg-surface-800 group-hover:bg-surface-700
                               flex items-center justify-center shrink-0 transition-colors">
                  <Icon className={`w-3.5 h-3.5 ${fmt.color}`} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-200 leading-none">{fmt.label}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{fmt.description}</p>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Main FormResponses page ───────────────────────────────────────────────────
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
    queryFn: () => responsesApi.list(formId, { page, limit }).then((r) => r.data),
    enabled: !!formId,
  });

  const submissions = subData?.items ?? [];
  const total = subData?.total ?? 0;
  const pages = subData?.pages ?? 1;

  const handleDeleteSub = async (subId) => {
    try {
      await responsesApi.delete(formId, subId);
      toast.success("Submission deleted.");
      refetch();
    } catch {
      toast.error("Failed to delete submission.");
    }
  };

  const getResponseValue = (submission, fieldId) => {
    const response = submission.response_values?.find((rv) => rv.field_id === fieldId);
    if (!response) return "-";
    try {
      const parsed = JSON.parse(response.value);
      if (Array.isArray(parsed)) return parsed.join(", ");
      return response.value;
    } catch {
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

  // Client-side search filter
  const filteredSubmissions = submissions.filter((sub) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      sub.id.toLowerCase().includes(q) ||
      sub.ip_address?.toLowerCase().includes(q) ||
      sub.response_values?.some((rv) => rv.value?.toLowerCase().includes(q))
    );
  });

  const fields = form?.fields ?? [];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => navigate("/dashboard")}
            className="p-2 text-slate-400 hover:text-slate-200 hover:bg-surface-850 rounded-lg
                       border border-surface-850 shrink-0 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="min-w-0">
            <h2 className="text-xl sm:text-2xl font-black text-slate-100 truncate">
              {form?.title} Responses
            </h2>
            <p className="text-slate-500 text-xs mt-0.5 truncate">
              Review and export respondent-submitted data
            </p>
          </div>
        </div>

        {submissions.length > 0 && (
          <ExportDropdown formTitle={form?.title} formId={formId} disabled={false} />
        )}
      </div>

      {/* ── Metrics Row ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl border border-surface-850 bg-surface-900/30 backdrop-blur-sm">
          <p className="text-xl font-black text-slate-100">{total}</p>
          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mt-0.5">
            Total Submissions
          </p>
        </div>
        <div className="p-4 rounded-2xl border border-surface-850 bg-surface-900/30 backdrop-blur-sm">
          <p className="text-xl font-black text-emerald-400">{fields.length}</p>
          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mt-0.5">
            Fields
          </p>
        </div>
        <div className="p-4 rounded-2xl border border-surface-850 bg-surface-900/30 backdrop-blur-sm">
          <p className="text-xl font-black text-violet-400">{pages}</p>
          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mt-0.5">
            Pages
          </p>
        </div>
        <div className="p-4 rounded-2xl border border-surface-850 bg-surface-900/30 backdrop-blur-sm">
          <p className="text-xl font-black text-brand-400">{form?.status ?? "—"}</p>
          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mt-0.5">
            Status
          </p>
        </div>
      </div>

      {/* ── Submissions Table ── */}
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

          {/* Table */}
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
                      {sub.id.slice(0, 12)}…
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                        {new Date(sub.submitted_at).toLocaleString()}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono">
                      <div className="flex items-center gap-1.5">
                        <Globe className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                        {sub.ip_address || "—"}
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
                          if (confirm("Delete this submission?")) handleDeleteSub(sub.id);
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

          {/* Pagination */}
          {pages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-surface-850/50">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="btn-secondary flex items-center gap-1 py-1.5 px-3
                           disabled:opacity-40 disabled:cursor-not-allowed text-xs"
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
                className="btn-secondary flex items-center gap-1 py-1.5 px-3
                           disabled:opacity-40 disabled:cursor-not-allowed text-xs"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Response Details Modal */}
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

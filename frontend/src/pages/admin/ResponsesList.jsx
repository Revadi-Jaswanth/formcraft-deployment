import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  MessageSquare,
  Search,
  Download,
  Calendar,
  Clock,
  Compass,
} from "lucide-react";
import { adminApi } from "../../services/adminApi";
import toast from "react-hot-toast";

export default function ResponsesList() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Debouncing search
  useMemo(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  // Query submissions list
  const { data: responses = [], isLoading } = useQuery({
    queryKey: ["admin-responses", debouncedSearch],
    queryFn: () => adminApi.getResponses({ search: debouncedSearch }).then((r) => r.data),
  });

  // Export CSV helper
  const handleExportCSV = () => {
    if (responses.length === 0) {
      toast.error("No submissions recorded to export.");
      return;
    }

    const headers = ["Submission ID", "Form ID", "Form Title", "Owner Email", "Submission Time", "IP Address", "Time Duration (sec)", "Fields Answered"];
    const rows = responses.map((r) => [
      r.id,
      r.form_id,
      `"${r.form_title.replace(/"/g, '""')}"`,
      r.creator_email,
      r.submitted_at,
      r.ip_address || "N/A",
      r.completion_time_seconds || "N/A",
      r.fields_answered,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `platform_submissions_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    toast.success("Platform submissions log exported successfully!");
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-100 tracking-tight">
            Submission Management
          </h2>
          <p className="text-slate-500 text-xs mt-0.5 font-medium">
            Monitor and audit all respondent form responses across the platform
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          {/* Search */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search by form or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-9 text-xs py-2 w-full"
            />
          </div>

          <button
            onClick={handleExportCSV}
            className="btn-primary py-2 px-3 text-xs flex items-center gap-1.5 w-full sm:w-auto justify-center"
          >
            <Download className="w-4 h-4" />
            Export CSV Log
          </button>
        </div>
      </div>

      {/* Table Card */}
      <div className="p-6 rounded-2xl border border-surface-850 bg-surface-900/60 backdrop-blur-md">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-8 h-8 rounded-full border-4 border-brand-500 border-t-transparent animate-spin"></div>
            <p className="text-xs text-slate-500 font-semibold animate-pulse">
              Aggregating platform responses log...
            </p>
          </div>
        ) : responses.length === 0 ? (
          <div className="text-center py-20 text-slate-500 text-xs space-y-2">
            <MessageSquare className="w-8 h-8 text-slate-700 mx-auto" />
            <p className="font-bold">No submissions found</p>
            <p className="text-[10px]">Try adjusting your search queries.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-surface-850 text-slate-500 font-bold">
                  <th className="py-3">Form Title</th>
                  <th className="py-3">Owner Email</th>
                  <th className="py-3 text-center">Fields Answered</th>
                  <th className="py-3">IP Address</th>
                  <th className="py-3">Duration (sec)</th>
                  <th className="py-3">Submitted At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-850/50">
                {responses.map((res) => (
                  <tr key={res.id} className="hover:bg-surface-850/10">
                    <td className="py-3">
                      <div className="truncate max-w-[200px]">
                        <span className="font-semibold text-slate-200 block truncate">
                          {res.form_title}
                        </span>
                        <span className="text-[9px] text-slate-500 block truncate mt-0.5">
                          ID: {res.id}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 text-slate-400 font-medium">{res.creator_email}</td>
                    <td className="py-3">
                      <div className="flex items-center justify-center">
                        <span className="px-2 py-0.5 rounded bg-brand-500/10 text-brand-400 font-bold text-[10px]">
                          {res.fields_answered} field(s)
                        </span>
                      </div>
                    </td>
                    <td className="py-3 text-slate-300 font-mono">{res.ip_address || "Anonymous"}</td>
                    <td className="py-3 font-semibold text-slate-300">
                      {res.completion_time_seconds ? (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-500" />
                          {res.completion_time_seconds}s
                        </span>
                      ) : (
                        "N/A"
                      )}
                    </td>
                    <td className="py-3 text-slate-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        {new Date(res.submitted_at).toLocaleDateString([], {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

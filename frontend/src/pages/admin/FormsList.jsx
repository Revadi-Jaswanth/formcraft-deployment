import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  FileText,
  Search,
  Archive,
  Trash2,
  ExternalLink,
  MessageSquare,
  Sparkles,
} from "lucide-react";
import { adminApi } from "../../services/adminApi";
import toast from "react-hot-toast";

export default function FormsList() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Debounce search
  useMemo(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  // Query forms
  const { data: forms = [], isLoading } = useQuery({
    queryKey: ["admin-forms", debouncedSearch, statusFilter],
    queryFn: () =>
      adminApi
        .getForms({ search: debouncedSearch, status_filter: statusFilter })
        .then((r) => r.data),
  });

  // Mutations
  const archiveMutation = useMutation({
    mutationFn: (formId) => adminApi.archiveForm(formId),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["admin-forms"] });
      qc.invalidateQueries({ queryKey: ["admin-stats"] });
      toast.success(data.data.message);
    },
    onError: () => {
      toast.error("Failed to update form archive state.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (formId) => adminApi.deleteForm(formId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-forms"] });
      qc.invalidateQueries({ queryKey: ["admin-stats"] });
      toast.success("Form permanently deleted.");
    },
    onError: () => {
      toast.error("Failed to delete form template.");
    },
  });

  const handleArchiveForm = (formId) => {
    archiveMutation.mutate(formId);
  };

  const handleDeleteForm = (form) => {
    if (
      confirm(
        `Are you sure you want to permanently delete "${form.title}"? This will also delete all of its recorded response submissions and cannot be undone.`
      )
    ) {
      deleteMutation.mutate(form.id);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-100 tracking-tight">
            Form Management
          </h2>
          <p className="text-slate-500 text-xs mt-0.5 font-medium">
            Monitor and manage form templates across the entire platform
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          {/* Search */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search forms by title..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-9 text-xs py-2 w-full"
            />
          </div>

          {/* Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input text-xs py-2 w-full sm:w-36 bg-surface-900 border-surface-850"
          >
            <option value="">All Statuses</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </div>

      {/* Forms Table Card */}
      <div className="p-6 rounded-2xl border border-surface-850 bg-surface-900/60 backdrop-blur-md">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-8 h-8 rounded-full border-4 border-brand-500 border-t-transparent animate-spin"></div>
            <p className="text-xs text-slate-500 font-semibold animate-pulse">
              Syncing platform forms register...
            </p>
          </div>
        ) : forms.length === 0 ? (
          <div className="text-center py-20 text-slate-500 text-xs space-y-2">
            <FileText className="w-8 h-8 text-slate-700 mx-auto" />
            <p className="font-bold">No forms found</p>
            <p className="text-[10px]">Try adjusting your search queries.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-surface-850 text-slate-500 font-bold">
                  <th className="py-3">Form Details</th>
                  <th className="py-3">Owner / Creator</th>
                  <th className="py-3">Status</th>
                  <th className="py-3">Responses</th>
                  <th className="py-3">Created Date</th>
                  <th className="py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-850/50">
                {forms.map((form) => (
                  <tr key={form.id} className="hover:bg-surface-850/10 group">
                    <td className="py-3">
                      <div className="truncate max-w-[220px]">
                        <span className="font-semibold text-slate-200 block truncate">
                          {form.title}
                        </span>
                        <span className="text-[9px] text-slate-500 block truncate mt-0.5">
                          ID: {form.id}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 text-slate-400 font-medium">{form.creator_email}</td>
                    <td className="py-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                          form.status === "published"
                            ? "bg-emerald-500/10 text-emerald-400"
                            : form.status === "archived"
                            ? "bg-red-500/10 text-red-400"
                            : "bg-slate-500/10 text-slate-400"
                        }`}
                      >
                        {form.status}
                      </span>
                    </td>
                    <td className="py-3 font-semibold text-slate-300">
                      <span className="flex items-center gap-1">
                        <MessageSquare className="w-3.5 h-3.5 text-slate-500" />
                        {form.responses_count}
                      </span>
                    </td>
                    <td className="py-3 text-slate-400">
                      {new Date(form.created_at).toLocaleDateString([], {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>
                    <td className="py-3 text-right">
                      <div className="flex items-center justify-end gap-2.5">
                        <button
                          onClick={() => handleArchiveForm(form.id)}
                          className="btn-secondary py-1 px-2 text-[10px] flex items-center gap-1"
                          title="Toggle Archive State"
                        >
                          <Archive className="w-3 h-3 text-brand-400" />
                          {form.status === "archived" ? "Unarchive" : "Archive"}
                        </button>
                        <button
                          onClick={() => handleDeleteForm(form)}
                          className="text-red-400 hover:text-red-300 p-1.5 rounded hover:bg-red-500/5 transition-all"
                          title="Delete Form Permanently"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
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

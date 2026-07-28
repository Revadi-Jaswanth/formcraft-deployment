import { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Trash2, Archive, FileText, Search } from "lucide-react";
import { useForms, useDeleteForm, FORMS_KEY } from "../../hooks/useForms";
import { formsApi } from "../../services/formsApi";
import SkeletonCard from "../../components/dashboard/SkeletonCard";
import EmptyState from "../../components/dashboard/EmptyState";
import toast from "react-hot-toast";

export default function ArchivedForms() {
  const qc = useQueryClient();

  // Query forms (all forms including archived ones)
  const { data: formsData, isLoading } = useForms({ limit: 100 });
  const forms = formsData?.items ?? [];

  // Filter archived forms
  const archivedForms = useMemo(() => {
    return forms.filter((f) => f.status === "archived");
  }, [forms]);

  const deleteMutation = useDeleteForm();

  // Archive toggle mutation
  const restoreMutation = useMutation({
    mutationFn: (formId) => formsApi.update(formId, { status: "draft" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [FORMS_KEY] });
      toast.success("Form restored to drafts!");
    },
    onError: () => {
      toast.error("Failed to restore form.");
    },
  });

  const handleRestore = (formId) => {
    restoreMutation.mutate(formId);
  };

  const handleDelete = (form) => {
    if (confirm(`Are you sure you want to permanently delete "${form.title}"? All associated responses will be deleted. This cannot be undone.`)) {
      deleteMutation.mutate(form.id);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-surface-900 rounded animate-pulse"></div>
        <SkeletonCard type="table" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-slate-100 tracking-tight">
          Archived Forms
        </h2>
        <p className="text-slate-500 text-xs mt-0.5 font-medium">
          Manage archived forms, restore them to drafts, or permanently delete them
        </p>
      </div>

      {archivedForms.length === 0 ? (
        <EmptyState
          title="No archived forms"
          description="Forms you archive will appear here. Archiving stops responses but keeps submission history safe."
        />
      ) : (
        <div className="p-6 rounded-2xl border border-surface-850 bg-surface-900/60 backdrop-blur-md">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-surface-850 text-slate-500 font-bold">
                  <th className="py-3">Form Title</th>
                  <th className="py-3">Status</th>
                  <th className="py-3">Created Date</th>
                  <th className="py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-850/50">
                {archivedForms.map((form) => (
                  <tr key={form.id} className="hover:bg-surface-850/10">
                    <td className="py-3 font-semibold text-slate-200">
                      <div className="truncate max-w-xs">{form.title}</div>
                    </td>
                    <td className="py-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-red-500/10 text-red-400">
                        {form.status}
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
                          onClick={() => handleRestore(form.id)}
                          className="btn-secondary py-1 px-2.5 text-[10px] flex items-center gap-1 font-bold"
                          title="Restore Form to Drafts"
                        >
                          <Archive className="w-3 h-3 text-brand-400" />
                          Restore
                        </button>
                        <button
                          onClick={() => handleDelete(form)}
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
        </div>
      )}
    </div>
  );
}

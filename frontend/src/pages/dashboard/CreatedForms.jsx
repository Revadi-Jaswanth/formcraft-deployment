import { useState, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { formsApi } from "../../services/formsApi";
import {
  useForms,
  useDeleteForm,
  useArchiveForm,
  usePublishForm,
  useRestoreForm,
  useDuplicateForm,
  FORMS_KEY,
} from "../../hooks/useForms";
import {
  LayoutGrid,
  List,
  Search,
  ArrowUpDown,
  Filter,
  Plus,
  Trash2,
  Archive,
  Rocket,
  RefreshCw,
  Copy,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Eye,
  Edit,
  Link2,
  BarChart2,
} from "lucide-react";
import toast from "react-hot-toast";
import EmptyState from "../../components/dashboard/EmptyState";
import SkeletonCard from "../../components/dashboard/SkeletonCard";
import CreateFormModal from "../../components/forms/CreateFormModal";
import ShareFormDialog from "../../components/forms/ShareFormDialog";
import StatusBadge from "../../components/ui/StatusBadge";

export default function CreatedForms() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [viewMode, setViewMode] = useState("grid"); // grid or list
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState(""); // all, draft, published, archived
  const [shareForm, setShareForm] = useState(null);
  const [sortBy, setSortBy] = useState("updated_at"); // updated_at, title, field_count
  const [sortOrder, setSortOrder] = useState("desc"); // asc or desc
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const limit = 12;

  // React Query form retrieval
  const { data, isLoading, isError } = useForms({
    search: search || undefined,
    status: statusFilter || undefined,
    page,
    limit,
  });

  const forms = data?.items ?? [];
  const total = data?.total ?? 0;
  const pages = data?.pages ?? 1;

  // Mutation Hooks
  const deleteMutation = useDeleteForm();
  const archiveMutation = useArchiveForm();
  const publishMutation = usePublishForm();
  const restoreMutation = useRestoreForm();
  const duplicateMutation = useDuplicateForm();

  // Sorting Handler
  const sortedForms = useMemo(() => {
    return [...forms].sort((a, b) => {
      let valA = a[sortBy];
      let valB = b[sortBy];

      if (typeof valA === "string") {
        valA = valA.toLowerCase();
        valB = valB.toLowerCase();
      }

      if (valA < valB) return sortOrder === "asc" ? -1 : 1;
      if (valA > valB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
  }, [forms, sortBy, sortOrder]);

  // Bulk Selection Handlers
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(forms.map((f) => f.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Bulk Actions
  const handleBulkDelete = async () => {
    if (confirm(`Delete all ${selectedIds.length} selected forms? This cannot be undone.`)) {
      const loadingToast = toast.loading("Deleting selected forms...");
      try {
        await Promise.all(selectedIds.map((id) => deleteMutation.mutateAsync(id)));
        setSelectedIds([]);
        qc.invalidateQueries({ queryKey: [FORMS_KEY] });
        toast.success("Successfully deleted forms!", { id: loadingToast });
      } catch (err) {
        toast.error("Failed to delete all selected forms.", { id: loadingToast });
      }
    }
  };

  const handleBulkArchive = async () => {
    const loadingToast = toast.loading("Archiving selected forms...");
    try {
      await Promise.all(selectedIds.map((id) => archiveMutation.mutateAsync(id)));
      setSelectedIds([]);
      qc.invalidateQueries({ queryKey: [FORMS_KEY] });
      toast.success("Successfully archived forms!", { id: loadingToast });
    } catch (err) {
      toast.error("Failed to archive selected forms.", { id: loadingToast });
    }
  };

  const handleBulkPublish = async () => {
    const loadingToast = toast.loading("Publishing selected forms...");
    try {
      await Promise.all(
        selectedIds.map((id) => publishMutation.mutateAsync({ id, data: {} }))
      );
      setSelectedIds([]);
      qc.invalidateQueries({ queryKey: [FORMS_KEY] });
      toast.success("Successfully published forms!", { id: loadingToast });
    } catch (err) {
      toast.error("Failed to publish selected forms.", { id: loadingToast });
    }
  };

  const handleBulkRestore = async () => {
    const loadingToast = toast.loading("Restoring selected forms...");
    try {
      await Promise.all(selectedIds.map((id) => restoreMutation.mutateAsync(id)));
      setSelectedIds([]);
      qc.invalidateQueries({ queryKey: [FORMS_KEY] });
      toast.success("Successfully restored forms!", { id: loadingToast });
    } catch (err) {
      toast.error("Failed to restore selected forms.", { id: loadingToast });
    }
  };

  const handleCopyLink = (form) => {
    if (!form.share_token) {
      toast.error("Form is not published yet.");
      return;
    }
    const url = `${window.location.origin}/f/${form.share_token}`;
    navigator.clipboard.writeText(url);
    toast.success("Public link copied to clipboard!");
  };

  const toggleSort = (field) => {
    if (sortBy === field) {
      setSortOrder((o) => (o === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-100 tracking-tight">
            Created Forms
          </h2>
          <p className="text-slate-500 text-xs mt-0.5 font-medium">
            Manage, build, filter, and track public status of form sheets
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary flex items-center gap-2 shrink-0 shadow-glow"
        >
          <Plus className="w-4 h-4" />
          Create Form
        </button>
      </div>

      {/* Table Toolbar / Options Control */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch">
        <div className="flex flex-col sm:flex-row gap-3 flex-1">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search forms..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="input pl-9 text-xs py-2 w-full"
            />
          </div>

          {/* Filter Status */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="select text-xs py-2 w-full sm:w-40"
          >
            <option value="">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
        </div>

        {/* View togglers & Order */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center border border-surface-850 rounded-lg p-0.5 bg-surface-900/40">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === "grid"
                  ? "bg-surface-800 text-brand-400"
                  : "text-slate-500 hover:text-slate-300"
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === "list"
                  ? "bg-surface-800 text-brand-400"
                  : "text-slate-500 hover:text-slate-300"
              }`}
              title="List View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Bulk actions bar (renders if items are selected) */}
      {selectedIds.length > 0 && (
        <div className="p-3 bg-brand-500/10 border border-brand-500/20 rounded-xl flex items-center justify-between gap-4 animate-slide-in">
          <span className="text-xs font-semibold text-brand-300">
            {selectedIds.length} forms selected
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleBulkPublish}
              className="py-1 px-2.5 rounded bg-surface-850 hover:bg-surface-800 text-slate-300 hover:text-slate-100 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-surface-800"
            >
              <Rocket className="w-3.5 h-3.5 text-emerald-400" />
              Publish
            </button>
            <button
              onClick={handleBulkArchive}
              className="py-1 px-2.5 rounded bg-surface-850 hover:bg-surface-800 text-slate-300 hover:text-slate-100 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-surface-800"
            >
              <Archive className="w-3.5 h-3.5 text-orange-400" />
              Archive
            </button>
            <button
              onClick={handleBulkRestore}
              className="py-1 px-2.5 rounded bg-surface-850 hover:bg-surface-800 text-slate-300 hover:text-slate-100 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-surface-800"
            >
              <RefreshCw className="w-3.5 h-3.5 text-blue-400" />
              Restore
            </button>
            <div className="w-px h-4 bg-surface-800 mx-1"></div>
            <button
              onClick={handleBulkDelete}
              className="py-1 px-2.5 rounded bg-red-950/20 hover:bg-red-950/40 text-red-400 hover:text-red-300 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-red-900/30"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete
            </button>
          </div>
        </div>
      )}

      {/* Loading Skeleton */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : isError ? (
        <div className="p-8 text-center rounded-2xl border border-red-500/20 bg-red-500/5 text-red-400 font-medium">
          Failed to sync forms from workspace backend.
        </div>
      ) : forms.length === 0 ? (
        <EmptyState
          title="No forms found"
          description={
            statusFilter
              ? `You don't have any forms matching "${statusFilter}" status filter.`
              : "You haven't created any forms yet. Click the button below to start."
          }
          action={{
            label: "Create Form",
            onClick: () => setShowCreateModal(true),
          }}
        />
      ) : (
        <>
          {/* Main Card/Table Grid */}
          {viewMode === "grid" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {sortedForms.map((form) => (
                <div
                  key={form.id}
                  className="card p-5 flex flex-col justify-between gap-4 hover:border-brand-600/40 transition-all duration-200 group relative"
                >
                  {/* Select selection indicator checkbox */}
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(form.id)}
                    onChange={() => handleSelectOne(form.id)}
                    className="absolute top-4 right-4 rounded border-surface-800 text-brand-500 focus:ring-brand-500/30"
                  />

                  {/* Header Row */}
                  <div className="space-y-1 pr-6">
                    <h3 className="font-bold text-slate-100 text-sm group-hover:text-brand-400 transition-colors truncate">
                      {form.title}
                    </h3>
                    <p className="text-slate-500 text-xs line-clamp-1">
                      {form.description || "No description provided"}
                    </p>
                  </div>

                  {/* Badges */}
                  <div className="flex items-center gap-2">
                    <StatusBadge status={form.status} />
                    {form.current_version_number > 0 && (
                      <span className="text-[10px] text-slate-500 font-semibold">
                        v{form.current_version_number}
                      </span>
                    )}
                  </div>

                  {/* Field and submission summary count */}
                  <div className="grid grid-cols-2 gap-4 border-t border-b border-surface-850/60 py-3 text-xs text-slate-500 font-medium">
                    <div>
                      <p className="text-slate-400 font-mono text-sm font-semibold">
                        {form.field_count}
                      </p>
                      <p className="text-[10px] uppercase tracking-wider text-slate-600 mt-0.5">
                        Questions
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-400 font-mono text-sm font-semibold">
                        {form.submission_count}
                      </p>
                      <p className="text-[10px] uppercase tracking-wider text-slate-600 mt-0.5">
                        Responses
                      </p>
                    </div>
                  </div>

                  {/* Date details */}
                  <div className="text-[10px] text-slate-600 space-y-0.5 font-medium">
                    <p>Created: {new Date(form.created_at).toLocaleDateString()}</p>
                    <p>Updated: {new Date(form.updated_at).toLocaleDateString()}</p>
                  </div>

                  {/* Quick Action buttons */}
                  <div className="grid grid-cols-2 gap-2 border-t border-surface-850 pt-3">
                    <Link
                      to={`/forms/${form.id}/builder`}
                      className="btn-secondary py-1.5 text-xs justify-center gap-1.5"
                    >
                      <Edit className="w-3.5 h-3.5 text-brand-400" />
                      Build
                    </Link>
                    <Link
                      to={`/dashboard/forms/${form.id}/preview`}
                      className="btn-secondary py-1.5 text-xs justify-center gap-1.5"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Preview
                    </Link>
                  </div>

                  {/* Menu / Individual Actions row */}
                  <div className="flex items-center justify-between pt-1 text-slate-500">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setShareForm(form)}
                        title="Distribute / Share"
                        className="p-1 hover:text-slate-200 rounded text-slate-400"
                      >
                        <Link2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => navigate(`/dashboard/forms/${form.id}/analytics`)}
                        title="Visual Analytics"
                        className="p-1 hover:text-brand-400 rounded text-slate-400"
                      >
                        <BarChart2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => duplicateMutation.mutate({ id: form.id, data: {} })}
                        title="Duplicate"
                        className="p-1 hover:text-slate-200 rounded"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center gap-1">
                      {form.status === "published" && (
                        <button
                          onClick={() => archiveMutation.mutate(form.id)}
                          title="Archive"
                          className="p-1 hover:text-orange-400 rounded"
                        >
                          <Archive className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => {
                          if (confirm(`Delete "${form.title}"?`)) {
                            deleteMutation.mutate(form.id);
                          }
                        }}
                        title="Delete"
                        className="p-1 hover:text-red-400 rounded"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* List View table format */
            <div className="p-6 rounded-2xl border border-surface-850 bg-surface-900/30 backdrop-blur-md shadow-sm overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-surface-850 text-slate-500 font-semibold uppercase tracking-wider">
                    <th className="py-3 px-4 w-10">
                      <input
                        type="checkbox"
                        checked={
                          selectedIds.length === forms.length && forms.length > 0
                        }
                        onChange={handleSelectAll}
                        className="rounded border-surface-800 text-brand-500 focus:ring-brand-500/30"
                      />
                    </th>
                    <th className="py-3 px-4 min-w-44 cursor-pointer" onClick={() => toggleSort("title")}>
                      <div className="flex items-center gap-1.5">
                        Form Name
                        <ArrowUpDown className="w-3.5 h-3.5 text-slate-600" />
                      </div>
                    </th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 cursor-pointer" onClick={() => toggleSort("field_count")}>
                      <div className="flex items-center gap-1.5">
                        Questions
                        <ArrowUpDown className="w-3.5 h-3.5 text-slate-600" />
                      </div>
                    </th>
                    <th className="py-3 px-4">Responses</th>
                    <th className="py-3 px-4 cursor-pointer" onClick={() => toggleSort("updated_at")}>
                      <div className="flex items-center gap-1.5">
                        Last Updated
                        <ArrowUpDown className="w-3.5 h-3.5 text-slate-600" />
                      </div>
                    </th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-850/40 text-slate-400">
                  {sortedForms.map((form) => (
                    <tr
                      key={form.id}
                      className="hover:bg-surface-850/20 hover:text-slate-200 transition-colors group"
                    >
                      <td className="py-3 px-4">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(form.id)}
                          onChange={() => handleSelectOne(form.id)}
                          className="rounded border-surface-800 text-brand-500 focus:ring-brand-500/30"
                        />
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-300 group-hover:text-slate-100">
                        <Link to={`/forms/${form.id}/builder`} className="hover:text-brand-400">
                          {form.title}
                        </Link>
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge status={form.status} />
                      </td>
                      <td className="py-3 px-4 font-mono font-medium">{form.field_count} fields</td>
                      <td className="py-3 px-4 font-mono font-medium">{form.submission_count}</td>
                      <td className="py-3 px-4 font-medium">
                        {new Date(form.updated_at).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-right space-x-2">
                        <Link
                          to={`/forms/${form.id}/builder`}
                          className="inline-flex items-center gap-1 hover:text-slate-100 transition-colors"
                        >
                          <Edit className="w-3.5 h-3.5 text-brand-400" />
                          Build
                        </Link>
                        <Link
                          to={`/dashboard/forms/${form.id}/preview`}
                          className="inline-flex items-center gap-1 hover:text-slate-100 transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Preview
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

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
        </>
      )}

      {/* ── Create Form Modal Overlay ─────────────────────────────────── */}
      {showCreateModal && (
        <CreateFormModal onClose={() => setShowCreateModal(false)} />
      )}

      {/* Share / QR Code Dialog */}
      {shareForm && (
        <ShareFormDialog
          form={shareForm}
          isOpen={!!shareForm}
          onClose={() => setShareForm(null)}
        />
      )}
    </div>
  );
}

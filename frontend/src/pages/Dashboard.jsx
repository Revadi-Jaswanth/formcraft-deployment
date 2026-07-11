import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus, Search, Filter, MoreVertical, Eye, Edit3, Copy, Archive,
  Trash2, FileText, CheckCircle, FolderArchive, Clock, TrendingUp,
  ExternalLink,
} from "lucide-react";
import { useForms, useCreateForm, useDeleteForm, useArchiveForm, useDuplicateForm } from "@/hooks/useForms";
import CreateFormModal from "@/components/forms/CreateFormModal";
import EmptyState from "@/components/ui/EmptyState";
import Spinner from "@/components/ui/Spinner";
import StatusBadge from "@/components/ui/StatusBadge";

export default function Dashboard() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [page, setPage] = useState(1);

  const { data, isLoading, isError } = useForms({
    search: search || undefined,
    status: statusFilter || undefined,
    page,
    limit: 12,
  });

  const deleteMutation = useDeleteForm();
  const archiveMutation = useArchiveForm();
  const duplicateMutation = useDuplicateForm();

  const forms = data?.items ?? [];
  const total = data?.total ?? 0;

  const stats = [
    {
      label: "Total Forms",
      value: total,
      icon: FileText,
      color: "text-brand-400",
      bg: "bg-brand-600/10",
    },
    {
      label: "Published",
      value: forms.filter((f) => f.status === "published").length,
      icon: CheckCircle,
      color: "text-emerald-400",
      bg: "bg-emerald-600/10",
    },
    {
      label: "Drafts",
      value: forms.filter((f) => f.status === "draft").length,
      icon: Clock,
      color: "text-amber-400",
      bg: "bg-amber-600/10",
    },
    {
      label: "Archived",
      value: forms.filter((f) => f.status === "archived").length,
      icon: FolderArchive,
      color: "text-slate-400",
      bg: "bg-slate-600/10",
    },
  ];

  return (
    <div className="page-content space-y-8 animate-fade-in">
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-100">
            Form <span className="text-gradient">Portfolio</span>
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Manage, publish, and share your data collection forms.
          </p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary btn-lg shrink-0">
          <Plus className="w-4 h-4" />
          New Form
        </button>
      </div>

      {/* ── Stats ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="card px-5 py-4 flex items-center gap-4">
            <div className={`w-10 h-10 rounded-lg ${bg} flex items-center justify-center`}>
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-100">{value}</p>
              <p className="text-xs text-slate-500">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Filters ─────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            className="input pl-9"
            placeholder="Search forms…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <select
          className="select w-44"
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
        >
          <option value="">All statuses</option>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      {/* ── Form Grid ───────────────────────────────────────────── */}
      {isLoading ? (
        <div className="flex justify-center py-20">
          <Spinner size="lg" />
        </div>
      ) : isError ? (
        <div className="card p-8 text-center text-red-400">
          Failed to load forms. Make sure the backend is running.
        </div>
      ) : forms.length === 0 ? (
        <EmptyState
          title="No forms yet"
          description="Create your first form to start collecting responses."
          action={{ label: "Create Form", onClick: () => setShowCreate(true) }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {forms.map((form) => (
            <FormCard
              key={form.id}
              form={form}
              onEdit={() => navigate(`/forms/${form.id}/builder`)}
              onDelete={() => {
                if (confirm(`Delete "${form.title}"? This cannot be undone.`)) {
                  deleteMutation.mutate(form.id);
                }
              }}
              onArchive={() => archiveMutation.mutate(form.id)}
              onDuplicate={() => duplicateMutation.mutate({ id: form.id, data: {} })}
              onShare={() => {
                if (form.share_token) {
                  window.open(`/f/${form.share_token}`, "_blank");
                }
              }}
            />
          ))}
        </div>
      )}

      {/* ── Pagination ──────────────────────────────────────────── */}
      {data?.pages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: data.pages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`w-9 h-9 rounded-lg text-sm font-medium transition-all ${
                p === page
                  ? "bg-brand-600 text-white"
                  : "btn-secondary"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      )}

      {/* ── Modals ──────────────────────────────────────────────── */}
      {showCreate && <CreateFormModal onClose={() => setShowCreate(false)} />}
    </div>
  );
}

function FormCard({ form, onEdit, onDelete, onArchive, onDuplicate, onShare }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="card p-5 flex flex-col gap-4 hover:border-brand-600/40 transition-all duration-200">
      {/* ── Top row ─────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-slate-100 truncate">{form.title}</h3>
          <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
            {form.description || "No description"}
          </p>
        </div>
        <div className="relative shrink-0">
          <button
            className="btn-icon"
            onClick={() => setMenuOpen((v) => !v)}
          >
            <MoreVertical className="w-4 h-4" />
          </button>
          {menuOpen && (
            <div
              className="absolute right-0 top-9 w-44 bg-surface-800 border border-surface-700 rounded-xl shadow-xl z-20 py-1 animate-slide-in"
              onMouseLeave={() => setMenuOpen(false)}
            >
              <MenuItem icon={Edit3} label="Edit / Build" onClick={onEdit} />
              <MenuItem icon={Copy} label="Duplicate" onClick={onDuplicate} />
              {form.status === "published" && (
                <MenuItem icon={ExternalLink} label="Open Link" onClick={onShare} />
              )}
              {form.status === "published" && (
                <MenuItem icon={Archive} label="Archive" onClick={onArchive} className="text-orange-400" />
              )}
              <div className="h-px bg-surface-700 my-1" />
              <MenuItem icon={Trash2} label="Delete" onClick={onDelete} className="text-red-400" />
            </div>
          )}
        </div>
      </div>

      {/* ── Status + version ────────────────────────────────────── */}
      <div className="flex items-center gap-2">
        <StatusBadge status={form.status} />
        {form.current_version_number > 0 && (
          <span className="text-xs text-slate-500">v{form.current_version_number}</span>
        )}
      </div>

      {/* ── Stats row ───────────────────────────────────────────── */}
      <div className="flex items-center gap-4 text-xs text-slate-500 border-t border-surface-800 pt-3">
        <span className="flex items-center gap-1">
          <FileText className="w-3 h-3" />
          {form.field_count} field{form.field_count !== 1 ? "s" : ""}
        </span>
        <span className="flex items-center gap-1">
          <TrendingUp className="w-3 h-3" />
          {form.submission_count} submission{form.submission_count !== 1 ? "s" : ""}
        </span>
      </div>

      {/* ── Actions ─────────────────────────────────────────────── */}
      <button className="btn-secondary w-full justify-center" onClick={onEdit}>
        <Edit3 className="w-3.5 h-3.5" />
        Open Builder
      </button>
    </div>
  );
}

function MenuItem({ icon: Icon, label, onClick, className = "" }) {
  return (
    <button
      className={`flex items-center gap-2.5 w-full px-3 py-2 text-sm text-slate-300 hover:bg-surface-700 transition-colors ${className}`}
      onClick={onClick}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );
}

import { useState, useEffect, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { dashboardApi } from "../../services/dashboardApi";
import { formsApi } from "../../services/formsApi";
import {
  useForms,
  useCreateForm,
  useDuplicateForm,
  FORMS_KEY,
} from "../../hooks/useForms";
import {
  Plus,
  Copy,
  Upload,
  Download,
  Search,
  Flame,
  Star,
  Pin,
  Clock,
  Sparkles,
  Info,
} from "lucide-react";
import toast from "react-hot-toast";
import StatsCards from "../../components/dashboard/StatsCards";
import RecentForms from "../../components/dashboard/RecentForms";
import RecentResponses from "../../components/dashboard/RecentResponses";
import ActivityTimeline from "../../components/dashboard/ActivityTimeline";
import EmptyState from "../../components/dashboard/EmptyState";
import SkeletonCard from "../../components/dashboard/SkeletonCard";
import CreateFormModal from "../../components/forms/CreateFormModal";

export default function DashboardHome() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Debouncing search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  // React Query queries for telemetry APIs
  const { data: overview, isLoading: overviewLoading } = useQuery({
    queryKey: ["dashboard-overview"],
    queryFn: () => dashboardApi.getOverview().then((r) => r.data),
  });

  const { data: activity, isLoading: activityLoading } = useQuery({
    queryKey: ["dashboard-activity"],
    queryFn: () => dashboardApi.getActivity().then((r) => r.data),
  });

  const { data: submissions, isLoading: submissionsLoading } = useQuery({
    queryKey: ["dashboard-submissions"],
    queryFn: () => dashboardApi.getSubmissions().then((r) => r.data),
  });

  const { data: favorites, isLoading: favoritesLoading } = useQuery({
    queryKey: ["dashboard-favorites"],
    queryFn: () => dashboardApi.getFavorites().then((r) => r.data),
  });

  const { data: formsData, isLoading: formsLoading } = useForms({ limit: 100 });
  const forms = formsData?.items ?? [];

  const duplicateMutation = useDuplicateForm();

  // Filtered structures based on debounced search
  const filteredForms = useMemo(() => {
    if (!debouncedSearch) return forms;
    const query = debouncedSearch.toLowerCase();
    return forms.filter(
      (f) =>
        f.title.toLowerCase().includes(query) ||
        (f.description && f.description.toLowerCase().includes(query))
    );
  }, [forms, debouncedSearch]);

  const filteredActivity = useMemo(() => {
    const rawActivity = activity ?? [];
    if (!debouncedSearch) return rawActivity;
    const query = debouncedSearch.toLowerCase();
    return rawActivity.filter((act) =>
      act.form_title.toLowerCase().includes(query)
    );
  }, [activity, debouncedSearch]);

  // Export all forms as JSON backup file
  const handleExportForms = () => {
    if (forms.length === 0) {
      toast.error("No form templates found to export.");
      return;
    }
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(forms, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `formcraft_backup_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    toast.success("Templates backup downloaded successfully!");
  };

  const handleToggleFavorite = async (formId) => {
    const isFav = favorites?.some((f) => f.id === formId);
    let updatedFavs = [];
    if (isFav) {
      updatedFavs = favorites.filter((f) => f.id !== formId).map((f) => f.id);
    } else {
      updatedFavs = [...(favorites?.map((f) => f.id) ?? []), formId];
    }

    try {
      await dashboardApi.updatePreferences({ favorites: updatedFavs });
      qc.invalidateQueries({ queryKey: ["dashboard-favorites"] });
      toast.success(isFav ? "Removed from Favorites" : "Added to Favorites");
    } catch (err) {
      toast.error("Failed to update favorite settings.");
    }
  };

  const handleImportFile = (e) => {
    e.preventDefault();
    toast.success("Form imported successfully! (Simulator placeholder completed)");
    setShowImportModal(false);
  };

  const isWorkspaceLoading =
    overviewLoading || activityLoading || favoritesLoading || formsLoading || submissionsLoading;

  if (isWorkspaceLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-surface-900 rounded animate-pulse"></div>
        <SkeletonCard type="stats" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4">
          <div className="lg:col-span-2 space-y-6">
            <SkeletonCard type="table" />
          </div>
          <div>
            <SkeletonCard type="table" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome & Global Search Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-100 tracking-tight">
            Workspace Overview
          </h2>
          <p className="text-slate-500 text-xs mt-0.5 font-medium">
            Monitor response telemetry, version releases, and logic diagrams
          </p>
        </div>

        {/* Global debounced search input */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search forms and activities..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-9 text-xs py-2 w-full"
          />
        </div>
      </div>

      {/* Quick Action Panels Bar */}
      <div className="flex flex-wrap gap-3 items-center p-4 rounded-xl bg-surface-900/60 border border-surface-850 justify-between">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
          <Sparkles className="w-4 h-4 text-brand-400" />
          <span>Quick Actions:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary py-1.5 px-3 text-xs flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            New Form
          </button>
          <button
            onClick={() => {
              if (forms.length > 0) {
                duplicateMutation.mutate({ id: forms[0].id, data: {} });
              } else {
                toast.error("Create a form first to simulate duplicate!");
              }
            }}
            className="btn-secondary py-1.5 px-3 text-xs flex items-center gap-1.5"
          >
            <Copy className="w-3.5 h-3.5 text-brand-400" />
            Duplicate Form
          </button>
          <button
            onClick={() => setShowImportModal(true)}
            className="btn-secondary py-1.5 px-3 text-xs flex items-center gap-1.5"
          >
            <Upload className="w-3.5 h-3.5 text-violet-400" />
            Import
          </button>
          <button
            onClick={handleExportForms}
            className="btn-secondary py-1.5 px-3 text-xs flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            Export Forms
          </button>
        </div>
      </div>

      {/* Main Stats Cards Grid */}
      <StatsCards forms={forms} overview={overview} />

      {forms.length === 0 ? (
        <EmptyState
          title="You haven't created any forms yet"
          description="Create your first form template to start publishing dynamic schemas and gathering validated response submissions."
          action={{
            label: "Create Form",
            onClick: () => setShowCreateModal(true),
          }}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Left panel: recents & favorites */}
          <div className="lg:col-span-2 space-y-6">
            {/* Favorites / Pinned forms segment */}
            {favorites && favorites.length > 0 && (
              <div className="p-6 rounded-2xl border border-surface-850 bg-surface-900/30 backdrop-blur-md space-y-4">
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                  <h3 className="font-bold text-slate-100 text-sm">Starred & Pinned Templates</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {favorites.map((fav) => (
                    <div
                      key={fav.id}
                      className="p-3.5 rounded-xl border border-surface-800 bg-surface-950/40 flex justify-between items-center gap-2 hover:border-brand-500/30 transition-all"
                    >
                      <Link to={`/dashboard/forms/${fav.id}/builder`} className="truncate">
                        <span className="font-semibold text-slate-200 hover:text-brand-400 text-xs block truncate">
                          {fav.title}
                        </span>
                        <span className="text-[10px] text-slate-500 block mt-0.5">
                          Status: {fav.status}
                        </span>
                      </Link>
                      <button
                        onClick={() => handleToggleFavorite(fav.id)}
                        title="Unstar"
                        className="text-amber-400 hover:text-slate-600 transition-colors"
                      >
                        <Star className="w-3.5 h-3.5 fill-amber-400" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Forms table */}
            <RecentForms forms={filteredForms} />

            {/* Favorite handler integration: inject favorite click option */}
            <div className="p-6 rounded-2xl border border-surface-850 bg-surface-900/30 backdrop-blur-md space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Pin className="w-4 h-4 text-brand-400" />
                  <h3 className="font-bold text-slate-100 text-sm">Pin / Star Forms Workspace</h3>
                </div>
                <span className="text-[10px] bg-brand-500/10 text-brand-400 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                  Quick Access
                </span>
              </div>
              <div className="space-y-2">
                {forms.slice(0, 4).map((form) => {
                  const isStarred = favorites?.some((f) => f.id === form.id);
                  return (
                    <div
                      key={form.id}
                      className="flex items-center justify-between p-2.5 rounded-xl border border-surface-850/50 hover:bg-surface-850/10 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        <span className="text-xs font-medium text-slate-300">{form.title}</span>
                      </div>
                      <button
                        onClick={() => handleToggleFavorite(form.id)}
                        className={`p-1 rounded transition-colors ${
                          isStarred ? "text-amber-400 hover:text-slate-500" : "text-slate-500 hover:text-amber-400"
                        }`}
                      >
                        <Star className={`w-3.5 h-3.5 ${isStarred ? "fill-amber-400" : ""}`} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Submissions list */}
            <RecentResponses submissions={submissions} isLoading={submissionsLoading} />
          </div>

          {/* Right panel: Timeline Logs */}
          <div className="space-y-6">
            <ActivityTimeline forms={forms} activities={filteredActivity} />
          </div>
        </div>
      )}

      {/* ── Create Form Modal Overlay ─────────────────────────────────── */}
      {showCreateModal && (
        <CreateFormModal onClose={() => setShowCreateModal(false)} />
      )}

      {/* ── Import Form Modal Overlay (Placeholder) ───────────────────── */}
      {showImportModal && (
        <div className="fixed inset-0 bg-surface-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleImportFile}
            className="w-full max-w-md bg-surface-900 border border-surface-800 rounded-2xl p-6 space-y-6 shadow-2xl animate-scale-in"
          >
            <div className="space-y-1">
              <h3 className="font-bold text-slate-100 text-sm">Import Form Template</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Upload a JSON schema snapshot to restore templates into your active workspace.
              </p>
            </div>

            {/* Dropzone mock */}
            <div className="border-2 border-dashed border-surface-800 rounded-xl p-8 text-center bg-surface-950/40 hover:border-brand-500/50 cursor-pointer transition-all">
              <Upload className="w-8 h-8 text-slate-600 mx-auto mb-3" />
              <p className="text-xs font-semibold text-slate-400">Click to select backup file</p>
              <p className="text-[10px] text-slate-600 mt-1">Accepts only JSON files (.json)</p>
              <input type="file" className="hidden" accept=".json" />
            </div>

            <div className="flex justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => setShowImportModal(false)}
                className="btn-secondary py-2 px-4"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary py-2 px-4"
              >
                Restore Import
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

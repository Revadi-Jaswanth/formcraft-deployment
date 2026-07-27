/**
 * FormBuilder page — 3-panel build UI with Logic and Settings tabs.
 *
 * Module 2 changes:
 *  - Import RuleBuilder (replaces ConditionBuilder in logic tab)
 *  - Fetch rules via useRules and pass to FieldList for LogicBadge
 */
import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft, Settings, Eye, Globe, GitBranch, Plus,
} from "lucide-react";
import { useForm, usePublishForm, useUpdateForm } from "@/hooks/useForms";
import { useRules } from "@/hooks/useConditions";
import FieldList         from "@/components/form-builder/FieldList";
import FieldTypePanel    from "@/components/form-builder/FieldTypePanel";
import FieldConfigPanel  from "@/components/form-builder/FieldConfigPanel";
import RuleBuilder       from "@/components/form-builder/RuleBuilder";
import FormSettingsPanel from "@/components/form-builder/FormSettingsPanel";
import PreviewModal      from "@/components/form-builder/PreviewModal";
import Spinner           from "@/components/ui/Spinner";
import StatusBadge       from "@/components/ui/StatusBadge";

const TABS = [
  { id: "build",    label: "Build",    icon: Plus       },
  { id: "logic",    label: "Logic",    icon: GitBranch  },
  { id: "settings", label: "Settings", icon: Settings   },
];

export default function FormBuilder() {
  const { formId }   = useParams();
  const navigate     = useNavigate();

  const { data: form, isLoading, isError } = useForm(formId);
  const { data: rules = [] }               = useRules(formId);
  const publishMutation = usePublishForm();

  const [activeTab,     setActiveTab]     = useState("build");
  const [selectedField, setSelectedField] = useState(null);
  const [showPreview,   setShowPreview]   = useState(false);

  // ── Loading / error states ─────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Spinner size="lg" />
      </div>
    );
  }
  if (isError || !form) {
    return (
      <div className="flex items-center justify-center h-full text-red-400">
        Failed to load form.
      </div>
    );
  }

  const handlePublish = () => publishMutation.mutate({ id: formId, data: {} });

  // Logic tab badge — show rule count on the tab
  const ruleCount = rules.length;

  return (
    <div className="flex flex-col h-full">
      {/* ── Builder Topbar ───────────────────────────────────────────────────── */}
      <div className="flex items-center gap-4 px-6 py-3 border-b border-surface-800 bg-surface-900">
        <button
          className="btn-ghost btn-sm"
          onClick={() => navigate("/dashboard")}
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="font-semibold text-slate-100 truncate">{form.title}</h1>
            <StatusBadge status={form.status} />
          </div>
          <p className="text-xs text-slate-500">
            {form.fields?.length ?? 0} fields ·{" "}
            {form.current_version_number > 0
              ? `v${form.current_version_number}`
              : "Not published"}
            {ruleCount > 0 && ` · ${ruleCount} rule${ruleCount !== 1 ? "s" : ""}`}
          </p>
        </div>

        {/* ── Tabs ────────────────────────────────────────────────────────────── */}
        <div className="flex items-center gap-1 bg-surface-800 p-1 rounded-lg">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                activeTab === id
                  ? "bg-brand-600 text-white"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
              {/* Rule count badge on Logic tab */}
              {id === "logic" && ruleCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-violet-500 text-white text-[9px] font-bold flex items-center justify-center">
                  {ruleCount}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button className="btn-secondary btn-sm" onClick={() => setShowPreview(true)}>
            <Eye className="w-3.5 h-3.5" />
            Preview
          </button>
          {form.share_token && (
            <a
              href={`/f/${form.share_token}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary btn-sm"
            >
              <Globe className="w-3.5 h-3.5" />
              Share Link
            </a>
          )}
          <button
            className="btn-primary btn-sm"
            onClick={handlePublish}
            disabled={publishMutation.isPending}
          >
            {publishMutation.isPending ? (
              <Spinner size="xs" />
            ) : (
              <Globe className="w-3.5 h-3.5" />
            )}
            {form.status === "draft" ? "Publish" : "Re-publish"}
          </button>
        </div>
      </div>

      {/* ── Builder Body ─────────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">
        {/* ── BUILD TAB ──────────────────────────────────────────────────────── */}
        {activeTab === "build" && (
          <>
            {/* Left: Field type palette */}
            <FieldTypePanel formId={formId} fields={form.fields ?? []} />

            {/* Center: Drag-drop field list — receives rules for LogicBadge */}
            <div className="flex-1 overflow-auto border-x border-surface-800">
              <FieldList
                formId={formId}
                fields={form.fields ?? []}
                rules={rules}
                selectedField={selectedField}
                onSelectField={setSelectedField}
              />
            </div>

            {/* Right: Field config panel */}
            {selectedField && (
              <FieldConfigPanel
                formId={formId}
                field={selectedField}
                onClose={() => setSelectedField(null)}
              />
            )}
          </>
        )}

        {/* ── LOGIC TAB ──────────────────────────────────────────────────────── */}
        {activeTab === "logic" && (
          <div className="flex-1 overflow-auto p-6">
            <RuleBuilder formId={formId} fields={form.fields ?? []} />
          </div>
        )}

        {/* ── SETTINGS TAB ───────────────────────────────────────────────────── */}
        {activeTab === "settings" && (
          <div className="flex-1 overflow-auto p-6 max-w-2xl mx-auto w-full">
            <FormSettingsPanel form={form} />
          </div>
        )}
      </div>

      {/* ── Preview Modal ─────────────────────────────────────────────────────── */}
      {showPreview && (
        <PreviewModal form={form} onClose={() => setShowPreview(false)} />
      )}
    </div>
  );
}

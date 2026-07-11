import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft, Settings, Eye, Globe, GitBranch, Plus, Save,
} from "lucide-react";
import { useForm } from "@/hooks/useForms";
import { usePublishForm, useUpdateForm } from "@/hooks/useForms";
import FieldList from "@/components/form-builder/FieldList";
import FieldTypePanel from "@/components/form-builder/FieldTypePanel";
import FieldConfigPanel from "@/components/form-builder/FieldConfigPanel";
import ConditionBuilder from "@/components/form-builder/ConditionBuilder";
import FormSettingsPanel from "@/components/form-builder/FormSettingsPanel";
import PreviewModal from "@/components/form-builder/PreviewModal";
import Spinner from "@/components/ui/Spinner";
import StatusBadge from "@/components/ui/StatusBadge";

const TABS = [
  { id: "build", label: "Build", icon: Plus },
  { id: "logic", label: "Logic", icon: GitBranch },
  { id: "settings", label: "Settings", icon: Settings },
];

export default function FormBuilder() {
  const { formId } = useParams();
  const navigate = useNavigate();

  const { data: form, isLoading, isError } = useForm(formId);
  const publishMutation = usePublishForm();
  const updateMutation = useUpdateForm(formId);

  const [activeTab, setActiveTab] = useState("build");
  const [selectedField, setSelectedField] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

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

  const handlePublish = () => {
    publishMutation.mutate({ id: formId, data: {} });
  };

  return (
    <div className="flex flex-col h-full">
      {/* ── Builder Topbar ─────────────────────────────────────── */}
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
            {form.current_version_number > 0 ? `v${form.current_version_number}` : "Not published"}
          </p>
        </div>

        {/* ── Tabs ──────────────────────────────────────────────── */}
        <div className="flex items-center gap-1 bg-surface-800 p-1 rounded-lg">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                activeTab === id
                  ? "bg-brand-600 text-white"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
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

      {/* ── Builder Body ───────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">
        {activeTab === "build" && (
          <>
            {/* Left: Field type palette */}
            <FieldTypePanel formId={formId} fields={form.fields ?? []} />

            {/* Center: Field list (drag-drop) */}
            <div className="flex-1 overflow-auto border-x border-surface-800">
              <FieldList
                formId={formId}
                fields={form.fields ?? []}
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

        {activeTab === "logic" && (
          <div className="flex-1 overflow-auto p-6">
            <ConditionBuilder formId={formId} fields={form.fields ?? []} />
          </div>
        )}

        {activeTab === "settings" && (
          <div className="flex-1 overflow-auto p-6 max-w-2xl mx-auto w-full">
            <FormSettingsPanel form={form} />
          </div>
        )}
      </div>

      {/* ── Preview Modal ──────────────────────────────────────── */}
      {showPreview && (
        <PreviewModal
          form={form}
          onClose={() => setShowPreview(false)}
        />
      )}
    </div>
  );
}

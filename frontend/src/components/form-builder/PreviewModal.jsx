/**
 * Preview Modal — renders the form exactly as respondents will see it.
 */
import { X } from "lucide-react";
import FormRenderer from "@/components/public/FormRenderer";

export default function PreviewModal({ form, onClose }) {
  const publicForm = {
    id: form.id,
    title: form.title,
    description: form.description,
    settings: form.settings,
    version_number: form.current_version_number,
    share_token: form.share_token,
    fields: form.fields ?? [],
    conditions: form.conditions ?? [],
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-6 bg-black/70 backdrop-blur-sm overflow-auto">
      <div className="w-full max-w-2xl animate-slide-in">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm font-medium text-slate-300">Form Preview</p>
            <p className="text-xs text-slate-500">This is how respondents will see the form.</p>
          </div>
          <button className="btn-secondary btn-sm" onClick={onClose}>
            <X className="w-4 h-4" />
            Close
          </button>
        </div>

        {/* Form */}
        <FormRenderer form={publicForm} isPreview />
      </div>
    </div>
  );
}

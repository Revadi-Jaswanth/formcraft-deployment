import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Layers, Plus, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { formsApi } from "../../services/formsApi";
import { FORMS_KEY } from "../../hooks/useForms";
import toast from "react-hot-toast";

const TEMPLATE_PRESETS = [
  {
    title: "Customer Feedback Survey",
    description: "Gather feedback on product satisfaction, support rating, and suggestions.",
    fields: [
      { label: "Full Name", field_type: "text", is_required: true },
      { label: "Product Rating", field_type: "rating", is_required: true },
      { label: "Suggestions for improvement", field_type: "textarea", is_required: false },
    ],
  },
  {
    title: "Event Registration",
    description: "Collect attendee names, contact details, and workshop preferences.",
    fields: [
      { label: "Full Name", field_type: "text", is_required: true },
      { label: "Email Address", field_type: "text", is_required: true },
      { label: "Workshop Preferences", field_type: "checkbox", is_required: true },
    ],
  },
  {
    title: "Job Application",
    description: "Standard application gathering resume files, position preferences, and details.",
    fields: [
      { label: "Full Name", field_type: "text", is_required: true },
      { label: "Email Address", field_type: "text", is_required: true },
      { label: "Upload Resume (PDF)", field_type: "file", is_required: true },
    ],
  },
];

export default function Templates() {
  const qc = useQueryClient();
  const navigate = useNavigate();

  const createMutation = useMutation({
    mutationFn: (data) => formsApi.create(data),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: [FORMS_KEY] });
      toast.success("Template copied successfully! Opening in builder...");
      navigate(`/dashboard/forms/${data.data.id}/builder`);
    },
    onError: () => {
      toast.error("Failed to create template copy.");
    },
  });

  const handleUseTemplate = (template) => {
    createMutation.mutate({
      title: template.title,
      description: template.description,
      settings: {},
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-slate-100 tracking-tight">
          Form Templates Library
        </h2>
        <p className="text-slate-500 text-xs mt-0.5 font-medium">
          Create new forms instantly using our hand-crafted, beautiful starting templates
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
        {TEMPLATE_PRESETS.map((tmpl, index) => (
          <div
            key={index}
            className="p-6 rounded-2xl border border-surface-850 bg-surface-900/60 backdrop-blur-md flex flex-col justify-between hover:border-brand-500/30 transition-all group"
          >
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-brand-500/10 flex items-center justify-center text-brand-400 group-hover:scale-110 transition-transform">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-200 text-sm group-hover:text-brand-400 transition-colors">
                {tmpl.title}
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed font-medium">
                {tmpl.description}
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-surface-850/60 flex items-center justify-between">
              <span className="text-[10px] bg-brand-500/10 text-brand-400 px-2 py-0.5 rounded font-extrabold uppercase">
                {tmpl.fields.length} Fields
              </span>
              <button
                onClick={() => handleUseTemplate(tmpl)}
                className="btn-primary py-1.5 px-3 text-xs flex items-center gap-1 font-bold"
              >
                <Plus className="w-3.5 h-3.5" />
                Use Template
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

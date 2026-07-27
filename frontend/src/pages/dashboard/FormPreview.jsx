import { useParams, useNavigate } from "react-router-dom";
import { useForm } from "../../hooks/useForms";
import { ArrowLeft, Eye, Play } from "lucide-react";
import FormRenderer from "../../components/public/FormRenderer";
import FormSkeleton from "../../components/public/FormSkeleton";
import toast from "react-hot-toast";

export default function FormPreview() {
  const { formId } = useParams();
  const navigate = useNavigate();
  
  // Load form details via cached react query hook
  const { data: form, isLoading, isError } = useForm(formId);

  const handleMockSubmit = (data) => {
    toast.success("Form submission simulated successfully in preview mode!");
  };

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <FormSkeleton />
      </div>
    );
  }

  if (isError || !form) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8 text-center text-red-400 font-medium">
        Failed to load form details for preview.
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fade-in">
      {/* Top Banner Toolbar */}
      <div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-surface-900 border border-surface-850">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-surface-800 rounded transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
              <Eye className="w-4 h-4 text-brand-400" />
              Preview: {form.title}
            </h3>
            <p className="text-[10px] text-slate-500 font-medium">
              Mode: Administrator interactive preview (No response logging)
            </p>
          </div>
        </div>

        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-brand-500/10 text-brand-400 border border-brand-500/20">
          <Play className="w-3 h-3" />
          Live Simulator
        </span>
      </div>

      {/* Dynamic Form Renderer Container */}
      <div className="p-8 rounded-2xl border border-surface-850 bg-surface-900/25 backdrop-blur-md shadow-2xl relative">
        <FormRenderer
          form={form}
          isPreview={true}
          onSubmit={handleMockSubmit}
        />
      </div>
    </div>
  );
}

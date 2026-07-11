/**
 * PublicForm page — unauthenticated respondent view.
 * Fetches form by share token and handles submission.
 */
import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { publicApi } from "@/services/api";
import FormRenderer from "@/components/public/FormRenderer";
import Spinner from "@/components/ui/Spinner";
import { Zap, CheckCircle, XCircle } from "lucide-react";

export default function PublicForm() {
  const { shareToken } = useParams();
  const [submitted, setSubmitted] = useState(false);
  const [startedAt] = useState(new Date().toISOString());

  const { data: form, isLoading, isError } = useQuery({
    queryKey: ["public-form", shareToken],
    queryFn: () => publicApi.getForm(shareToken).then((r) => r.data),
  });

  const submitMutation = useMutation({
    mutationFn: (data) => publicApi.submit(shareToken, data).then((r) => r.data),
    onSuccess: () => setSubmitted(true),
  });

  const handleSubmit = (responses) => {
    const now = new Date();
    const start = new Date(startedAt);
    const completionSeconds = Math.round((now - start) / 1000);

    submitMutation.mutate({
      started_at: startedAt,
      completion_time_seconds: completionSeconds,
      responses,
    });
  };

  return (
    <div className="min-h-screen bg-surface-950 flex flex-col">
      {/* Top bar */}
      <div className="px-6 py-4 flex items-center gap-2 border-b border-surface-800 bg-surface-900">
        <div className="w-6 h-6 rounded bg-gradient-to-br from-brand-500 to-violet-600 flex items-center justify-center">
          <Zap className="w-3.5 h-3.5 text-white" />
        </div>
        <span className="text-sm font-semibold text-slate-300">FormCraft</span>
      </div>

      <div className="flex-1 flex items-start justify-center px-4 py-10">
        <div className="w-full max-w-2xl">
          {isLoading && (
            <div className="flex justify-center py-20">
              <Spinner size="lg" />
            </div>
          )}

          {isError && (
            <div className="card p-10 text-center space-y-4">
              <XCircle className="w-12 h-12 text-red-400 mx-auto" />
              <h2 className="text-xl font-bold text-slate-100">Form Not Found</h2>
              <p className="text-slate-400 text-sm">
                This form link is invalid or the form is no longer accepting responses.
              </p>
            </div>
          )}

          {form && !submitted && (
            <FormRenderer
              form={form}
              onSubmit={handleSubmit}
              submitting={submitMutation.isPending}
            />
          )}

          {submitted && (
            <SuccessScreen message={form?.settings?.success_message} />
          )}

          {submitMutation.isError && (
            <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
              {submitMutation.error?.message || "Submission failed. Please try again."}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SuccessScreen({ message }) {
  return (
    <div className="card p-12 text-center space-y-5 animate-slide-in">
      <div className="w-16 h-16 rounded-full bg-emerald-500/10 border-2 border-emerald-500/30 flex items-center justify-center mx-auto">
        <CheckCircle className="w-8 h-8 text-emerald-400" />
      </div>
      <div>
        <h2 className="text-2xl font-bold text-slate-100">Submitted!</h2>
        <p className="text-slate-400 mt-2">
          {message || "Thank you for your submission!"}
        </p>
      </div>
    </div>
  );
}

/**
 * PublicForm page — unauthenticated respondent view.
 *
 * Features:
 *   - Idempotency key protection to prevent duplicate submissions.
 *   - Respondent form rendering with live conditional rules & client/server validation.
 *   - Production-grade confirmation / success screen displaying:
 *       • Thank You header
 *       • Submission ID (with Copy Response ID button)
 *       • Timestamp
 *       • Form Name & Fields Answered summary
 *       • Submit Another Response & Return Home buttons
 */
import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { publicApi } from "@/services/api";
import { mapBackendErrors } from "@/lib/mapBackendErrors";
import FormRenderer from "@/components/public/FormRenderer";
import FormSkeleton from "@/components/public/FormSkeleton";
import { Zap, CheckCircle, XCircle, Copy, Home, RotateCcw, Check } from "lucide-react";

export default function PublicForm() {
  const { shareToken } = useParams();
  const navigate = useNavigate();

  const [submissionResult, setSubmissionResult] = useState(null);
  const [startedAt] = useState(new Date().toISOString());
  const [generalError, setGeneralError] = useState(null);

  // Generate an idempotency key for this form session
  const [idempotencyKey] = useState(() =>
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `idemp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
  );

  const { data: form, isLoading, isError } = useQuery({
    queryKey: ["public-form", shareToken],
    queryFn: () => publicApi.getForm(shareToken).then((r) => r.data),
  });

  const submitMutation = useMutation({
    mutationFn: (data) =>
      publicApi.submit(shareToken, data, idempotencyKey).then((r) => r.data),
    onSuccess: (res) => {
      setSubmissionResult(res);
    },
  });

  const handleSubmit = (responses, setError) => {
    setGeneralError(null);
    const now = new Date();
    const start = new Date(startedAt);
    const completionSeconds = Math.round((now - start) / 1000);

    submitMutation.mutate(
      {
        started_at: startedAt,
        completion_time_seconds: completionSeconds,
        responses,
      },
      {
        onError: (err) => {
          const wasMapped = mapBackendErrors(err, setError);
          if (!wasMapped) {
            setGeneralError(err.message || "Submission failed. Please try again.");
          }
        },
      }
    );
  };

  const handleReset = () => {
    setSubmissionResult(null);
    setGeneralError(null);
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-surface-950 flex flex-col">
      {/* Top bar */}
      <div className="px-6 py-4 flex items-center justify-between border-b border-surface-800 bg-surface-900">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-gradient-to-br from-brand-500 to-violet-600 flex items-center justify-center">
            <Zap className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-sm font-semibold text-slate-300">FormCraft</span>
        </div>
      </div>

      <div className="flex-1 flex items-start justify-center px-4 py-10">
        <div className="w-full max-w-2xl">
          {isLoading && <FormSkeleton />}

          {isError && (
            <div className="card p-10 text-center space-y-4">
              <XCircle className="w-12 h-12 text-red-400 mx-auto" />
              <h2 className="text-xl font-bold text-slate-100">Form Not Found</h2>
              <p className="text-slate-400 text-sm">
                This form link is invalid or the form is no longer accepting responses.
              </p>
            </div>
          )}

          {form && !submissionResult && (
            <FormRenderer
              form={form}
              onSubmit={handleSubmit}
              submitting={submitMutation.isPending}
            />
          )}

          {submissionResult && (
            <SuccessScreen
              result={submissionResult}
              formTitle={form?.title}
              successMessage={form?.settings?.success_message}
              onReset={handleReset}
              onHome={() => navigate("/dashboard")}
            />
          )}

          {generalError && (
            <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm flex items-center gap-2">
              <XCircle className="w-4 h-4 shrink-0" />
              <span>{generalError}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SuccessScreen({ result, formTitle, successMessage, onReset, onHome }) {
  const [copied, setCopied] = useState(false);

  const responseId = result.response_id || result.submission_id || "";
  const submittedAt = result.submitted_at
    ? new Date(result.submitted_at).toLocaleString()
    : new Date().toLocaleString();

  const fieldsAnswered = result.summary?.fields_answered ?? 0;
  const title = result.summary?.form_title || formTitle || "Form";

  const copyToClipboard = () => {
    if (responseId && navigator.clipboard) {
      navigator.clipboard.writeText(String(responseId));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="card p-8 sm:p-12 text-center space-y-6 animate-slide-in">
      {/* Icon */}
      <div className="w-16 h-16 rounded-full bg-emerald-500/10 border-2 border-emerald-500/30 flex items-center justify-center mx-auto">
        <CheckCircle className="w-8 h-8 text-emerald-400" />
      </div>

      {/* Header & Success message */}
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-slate-100">Thank You!</h2>
        <p className="text-slate-300 text-base">
          {successMessage || "Your response has been recorded successfully."}
        </p>
      </div>

      {/* Submission Details Card */}
      <div className="bg-surface-950 rounded-xl border border-surface-800 p-5 text-left space-y-3 text-sm">
        <div className="flex items-center justify-between border-b border-surface-800/80 pb-2">
          <span className="text-slate-500 font-medium">Form</span>
          <span className="font-semibold text-slate-200">{title}</span>
        </div>

        <div className="flex items-center justify-between border-b border-surface-800/80 pb-2">
          <span className="text-slate-500 font-medium">Submitted At</span>
          <span className="text-slate-300">{submittedAt}</span>
        </div>

        <div className="flex items-center justify-between border-b border-surface-800/80 pb-2">
          <span className="text-slate-500 font-medium">Fields Answered</span>
          <span className="text-slate-300 font-semibold">{fieldsAnswered}</span>
        </div>

        {responseId && (
          <div className="flex items-center justify-between pt-1">
            <span className="text-slate-500 font-medium">Submission ID</span>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-brand-400 bg-brand-500/10 px-2 py-1 rounded">
                {String(responseId).slice(0, 8)}…
              </span>
              <button
                type="button"
                onClick={copyToClipboard}
                className="btn-secondary btn-sm"
                title="Copy Response ID"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? "Copied" : "Copy ID"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
        <button type="button" className="btn-secondary w-full sm:w-auto" onClick={onReset}>
          <RotateCcw className="w-4 h-4" />
          Submit Another Response
        </button>

        <button type="button" className="btn-primary w-full sm:w-auto" onClick={onHome}>
          <Home className="w-4 h-4" />
          Return Home
        </button>
      </div>
    </div>
  );
}

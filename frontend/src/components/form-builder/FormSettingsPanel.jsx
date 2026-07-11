/**
 * Form Settings Panel — edit form-level settings.
 */
import { useState } from "react";
import { Save } from "lucide-react";
import { useUpdateForm } from "@/hooks/useForms";

export default function FormSettingsPanel({ form }) {
  const updateMutation = useUpdateForm(form.id);
  const [title, setTitle] = useState(form.title);
  const [description, setDescription] = useState(form.description || "");
  const [settings, setSettings] = useState({
    allow_multiple_submissions: true,
    show_progress_bar: true,
    submit_button_text: "Submit",
    success_message: "Thank you for your submission!",
    require_email: false,
    is_anonymous: false,
    ...(form.settings || {}),
  });

  const handleSave = () => {
    updateMutation.mutate({ title, description, settings });
  };

  const Field = ({ label, helper, children }) => (
    <div className="flex items-start justify-between gap-4 py-4 border-b border-surface-800">
      <div className="flex-1">
        <p className="text-sm font-medium text-slate-200">{label}</p>
        {helper && <p className="text-xs text-slate-500 mt-0.5">{helper}</p>}
      </div>
      <div className="shrink-0 w-64">{children}</div>
    </div>
  );

  const Toggle = ({ value, onChange }) => (
    <button
      className={`w-11 h-6 rounded-full transition-all relative ${value ? "bg-brand-600" : "bg-surface-700"}`}
      onClick={() => onChange(!value)}
    >
      <span
        className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${value ? "left-5" : "left-0.5"}`}
      />
    </button>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h3 className="font-semibold text-slate-100 text-lg">Form Settings</h3>
        <p className="text-slate-400 text-sm mt-1">Configure form metadata and behavior.</p>
      </div>

      <div className="card p-6 space-y-1">
        {/* Title */}
        <Field label="Form Title" helper="Visible to respondents at the top of the form">
          <input
            className="input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </Field>

        {/* Description */}
        <Field label="Description" helper="Optional subtitle below the form title">
          <textarea
            className="textarea"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional description…"
          />
        </Field>

        {/* Submit button text */}
        <Field label="Submit button text" helper="Label on the form submit button">
          <input
            className="input"
            value={settings.submit_button_text}
            onChange={(e) => setSettings((s) => ({ ...s, submit_button_text: e.target.value }))}
          />
        </Field>

        {/* Success message */}
        <Field label="Success message" helper="Shown after a successful submission">
          <textarea
            className="textarea"
            rows={2}
            value={settings.success_message}
            onChange={(e) => setSettings((s) => ({ ...s, success_message: e.target.value }))}
          />
        </Field>

        {/* Multiple submissions */}
        <Field label="Allow multiple submissions" helper="Same person can submit more than once">
          <Toggle
            value={settings.allow_multiple_submissions}
            onChange={(v) => setSettings((s) => ({ ...s, allow_multiple_submissions: v }))}
          />
        </Field>

        {/* Progress bar */}
        <Field label="Show progress bar" helper="Displays form completion progress">
          <Toggle
            value={settings.show_progress_bar}
            onChange={(v) => setSettings((s) => ({ ...s, show_progress_bar: v }))}
          />
        </Field>

        {/* Anonymous */}
        <Field label="Anonymous responses" helper="Do not collect IP address or session ID">
          <Toggle
            value={settings.is_anonymous}
            onChange={(v) => setSettings((s) => ({ ...s, is_anonymous: v }))}
          />
        </Field>
      </div>

      <button
        className="btn-primary btn-lg"
        onClick={handleSave}
        disabled={updateMutation.isPending}
      >
        <Save className="w-4 h-4" />
        {updateMutation.isPending ? "Saving…" : "Save Settings"}
      </button>
    </div>
  );
}

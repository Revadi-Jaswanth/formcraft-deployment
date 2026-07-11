/**
 * Create Form Modal — validated form creation dialog.
 */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { X, Zap } from "lucide-react";
import { useCreateForm } from "@/hooks/useForms";

export default function CreateFormModal({ onClose }) {
  const navigate = useNavigate();
  const createMutation = useCreateForm();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    createMutation.mutate(
      { title: title.trim(), description: description.trim() || null },
      {
        onSuccess: (form) => {
          onClose();
          navigate(`/forms/${form.id}/builder`);
        },
      }
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-md animate-slide-in">
        <div className="card p-6 space-y-5">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-violet-600 flex items-center justify-center">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <h2 className="font-bold text-slate-100">Create New Form</h2>
            </div>
            <button className="btn-icon" onClick={onClose}>
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Form Title *</label>
              <input
                className="input"
                placeholder="e.g. Employee Satisfaction Survey"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                autoFocus
                required
              />
            </div>
            <div>
              <label className="label">Description</label>
              <textarea
                className="textarea"
                placeholder="Optional — describe what this form is for…"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                className="btn-secondary flex-1 justify-center"
                onClick={onClose}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary flex-1 justify-center"
                disabled={!title.trim() || createMutation.isPending}
              >
                {createMutation.isPending ? "Creating…" : "Create & Open Builder"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

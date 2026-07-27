import { useState } from "react";
import { X, Trash2, Loader2, AlertTriangle } from "lucide-react";
import { profileApi } from "../../services/profileApi";
import { useAuth } from "../../contexts/AuthContext";
import toast from "react-hot-toast";

export default function DeleteAccountDialog({ isOpen, onClose }) {
  const { logout } = useAuth();
  const [password, setPassword] = useState("");
  const [confirmText, setConfirmText] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (confirmText !== "DELETE") {
      toast.error("Please type DELETE to confirm account removal.");
      return;
    }

    setLoading(true);
    try {
      await profileApi.deleteAccount(password);
      toast.success("Your profile and data have been permanently deleted.");
      await logout();
      onClose();
      window.location.href = "/";
    } catch (err) {
      toast.error(err.response?.data?.detail || "Account deletion rejected. Incorrect password.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-surface-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-surface-900 border border-red-500/20 rounded-2xl p-6 relative shadow-2xl space-y-6 animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-surface-850/50 pb-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <h3 className="font-bold text-slate-100 text-sm">Delete Profile Workspace</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-500 hover:text-slate-300 hover:bg-surface-800 rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Warning Callout */}
        <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/10 text-xs text-red-400 leading-relaxed font-semibold space-y-1">
          <p className="font-bold">⚠️ Warning: Danger Zone Action</p>
          <p>
            Deleting your account will permanently remove all your forms, collected responses, file uploads, settings, and workspace preferences. This action cannot be undone.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-semibold">
          {/* Password */}
          <div className="space-y-1.5">
            <label className="text-slate-400 uppercase tracking-wider">Confirm Password</label>
            <input
              type="password"
              placeholder="Enter password to verify"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-surface-950 border border-surface-800 focus:border-red-500/50 rounded-lg px-3 py-2.5 outline-none text-slate-200"
              required
            />
          </div>

          {/* Confirm text field */}
          <div className="space-y-1.5">
            <label className="text-slate-400 uppercase tracking-wider">
              Type <span className="text-red-400 font-bold">DELETE</span> to confirm
            </label>
            <input
              type="text"
              placeholder="DELETE"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              className="w-full bg-surface-950 border border-surface-800 focus:border-red-500/50 rounded-lg px-3 py-2.5 outline-none text-slate-200"
              required
            />
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-2 pt-2 text-xs">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary py-2 px-4"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary bg-red-600 hover:bg-red-500 border-red-700/30 hover:shadow-red-500/10 py-2 px-4 flex items-center gap-1.5 font-bold"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Deleting Account...
                </>
              ) : (
                <>
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete Workspace
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

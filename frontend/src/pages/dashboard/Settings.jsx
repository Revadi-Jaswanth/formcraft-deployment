import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { profileApi } from "../../services/profileApi";
import { formsApi } from "../../services/formsApi";
import {
  Settings as SettingsIcon,
  Sun,
  Bell,
  Lock,
  Download,
  AlertTriangle,
  Loader2,
  CheckCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import ThemeSelector from "../../components/profile/ThemeSelector";
import NotificationSettings from "../../components/profile/NotificationSettings";
import SecuritySettings from "../../components/profile/SecuritySettings";
import DeleteAccountDialog from "../../components/profile/DeleteAccountDialog";

export default function Settings() {
  const qc = useQueryClient();
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // 1. Query user settings
  const { data: settings, isLoading, isError } = useQuery({
    queryKey: ["user-settings"],
    queryFn: () => profileApi.getSettings().then((r) => r.data),
  });

  const [appearance, setAppearance] = useState("dark");
  const [notifications, setNotifications] = useState({
    email_notifications: true,
    submission_alerts: true,
    weekly_reports: false,
    marketing_emails: false,
  });

  // Sync state once loaded
  useEffect(() => {
    if (settings) {
      setAppearance(settings.appearance || "dark");
      setNotifications(settings.notifications || {});
    }
  }, [settings]);

  const handleSaveSettings = async () => {
    setLoading(true);
    try {
      await profileApi.updateSettings({ appearance, notifications });
      qc.invalidateQueries({ queryKey: ["user-settings"] });
      
      // Update global body data-theme attribute
      if (appearance === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
      
      toast.success("Settings updated successfully!");
    } catch (err) {
      toast.error("Failed to save settings preferences.");
    } finally {
      setLoading(false);
    }
  };

  const handleExportAllData = async () => {
    try {
      const response = await formsApi.list({ limit: 1000 });
      const forms = response.data?.items ?? [];
      const backupData = {
        exported_at: new Date().toISOString(),
        forms: forms,
        settings: settings,
      };
      
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData, null, 2));
      const downloadAnchor = document.createElement("a");
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `formcraft_user_export_${Date.now()}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      toast.success("JSON backup downloaded successfully!");
    } catch (err) {
      toast.error("Failed to export all workspace data.");
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="w-6 h-6 text-brand-400 animate-spin" />
      </div>
    );
  }

  if (isError || !settings) {
    return (
      <div className="p-8 text-center text-red-400 font-medium">
        Failed to fetch settings details from server.
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fade-in text-xs font-semibold">
      {/* Header bar */}
      <div className="flex items-center justify-between border-b border-surface-850 pb-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-100 tracking-tight">
            Account Settings
          </h2>
          <p className="text-slate-500 text-xs mt-0.5 font-medium">
            Personalize theme styling, system alert logs, data backups, and Danger Zone configurations
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        {/* Left Side: Navigation / Info */}
        <div className="md:col-span-1 space-y-6">
          <div className="p-5 rounded-2xl border border-surface-850 bg-surface-900/30 backdrop-blur-md space-y-3.5">
            <div className="flex items-center gap-2 text-slate-300 font-bold border-b border-surface-850 pb-2.5">
              <SettingsIcon className="w-4 h-4 text-brand-400" />
              <span>Workspace Control</span>
            </div>
            <p className="text-[10px] text-slate-500 leading-relaxed font-medium">
              FormCraft stores settings keys locally per user. Feel free to update preferences or export a backup copy of your assets.
            </p>
            <button
              onClick={handleSaveSettings}
              disabled={loading}
              className="w-full btn-primary py-2 justify-center gap-1.5 shadow-glow"
            >
              {loading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <CheckCircle className="w-3.5 h-3.5" />
              )}
              Save Configuration
            </button>
          </div>
        </div>

        {/* Right Side: Options Panels */}
        <div className="md:col-span-2 space-y-6">
          {/* Appearance Section */}
          <div className="p-6 rounded-2xl border border-surface-850 bg-surface-900/30 backdrop-blur-md space-y-4">
            <div className="flex items-center gap-2">
              <Sun className="w-4 h-4 text-brand-400" />
              <h3 className="font-bold text-slate-200 text-sm">Theme Appearance</h3>
            </div>
            <ThemeSelector value={appearance} onChange={setAppearance} />
          </div>

          {/* Notifications Section */}
          <div className="p-6 rounded-2xl border border-surface-850 bg-surface-900/30 backdrop-blur-md space-y-4">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-violet-400" />
              <h3 className="font-bold text-slate-200 text-sm">Alert Notifications</h3>
            </div>
            <NotificationSettings value={notifications} onChange={setNotifications} />
          </div>

          {/* Sessions & Security Section */}
          <div className="p-6 rounded-2xl border border-surface-850 bg-surface-900/30 backdrop-blur-md space-y-4">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-emerald-400" />
              <h3 className="font-bold text-slate-200 text-sm">Device Security</h3>
            </div>
            <SecuritySettings />
          </div>

          {/* Data Export Section */}
          <div className="p-6 rounded-2xl border border-surface-850 bg-surface-900/30 backdrop-blur-md space-y-4">
            <div className="flex items-center gap-2">
              <Download className="w-4 h-4 text-blue-400" />
              <h3 className="font-bold text-slate-200 text-sm">Workspace Export</h3>
            </div>
            <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
              Export all your forms list, dynamic conditional rule matrices, setting presets, and collected responses into a single JSON file.
            </p>
            <button
              onClick={handleExportAllData}
              className="btn-secondary py-1.5 px-3.5 text-xs flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              Export Backup JSON
            </button>
          </div>

          {/* Danger Zone Section */}
          <div className="p-6 rounded-2xl border border-red-500/20 bg-red-500/5 backdrop-blur-md space-y-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400 animate-pulse" />
              <h3 className="font-bold text-red-400 text-sm">Danger Zone</h3>
            </div>
            <p className="text-[10px] text-red-400/70 leading-relaxed font-semibold">
              Once you delete your account, all user forms, conditional flow paths, response analytics, files, and preferences will be permanently wiped out. This is irreversible.
            </p>
            <button
              onClick={() => setIsDeleteOpen(true)}
              className="py-1.5 px-3.5 rounded bg-red-650/15 hover:bg-red-600 border border-red-700/20 hover:text-white text-red-400 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
            >
              Delete Account
            </button>
          </div>
        </div>
      </div>

      {/* Delete Account Confirmation Dialog */}
      {isDeleteOpen && (
        <DeleteAccountDialog
          isOpen={isDeleteOpen}
          onClose={() => setIsDeleteOpen(false)}
        />
      )}
    </div>
  );
}

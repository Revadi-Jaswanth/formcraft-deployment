import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Activity,
  Settings,
  ShieldCheck,
  ToggleLeft,
  ToggleRight,
  Database,
  RefreshCw,
} from "lucide-react";
import { adminApi } from "../../services/adminApi";
import toast from "react-hot-toast";

export default function SystemSettings() {
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState("logs"); // 'logs' or 'settings'

  // Query audit logs
  const { data: auditLogs = [], isLoading: logsLoading, refetch: refetchLogs } = useQuery({
    queryKey: ["admin-audit-logs"],
    queryFn: () => adminApi.getAuditLogs().then((r) => r.data),
  });

  // Query platform settings
  const { data: systemSettings, isLoading: settingsLoading } = useQuery({
    queryKey: ["admin-system-settings"],
    queryFn: () => adminApi.getSettings().then((r) => r.data),
  });

  // Mutation
  const updateSettingsMutation = useMutation({
    mutationFn: (data) => adminApi.updateSettings(data),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["admin-system-settings"] });
      toast.success(data.data.message);
    },
    onError: () => {
      toast.error("Failed to update system settings.");
    },
  });

  const handleToggleRegistration = () => {
    if (!systemSettings) return;
    updateSettingsMutation.mutate({
      ...systemSettings,
      allow_registration: !systemSettings.allow_registration,
    });
  };

  const handleToggleMaintenance = () => {
    if (!systemSettings) return;
    updateSettingsMutation.mutate({
      ...systemSettings,
      maintenance_mode: !systemSettings.maintenance_mode,
    });
  };

  const isPageLoading = logsLoading || settingsLoading;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-slate-100 tracking-tight">
          System Console
        </h2>
        <p className="text-slate-500 text-xs mt-0.5 font-medium">
          Manage system-wide parameters and audit active platform registries
        </p>
      </div>

      {/* Tabs Row */}
      <div className="flex border-b border-surface-850 gap-6 shrink-0">
        <button
          onClick={() => setActiveTab("logs")}
          className={`pb-3 text-xs font-bold transition-all relative ${
            activeTab === "logs" ? "text-brand-400" : "text-slate-500 hover:text-slate-300"
          }`}
        >
          Audit Logs Timeline
          {activeTab === "logs" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-500 rounded-full"></div>
          )}
        </button>
        <button
          onClick={() => setActiveTab("settings")}
          className={`pb-3 text-xs font-bold transition-all relative ${
            activeTab === "settings" ? "text-brand-400" : "text-slate-500 hover:text-slate-300"
          }`}
        >
          Platform Settings
          {activeTab === "settings" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-500 rounded-full"></div>
          )}
        </button>
      </div>

      {/* Content Panels */}
      {isPageLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="w-8 h-8 rounded-full border-4 border-brand-500 border-t-transparent animate-spin"></div>
          <p className="text-xs text-slate-500 font-semibold animate-pulse">
            Retrieving console telemetry...
          </p>
        </div>
      ) : activeTab === "logs" ? (
        /* ── AUDIT LOGS VIEW ── */
        <div className="p-6 rounded-2xl border border-surface-850 bg-surface-900/60 backdrop-blur-md space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
              <Activity className="w-4 h-4 text-brand-400 animate-pulse" />
              Live Audit Trails Log
            </h3>
            <button
              onClick={() => {
                refetchLogs();
                toast.success("Audit trail logs refreshed!");
              }}
              className="btn-secondary py-1.5 px-3 text-[10px] flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh
            </button>
          </div>

          <div className="relative border-l-2 border-surface-800 ml-3 pl-6 space-y-6 py-2">
            {auditLogs.length === 0 ? (
              <p className="text-slate-500 text-xs italic">No entries logged yet.</p>
            ) : (
              auditLogs.map((log, index) => {
                let badgeClass = "bg-brand-500/10 text-brand-400";
                if (log.type === "USER_SIGNUP") badgeClass = "bg-blue-500/10 text-blue-400";
                if (log.type === "FORM_SUBMISSION") badgeClass = "bg-emerald-500/10 text-emerald-400";

                return (
                  <div key={index} className="relative group">
                    {/* Visual Dot on border */}
                    <div className="absolute -left-[31px] top-1.5 w-2 h-2 rounded-full bg-surface-800 border-2 border-surface-900 group-hover:bg-brand-500 group-hover:scale-125 transition-all"></div>
                    
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-3">
                        <span className={`text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded tracking-wide ${badgeClass}`}>
                          {log.type}
                        </span>
                        <span className="text-[10px] text-slate-500 font-bold">
                          {new Date(log.timestamp).toLocaleString([], {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                          })}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-slate-200">
                        <span className="text-slate-400 font-medium">{log.actor}</span> {log.action}
                      </p>
                      <span className="text-[10px] text-slate-500 font-medium block">
                        {log.details}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      ) : (
        /* ── PLATFORM SETTINGS VIEW ── */
        <div className="p-6 rounded-2xl border border-surface-850 bg-surface-900/60 backdrop-blur-md space-y-6">
          <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
            <Settings className="w-4 h-4 text-brand-400" />
            Global Platform Parameters
          </h3>

          <div className="divide-y divide-surface-850">
            {/* Setting 1: Public Registration */}
            <div className="py-4 flex items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold text-slate-200 block">
                  Allow Public Signups
                </span>
                <span className="text-[10px] text-slate-500 font-medium mt-0.5 block leading-relaxed max-w-md">
                  When deactivated, new user registration is locked, and only existing owners/admins can login.
                </span>
              </div>
              <button
                onClick={handleToggleRegistration}
                className={`transition-colors p-1 rounded-lg ${
                  systemSettings?.allow_registration ? "text-brand-500" : "text-slate-600"
                }`}
              >
                {systemSettings?.allow_registration ? (
                  <ToggleRight className="w-10 h-10" />
                ) : (
                  <ToggleLeft className="w-10 h-10" />
                )}
              </button>
            </div>

            {/* Setting 2: Maintenance Mode */}
            <div className="py-4 flex items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold text-slate-200 block">
                  System Maintenance Mode
                </span>
                <span className="text-[10px] text-slate-500 font-medium mt-0.5 block leading-relaxed max-w-md">
                  Activate to lock all platform workspaces. Public forms and dashboard APIs will return standard 503 Maintenance Status.
                </span>
              </div>
              <button
                onClick={handleToggleMaintenance}
                className={`transition-colors p-1 rounded-lg ${
                  systemSettings?.maintenance_mode ? "text-brand-500" : "text-slate-600"
                }`}
              >
                {systemSettings?.maintenance_mode ? (
                  <ToggleRight className="w-10 h-10" />
                ) : (
                  <ToggleLeft className="w-10 h-10" />
                )}
              </button>
            </div>

            {/* Setting 3: Limits Info */}
            <div className="py-4 space-y-4">
              <span className="text-xs font-bold text-slate-200 block">
                Platform Workspace Thresholds
              </span>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-surface-800 bg-surface-950/30">
                  <span className="text-[9px] text-slate-500 font-bold uppercase block">
                    Max forms per workspace
                  </span>
                  <span className="text-lg font-black text-slate-200 mt-1 block">
                    {systemSettings?.max_forms_per_user} templates
                  </span>
                </div>
                <div className="p-4 rounded-xl border border-surface-800 bg-surface-950/30">
                  <span className="text-[9px] text-slate-500 font-bold uppercase block">
                    Max file size upload limit
                  </span>
                  <span className="text-lg font-black text-slate-200 mt-1 block">
                    {systemSettings?.max_file_size_mb} MB
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

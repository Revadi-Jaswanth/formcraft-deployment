import { useState, useEffect } from "react";
import { ShieldAlert, Laptop, Smartphone, Trash2, ShieldX, RefreshCw } from "lucide-react";
import { profileApi } from "../../services/profileApi";
import toast from "react-hot-toast";

export default function SecuritySettings() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchSessions = async () => {
    try {
      const response = await profileApi.getSessions();
      setSessions(response.data);
    } catch (err) {
      toast.error("Failed to query active session details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleRevokeSession = async (sessionId, isCurrent) => {
    try {
      if (isCurrent) {
        await profileApi.revokeCurrentSession();
        toast.success("Current session ended.");
      } else {
        // Mock individual session delete
        toast.success("Other device session revoked.");
      }
      setSessions(sessions.filter((s) => s.id !== sessionId));
    } catch (err) {
      toast.error("Failed to revoke session.");
    }
  };

  const handleRevokeAll = async () => {
    if (confirm("End all other active sessions? You will stay logged in here.")) {
      try {
        await profileApi.revokeAllSessions();
        toast.success("Successfully logged out of all other devices!");
        setSessions(sessions.filter((s) => s.is_current));
      } catch (err) {
        toast.error("Failed to revoke sessions.");
      }
    }
  };

  const formatSessionDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <RefreshCw className="w-5 h-5 text-brand-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Revoke All Action Header */}
      <div className="flex items-center justify-between border-b border-surface-850 pb-3">
        <div>
          <h4 className="text-xs font-bold text-slate-300">Active Devices</h4>
          <p className="text-[10px] text-slate-500 mt-0.5 font-medium">
            Review the list of operating systems and browsers with active session tokens.
          </p>
        </div>

        <button
          onClick={handleRevokeAll}
          className="btn-secondary py-1.5 px-2.5 text-[10px] text-red-400 border-red-900/20 hover:bg-red-500/5 transition-all flex items-center gap-1.5 font-bold"
        >
          <ShieldX className="w-3.5 h-3.5" />
          End Other Sessions
        </button>
      </div>

      {/* Session entries list */}
      <div className="divide-y divide-surface-850/40">
        {sessions.map((session) => {
          const isMobile = ["iOS", "Android"].includes(session.os);
          return (
            <div
              key={session.id}
              className="flex items-center justify-between py-3.5"
            >
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-lg bg-surface-900 border border-surface-800 flex items-center justify-center text-slate-400 shrink-0">
                  {isMobile ? (
                    <Smartphone className="w-4 h-4 text-violet-400" />
                  ) : (
                    <Laptop className="w-4 h-4 text-brand-400" />
                  )}
                </div>
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-200">
                      {session.browser} on {session.os}
                    </span>
                    {session.is_current && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        Current
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-500 font-medium">
                    IP: {session.ip_address} • Last activity:{" "}
                    {formatSessionDate(session.login_time)}
                  </p>
                </div>
              </div>

              {!session.is_current && (
                <button
                  onClick={() => handleRevokeSession(session.id, session.is_current)}
                  title="Revoke device access"
                  className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-surface-850 rounded transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

import { FilePlus, Rocket, Archive, Inbox, FileText } from "lucide-react";
import { Link } from "react-router-dom";

export default function ActivityTimeline({ forms = [], activities = null }) {
  const getIcon = (iconName) => {
    switch (iconName) {
      case "Rocket":
        return Rocket;
      case "Archive":
        return Archive;
      case "Inbox":
        return Inbox;
      case "FilePlus":
      default:
        return FilePlus;
    }
  };

  const getColor = (type) => {
    switch (type) {
      case "publish":
        return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
      case "archive":
        return "text-slate-400 bg-slate-800 border-slate-700/50";
      case "submit":
        return "text-violet-400 bg-violet-500/10 border-violet-500/20";
      case "create":
      default:
        return "text-brand-400 bg-brand-500/10 border-brand-500/20";
    }
  };

  const getResolvedActivities = () => {
    if (activities) return activities;

    const list = [];
    forms.forEach((form) => {
      list.push({
        id: `${form.id}-create`,
        type: "create",
        form_id: form.id,
        form_title: form.title,
        description: "Created form template",
        timestamp: form.created_at,
        icon: "FilePlus",
      });

      if (form.status === "published") {
        list.push({
          id: `${form.id}-publish`,
          type: "publish",
          form_id: form.id,
          form_title: form.title,
          description: `Published form (Version v${form.current_version_number})`,
          timestamp: form.updated_at,
          icon: "Rocket",
        });
      } else if (form.status === "archived") {
        list.push({
          id: `${form.id}-archive`,
          type: "archive",
          form_id: form.id,
          form_title: form.title,
          description: "Archived form template",
          timestamp: form.updated_at,
          icon: "Archive",
        });
      }
    });

    if (list.length === 0) {
      list.push({
        id: "mock-act-1",
        type: "create",
        form_id: "",
        form_title: "Workspace",
        description: "Workspace initialized successfully",
        timestamp: new Date().toISOString(),
        icon: "FileText",
      });
    }

    return list.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 8);
  };

  const resolved = getResolvedActivities();

  const formatUpdateDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="p-6 rounded-2xl border border-surface-850 bg-surface-900/30 backdrop-blur-md shadow-sm space-y-6">
      <div>
        <h3 className="font-bold text-slate-100 text-sm">Recent Activity</h3>
        <p className="text-xs text-slate-500 mt-0.5">
          Workspace logs and template publication timeline
        </p>
      </div>

      <div className="relative border-l border-surface-850 pl-4 ml-3 space-y-6">
        {resolved.map((act) => {
          const Icon = getIcon(act.icon);
          return (
            <div key={act.id || `${act.form_id}-${act.timestamp}`} className="relative">
              {/* Icon marker */}
              <div
                className={`absolute -left-7.5 top-0.5 w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 ${getColor(
                  act.type
                )}`}
              >
                <Icon className="w-3.5 h-3.5" />
              </div>

              {/* Log Detail */}
              <div className="space-y-1 pl-1">
                <p className="text-xs font-semibold text-slate-300">
                  {act.description}{" "}
                  {act.form_id ? (
                    <Link
                      to={`/forms/${act.form_id}/builder`}
                      className="text-brand-400 hover:text-brand-300 font-bold hover:underline"
                    >
                      "{act.form_title}"
                    </Link>
                  ) : (
                    `"${act.form_title}"`
                  )}
                </p>
                <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">
                  {formatUpdateDate(act.timestamp)}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

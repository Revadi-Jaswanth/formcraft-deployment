import { Mail, Bell, BarChart3, Star } from "lucide-react";

export default function NotificationSettings({ value = {}, onChange }) {
  const config = [
    {
      key: "email_notifications",
      label: "Email Notifications",
      desc: "Receive weekly activity highlights and digest reports directly in your inbox.",
      icon: Mail,
    },
    {
      key: "submission_alerts",
      label: "Submission Alerts",
      desc: "Get instantly notified when respondents submit completed forms.",
      icon: Bell,
    },
    {
      key: "weekly_reports",
      label: "Weekly Analytics Reports",
      desc: "Receive a compiled summary analytics report every Monday morning.",
      icon: BarChart3,
    },
    {
      key: "marketing_emails",
      label: "Product News & Marketing",
      desc: "Stay up-to-date with new FormCraft features and software updates.",
      icon: Star,
    },
  ];

  const handleToggle = (key) => {
    const updated = {
      ...value,
      [key]: !value[key],
    };
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      {config.map((item) => {
        const Icon = item.icon;
        const isActive = !!value[item.key];
        return (
          <div
            key={item.key}
            className="flex items-start justify-between p-4 rounded-xl border border-surface-850/50 bg-surface-900/10 hover:border-surface-800 transition-all gap-4"
          >
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-lg bg-surface-850 flex items-center justify-center text-slate-400 shrink-0 mt-0.5">
                <Icon className="w-4 h-4" />
              </div>
              <div className="space-y-0.5">
                <h4 className="text-xs font-bold text-slate-200">{item.label}</h4>
                <p className="text-[10px] text-slate-500 leading-relaxed max-w-md font-medium">
                  {item.desc}
                </p>
              </div>
            </div>

            {/* Toggle switch checkbox */}
            <button
              type="button"
              onClick={() => handleToggle(item.key)}
              className={`w-9 h-5 rounded-full p-0.5 transition-colors relative shrink-0 outline-none ${
                isActive ? "bg-brand-500" : "bg-surface-800"
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform ${
                  isActive ? "translate-x-4" : "translate-x-0"
                }`}
              ></div>
            </button>
          </div>
        );
      })}
    </div>
  );
}

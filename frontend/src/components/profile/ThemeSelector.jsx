import { Sun, Moon, Laptop } from "lucide-react";

export default function ThemeSelector({ value, onChange }) {
  const themes = [
    { id: "light", label: "Light Theme", icon: Sun },
    { id: "dark", label: "Dark Theme", icon: Moon },
    { id: "system", label: "System Default", icon: Laptop },
  ];

  return (
    <div className="grid grid-cols-3 gap-3">
      {themes.map((theme) => {
        const Icon = theme.icon;
        const isActive = value === theme.id;
        return (
          <button
            key={theme.id}
            type="button"
            onClick={() => onChange(theme.id)}
            className={`p-4 rounded-xl border text-center flex flex-col items-center gap-2.5 transition-all outline-none ${
              isActive
                ? "bg-brand-500/10 border-brand-500 text-brand-400 font-semibold"
                : "border-surface-850 hover:border-surface-800 bg-surface-900/10 text-slate-400 hover:text-slate-200"
            }`}
          >
            <Icon className="w-5 h-5 shrink-0" />
            <span className="text-[10px] uppercase tracking-wider font-bold">
              {theme.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

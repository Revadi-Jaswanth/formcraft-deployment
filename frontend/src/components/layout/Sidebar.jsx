import { NavLink } from "react-router-dom";
import { LayoutDashboard, Zap, Settings, HelpCircle } from "lucide-react";

const navItems = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
];

export default function Sidebar() {
  return (
    <aside className="sidebar">
      {/* ── Logo ─────────────────────────────────────────────────── */}
      <div className="px-5 py-5 border-b border-surface-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-violet-600 flex items-center justify-center shadow-glow">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="font-bold text-sm text-slate-100 leading-none">FormCraft</p>
            <p className="text-xs text-slate-500 mt-0.5">Form Builder</p>
          </div>
        </div>
      </div>

      {/* ── Navigation ───────────────────────────────────────────── */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <p className="px-2 mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Menu
        </p>
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                isActive
                  ? "bg-brand-600/20 text-brand-400 border border-brand-600/30"
                  : "text-slate-400 hover:text-slate-200 hover:bg-surface-800"
              }`
            }
          >
            <Icon className="w-4 h-4 shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* ── Bottom ───────────────────────────────────────────────── */}
      <div className="px-3 py-4 border-t border-surface-800 space-y-1">
        <a
          href="http://localhost:8000/docs"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-400 hover:text-slate-200 hover:bg-surface-800 transition-all"
        >
          <HelpCircle className="w-4 h-4" />
          API Docs
        </a>
      </div>
    </aside>
  );
}

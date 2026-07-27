import React from "react";
import { NavLink } from "react-router-dom";

export const SidebarItem = React.memo(function SidebarItem({
  to,
  icon: Icon,
  label,
  badge,
  badgeType = "info",
  onClick,
}) {
  const getBadgeClass = () => {
    if (badgeType === "coming-soon") {
      return "bg-surface-800 text-slate-500 border border-surface-700/50";
    }
    return "bg-brand-500/10 text-brand-400 border border-brand-500/20";
  };

  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        `flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 group ${
          isActive
            ? "bg-brand-600/15 text-brand-400 border border-brand-600/25 shadow-sm"
            : "text-slate-400 hover:text-slate-200 hover:bg-surface-850 border border-transparent"
        }`
      }
    >
      <div className="flex items-center gap-3">
        {Icon && <Icon className="w-4 h-4 shrink-0" />}
        <span>{label}</span>
      </div>
      {badge && (
        <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider ${getBadgeClass()}`}>
          {badge}
        </span>
      )}
    </NavLink>
  );
});

export default SidebarItem;

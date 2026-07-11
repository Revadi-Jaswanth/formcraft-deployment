import { useLocation } from "react-router-dom";
import { Bell } from "lucide-react";

const TITLES = {
  "/dashboard": "Dashboard",
};

export default function Topbar() {
  const { pathname } = useLocation();
  const title = TITLES[pathname] ?? "FormCraft";

  return (
    <header className="topbar">
      <h1 className="font-semibold text-slate-100 text-base flex-1">{title}</h1>
      <div className="flex items-center gap-2">
        <button className="btn-icon">
          <Bell className="w-4 h-4" />
        </button>
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-500 to-violet-600 flex items-center justify-center text-xs font-bold text-white">
          A
        </div>
      </div>
    </header>
  );
}

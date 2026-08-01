import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Menu,
  Bell,
  Search,
  User,
  Settings,
  LogOut,
  Sun,
  Moon,
  ChevronDown,
  Plus,
  Download,
  Sparkles,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { formsApi } from "../../services/formsApi";
import { profileApi } from "../../services/api";
import toast from "react-hot-toast";

export default function TopNavbar({ setMobileOpen, onCreateFormClick }) {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [actionsOpen, setActionsOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return document.documentElement.classList.contains("dark");
  });

  // Keep button state in sync if theme is updated elsewhere (e.g. settings page)
  useEffect(() => {
    const handleStorageChange = () => {
      setIsDarkMode(document.documentElement.classList.contains("dark"));
    };
    window.addEventListener("storage", handleStorageChange);
    // Also check on interval or when document classes change
    const observer = new MutationObserver(() => {
      setIsDarkMode(document.documentElement.classList.contains("dark"));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      observer.disconnect();
    };
  }, []);

  const handleToggleTheme = async () => {
    const nextDark = !isDarkMode;
    setIsDarkMode(nextDark);
    if (nextDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
    try {
      await profileApi.updateSettings({ appearance: nextDark ? "dark" : "light" });
    } catch (err) {
      // silent fail
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const handleExportForms = async () => {
    try {
      const response = await formsApi.list({ limit: 100 });
      const forms = response.data?.items ?? [];
      if (forms.length === 0) {
        toast.error("No form templates found to export.");
        return;
      }
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(forms, null, 2));
      const downloadAnchor = document.createElement("a");
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `formcraft_backup_${Date.now()}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      toast.success("Templates backup downloaded!");
      setActionsOpen(false);
    } catch (err) {
      toast.error("Failed to query templates list for export.");
    }
  };

  const getInitials = () => {
    if (!currentUser?.name) return "U";
    return currentUser.name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="sticky top-0 z-30 h-16 shrink-0 bg-surface-900 border-b border-surface-850 px-6 flex items-center justify-between">
      {/* Left Area: Mobile Menu Trigger & Search */}
      <div className="flex items-center gap-4 flex-1">
        <button
          onClick={() => setMobileOpen(true)}
          className="md:hidden p-1.5 text-slate-400 hover:text-slate-200 hover:bg-surface-800 rounded transition-all"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Search Bar - UI Only */}
        <div className="hidden sm:flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-surface-950/50 border border-surface-800 text-slate-500 w-64 focus-within:border-brand-500/50 focus-within:text-slate-400 transition-all">
          <Search className="w-4 h-4 shrink-0" />
          <input
            type="text"
            placeholder="Quick search..."
            className="bg-transparent border-none outline-none text-xs text-slate-200 w-full placeholder-slate-600"
            disabled
          />
        </div>
      </div>

      {/* Right Area: System Controls & User Options */}
      <div className="flex items-center gap-3">
        {/* Theme Toggle */}
        <button
          onClick={handleToggleTheme}
          title="Toggle Theme"
          className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-surface-800 rounded transition-all"
        >
          {isDarkMode ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
        </button>

        {/* Notification Bell - Mock */}
        <button
          title="Notifications"
          className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-surface-800 rounded transition-all relative font-semibold"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-brand-500"></span>
        </button>

        {/* Quick Actions Dropdown */}
        <div className="relative">
          <button
            onClick={() => setActionsOpen(!actionsOpen)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-500/10 border border-brand-500/20 text-brand-400 text-xs font-semibold hover:bg-brand-500/15 transition-all shrink-0"
            title="Quick Actions"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Actions</span>
            <ChevronDown className="w-3 h-3 shrink-0" />
          </button>

          {actionsOpen && (
            <div
              className="absolute right-0 top-9 w-44 bg-surface-800 border border-surface-700 rounded-xl shadow-xl z-30 py-1.5 animate-slide-in"
              onMouseLeave={() => setActionsOpen(false)}
            >
              <button
                onClick={() => {
                  setActionsOpen(false);
                  onCreateFormClick();
                }}
                className="flex items-center gap-2.5 w-full text-left px-3.5 py-2 text-xs text-slate-300 hover:bg-surface-700 transition-colors"
              >
                <Plus className="w-3.5 h-3.5 text-brand-400" />
                Create Form
              </button>
              <button
                onClick={handleExportForms}
                className="flex items-center gap-2.5 w-full text-left px-3.5 py-2 text-xs text-slate-300 hover:bg-surface-700 transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-emerald-400" />
                Export Forms
              </button>
            </div>
          )}
        </div>

        <div className="h-4 w-px bg-surface-800 mx-1"></div>

        {/* User Dropdown */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 p-1 rounded-lg hover:bg-surface-850 transition-all text-slate-400 hover:text-slate-200"
          >
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-brand-500 to-violet-600 flex items-center justify-center text-xs font-bold text-white shadow-sm shrink-0">
              {getInitials()}
            </div>
            {!currentUser?.name && (
              <ChevronDown className="w-3.5 h-3.5 shrink-0" />
            )}
            {currentUser?.name && (
              <div className="hidden md:flex items-center gap-1">
                <span className="text-xs font-medium text-slate-300 truncate max-w-24">
                  {currentUser.name}
                </span>
                <ChevronDown className="w-3.5 h-3.5 shrink-0" />
              </div>
            )}
          </button>

          {dropdownOpen && (
            <div
              className="absolute right-0 top-10 w-48 bg-surface-800 border border-surface-700 rounded-xl shadow-xl z-30 py-1.5 animate-slide-in"
              onMouseLeave={() => setDropdownOpen(false)}
            >
              <div className="px-3.5 py-2 border-b border-surface-750/50">
                <p className="text-xs font-semibold text-slate-200 truncate">
                  {currentUser?.name || "Workspace Owner"}
                </p>
                <p className="text-[10px] text-slate-500 truncate mt-0.5">
                  {currentUser?.email}
                </p>
              </div>

              <Link
                to="/profile"
                onClick={() => setDropdownOpen(false)}
                className="flex items-center gap-2.5 px-3.5 py-2 text-xs text-slate-300 hover:bg-surface-700 transition-colors"
              >
                <User className="w-3.5 h-3.5" />
                Profile
              </Link>
              <Link
                to="/settings"
                onClick={() => setDropdownOpen(false)}
                className="flex items-center gap-2.5 px-3.5 py-2 text-xs text-slate-300 hover:bg-surface-700 transition-colors"
              >
                <Settings className="w-3.5 h-3.5" />
                Settings
              </Link>
              <div className="h-px bg-surface-750 my-1" />
              <button
                onClick={handleLogout}
                className="flex items-center gap-2.5 w-full text-left px-3.5 py-2 text-xs text-red-400 hover:bg-surface-700 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

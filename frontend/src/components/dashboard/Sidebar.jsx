import { useState, useMemo } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  Zap,
  LayoutDashboard,
  PlusCircle,
  BarChart2,
  Layers,
  Trash2,
  User,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  FileText,
  MessageSquare,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useForms, useDeleteForm, useDuplicateForm } from "../../hooks/useForms";
import SidebarItem from "./SidebarItem";
import SidebarAccordion from "./SidebarAccordion";

export default function Sidebar({
  isCollapsed,
  setIsCollapsed,
  mobileOpen,
  setMobileOpen,
  onCreateFormClick,
}) {
  const { logout, currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Query forms list for dynamic accordions (high limit to see forms list)
  const { data } = useForms({ limit: 100 });
  const forms = useMemo(() => data?.items ?? [], [data]);

  const deleteMutation = useDeleteForm();
  const duplicateMutation = useDuplicateForm();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const handleDeleteForm = (form) => {
    if (confirm(`Delete "${form.title}"? This cannot be undone.`)) {
      deleteMutation.mutate(form.id);
    }
  };

  const handleDuplicateForm = (form) => {
    duplicateMutation.mutate({ id: form.id, data: {} });
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-surface-900 border-r border-surface-850 transition-all duration-300">
      {/* Brand Logo Header */}
      <div className="px-4 py-5 border-b border-surface-850 flex items-center justify-between shrink-0">
        <Link to="/" className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-violet-600 flex items-center justify-center shadow-glow shrink-0">
            <Zap className="w-4.5 h-4.5 text-white" />
          </div>
          {!isCollapsed && (
            <div className="truncate">
              <span className="font-bold text-sm text-slate-100 block tracking-tight leading-none">
                FormCraft
              </span>
              <span className="text-[9px] text-slate-500 font-semibold tracking-wider uppercase block mt-0.5">
                Workspaces
              </span>
            </div>
          )}
        </Link>

        {/* Desktop Collapse Trigger */}
        {!mobileOpen && (
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden md:flex p-1 text-slate-500 hover:text-slate-200 hover:bg-surface-800 rounded transition-all"
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        )}

        {/* Mobile Close Trigger */}
        {mobileOpen && (
          <button
            onClick={() => setMobileOpen(false)}
            className="md:hidden p-1 text-slate-400 hover:text-slate-200 hover:bg-surface-800 rounded transition-all"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        )}
      </div>

      {/* Nav List */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-4">
        {/* Core items */}
        <div className="space-y-1">
          <SidebarItem
            to="/dashboard"
            icon={LayoutDashboard}
            label={isCollapsed ? "" : "Dashboard"}
            onClick={() => setMobileOpen(false)}
          />
          <button
            onClick={() => {
              setMobileOpen(false);
              onCreateFormClick();
            }}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-400 hover:text-slate-200 hover:bg-surface-850 transition-all border border-transparent"
          >
            <PlusCircle className="w-4 h-4 shrink-0 text-brand-400" />
            {!isCollapsed && <span>Create Form</span>}
          </button>
        </div>

        {/* Accordions (Only show full view when expanded) */}
        {!isCollapsed && (
          <div className="space-y-4">
            <SidebarAccordion
              title="Created Forms"
              icon={FileText}
              items={forms}
              type="forms"
              onDelete={handleDeleteForm}
              onDuplicate={handleDuplicateForm}
            />
            <SidebarAccordion
              title="Responses"
              icon={MessageSquare}
              items={forms}
              type="responses"
            />
          </div>
        )}

        {/* Placeholder Items */}
        <div className="space-y-1">
          <SidebarItem
            to="/dashboard/analytics"
            icon={BarChart2}
            label={isCollapsed ? "" : "Analytics"}
            badge={isCollapsed ? "" : "Soon"}
            badgeType="coming-soon"
            onClick={(e) => e.preventDefault()}
          />
          <SidebarItem
            to="/dashboard/templates"
            icon={Layers}
            label={isCollapsed ? "" : "Templates"}
            badge={isCollapsed ? "" : "Soon"}
            badgeType="coming-soon"
            onClick={(e) => e.preventDefault()}
          />
          <SidebarItem
            to="/dashboard/trash"
            icon={Trash2}
            label={isCollapsed ? "" : "Trash"}
            onClick={(e) => e.preventDefault()}
          />
        </div>
      </div>

      {/* Footer User Profile & Action Box */}
      <div className="p-3 border-t border-surface-850 shrink-0 space-y-1.5">
        <SidebarItem
          to="/profile"
          icon={User}
          label={isCollapsed ? "" : "Profile"}
          onClick={() => setMobileOpen(false)}
        />
        <SidebarItem
          to="/settings"
          icon={Settings}
          label={isCollapsed ? "" : "Settings"}
          onClick={() => setMobileOpen(false)}
        />
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/5 transition-all"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {!isCollapsed && <span>Logout</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar (normal layout flow) */}
      <aside
        className={`hidden md:block h-screen shrink-0 transition-all duration-300 ${
          isCollapsed ? "w-16" : "w-64"
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Sidebar Drawer Overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Backdrop overlay */}
          <div
            className="fixed inset-0 bg-surface-950/80 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileOpen(false)}
          ></div>

          {/* Drawer container */}
          <div className="relative flex flex-col w-64 max-w-xs h-full animate-slide-in">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}

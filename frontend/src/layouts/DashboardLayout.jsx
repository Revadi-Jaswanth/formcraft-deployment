import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/dashboard/Sidebar";
import TopNavbar from "../components/dashboard/TopNavbar";
import Breadcrumbs from "../components/dashboard/Breadcrumbs";
import CreateFormModal from "../components/forms/CreateFormModal";

export default function DashboardLayout() {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem("sidebar-collapsed");
    return saved !== null ? JSON.parse(saved) : false;
  });
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const handleSetCollapsed = (val) => {
    setIsCollapsed(val);
    localStorage.setItem("sidebar-collapsed", JSON.stringify(val));
  };

  return (
    <div className="flex h-screen overflow-hidden bg-surface-950 text-slate-100 font-sans selection:bg-brand-500/30 selection:text-brand-300">
      {/* ── Collapsible & Mobile Drawer Sidebar ──────────────────────── */}
      <Sidebar
        isCollapsed={isCollapsed}
        setIsCollapsed={handleSetCollapsed}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        onCreateFormClick={() => setShowCreateModal(true)}
      />

      {/* ── Main Content Area ────────────────────────────────────────── */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Top Navbar */}
        <TopNavbar
          setMobileOpen={setMobileOpen}
          onCreateFormClick={() => setShowCreateModal(true)}
        />

        {/* Dynamic Route Pages & Content wrapper */}
        <main className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          <div className="max-w-7xl mx-auto space-y-4 pb-12">
            {/* Automatic Breadcrumbs Navigation bar */}
            <Breadcrumbs />

            {/* Nested Route Pages content */}
            <Outlet />
          </div>
        </main>

        {/* Minimal Footer */}
        <footer className="shrink-0 border-t border-surface-850 px-6 py-3 text-[10px] text-slate-500 font-medium bg-surface-900/50 flex items-center justify-between">
          <span>FormCraft SaaS Engine</span>
          <span>© {new Date().getFullYear()} Springboard Platform</span>
        </footer>
      </div>

      {/* ── Create Form Modal Overlay ─────────────────────────────────── */}
      {showCreateModal && (
        <CreateFormModal onClose={() => setShowCreateModal(false)} />
      )}
    </div>
  );
}

import { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/layout/ProtectedRoute";
import DashboardLayout from "./layouts/DashboardLayout";

// Standard Pages
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import PublicForm from "./pages/PublicForm";
import NotFound from "./pages/NotFound";
import FormBuilder from "./pages/FormBuilder";

// User Workspace Pages
import DashboardHome from "./pages/dashboard/DashboardHome";
import FormResponses from "./pages/dashboard/FormResponses";
import CreatedForms from "./pages/dashboard/CreatedForms";
import FormPreview from "./pages/dashboard/FormPreview";
import Profile from "./pages/dashboard/Profile";
import Settings from "./pages/dashboard/Settings";
import UserAnalytics from "./pages/dashboard/Analytics";
import FormAnalytics from "./pages/dashboard/FormAnalytics";
import UserTemplates from "./pages/dashboard/Templates";
import UserArchivedForms from "./pages/dashboard/ArchivedForms";

// Admin Workspace Pages
import AdminDashboardHome from "./pages/admin/DashboardHome";
import AdminUsersList from "./pages/admin/UsersList";
import AdminFormsList from "./pages/admin/FormsList";
import AdminResponsesList from "./pages/admin/ResponsesList";
import AdminSystemSettings from "./pages/admin/SystemSettings";

export default function App() {
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const isLight = savedTheme === "light";
    if (isLight) {
      document.documentElement.classList.remove("dark");
    } else {
      document.documentElement.classList.add("dark");
    }
  }, []);

  return (
    <AuthProvider>
      <Routes>
        {/* ── Public Visitor Pages ───────────────────────────────── */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* ── Protected User SaaS Area ───────────────────────────── */}
        <Route element={<ProtectedRoute allowedRoles={["admin", "owner", "user"]} />}>
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard" element={<DashboardHome />} />
            <Route path="/dashboard/forms" element={<CreatedForms />} />
            <Route path="/dashboard/forms/:formId/builder" element={<FormBuilder />} />
            <Route path="/dashboard/forms/:formId/preview" element={<FormPreview />} />
            <Route path="/dashboard/forms/:formId/responses" element={<FormResponses />} />
            <Route path="/dashboard/responses" element={<FormResponses />} />
            <Route path="/responses" element={<FormResponses />} />
            <Route path="/dashboard/forms/:formId/analytics" element={<FormAnalytics />} />
            
            {/* Route Aliases for direct /forms/:formId navigation */}
            <Route path="/forms/:formId/builder" element={<FormBuilder />} />
            <Route path="/forms/:formId/preview" element={<FormPreview />} />
            <Route path="/forms/:formId/responses" element={<FormResponses />} />
            <Route path="/forms/:formId/analytics" element={<FormAnalytics />} />

            <Route path="/dashboard/analytics" element={<UserAnalytics />} />
            <Route path="/dashboard/templates" element={<UserTemplates />} />
            <Route path="/dashboard/archived" element={<UserArchivedForms />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
        </Route>

        {/* ── Protected Admin SaaS Area ───────────────────────────── */}
        <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
          <Route element={<DashboardLayout />}>
            <Route path="/admin" element={<AdminDashboardHome />} />
            <Route path="/admin/users" element={<AdminUsersList />} />
            <Route path="/admin/forms" element={<AdminFormsList />} />
            <Route path="/admin/responses" element={<AdminResponsesList />} />
            <Route path="/admin/analytics" element={<AdminDashboardHome />} /> {/* Stats show growth charts */}
            <Route path="/admin/system" element={<AdminSystemSettings />} />
            <Route path="/admin/settings" element={<AdminSystemSettings />} />
          </Route>
        </Route>

        {/* ── Public Form Filling (No Layout, No Auth) ─────────────── */}
        <Route path="/f/:shareToken" element={<PublicForm />} />

        {/* ── Fallback 404 ─────────────────────────────────────────── */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AuthProvider>
  );
}

import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/layout/ProtectedRoute";
import DashboardLayout from "./layouts/DashboardLayout";
import DashboardHome from "./pages/dashboard/DashboardHome";
import FormResponses from "./pages/dashboard/FormResponses";
import CreatedForms from "./pages/dashboard/CreatedForms";
import FormPreview from "./pages/dashboard/FormPreview";
import Profile from "./pages/dashboard/Profile";
import Settings from "./pages/dashboard/Settings";
import FormBuilder from "./pages/FormBuilder";
import PublicForm from "./pages/PublicForm";
import NotFound from "./pages/NotFound";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* ── Public Visitor Pages ───────────────────────────────── */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* ── Protected Admin SaaS Area ───────────────────────────── */}
        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            {/* Dashboard Homepage */}
            <Route path="/dashboard" element={<DashboardHome />} />
            
            {/* Dedicated Created Forms page */}
            <Route path="/dashboard/forms" element={<CreatedForms />} />
            
            {/* Form Builder (rendered within the new SaaS shell layout) */}
            <Route path="/forms/:formId/builder" element={<FormBuilder />} />
            <Route path="/dashboard/forms/:formId/builder" element={<FormBuilder />} />
            
            {/* Form Preview Page (interactive administrator view) */}
            <Route path="/dashboard/forms/:formId/preview" element={<FormPreview />} />
            
            {/* Responses page */}
            <Route path="/dashboard/forms/:formId/responses" element={<FormResponses />} />
            
            {/* Dedicated Profile & Settings pages */}
            <Route path="/profile" element={<Profile />} />
            <Route path="/settings" element={<Settings />} />
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

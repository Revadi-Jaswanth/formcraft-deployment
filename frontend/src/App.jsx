import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import Dashboard from "@/pages/Dashboard";
import FormBuilder from "@/pages/FormBuilder";
import PublicForm from "@/pages/PublicForm";
import NotFound from "@/pages/NotFound";

export default function App() {
  return (
    <Routes>
      {/* ── Admin (protected layout) ─────────────────────────────── */}
      <Route path="/" element={<Layout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="forms/:formId/builder" element={<FormBuilder />} />
      </Route>

      {/* ── Public respondent view (no layout) ───────────────────── */}
      <Route path="/f/:shareToken" element={<PublicForm />} />

      {/* ── Fallback ─────────────────────────────────────────────── */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

export default function ProtectedRoute() {
  const { authenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-surface-950">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-4 border-brand-500 border-t-transparent animate-spin"></div>
          <p className="text-sm text-slate-400 font-medium animate-pulse">
            Verifying secure session...
          </p>
        </div>
      </div>
    );
  }

  return authenticated ? <Outlet /> : <Navigate to="/login" replace />;
}

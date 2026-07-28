import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

export default function ProtectedRoute({ allowedRoles }) {
  const { authenticated, loading, currentUser } = useAuth();

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

  if (!authenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(currentUser?.role?.toLowerCase())) {
    // Redirect unauthorized user to appropriate dashboard space based on their role
    const defaultRedirect = currentUser?.role?.toLowerCase() === "admin" ? "/admin" : "/dashboard";
    return <Navigate to={defaultRedirect} replace />;
  }

  return <Outlet />;
}

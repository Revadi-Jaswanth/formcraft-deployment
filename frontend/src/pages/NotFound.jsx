import { Link } from "react-router-dom";
import { Home, AlertTriangle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-surface-950 flex items-center justify-center p-6">
      <div className="text-center space-y-6">
        <div className="w-20 h-20 rounded-2xl bg-surface-800 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-10 h-10 text-amber-400" />
        </div>
        <div>
          <h1 className="text-4xl font-bold text-slate-100">404</h1>
          <p className="text-slate-400 mt-2">Page not found</p>
        </div>
        <Link to="/dashboard" className="btn-primary">
          <Home className="w-4 h-4" />
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}

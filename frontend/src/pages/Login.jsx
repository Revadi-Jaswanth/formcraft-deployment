import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useState } from "react";
import toast from "react-hot-toast";
import { Zap, Mail, Lock, Loader2, ArrowRight } from "lucide-react";

const loginSchema = z.object({
  email: z.string().min(1, "Email is required").email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);

  const {
    register: regField,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await login(data.email, data.password);
      toast.success("Successfully logged in!");
      // Redirect to original page or dashboard
      const from = location.state?.from?.pathname || "/dashboard";
      navigate(from, { replace: true });
    } catch (err) {
      toast.error(err.message || "Invalid credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-950 text-slate-100 flex items-center justify-center p-6 relative overflow-hidden font-sans">
      {/* Decorative background glow circles */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-brand-500/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-violet-600/10 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="w-full max-w-md relative z-10 space-y-8">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center space-y-3">
          <Link to="/" className="inline-flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-violet-600 flex items-center justify-center shadow-glow group-hover:scale-105 transition-transform duration-250">
              <Zap className="w-5 h-5 text-white" />
            </div>
          </Link>
          <div>
            <h2 className="text-2xl font-black tracking-tight text-slate-100">
              Welcome back
            </h2>
            <p className="text-xs text-slate-400 mt-1 font-medium">
              Log in to manage your FormCraft workflows
            </p>
          </div>
        </div>

        {/* Form Card */}
        <div className="p-8 rounded-2xl border border-surface-850 bg-surface-900/30 backdrop-blur-xl shadow-2xl space-y-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  placeholder="name@company.com"
                  className={`w-full bg-surface-950/80 border text-slate-200 text-sm rounded-lg pl-10 pr-4 py-2.5 outline-none transition-all duration-150 ${
                    errors.email
                      ? "border-red-500/50 focus:border-red-500/80 focus:ring-1 focus:ring-red-500/30"
                      : "border-surface-800 focus:border-brand-500/80 focus:ring-1 focus:ring-brand-500/30"
                  }`}
                  {...regField("email")}
                />
              </div>
              {errors.email && (
                <p className="text-xs text-red-400 font-medium">{errors.email.message}</p>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-semibold text-brand-400 hover:text-brand-300 transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  placeholder="••••••••"
                  className={`w-full bg-surface-950/80 border text-slate-200 text-sm rounded-lg pl-10 pr-4 py-2.5 outline-none transition-all duration-150 ${
                    errors.password
                      ? "border-red-500/50 focus:border-red-500/80 focus:ring-1 focus:ring-red-500/30"
                      : "border-surface-800 focus:border-brand-500/80 focus:ring-1 focus:ring-brand-500/30"
                  }`}
                  {...regField("password")}
                />
              </div>
              {errors.password && (
                <p className="text-xs text-red-400 font-medium">{errors.password.message}</p>
              )}
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-gradient-to-r from-brand-600 to-violet-600 hover:from-brand-500 hover:to-violet-500 text-white text-sm font-semibold shadow-lg shadow-brand-500/10 hover:shadow-brand-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Logging you in...
                </>
              ) : (
                <>
                  Continue
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Prompt to register */}
          <div className="text-center pt-2 border-t border-surface-850/50">
            <p className="text-xs text-slate-400 font-medium">
              Don't have an account?{" "}
              <Link
                to="/register"
                className="text-brand-400 hover:text-brand-300 font-bold transition-colors"
              >
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

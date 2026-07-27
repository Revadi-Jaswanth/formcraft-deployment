import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Link } from "react-router-dom";
import { useState } from "react";
import toast from "react-hot-toast";
import { Zap, Mail, ArrowLeft, Loader2, Send } from "lucide-react";

const forgotSchema = z.object({
  email: z.string().min(1, "Email is required").email("Please enter a valid email address"),
});

export default function ForgotPassword() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const {
    register: regField,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(forgotSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      // Simulate API call for email recovery
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setSuccess(true);
      toast.success("Recovery instructions sent!");
    } catch (err) {
      toast.error("Failed to send recovery email. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-950 text-slate-100 flex items-center justify-center p-6 relative overflow-hidden font-sans">
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
              Reset Password
            </h2>
            <p className="text-xs text-slate-400 mt-1 font-medium">
              We'll send you a link to securely recover your account
            </p>
          </div>
        </div>

        {/* Card Form */}
        <div className="p-8 rounded-2xl border border-surface-850 bg-surface-900/30 backdrop-blur-xl shadow-2xl space-y-6">
          {!success ? (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-gradient-to-r from-brand-600 to-violet-600 hover:from-brand-500 hover:to-violet-500 text-white text-sm font-semibold shadow-lg shadow-brand-500/10 hover:shadow-brand-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Sending link...
                  </>
                ) : (
                  <>
                    Send Reset Link
                    <Send className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            <div className="text-center space-y-4 py-4">
              <div className="w-12 h-12 rounded-full bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400 mx-auto">
                <Send className="w-5 h-5" />
              </div>
              <div className="space-y-2">
                <h3 className="text-base font-bold text-slate-200">Instructions sent!</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  We've emailed password reset instructions to your address. Please check your spam folder if you do not receive it in a few minutes.
                </p>
              </div>
            </div>
          )}

          {/* Go back helper */}
          <div className="text-center pt-2 border-t border-surface-850/50">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

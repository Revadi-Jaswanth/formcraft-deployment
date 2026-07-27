import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { X, Lock, Eye, EyeOff, Loader2, ShieldCheck } from "lucide-react";
import { profileApi } from "../../services/profileApi";
import toast from "react-hot-toast";

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Must contain at least one uppercase letter")
      .regex(/[a-z]/, "Must contain at least one lowercase letter")
      .regex(/[0-9]/, "Must contain at least one number")
      .regex(/[^A-Za-z0-9]/, "Must contain at least one special character"),
    confirmPassword: z.string().min(1, "Confirm password is required"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export default function ChangePasswordDialog({ isOpen, onClose }) {
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  const newPasswordValue = watch("newPassword", "");

  // Password strength checker helper
  const getPasswordStrength = () => {
    if (!newPasswordValue) return { score: 0, label: "Empty", color: "bg-slate-800" };
    let score = 0;
    if (newPasswordValue.length >= 8) score++;
    if (/[A-Z]/.test(newPasswordValue)) score++;
    if (/[a-z]/.test(newPasswordValue)) score++;
    if (/[0-9]/.test(newPasswordValue)) score++;
    if (/[^A-Za-z0-9]/.test(newPasswordValue)) score++;

    switch (score) {
      case 5:
        return { score, label: "Very Strong", color: "bg-emerald-500" };
      case 4:
        return { score, label: "Strong", color: "bg-teal-500" };
      case 3:
        return { score, label: "Medium", color: "bg-amber-500" };
      default:
        return { score, label: "Weak", color: "bg-red-500" };
    }
  };

  const strength = getPasswordStrength();

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await profileApi.changePassword(data.currentPassword, data.newPassword);
      toast.success("Password changed successfully!");
      reset();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Current password verification failed.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-surface-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-surface-900 border border-surface-800 rounded-2xl p-6 relative shadow-2xl space-y-6 animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-surface-850/50 pb-3">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-brand-400" />
            <h3 className="font-bold text-slate-100 text-sm">Update Password</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-500 hover:text-slate-300 hover:bg-surface-800 rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-xs font-semibold">
          {/* Current Password */}
          <div className="space-y-1.5">
            <label className="text-slate-400 uppercase tracking-wider">Current Password</label>
            <div className="relative">
              <input
                type={showCurrent ? "text" : "password"}
                placeholder="Enter current password"
                className={`w-full bg-surface-950 border rounded-lg pl-3 pr-10 py-2.5 outline-none text-slate-200 transition-colors ${
                  errors.currentPassword ? "border-red-500/50" : "border-surface-800 focus:border-brand-500"
                }`}
                {...register("currentPassword")}
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300"
              >
                {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.currentPassword && (
              <p className="text-red-400 text-[10px] mt-0.5">{errors.currentPassword.message}</p>
            )}
          </div>

          {/* New Password */}
          <div className="space-y-1.5">
            <label className="text-slate-400 uppercase tracking-wider">New Password</label>
            <div className="relative">
              <input
                type={showNew ? "text" : "password"}
                placeholder="At least 8 characters"
                className={`w-full bg-surface-950 border rounded-lg pl-3 pr-10 py-2.5 outline-none text-slate-200 transition-colors ${
                  errors.newPassword ? "border-red-500/50" : "border-surface-800 focus:border-brand-500"
                }`}
                {...register("newPassword")}
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300"
              >
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.newPassword && (
              <p className="text-red-400 text-[10px] mt-0.5">{errors.newPassword.message}</p>
            )}
          </div>

          {/* Password Strength Meter */}
          {newPasswordValue && (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[9px] font-bold">
                <span className="text-slate-500 uppercase tracking-wider">Strength:</span>
                <span className="text-slate-300">{strength.label}</span>
              </div>
              <div className="h-1.5 w-full bg-surface-950 rounded-full overflow-hidden flex gap-0.5">
                {[1, 2, 3, 4, 5].map((level) => (
                  <div
                    key={level}
                    className={`h-full flex-1 transition-all duration-300 ${
                      level <= strength.score ? strength.color : "bg-surface-850"
                    }`}
                  ></div>
                ))}
              </div>
            </div>
          )}

          {/* Confirm Password */}
          <div className="space-y-1.5">
            <label className="text-slate-400 uppercase tracking-wider">Confirm New Password</label>
            <input
              type="password"
              placeholder="Re-enter new password"
              className={`w-full bg-surface-950 border rounded-lg px-3 py-2.5 outline-none text-slate-200 transition-colors ${
                errors.confirmPassword ? "border-red-500/50" : "border-surface-800 focus:border-brand-500"
              }`}
              {...register("confirmPassword")}
            />
            {errors.confirmPassword && (
              <p className="text-red-400 text-[10px] mt-0.5">{errors.confirmPassword.message}</p>
            )}
          </div>

          {/* Submit buttons */}
          <div className="flex justify-end gap-2 pt-2 text-xs">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary py-2 px-4"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary py-2 px-4 flex items-center gap-1.5"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Save Password
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

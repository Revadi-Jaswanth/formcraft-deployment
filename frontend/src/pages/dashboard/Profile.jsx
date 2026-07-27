import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { profileApi } from "../../services/profileApi";
import {
  User,
  Mail,
  Shield,
  Calendar,
  Clock,
  Briefcase,
  Globe,
  Settings,
  Edit2,
  Lock,
  Loader2,
  CheckCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import AvatarUploader from "../../components/profile/AvatarUploader";
import ChangePasswordDialog from "../../components/profile/ChangePasswordDialog";

export default function Profile() {
  const qc = useQueryClient();
  const [isPasswordOpen, setIsPasswordOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  // Load user profile details using React Query
  const { data: profile, isLoading, isError } = useQuery({
    queryKey: ["user-profile"],
    queryFn: () => profileApi.getProfile().then((r) => r.data),
  });

  const [formData, setFormData] = useState({
    name: "",
    timezone: "",
    bio: "",
    company: "",
    website: "",
  });

  // Prefill state once profile is loaded
  useState(() => {
    if (profile) {
      setFormData({
        name: profile.name || "",
        timezone: profile.timezone || "UTC",
        bio: profile.bio || "",
        company: profile.company || "",
        website: profile.website || "",
      });
    }
  });

  // Sync details if updated
  const syncFormData = (profileData) => {
    setFormData({
      name: profileData.name || "",
      timezone: profileData.timezone || "UTC",
      bio: profileData.bio || "",
      company: profileData.company || "",
      website: profileData.website || "",
    });
  };

  const handleEditToggle = () => {
    if (profile) syncFormData(profile);
    setEditing(!editing);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await profileApi.updateProfile(formData);
      qc.setQueryData(["user-profile"], response.data);
      toast.success("Profile updated successfully!");
      setEditing(false);
    } catch (err) {
      toast.error("Failed to update profile settings.");
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="w-6 h-6 text-brand-400 animate-spin" />
      </div>
    );
  }

  if (isError || !profile) {
    return (
      <div className="p-8 text-center text-red-400 font-medium">
        Failed to fetch profile settings from the server.
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fade-in text-xs font-semibold">
      {/* Header bar */}
      <div className="flex items-center justify-between border-b border-surface-850 pb-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-100 tracking-tight">
            Account Profile
          </h2>
          <p className="text-slate-500 text-xs mt-0.5 font-medium">
            Manage your personal credentials, website integrations, and timezone preferences
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Side: Summary & Quick Actions */}
        <div className="md:col-span-1 space-y-6">
          <div className="p-6 rounded-2xl border border-surface-850 bg-surface-900/30 backdrop-blur-md text-center space-y-4">
            {/* Avatar uploader */}
            <AvatarUploader
              initialAvatar={profile.avatar_url}
              onUploadSuccess={(url) => {
                qc.invalidateQueries({ queryKey: ["user-profile"] });
              }}
            />

            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-200">{profile.name}</h3>
              <p className="text-[10px] text-slate-500">{profile.email}</p>
            </div>

            <div className="pt-3 border-t border-surface-850/60 grid grid-cols-2 gap-2 text-center text-slate-400">
              <div className="p-2 bg-surface-950/40 rounded-xl">
                <span className="font-mono text-xs font-bold block text-brand-400">
                  {profile.stats?.forms_created || 0}
                </span>
                <span className="text-[9px] uppercase tracking-wider text-slate-600 font-semibold block mt-0.5">
                  Forms
                </span>
              </div>
              <div className="p-2 bg-surface-950/40 rounded-xl">
                <span className="font-mono text-xs font-bold block text-violet-400">
                  {profile.stats?.responses_collected || 0}
                </span>
                <span className="text-[9px] uppercase tracking-wider text-slate-600 font-semibold block mt-0.5">
                  Submissions
                </span>
              </div>
            </div>

            <button
              onClick={() => setIsPasswordOpen(true)}
              className="w-full btn-secondary py-2 justify-center gap-1.5"
            >
              <Lock className="w-3.5 h-3.5 text-brand-400" />
              Update Password
            </button>
          </div>
        </div>

        {/* Right Side: Details & Edit Form */}
        <div className="md:col-span-2">
          <form
            onSubmit={handleSaveProfile}
            className="p-6 rounded-2xl border border-surface-850 bg-surface-900/30 backdrop-blur-md space-y-5"
          >
            <div className="flex items-center justify-between border-b border-surface-850 pb-3 mb-2">
              <h3 className="font-bold text-slate-100 text-sm">Personal Workspace Info</h3>
              <button
                type="button"
                onClick={handleEditToggle}
                className="text-slate-400 hover:text-slate-200 transition-colors flex items-center gap-1"
              >
                <Edit2 className="w-3.5 h-3.5" />
                {editing ? "Cancel" : "Edit Profile"}
              </button>
            </div>

            {/* Editing state values */}
            <div className="space-y-4">
              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="text-slate-400 uppercase tracking-wider">Full Name</label>
                <input
                  type="text"
                  name="name"
                  value={editing ? formData.name : profile.name}
                  onChange={handleInputChange}
                  disabled={!editing}
                  className="w-full bg-surface-950 border border-surface-850 rounded-lg px-3 py-2.5 outline-none text-slate-200 disabled:opacity-60 transition-colors focus:border-brand-500"
                  required
                />
              </div>

              {/* Timezone */}
              <div className="space-y-1.5">
                <label className="text-slate-400 uppercase tracking-wider">Timezone</label>
                <select
                  name="timezone"
                  value={editing ? formData.timezone : profile.timezone}
                  onChange={handleInputChange}
                  disabled={!editing}
                  className="select w-full bg-surface-950 border border-surface-850 rounded-lg px-3 py-2.5 outline-none text-slate-200 disabled:opacity-60 transition-colors focus:border-brand-500"
                >
                  <option value="UTC">UTC (GMT+0)</option>
                  <option value="EST">Eastern Time (EST, GMT-5)</option>
                  <option value="PST">Pacific Time (PST, GMT-8)</option>
                  <option value="IST">Indian Standard Time (IST, GMT+5:30)</option>
                </select>
              </div>

              {/* Bio */}
              <div className="space-y-1.5">
                <label className="text-slate-400 uppercase tracking-wider">Bio</label>
                <textarea
                  name="bio"
                  placeholder="Tell us about yourself..."
                  value={editing ? formData.bio : profile.bio || ""}
                  onChange={handleInputChange}
                  disabled={!editing}
                  className="w-full h-20 bg-surface-950 border border-surface-850 rounded-lg p-3 outline-none text-slate-200 disabled:opacity-60 transition-colors focus:border-brand-500 resize-none"
                />
              </div>

              {/* Company / Website */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-slate-400 uppercase tracking-wider">Company</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                      <Briefcase className="w-3.5 h-3.5" />
                    </div>
                    <input
                      type="text"
                      name="company"
                      placeholder="Acme Inc."
                      value={editing ? formData.company : profile.company || ""}
                      onChange={handleInputChange}
                      disabled={!editing}
                      className="w-full bg-surface-950 border border-surface-850 rounded-lg pl-10 pr-3 py-2.5 outline-none text-slate-200 disabled:opacity-60 transition-colors focus:border-brand-500"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-400 uppercase tracking-wider">Website</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                      <Globe className="w-3.5 h-3.5" />
                    </div>
                    <input
                      type="text"
                      name="website"
                      placeholder="https://company.com"
                      value={editing ? formData.website : profile.website || ""}
                      onChange={handleInputChange}
                      disabled={!editing}
                      className="w-full bg-surface-950 border border-surface-850 rounded-lg pl-10 pr-3 py-2.5 outline-none text-slate-200 disabled:opacity-60 transition-colors focus:border-brand-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Read-Only Telemetry */}
            <div className="pt-3.5 border-t border-surface-850/60 grid grid-cols-1 sm:grid-cols-2 gap-4 text-[10px] text-slate-500 font-semibold">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-brand-400" />
                <span>Role: {profile.role}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-violet-400" />
                <span>Joined: {new Date(profile.created_at).toLocaleDateString()}</span>
              </div>
            </div>

            {/* Save Buttons */}
            {editing && (
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleEditToggle}
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
                      Saving...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-3.5 h-3.5" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            )}
          </form>
        </div>
      </div>

      {/* Change Password Dialog Overlay */}
      {isPasswordOpen && (
        <ChangePasswordDialog
          isOpen={isPasswordOpen}
          onClose={() => setIsPasswordOpen(false)}
        />
      )}
    </div>
  );
}

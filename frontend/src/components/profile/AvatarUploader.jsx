import { useState, useRef } from "react";
import { Camera, Upload, Loader2, Star } from "lucide-react";
import { profileApi } from "../../services/profileApi";
import toast from "react-hot-toast";

export default function AvatarUploader({ initialAvatar, onUploadSuccess }) {
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(initialAvatar);
  const fileInputRef = useRef(null);

  const handleFileChange = async (file) => {
    if (!file) return;

    // Client-side type validation
    const allowed = ["image/jpeg", "image/png", "image/gif"];
    if (!allowed.includes(file.type)) {
      toast.error("File type not supported. Please upload a JPG, PNG or GIF.");
      return;
    }

    // Size check (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error("File size too large. Max allowed size is 2MB.");
      return;
    }

    // Preview locally
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
    };
    reader.readAsDataURL(file);

    // Upload to server
    setLoading(true);
    try {
      const response = await profileApi.uploadAvatar(file);
      toast.success("Profile photo updated!");
      onUploadSuccess && onUploadSuccess(response.data.avatar_url);
    } catch (err) {
      toast.error("Failed to upload avatar picture.");
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    handleFileChange(file);
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  const getInitialsSymbol = () => {
    return (
      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-brand-500 to-violet-600 flex items-center justify-center text-xl font-bold text-white shadow-lg border-2 border-surface-800">
        <Camera className="w-6 h-6 animate-pulse" />
      </div>
    );
  };

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6">
      {/* Avatar Container */}
      <div className="relative group cursor-pointer" onClick={triggerFileInput}>
        {preview ? (
          <img
            src={preview.startsWith("/public") ? preview : preview}
            alt="Profile Avatar"
            className="w-20 h-20 rounded-full object-cover border-2 border-surface-800 shadow-lg group-hover:opacity-60 transition-opacity"
            onError={() => setPreview(null)}
          />
        ) : (
          getInitialsSymbol()
        )}

        {/* Hover Camera icon Overlay */}
        <div className="absolute inset-0 rounded-full flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          <Camera className="w-5 h-5 text-white" />
        </div>

        {/* Loading Spinner */}
        {loading && (
          <div className="absolute inset-0 rounded-full flex items-center justify-center bg-surface-950/70">
            <Loader2 className="w-5 h-5 text-brand-400 animate-spin" />
          </div>
        )}
      </div>

      {/* Upload Details */}
      <div className="text-center sm:text-left space-y-1.5 flex-1">
        <button
          type="button"
          onClick={triggerFileInput}
          disabled={loading}
          className="btn-secondary py-1.5 px-3 text-xs flex items-center gap-1.5 mx-auto sm:mx-0"
        >
          <Upload className="w-3.5 h-3.5" />
          Upload Image
        </button>
        <p className="text-[10px] text-slate-500 font-medium">
          Supports JPG, PNG or GIF. Maximum file size allowed is 2MB.
        </p>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) => handleFileChange(e.target.files[0])}
        className="hidden"
        accept="image/jpeg,image/png,image/gif"
      />
    </div>
  );
}

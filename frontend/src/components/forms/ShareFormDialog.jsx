import { useState } from "react";
import { X, Link2, Copy, QrCode, Download, ExternalLink, RefreshCw, Archive, RotateCcw } from "lucide-react";
import { usePublishForm, useArchiveForm, useRestoreForm } from "../../hooks/useForms";
import toast from "react-hot-toast";

export default function ShareFormDialog({ form, isOpen, onClose }) {
  const [copied, setCopied] = useState(false);
  const publishMutation = usePublishForm();
  const archiveMutation = useArchiveForm();
  const restoreMutation = useRestoreForm();

  if (!isOpen || !form) return null;

  const publicUrl = form.share_token
    ? `${window.location.origin}/f/${form.share_token}`
    : "";

  const qrCodeUrl = form.share_token
    ? `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(publicUrl)}`
    : "";

  const handleCopyLink = () => {
    if (!publicUrl) return;
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    toast.success("Public share link copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadQR = async () => {
    try {
      const response = await fetch(qrCodeUrl);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `qr_${form.title.toLowerCase().replace(/\s+/g, "_")}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
      toast.success("QR Code downloaded successfully!");
    } catch (err) {
      toast.error("Failed to download QR code image.");
    }
  };

  const handlePublish = () => {
    publishMutation.mutate(
      { id: form.id, data: {} },
      {
        onSuccess: () => {
          toast.success("Form has been published successfully!");
        },
      }
    );
  };

  const handleArchive = () => {
    if (confirm("Archive this form? Respondents will no longer be able to submit responses.")) {
      archiveMutation.mutate(form.id, {
        onSuccess: () => {
          toast.success("Form archived.");
        },
      });
    }
  };

  const handleRestore = () => {
    restoreMutation.mutate(form.id, {
      onSuccess: () => {
        toast.success("Form restored to draft status.");
      },
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-surface-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-surface-900 border border-surface-850 rounded-2xl p-6 relative shadow-2xl space-y-6 animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-surface-850 pb-3">
          <div className="space-y-0.5">
            <h3 className="font-bold text-slate-100 text-sm">Form Distribution</h3>
            <p className="text-[10px] text-slate-500 font-medium">Manage how users access and submit answers</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-500 hover:text-slate-300 hover:bg-surface-800 rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content depends on form status */}
        {form.status === "draft" ? (
          <div className="text-center py-6 space-y-4">
            <div className="w-12 h-12 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto border border-amber-500/20">
              <Link2 className="w-5 h-5" />
            </div>
            <div className="space-y-1.5 max-w-sm mx-auto">
              <h4 className="text-xs font-bold text-slate-200">Form is currently a Draft</h4>
              <p className="text-[10px] text-slate-500 leading-relaxed font-medium">
                You must publish this form first to generate a shareable public link and QR code for your respondents.
              </p>
            </div>
            <button
              onClick={handlePublish}
              disabled={publishMutation.isLoading}
              className="btn-primary py-2 px-5 text-xs mx-auto flex items-center gap-1.5"
            >
              {publishMutation.isLoading ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <ExternalLink className="w-3.5 h-3.5" />
              )}
              Publish Form Now
            </button>
          </div>
        ) : form.status === "archived" ? (
          <div className="text-center py-6 space-y-4">
            <div className="w-12 h-12 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center mx-auto border border-slate-700">
              <Archive className="w-5 h-5" />
            </div>
            <div className="space-y-1.5 max-w-sm mx-auto">
              <h4 className="text-xs font-bold text-slate-200">Form is Archived</h4>
              <p className="text-[10px] text-slate-500 leading-relaxed font-medium">
                This form has been archived and is not accepting submissions. Restore it to draft status to edit and publish it again.
              </p>
            </div>
            <button
              onClick={handleRestore}
              disabled={restoreMutation.isLoading}
              className="btn-secondary py-2 px-5 text-xs mx-auto flex items-center gap-1.5"
            >
              {restoreMutation.isLoading ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <RotateCcw className="w-3.5 h-3.5 text-brand-400" />
              )}
              Restore to Draft
            </button>
          </div>
        ) : (
          /* Published form share tools */
          <div className="space-y-5 text-xs font-semibold">
            {/* Copy link input */}
            <div className="space-y-1.5">
              <label className="text-slate-400 uppercase tracking-wider">Public Share Link</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={publicUrl}
                  readOnly
                  className="flex-1 bg-surface-950 border border-surface-850 rounded-lg px-3 py-2 outline-none text-slate-300 font-mono text-[10px]"
                />
                <button
                  onClick={handleCopyLink}
                  className="btn-secondary py-2 px-3 flex items-center justify-center"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* QR Code Container */}
            <div className="space-y-1.5 flex flex-col items-center">
              <label className="text-slate-400 uppercase tracking-wider self-start">QR Code</label>
              <div className="p-3 bg-white rounded-xl shadow-md border border-slate-200 mt-2">
                <img
                  src={qrCodeUrl}
                  alt="Form QR Code"
                  className="w-40 h-40 object-contain"
                />
              </div>

              <div className="flex gap-2.5 mt-4 w-full">
                <button
                  onClick={handleDownloadQR}
                  className="flex-1 btn-secondary py-2 text-xs flex items-center justify-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-400" />
                  Download Image
                </button>
                <a
                  href={publicUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 btn-secondary py-2 text-xs flex items-center justify-center gap-1.5"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Open Link
                </a>
              </div>
            </div>

            {/* Change Status Section */}
            <div className="pt-4 border-t border-surface-850/60 flex items-center justify-between text-[10px] text-slate-500">
              <span>Status: <span className="text-emerald-400 font-bold uppercase">Published</span></span>
              <button
                onClick={handleArchive}
                className="text-red-400 hover:text-red-300 hover:underline flex items-center gap-1"
              >
                <Archive className="w-3.5 h-3.5" />
                Archive Form
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  ChevronDown,
  Edit2,
  Copy,
  Link2,
  Trash,
  FileText,
  MessageSquare,
} from "lucide-react";
import toast from "react-hot-toast";

export default function SidebarAccordion({
  title,
  icon: Icon,
  items = [],
  type = "forms",
  onDelete,
  onDuplicate,
}) {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(() => {
    const saved = localStorage.getItem(`sidebar-accordion-${title}`);
    return saved !== null ? JSON.parse(saved) : true;
  });
  const navigate = useNavigate();

  const toggleOpen = () => {
    setIsOpen((prev) => {
      const next = !prev;
      localStorage.setItem(`sidebar-accordion-${title}`, JSON.stringify(next));
      return next;
    });
  };

  const handleCopyLink = (e, form) => {
    e.preventDefault();
    e.stopPropagation();
    if (!form.share_token) {
      toast.error("Form is not published yet.");
      return;
    }
    const url = `${window.location.origin}/f/${form.share_token}`;
    navigator.clipboard.writeText(url);
    toast.success("Public link copied to clipboard!");
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "published":
        return "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
      case "archived":
        return "bg-slate-800 text-slate-400 border border-slate-700/50";
      default:
        return "bg-amber-500/10 text-amber-400 border border-amber-500/20";
    }
  };

  return (
    <div className="space-y-1">
      {/* Header Button */}
      <button
        onClick={toggleOpen}
        className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider hover:text-slate-300 transition-colors"
      >
        <div className="flex items-center gap-2">
          {Icon && <Icon className="w-3.5 h-3.5" />}
          <span>{title}</span>
        </div>
        <ChevronDown
          className={`w-3.5 h-3.5 transition-transform duration-200 ${
            isOpen ? "" : "-rotate-90"
          }`}
        />
      </button>

      {/* Collapsible Content */}
      <div
        className={`transition-all duration-300 overflow-hidden ${
          isOpen ? "max-h-[350px] overflow-y-auto space-y-1 pl-2" : "max-h-0"
        }`}
      >
        {items.length === 0 ? (
          <p className="text-xs text-slate-600 px-3 py-2 italic">
            No items available
          </p>
        ) : (
          items.map((item) => {
            const isForms = type === "forms";
            const targetUrl = isForms
              ? `/forms/${item.id}/builder`
              : `/dashboard/forms/${item.id}/responses`;
            const isActive = location.pathname === targetUrl;

            return (
              <Link
                key={item.id}
                to={targetUrl}
                className={`flex items-center justify-between p-2 rounded-lg text-xs transition-all group relative border ${
                  isActive
                    ? "bg-brand-500/10 border-brand-500/20 text-brand-400 font-semibold"
                    : "text-slate-400 hover:text-slate-200 hover:bg-surface-850 border-transparent"
                }`}
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  {isForms ? (
                    <FileText className="w-3.5 h-3.5 text-brand-400 shrink-0" />
                  ) : (
                    <MessageSquare className="w-3.5 h-3.5 text-violet-400 shrink-0" />
                  )}
                  <div className="truncate pr-2">
                    <p className="font-medium truncate text-slate-300 group-hover:text-slate-100">
                      {item.title}
                    </p>
                    {isForms ? (
                      <span className="flex items-center gap-1.5 mt-0.5 text-[10px] text-slate-500">
                        <span className={`px-1 rounded text-[9px] ${getStatusColor(item.status)}`}>
                          {item.status}
                        </span>
                        <span>•</span>
                        <span>{item.submission_count || 0} sub</span>
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-500 block mt-0.5">
                        {item.submission_count || 0} total responses
                      </span>
                    )}
                  </div>
                </div>

                {/* Hover Action Buttons */}
                {isForms && (
                  <div className="hidden group-hover:flex items-center gap-1 shrink-0 bg-surface-850 pl-2 rounded-lg">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        navigate(`/forms/${item.id}/builder`);
                      }}
                      title="Edit"
                      className="p-1 text-slate-400 hover:text-slate-100 rounded hover:bg-surface-800 transition-colors"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                    {item.status === "published" && (
                      <button
                        onClick={(e) => handleCopyLink(e, item)}
                        title="Copy Share Link"
                        className="p-1 text-slate-400 hover:text-slate-100 rounded hover:bg-surface-800 transition-colors"
                      >
                        <Link2 className="w-3 h-3" />
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onDuplicate && onDuplicate(item);
                      }}
                      title="Duplicate"
                      className="p-1 text-slate-400 hover:text-slate-100 rounded hover:bg-surface-800 transition-colors"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onDelete && onDelete(item);
                      }}
                      title="Delete"
                      className="p-1 text-red-500 hover:text-red-400 rounded hover:bg-surface-800 transition-colors"
                    >
                      <Trash className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}

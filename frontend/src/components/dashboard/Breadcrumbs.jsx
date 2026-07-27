import { useLocation, Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { useForms } from "../../hooks/useForms";

export default function Breadcrumbs() {
  const { pathname } = useLocation();
  
  // Load forms to resolve form titles from form IDs
  const { data } = useForms();
  const forms = data?.items ?? [];

  const getBreadcrumbs = () => {
    const segments = pathname.split("/").filter(Boolean);
    const breadcrumbs = [];

    // Always starts with Dashboard (or Landing if we are on root, but this is inside DashboardLayout)
    breadcrumbs.push({ label: "Dashboard", path: "/dashboard" });

    let currentPath = "";
    segments.forEach((segment) => {
      currentPath += `/${segment}`;

      // Skip "/dashboard" segment to prevent duplicate "Dashboard / Dashboard"
      if (segment.toLowerCase() === "dashboard") return;

      // Check if segment is a Form ID (UUID format check)
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (uuidRegex.test(segment)) {
        const matchedForm = forms.find((f) => f.id === segment);
        breadcrumbs.push({
          label: matchedForm ? matchedForm.title : "Form Builder",
          path: currentPath,
        });
      } else {
        // Humanize standard segments (e.g. "responses" -> "Responses", "forms" -> "Forms")
        const label = segment
          .split("-")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ");
        breadcrumbs.push({ label, path: currentPath });
      }
    });

    return breadcrumbs;
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <nav className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 py-3">
      {breadcrumbs.map((crumb, idx) => {
        const isLast = idx === breadcrumbs.length - 1;

        if (isLast) {
          return (
            <span key={crumb.path} className="text-slate-300 font-bold truncate max-w-44">
              {crumb.label}
            </span>
          );
        }

        return (
          <div key={crumb.path} className="flex items-center gap-1.5 min-w-0">
            <Link
              to={crumb.path}
              className="hover:text-slate-300 transition-colors shrink-0"
            >
              {crumb.label}
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-700 shrink-0" />
          </div>
        );
      })}
    </nav>
  );
}

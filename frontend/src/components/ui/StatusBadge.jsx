const BADGE_CLASSES = {
  draft: "badge-draft",
  published: "badge-published",
  archived: "badge-archived",
};

const DOTS = {
  draft: "bg-slate-500",
  published: "bg-emerald-400",
  archived: "bg-orange-400",
};

export default function StatusBadge({ status }) {
  return (
    <span className={BADGE_CLASSES[status] ?? "badge"}>
      <span className={`w-1.5 h-1.5 rounded-full ${DOTS[status] ?? "bg-slate-500"}`} />
      {status}
    </span>
  );
}

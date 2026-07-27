export default function SkeletonCard({ type = "card" }) {
  if (type === "stats") {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="p-5 rounded-2xl border border-surface-850 bg-surface-900/30 flex items-center justify-between"
          >
            <div className="space-y-2 flex-1">
              <div className="h-6 w-16 bg-surface-800 rounded"></div>
              <div className="h-3 w-24 bg-surface-800/60 rounded"></div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-surface-800 shrink-0"></div>
          </div>
        ))}
      </div>
    );
  }

  if (type === "table") {
    return (
      <div className="p-6 rounded-2xl border border-surface-850 bg-surface-900/30 animate-pulse space-y-4">
        <div className="space-y-2">
          <div className="h-4 w-32 bg-surface-800 rounded"></div>
          <div className="h-3 w-48 bg-surface-800/60 rounded"></div>
        </div>
        <div className="space-y-3 pt-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex justify-between items-center gap-4 py-2 border-b border-surface-850/50">
              <div className="h-4 w-40 bg-surface-800 rounded"></div>
              <div className="h-3 w-16 bg-surface-800 rounded"></div>
              <div className="h-3 w-24 bg-surface-800 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-5 rounded-2xl border border-surface-850 bg-surface-900/30 animate-pulse space-y-4">
      <div className="flex justify-between items-start">
        <div className="space-y-2 flex-1">
          <div className="h-4 w-3/4 bg-surface-800 rounded"></div>
          <div className="h-3 w-1/2 bg-surface-800/60 rounded"></div>
        </div>
        <div className="w-8 h-8 rounded bg-surface-800 shrink-0"></div>
      </div>
      <div className="h-3 w-20 bg-surface-800 rounded"></div>
      <div className="flex gap-4 pt-2">
        <div className="h-3 w-12 bg-surface-800 rounded"></div>
        <div className="h-3 w-16 bg-surface-800 rounded"></div>
      </div>
      <div className="h-9 w-full bg-surface-800 rounded-lg pt-2"></div>
    </div>
  );
}

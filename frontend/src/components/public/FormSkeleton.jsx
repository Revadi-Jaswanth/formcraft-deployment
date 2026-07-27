import React from "react";

export default function FormSkeleton() {
  return (
    <div className="w-full max-w-2xl mx-auto space-y-6 animate-pulse">
      {/* Title Card Skeleton */}
      <div className="p-6 rounded-2xl border border-surface-850 bg-surface-900/30 space-y-3">
        <div className="h-6 bg-surface-800 rounded-lg w-2/3"></div>
        <div className="h-4 bg-surface-800 rounded-lg w-1/2"></div>
      </div>

      {/* Fields Skeletons */}
      <div className="space-y-4">
        {[1, 2, 3].map((n) => (
          <div
            key={n}
            className="p-5 rounded-xl border border-surface-850 bg-surface-900/30 space-y-3"
          >
            <div className="h-4 bg-surface-800 rounded-lg w-1/4"></div>
            <div className="h-10 bg-surface-800/60 rounded-lg w-full"></div>
          </div>
        ))}
      </div>

      {/* Button Skeleton */}
      <div className="h-10 bg-brand-600/30 rounded-lg w-32 ml-auto"></div>
    </div>
  );
}

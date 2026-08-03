import React from "react";

export function CardSkeleton({ count = 1 }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-700/60 shadow-sm animate-pulse space-y-4"
        >
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 bg-slate-200 dark:bg-slate-700 rounded-xl" />
            <div className="w-16 h-5 bg-slate-200 dark:bg-slate-700 rounded-full" />
          </div>
          <div className="space-y-2">
            <div className="w-1/3 h-4 bg-slate-200 dark:bg-slate-700 rounded" />
            <div className="w-2/3 h-7 bg-slate-200 dark:bg-slate-700 rounded" />
          </div>
        </div>
      ))}
    </>
  );
}

export function TableSkeleton({ rows = 5, cols = 4 }) {
  return (
    <div className="w-full bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 overflow-hidden shadow-sm animate-pulse">
      <div className="bg-slate-50 dark:bg-slate-900/50 p-4 border-b border-slate-200 dark:border-slate-700 flex gap-4">
        {Array.from({ length: cols }).map((_, i) => (
          <div key={i} className="h-4 bg-slate-200 dark:bg-slate-700 rounded flex-1" />
        ))}
      </div>
      <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="p-4 flex gap-4 items-center">
            {Array.from({ length: cols }).map((_, c) => (
              <div
                key={c}
                className={`h-4 bg-slate-200 dark:bg-slate-700/70 rounded ${
                  c === 0 ? "w-1/4" : "flex-1"
                }`}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="space-y-6 animate-pulse p-2">
      <div className="h-8 bg-slate-200 dark:bg-slate-700/60 rounded-lg w-64" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <CardSkeleton count={3} />
      </div>
      <TableSkeleton rows={4} cols={5} />
    </div>
  );
}

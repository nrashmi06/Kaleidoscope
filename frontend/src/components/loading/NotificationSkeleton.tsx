"use client";

import React from "react";

export default function NotificationSkeleton() {
  return (
    <div className="animate-pulse flex items-start gap-3 p-4 rounded-xl border border-border-subtle bg-cream-50/50 dark:bg-navy-700/30">
      {/* Avatar */}
      <div className="w-10 h-10 rounded-full bg-cream-300/60 dark:bg-navy-600/60 flex-shrink-0" />
      {/* Content */}
      <div className="flex-1 space-y-2">
        <div className="h-3.5 bg-cream-300/50 dark:bg-navy-600/50 rounded w-3/4" />
        <div className="h-3 bg-cream-300/40 dark:bg-navy-600/40 rounded w-5/6" />
        <div className="h-2.5 bg-cream-300/30 dark:bg-navy-600/30 rounded w-1/3 mt-1" />
      </div>
    </div>
  );
}

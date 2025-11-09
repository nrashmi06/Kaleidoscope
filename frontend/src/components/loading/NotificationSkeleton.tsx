"use client";

import React from "react";

/**
 * NotificationSkeleton — Shimmer placeholder while notifications are loading
 */
export default function NotificationSkeleton() {
  return (
    <div
      className="
        animate-pulse flex flex-col gap-2 p-4 m-2 rounded-xl border 
        border-neutral-200 dark:border-neutral-800 
        bg-white dark:bg-neutral-900
      "
    >
      {/* Top row: message + delete icon placeholder */}
      <div className="flex items-start justify-between">
        <div className="flex-1 space-y-2">
          <div className="h-3.5 bg-neutral-200 dark:bg-neutral-700 rounded w-3/4" />
          <div className="h-3 bg-neutral-200 dark:bg-neutral-700 rounded w-5/6" />
        </div>
        <div className="w-6 h-6 bg-neutral-200 dark:bg-neutral-700 rounded-md" />
      </div>

      {/* Timestamp placeholder */}
      <div className="h-2.5 bg-neutral-200 dark:bg-neutral-700 rounded w-1/3 mt-2" />
    </div>
  );
}

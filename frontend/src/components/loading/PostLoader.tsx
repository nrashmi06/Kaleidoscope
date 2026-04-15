"use client";

import React from "react";

export default function PostLoader() {
  return (
    <div className="w-full animate-pulse">
      {/* Image placeholder */}
      <div className="w-full aspect-[4/3] rounded-2xl bg-cream-300/50 dark:bg-navy-700/50" />

      {/* Content placeholder */}
      <div className="mt-4 space-y-3 px-0.5">
        {/* Author row */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-cream-300/50 dark:bg-navy-700/50" />
          <div className="space-y-1.5">
            <div className="w-24 h-3 bg-cream-300/50 dark:bg-navy-700/50 rounded-full" />
            <div className="w-16 h-2.5 bg-cream-300/30 dark:bg-navy-700/30 rounded-full" />
          </div>
        </div>
        {/* Text lines */}
        <div className="w-4/5 h-4 bg-cream-300/50 dark:bg-navy-700/50 rounded-full" />
        <div className="w-3/5 h-3.5 bg-cream-300/30 dark:bg-navy-700/30 rounded-full" />
      </div>
    </div>
  );
}

"use client";

import React from "react";
import { RefreshCw, Loader2, SlidersHorizontal } from "lucide-react";

interface FeedHeaderProps {
  isRefreshing: boolean;
  refreshPosts: () => void;
  onFilterClick?: () => void;
}

export default function FeedHeader({
  isRefreshing,
  refreshPosts,
  onFilterClick,
}: FeedHeaderProps) {
  return (
    <header
      className="
        sticky top-0 z-20
        flex items-center justify-between
        px-4 py-2
        rounded-md
        bg-white/10 dark:bg-neutral-900/70
        border-b border-gray-200 dark:border-neutral-800
        backdrop-blur-md
        supports-[backdrop-filter]:backdrop-blur-lg
        shadow-sm
      "
    >
      {/* Left — Title */}
      <div className="flex items-center gap-2">
        <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
          Feed
        </h1>
        <p className="hidden sm:inline text-sm text-gray-500 dark:text-gray-400">
          | Find the world around you 
        </p>
      </div>

      {/* Right — Controls */}
      <div className="flex items-center gap-1.5">
        {/* Filter Button */}
        <button
          onClick={onFilterClick}
          aria-label="Filter"
          className="
            flex items-center justify-center gap-1.5
            px-3 h-8
            text-xs font-medium text-gray-600 dark:text-gray-300
            bg-transparent
            rounded-full
            hover:bg-gray-100 dark:hover:bg-neutral-800
            transition-colors
          "
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span className="hidden sm:inline">Filter</span>
        </button>

        {/* Refresh Button */}
        <button
          onClick={refreshPosts}
          disabled={isRefreshing}
          aria-label="Refresh"
          className="
            flex items-center justify-center gap-1.5
            px-3 h-8
            text-xs font-medium
            text-blue-600 dark:text-blue-400
            bg-blue-50 dark:bg-blue-950/30
            rounded-full
            hover:bg-blue-100 dark:hover:bg-blue-900/40
            active:scale-[0.98]
            border border-blue-100 dark:border-blue-900/50
            transition-all
            disabled:opacity-60 disabled:pointer-events-none
          "
        >
          {isRefreshing ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span className="hidden sm:inline">Refreshing</span>
            </>
          ) : (
            <>
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Refresh</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
}

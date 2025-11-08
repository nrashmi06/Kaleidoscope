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
        flex flex-col md:flex-row md:items-center md:justify-between
        gap-4 px-5 py-4
        bg-white/70 dark:bg-neutral-900/70
        border-b border-gray-200 dark:border-neutral-800
        backdrop-blur-md
        supports-[backdrop-filter]:backdrop-blur-xl
      "
    >
      {/* Left Section — Title */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
          Feed
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Explore what’s happening right now
        </p>
      </div>

      {/* Right Section — Buttons */}
      <div className="flex items-center gap-3 w-full md:w-auto">
        {/* Filter Button */}
        <button
          onClick={onFilterClick}
          className="
            flex flex-1 md:flex-none items-center justify-center gap-2
            px-4 py-2.5
            text-sm font-medium text-gray-700 dark:text-gray-200
            bg-white dark:bg-neutral-800
            border border-gray-200 dark:border-neutral-700
            rounded-lg
            hover:bg-gray-50 dark:hover:bg-neutral-700
            active:scale-[0.98]
            transition-all
            shadow-sm
          "
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span>Filter</span>
        </button>

        {/* Refresh Button */}
        <button
          onClick={refreshPosts}
          disabled={isRefreshing}
          className="
            flex flex-1 md:flex-none items-center justify-center gap-2
            px-5 py-2.5
            text-sm font-medium
            text-white bg-blue-500 hover:bg-blue-600
            rounded-lg
            shadow-md hover:shadow-lg
            active:scale-[0.98]
            transition-all
            disabled:opacity-60 disabled:pointer-events-none
            min-w-[8rem]
          "
        >
          {isRefreshing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Refreshing...</span>
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4" />
              <span>Refresh</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
}

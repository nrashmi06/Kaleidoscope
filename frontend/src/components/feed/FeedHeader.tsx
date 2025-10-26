"use client";

import React from "react";
import { RefreshCw, Loader2, List } from "lucide-react";

interface FeedHeaderProps {
  postsCount: number;
  isRefreshing: boolean;
  refreshPosts: () => void;
  loadAllPosts: () => void;
}

export default function FeedHeader({
  postsCount,
  isRefreshing,
  refreshPosts,
  loadAllPosts,
}: FeedHeaderProps) {
  return (
    <div className="flex justify-between items-center py-4 px-5 bg-white/70 dark:bg-neutral-900/70 backdrop-blur-lg border border-gray-200 dark:border-neutral-800 rounded-2xl shadow-sm">
      {/* Left Side: Title and Post Count */}
      <div className="flex items-center gap-3">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Recent Posts
        </h2>
        {/* Post count as a "pill" badge */}
        <span className="px-2.5 py-0.5 text-xs font-semibold text-blue-800 bg-blue-100 dark:text-blue-200 dark:bg-blue-900/50 rounded-full">
          {postsCount} {postsCount === 1 ? "post" : "posts"}
        </span>
      </div>

      {/* Right Side: Action Buttons */}
      <div className="flex gap-2">
        {/* Load All Button (Secondary Action) */}
        <button
          onClick={loadAllPosts}
          disabled={isRefreshing}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 hover:bg-gray-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 rounded-lg transition-colors disabled:opacity-50 disabled:pointer-events-none"
        >
          <List className="w-4 h-4" />
          Load All
        </button>

        {/* Refresh Button (Primary Action) */}
        <button
          onClick={refreshPosts}
          disabled={isRefreshing}
          className="flex items-center justify-center gap-2 w-28 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 rounded-lg transition-all disabled:opacity-50 disabled:pointer-events-none shadow-sm shadow-blue-500/20 hover:shadow-md hover:shadow-blue-500/30"
        >
          {isRefreshing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Loading...</span>
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4" />
              <span>Refresh</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

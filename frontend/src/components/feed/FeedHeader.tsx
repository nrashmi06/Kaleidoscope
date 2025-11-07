"use client";

import React from "react";
import { RefreshCw, Loader2 } from "lucide-react";

interface FeedHeaderProps {
  isRefreshing: boolean;
  refreshPosts: () => void;
}

export default function FeedHeader({
  isRefreshing,
  refreshPosts,
}: FeedHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 py-3 px-5 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-lg ">
      {/* Left Side: Title */}
      {/* This div ensures proper alignment in both flex-col and flex-row layouts */}
      <div className="w-full md:w-auto">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
          Recent Posts
        </h1>
      </div>

      {/* Right Side: Action Buttons */}
      {/* This group scales full-width on mobile and auto-width on desktop */}
      <div className="flex w-full md:w-auto gap-2">
        {/* Refresh Button (Primary Action) */}
        <button
          onClick={refreshPosts}
          disabled={isRefreshing}
          className="
            flex flex-1 md:flex-none items-center justify-center gap-2 px-3 py-1.5 
            text-sm font-medium 
            text-white bg-gray-900 
            dark:text-gray-900 dark:bg-gray-50
            hover:bg-gray-700 dark:hover:bg-gray-200 
            rounded-lg transition-colors 
            disabled:opacity-50 disabled:pointer-events-none
            min-w-[7.5rem]
            cursor-pointer
          "
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
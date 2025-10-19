"use client";

import React from "react";
import { RefreshCw } from "lucide-react";

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
    <div className="flex justify-between items-center">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
        Recent Posts ({postsCount})
      </h2>
      <div className="flex gap-2">
        <button
          onClick={loadAllPosts}
          disabled={isRefreshing}
          className="flex items-center gap-2 px-3 py-2 text-sm bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
        >
          {isRefreshing ? "Loading..." : "Load All"}
        </button>
        <button
          onClick={refreshPosts}
          disabled={isRefreshing}
          className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
          {isRefreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>
    </div>
  );
}

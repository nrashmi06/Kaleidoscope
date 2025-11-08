"use client";

import React from "react";

/**
 * PostLoader – Skeleton loader for a post card
 * -------------------------------------------------
 * Shows placeholder shapes for:
 * - Avatar
 * - Username & timestamp
 * - Post image or media
 * - Post text content
 * -------------------------------------------------
 */

export default function PostLoader() {
  return (
    <div className="w-full max-w-2xl mx-auto p-4 mb-4 rounded-2xl border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm animate-pulse">
      {/* Header (avatar + username) */}
      <div className="flex items-center gap-3 mb-4">
        {/* Avatar */}
        <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-neutral-700" />
        {/* Username and timestamp */}
        <div className="flex-1">
          <div className="w-32 h-4 bg-gray-200 dark:bg-neutral-700 rounded mb-2" />
          <div className="w-20 h-3 bg-gray-200 dark:bg-neutral-700 rounded" />
        </div>
      </div>

      {/* Image placeholder */}
      <div className="w-full h-56 bg-gray-200 dark:bg-neutral-800 rounded-xl mb-4" />

      {/* Post title/text lines */}
      <div className="space-y-2">
        <div className="w-5/6 h-4 bg-gray-200 dark:bg-neutral-700 rounded" />
        <div className="w-3/4 h-4 bg-gray-200 dark:bg-neutral-700 rounded" />
        <div className="w-4/5 h-4 bg-gray-200 dark:bg-neutral-700 rounded" />
      </div>

      {/* Footer buttons (like/comment placeholders) */}
      <div className="flex items-center gap-4 mt-4">
        <div className="w-16 h-4 bg-gray-200 dark:bg-neutral-700 rounded" />
        <div className="w-16 h-4 bg-gray-200 dark:bg-neutral-700 rounded" />
      </div>
    </div>
  );
}

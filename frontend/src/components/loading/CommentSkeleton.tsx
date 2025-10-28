"use client";

import React from "react";

export const CommentSkeleton = () => (
  <div className="animate-pulse flex items-start gap-3 py-2">
    <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
    <div className="flex-1 space-y-2">
      <div className="w-1/3 h-3 bg-gray-300 dark:bg-gray-600 rounded"></div>
      <div className="w-2/3 h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
      <div className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
    </div>
  </div>
);

export default CommentSkeleton;

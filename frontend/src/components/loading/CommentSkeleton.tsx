"use client";

import React from "react";

export const CommentSkeleton = () => (
  <div className="animate-pulse flex items-start gap-3 py-2">
    <div className="w-8 h-8 bg-cream-300/60 dark:bg-navy-700/60 rounded-full"></div>
    <div className="flex-1 space-y-2">
      <div className="w-1/3 h-3 bg-cream-300/60 dark:bg-navy-700/60 rounded"></div>
      <div className="w-2/3 h-3 bg-surface-hover rounded"></div>
      <div className="w-full h-3 bg-surface-hover rounded"></div>
    </div>
  </div>
);

export default CommentSkeleton;

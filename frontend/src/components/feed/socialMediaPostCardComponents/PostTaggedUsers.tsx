"use client";

import { useState } from "react";
import { Post } from "@/services/post/fetchPosts";

export function PostTaggedUsers({ post }: { post: Post }) {
  const [showHover, setShowHover] = useState(false);

  // ✅ Narrow post.taggedUsers explicitly
  const taggedUsers = post.taggedUsers;
  if (!taggedUsers || taggedUsers.length === 0) return null;

  return (
    <div className="relative">
      <div
        className="flex flex-wrap gap-1.5 pt-2 border-t border-border-default"
        onMouseEnter={() => setShowHover(true)}
        onMouseLeave={() => setShowHover(false)}
      >
        <span className="text-[11px] text-steel dark:text-sky/50">Tagged:</span>
        {taggedUsers.map((user, idx) => (
          <span
            key={user.userId}
            className="text-[11px] text-steel dark:text-sky hover:underline cursor-pointer"
          >
            @{user.username}
            {idx < taggedUsers.length - 1 ? "," : ""}
          </span>
        ))}
      </div>

      {showHover && (
        <div className="absolute top-full mt-2 right-0 bg-navy/95 dark:bg-navy-700/95 backdrop-blur-sm text-cream rounded-xl p-3 z-20 shadow-lg shadow-navy/20 dark:shadow-black/30 min-w-[200px] border border-navy-700/50 dark:border-navy-600/50">
          <div className="text-xs font-semibold mb-2 text-cream">Tagged Users</div>
          <div className="space-y-1.5">
            {taggedUsers.map((user) => (
              <div
                key={user.userId}
                className="text-xs flex items-center gap-2 text-cream/80 hover:text-sky transition"
              >
                <div className="w-5 h-5 rounded-full bg-steel/30 flex items-center justify-center">
                  <span className="text-[10px] font-medium text-sky">
                    {user.username.charAt(0).toUpperCase()}
                  </span>
                </div>
                @{user.username}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

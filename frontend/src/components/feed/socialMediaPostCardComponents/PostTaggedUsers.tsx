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
        className="flex flex-wrap gap-2 pt-2 border-t border-gray-100 dark:border-gray-700"
        onMouseEnter={() => setShowHover(true)}
        onMouseLeave={() => setShowHover(false)}
      >
        <span className="text-xs text-gray-500 dark:text-gray-400">Tagged:</span>
        {taggedUsers.map((user, idx) => (
          <span
            key={user.userId}
            className="text-xs text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
          >
            @{user.username}
            {idx < taggedUsers.length - 1 ? "," : ""}
          </span>
        ))}
      </div>

      {showHover && (
        <div className="absolute top-full mt-2 right-0 bg-gray-900 bg-opacity-90 text-white rounded-lg p-3 z-20 shadow-lg min-w-[200px]">
          <div className="text-sm font-medium mb-2">Tagged Users</div>
          <div className="space-y-1">
            {taggedUsers.map((user) => (
              <div
                key={user.userId}
                className="text-xs flex items-center gap-2 hover:text-blue-300 transition"
              >
                <div className="w-6 h-6 rounded-full bg-gray-600 flex items-center justify-center">
                  <span className="text-xs font-medium">
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

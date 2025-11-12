// src/components/user/UserProfilePosts.tsx
"use client";

import { FileText, Lock, Eye } from "lucide-react";
// ✅ 1. REMOVED UNUSED IMPORTS (formatDistanceToNow, PostAuthor)
import { type MappedUserProfile, type FollowStatus } from "@/lib/types/userProfile";
import { PostFeedGrid } from "@/components/feed/PostFeedGrid";

interface UserProfilePostsProps {
  // 'posts' prop is now PaginatedResponse<NormalizedPostFeedItem>
  posts: MappedUserProfile["posts"];
  isPostsPrivate: boolean;
  followStatus: FollowStatus;
  accessToken: string;
  onPostDeleted: (postId: string) => void;
  username: string;
}

export function UserProfilePosts({
  posts,
  isPostsPrivate,
  followStatus,
  accessToken,
  onPostDeleted,
  username,
}: UserProfilePostsProps) {
  
  // ✅ 2. ALL MAPPING LOGIC IS REMOVED.
  // 'posts.content' is already a 'NormalizedPostFeedItem[]'.

  return (
    <div className="p-6 border-t border-gray-200 dark:border-neutral-800">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          Posts
          <span className="px-3 py-1 text-sm font-semibold rounded-full bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-neutral-300">
            {posts.totalElements}
          </span>
        </h2>
      </div>

      {isPostsPrivate ? (
        // --- Private Profile View ---
        <div className="text-center py-16 bg-gray-50 dark:bg-neutral-800 rounded-xl border border-dashed border-gray-300 dark:border-neutral-700 shadow-inner">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gray-100 dark:bg-neutral-700 flex items-center justify-center">
            <Lock className="w-10 h-10 text-yellow-600 dark:text-yellow-400" />
          </div>
          <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">
            Private Profile
          </h3>
          <p className="text-gray-600 dark:text-neutral-400">
            {followStatus === "PENDING"
              ? "Your follow request is pending approval."
              : `Follow ${username} to see their posts.`}
          </p>
        </div>
      ) : posts.content.length > 0 ? (
        // --- Public Profile View: Use PostFeedGrid ---
        <PostFeedGrid
          isLoading={false} // Data is already loaded by the parent
          error={null}
          posts={posts.content} // ✅ 3. Pass 'posts.content' directly
          accessToken={accessToken}
          onPostDeleted={onPostDeleted}
          onRetry={() => {}} // Not needed here
        />
      ) : (
        // --- Public but No Posts View ---
        <div className="text-center py-16 text-gray-500 dark:text-neutral-400 bg-gray-50 dark:bg-neutral-800 rounded-xl border border-dashed border-gray-300 dark:border-neutral-700">
          <Eye className="w-10 h-10 mx-auto mb-4" />
          <p className="text-lg font-medium">
            This user hasn&apos;t posted anything yet.
          </p>
        </div>
      )}

      {/* "Load More" button (if needed) */}
      {posts.totalPages > 1 &&
        posts.page < posts.totalPages - 1 &&
        !isPostsPrivate && (
          <div className="text-center pt-6">
            <button className="px-6 py-2.5 text-sm font-semibold rounded-full bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-neutral-700 transition-all duration-200 shadow-md">
              Load More Posts
            </button>
          </div>
        )}
    </div>
  );
}
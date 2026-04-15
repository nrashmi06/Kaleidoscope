// src/components/user/UserProfilePosts.tsx
"use client";

import { FileText, Lock, Eye } from "lucide-react";
import { type MappedUserProfile, type FollowStatus } from "@/lib/types/userProfile";
import { PostFeedGrid } from "@/components/feed/PostFeedGrid";

interface UserProfilePostsProps {
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
  return (
    <div className="px-6 sm:px-8 pb-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-display font-bold text-navy dark:text-cream flex items-center gap-2">
          <FileText className="w-5 h-5 text-steel dark:text-sky" />
          Posts
          <span className="px-2.5 py-0.5 text-[11px] font-semibold rounded-full bg-steel/10 dark:bg-sky/10 text-steel dark:text-sky">
            {posts.totalElements}
          </span>
        </h2>
      </div>

      {isPostsPrivate ? (
        <div className="flex flex-col items-center justify-center text-center py-16 px-6 rounded-2xl border border-dashed border-cream-300 dark:border-navy-700 bg-cream-50/50 dark:bg-navy/50 backdrop-blur-sm">
          <div className="flex items-center justify-center w-14 h-14 rounded-full bg-amber-50 dark:bg-amber-900/20 border border-amber-200/60 dark:border-amber-800/40 mb-4">
            <Lock className="w-7 h-7 text-amber-600 dark:text-amber-400" />
          </div>
          <h3 className="text-base font-semibold text-navy dark:text-cream mb-1.5">
            Private Profile
          </h3>
          <p className="text-sm text-steel dark:text-sky/60">
            {followStatus === "PENDING"
              ? "Your follow request is pending approval."
              : `Follow ${username} to see their posts.`}
          </p>
        </div>
      ) : posts.content.length > 0 ? (
        <PostFeedGrid
          isLoading={false}
          error={null}
          posts={posts.content}
          accessToken={accessToken}
          onPostDeleted={onPostDeleted}
          onRetry={() => {}}
        />
      ) : (
        <div className="flex flex-col items-center justify-center text-center py-16 px-6 rounded-2xl border border-dashed border-cream-300 dark:border-navy-700 bg-cream-50/50 dark:bg-navy/50 backdrop-blur-sm">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-cream-300/50 dark:bg-navy-700/50 border border-cream-400/40 dark:border-navy-600/40 mb-4">
            <Eye className="w-6 h-6 text-steel dark:text-sky/60" />
          </div>
          <h3 className="text-base font-semibold text-navy dark:text-cream mb-1.5">
            No Posts Yet
          </h3>
          <p className="text-sm text-steel dark:text-sky/60">
            This user hasn&apos;t posted anything yet.
          </p>
        </div>
      )}

      {posts.totalPages > 1 &&
        posts.page < posts.totalPages - 1 &&
        !isPostsPrivate && (
          <div className="text-center pt-6">
            <button className="px-6 py-2 text-sm font-semibold rounded-xl bg-steel/10 dark:bg-sky/10 text-steel dark:text-sky hover:bg-steel/20 dark:hover:bg-sky/20 transition-all cursor-pointer">
              Load More Posts
            </button>
          </div>
        )}
    </div>
  );
}

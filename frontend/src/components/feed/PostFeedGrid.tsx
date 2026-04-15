// src/components/feed/PostFeedGrid.tsx
"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import PostLoader from "@/components/loading/PostLoader";
import { SocialPostCard } from "@/components/feed/SocialPostCard";
import { AlertCircle, Inbox } from "lucide-react";

// --- FIX IS HERE ---
// We import the types used by the feed (NormalizedPostFeedItem) and the adapter function
import {
  type NormalizedPostFeedItem,
  mapFeedItemToPost,
} from "@/lib/types/postFeed";
// We import the 'Post' type from its original source file
import { type Post } from "@/lib/types/post";
// --- END OF FIX ---

interface PostFeedGridProps {
  isLoading: boolean;
  error: string | null;
  posts: NormalizedPostFeedItem[];
  accessToken: string;
  onPostDeleted: (postId: string) => void;
  onRetry: () => void;
}

export function PostFeedGrid({
  isLoading,
  error,
  posts,
  accessToken,
  onPostDeleted,
  onRetry,
}: PostFeedGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {Array.from({ length: 6 }).map((_, i) => (
          <PostLoader key={i} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-16 px-6 rounded-2xl border border-red-200/60 dark:border-red-900/30 bg-red-50/50 dark:bg-red-950/10 backdrop-blur-sm">
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/20 border border-red-200/60 dark:border-red-800/40 mb-4">
          <AlertCircle className="w-6 h-6 text-red-500" />
        </div>
        <h3 className="text-base font-display font-semibold text-red-700 dark:text-red-300 mb-1.5">
          Failed to Load Feed
        </h3>
        <p className="text-sm text-red-600/80 dark:text-red-400/80 mb-5 max-w-sm">{error}</p>
        <Button onClick={onRetry} variant="destructive" size="sm">
          Try Again
        </Button>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-16 px-6 rounded-2xl border border-dashed border-cream-300 dark:border-navy-700 bg-cream-50/50 dark:bg-navy/50 backdrop-blur-sm">
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-cream-300/50 dark:bg-navy-700/50 border border-cream-400/40 dark:border-navy-600/40 mb-4">
          <Inbox className="w-6 h-6 text-steel dark:text-sky/60" />
        </div>
        <h3 className="text-base font-display font-semibold text-navy dark:text-cream mb-1.5">
          No Posts Found
        </h3>
        <p className="text-sm text-steel dark:text-sky/60">
          Try adjusting your filters or check back later.
        </p>
      </div>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        layout
        className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5"
      >
        {posts.map((postItem, index) => {
          const adaptedPost: Post = mapFeedItemToPost(postItem);

          return (
            <motion.div
              key={postItem.postId}
              layout
              initial={{ opacity: 0, y: 24, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -16, scale: 0.97 }}
              transition={{ duration: 0.35, delay: index * 0.04, ease: "easeOut" }}
            >
              <SocialPostCard
                post={adaptedPost}
                accessToken={accessToken}
                onPostDeleted={onPostDeleted}
              />
            </motion.div>
          );
        })}
      </motion.div>
    </AnimatePresence>
  );
}
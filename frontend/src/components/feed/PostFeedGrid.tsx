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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <PostLoader key={i} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-20 px-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <h3 className="text-xl font-semibold text-red-700 dark:text-red-300 mb-2">
          Failed to Load Feed
        </h3>
        <p className="text-red-600 dark:text-red-400 mb-6">{error}</p>
        <Button onClick={onRetry} variant="destructive">
          Try Again
        </Button>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-20 px-6 bg-gray-50 dark:bg-neutral-800/50 border border-dashed border-gray-200 dark:border-neutral-700 rounded-lg">
        <Inbox className="w-12 h-12 text-gray-400 dark:text-gray-500 mb-4" />
        <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
          No Posts Found
        </h3>
        <p className="text-gray-500 dark:text-gray-400">
          Try adjusting your filters or check back later.
        </p>
      </div>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        layout
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {posts.map((postItem, index) => {
          // Adapt the new feed item to the existing Post card type
          const adaptedPost: Post = mapFeedItemToPost(postItem);

          return (
            <motion.div
              key={postItem.postId}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
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
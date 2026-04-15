// src/components/feed/PostFeedGrid.tsx
"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import PostLoader from "@/components/loading/PostLoader";
import { SocialPostCard } from "@/components/feed/SocialPostCard";
import { AlertCircle, Inbox } from "lucide-react";

import {
  type NormalizedPostFeedItem,
  mapFeedItemToPost,
} from "@/lib/types/postFeed";
import { type Post } from "@/lib/types/post";

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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-10">
        {Array.from({ length: 6 }).map((_, i) => (
          <PostLoader key={i} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-20 px-6">
        <div className="flex items-center justify-center w-14 h-14 rounded-full bg-red-50 dark:bg-red-950/20 mb-5">
          <AlertCircle className="w-6 h-6 text-red-500 dark:text-red-400" />
        </div>
        <h3 className="text-lg font-display font-semibold text-heading mb-2">
          Something went wrong
        </h3>
        <p className="text-sm text-steel/50 dark:text-sky/35 mb-6 max-w-sm">
          {error}
        </p>
        <Button onClick={onRetry} variant="destructive" size="sm" className="rounded-full px-6">
          Try Again
        </Button>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-20 px-6">
        <div className="flex items-center justify-center w-14 h-14 rounded-full bg-cream-300/30 dark:bg-navy-700/30 mb-5">
          <Inbox className="w-6 h-6 text-steel/40 dark:text-sky/30" />
        </div>
        <h3 className="text-lg font-display font-semibold text-heading mb-2">
          No Posts Yet
        </h3>
        <p className="text-sm text-steel/50 dark:text-sky/35">
          Try adjusting your filters or check back later.
        </p>
      </div>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        layout
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-10"
      >
        {posts.map((postItem, index) => {
          const adaptedPost: Post = mapFeedItemToPost(postItem);

          return (
            <motion.div
              key={postItem.postId}
              layout
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{
                duration: 0.5,
                delay: index * 0.06,
                ease: [0.25, 0.1, 0.25, 1],
              }}
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

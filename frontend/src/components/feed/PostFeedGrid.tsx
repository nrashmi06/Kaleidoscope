// src/components/feed/PostFeedGrid.tsx
"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
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

const SKELETON_HEIGHTS = ["h-52", "h-72", "h-60", "h-80", "h-48", "h-64", "h-56", "h-44", "h-68", "h-76", "h-58", "h-42"];

function useColumnCount(): number {
  const [cols, setCols] = useState(2);
  useEffect(() => {
    const update = () => {
      if (window.innerWidth >= 1024) setCols(4);
      else if (window.innerWidth >= 640) setCols(3);
      else setCols(2);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  return cols;
}

export function PostFeedGrid({
  isLoading,
  error,
  posts,
  accessToken,
  onPostDeleted,
  onRetry,
}: PostFeedGridProps) {
  const colCount = useColumnCount();

  if (isLoading) {
    return (
      <div className="columns-2 sm:columns-3 lg:columns-4 gap-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className={`break-inside-avoid mb-4 rounded-2xl bg-cream-300/30 dark:bg-navy-700/30 animate-pulse ${SKELETON_HEIGHTS[i % SKELETON_HEIGHTS.length]}`}
          />
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

  // Distribute posts into columns round-robin so items fill left→right
  const columns: NormalizedPostFeedItem[][] = Array.from({ length: colCount }, () => []);
  posts.forEach((post, i) => columns[i % colCount].push(post));

  // Global index for staggered animation delay
  let globalIndex = 0;

  return (
    <AnimatePresence>
      <div className="flex items-stretch gap-4">
        {columns.map((col, colIdx) => (
          <div key={colIdx} className="flex flex-col flex-1 gap-4">
            {col.map((postItem) => {
              const adaptedPost: Post = mapFeedItemToPost(postItem);
              const delay = globalIndex++ * 0.04;
              return (
                <motion.div
                  key={postItem.postId}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4, delay, ease: [0.25, 0.1, 0.25, 1] }}
                >
                  <SocialPostCard
                    post={adaptedPost}
                    accessToken={accessToken}
                    onPostDeleted={onPostDeleted}
                  />
                </motion.div>
              );
            })}
            {/* Spacer pushes all column bottoms to the same baseline */}
            <div className="flex-1" />
          </div>
        ))}
      </div>
    </AnimatePresence>
  );
}

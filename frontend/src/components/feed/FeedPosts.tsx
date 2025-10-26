"use client";

import React, { useEffect, useRef } from "react";
import { SocialPostCard } from "@/components/feed/SocialPostCard";
import { Post } from "@/services/post/fetchPosts";
import { useAccessToken } from "@/hooks/useAccessToken";

interface FeedPostsProps {
  posts: Post[];
  isLoading: boolean;
  hasMorePosts: boolean;
  loadMorePosts: () => void;
  handlePostDeleted: (id: string) => void;
}

export default function FeedPosts({
  posts,
  isLoading,
  hasMorePosts,
  loadMorePosts,
  handlePostDeleted,
}: FeedPostsProps) {
  const accessToken = useAccessToken();
  const containerRef = useRef<HTMLDivElement>(null);

  // Infinite scroll
  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current || isLoading || !hasMorePosts) return;

      const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
      if (scrollTop + clientHeight >= scrollHeight - 200) {
        loadMorePosts();
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener("scroll", handleScroll);
    }

    return () => {
      if (container) container.removeEventListener("scroll", handleScroll);
    };
  }, [isLoading, hasMorePosts, loadMorePosts]);

  return (
    <div
      ref={containerRef}
      className="overflow-auto max-h-[70vh] space-y-4 scrollbar-none"
      style={{
        scrollbarWidth: "none", // Firefox
      }}
    >
      {posts.map((post) => (
        <SocialPostCard
          key={post.postId}
          post={post}
          onPostDeleted={handlePostDeleted}
          accessToken={accessToken}
        />
      ))}

      {isLoading && (
        <div className="flex justify-center py-4 text-gray-500">Loading posts...</div>
      )}

      {!hasMorePosts && posts.length > 0 && (
        <div className="flex justify-center py-4 text-gray-500 text-sm">
          All posts loaded ({posts.length} total)
        </div>
      )}

      <style jsx>{`
        div::-webkit-scrollbar {
          display: none; /* Chrome, Safari */
        }
      `}</style>
    </div>
  );
}

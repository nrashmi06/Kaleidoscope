"use client";

import React, { useEffect } from "react";
import { SocialPostCard } from "@/components/feed/SocialPostCard";
import { Post } from "@/services/post/fetchPosts";
import { useAccessToken } from "@/hooks/useAccessToken";
import PostLoader from "../loading/PostLoader";

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
  // No containerRef needed as we are using the window for scrolling

  // Infinite scroll
  useEffect(() => {
    const handleScroll = () => {
      // Check isLoading and hasMorePosts first
      if (isLoading || !hasMorePosts) return;

      // Get scroll values from the window and document
      const scrollTop = window.scrollY;
      const clientHeight = window.innerHeight;
      const scrollHeight = document.documentElement.scrollHeight;

      // Trigger loadMorePosts when near the bottom of the page
      if (scrollTop + clientHeight >= scrollHeight - 200) {
        loadMorePosts();
      }
    };

    // Add/remove the listener from the 'window' object
    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [isLoading, hasMorePosts, loadMorePosts]);

  return (
    // The div is now just a simple container, no scrolling or height classes
    <div className="space-y-4">

      {posts.map((post) => (
        <SocialPostCard
          key={post.postId}
          post={post}
          onPostDeleted={handlePostDeleted}
          accessToken={accessToken}
        />
      ))}

      {isLoading && (
        <>
          <PostLoader />
          <PostLoader />
          <PostLoader />
        </>
      )}

      {!hasMorePosts && posts.length > 0 && (
        <div className="flex justify-center py-4 text-gray-500 text-sm">
          All posts loaded ({posts.length} total)
        </div>
      )}
    </div>
  );
}
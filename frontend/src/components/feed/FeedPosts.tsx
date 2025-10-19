"use client";

import React from "react";
import { SocialPostCard } from "@/components/feed/SocialPostCard";
import { Post } from "@/services/post/fetchPosts";

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
  if (isLoading)
    return (
      <div className="flex justify-center items-center py-8">
        <div className="text-gray-500">Loading posts...</div>
      </div>
    );

  if (!isLoading && posts.length === 0)
    return (
      <div className="flex justify-center items-center py-8">
        <div className="text-gray-500">No posts found</div>
      </div>
    );

  return (
    <>
      {posts.map((post) => (
        <SocialPostCard key={post.postId} post={post} onPostDeleted={handlePostDeleted} />
      ))}

      {hasMorePosts ? (
        <div className="flex justify-center py-6">
          <button
            onClick={loadMorePosts}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Load More Posts
          </button>
        </div>
      ) : (
        <div className="flex justify-center py-6">
          <div className="text-gray-500 text-sm">
            All posts loaded ({posts.length} total)
          </div>
        </div>
      )}
    </>
  );
}

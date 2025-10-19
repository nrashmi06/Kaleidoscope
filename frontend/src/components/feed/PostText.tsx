"use client";
import { Post } from "@/services/post/fetchPosts";

export function PostText({ post }: { post: Post }) {
  return (
    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{post.summary}</p>
  );
}

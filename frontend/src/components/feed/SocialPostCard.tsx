"use client";
import { Post } from "@/services/post/fetchPosts";
import { useState } from "react";
import { deletePostController } from "@/controllers/postController/deletePost";
import { PostHeader } from "./PostHeader";
import { PostMedia } from "./PostMedia";
import { PostText } from "./PostText";
import { PostTaggedUsers } from "./PostTaggedUsers";
import { PostActions } from "./PostActions";

interface SocialPostCardProps {
  post: Post;
  onPostDeleted?: (postId: string) => void;
}

export function SocialPostCard({ post, onPostDeleted }: SocialPostCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const canDeletePost = true;

  const handleDelete = async () => {
    if (!canDeletePost || isDeleting) return;
    const confirmDelete = window.confirm("Are you sure you want to delete this post?");
    if (!confirmDelete) return;

    setIsDeleting(true);
    try {
      console.log('Deleting post', post.postId);
      onPostDeleted?.(post.postId.toString());
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="w-full max-w-full mx-auto bg-white dark:bg-neutral-900 rounded-lg shadow-sm border border-gray-200 dark:border-neutral-800 relative">
      <PostHeader post={post} canDelete={canDeletePost} onDelete={handleDelete} />
      <div className="px-4 pb-4 space-y-4">
        <PostMedia post={post} />
        <PostText post={post} />
        <PostTaggedUsers post={post} />
        <PostActions post={post} />
      </div>
    </div>
  );
}

"use client";
import { useState, useCallback, memo } from "react";
import { Post } from "@/services/post/fetchPosts";
import { deletePostController } from "@/controllers/postController/deletePost";
import { PostHeader } from "./socialMediaPostCardComponents/PostHeader";
import { PostMedia } from "./socialMediaPostCardComponents/PostMedia";
import { PostText } from "./socialMediaPostCardComponents/PostText";
import { PostTaggedUsers } from "./socialMediaPostCardComponents/PostTaggedUsers";
import { PostActions } from "./socialMediaPostCardComponents/PostActions";
import  CommentDropdown  from "./socialMediaPostCardComponents/CommentDropdown";

interface SocialPostCardProps {
  post: Post;
  onPostDeleted?: (postId: string) => void;
  accessToken: string;
}

function SocialPostCardComponent({ post, onPostDeleted, accessToken }: SocialPostCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const canDeletePost = true; // replace later with role/ownership logic

  const handleDelete = useCallback(async () => {
    if (!canDeletePost || isDeleting) return;
    const confirmDelete = window.confirm("Are you sure you want to delete this post?");
    if (!confirmDelete) return;

    setIsDeleting(true);
    try {
      const result = await deletePostController(accessToken, post.postId, false);
      if (result.success) {
        console.log("Post deleted successfully:", post.postId);
        onPostDeleted?.(post.postId.toString());
      } else {
        console.error("Failed to delete post:", result.error);
        alert(result.error);
      }
    } catch (err) {
      console.error("Error deleting post:", err);
      alert("An error occurred while deleting the post.");
    } finally {
      setIsDeleting(false);
    }
  }, [accessToken, post.postId, onPostDeleted, isDeleting, canDeletePost]);

  return (
    <div className="w-full max-w-full mx-auto bg-white dark:bg-neutral-900 rounded-lg shadow-sm border border-gray-200 dark:border-neutral-800 relative">
      <PostHeader post={post} canDelete={canDeletePost} onDelete={handleDelete} isDeleting={isDeleting} />
      <div className="px-4 pb-4 space-y-4">
        <PostMedia post={post} />
        <PostText post={post} />
        <PostTaggedUsers post={post} />
        <p className="mb-0 mt-0">
          <PostActions postId={post.postId} />
        </p>
        <CommentDropdown postId={post.postId} />
      </div>
    </div>
  );
}

export const SocialPostCard = memo(SocialPostCardComponent);

"use client";
import { useState, useCallback, memo } from "react";
import { Post } from "@/services/post/fetchPosts";
import { deletePostController } from "@/controllers/postController/deletePost";
import { useUserData } from "@/hooks/useUserData";
import { PostHeader } from "./socialMediaPostCardComponents/PostHeader";
import { PostMedia } from "./socialMediaPostCardComponents/PostMedia";
import { PostText } from "./socialMediaPostCardComponents/PostText";
import { PostTaggedUsers } from "./socialMediaPostCardComponents/PostTaggedUsers";
import { PostActions } from "./socialMediaPostCardComponents/PostActions";
import  CommentDropdown  from "./socialMediaPostCardComponents/CommentDropdown";
import { PostModal } from "@/components/ui/PostModal";
import { Eye } from "lucide-react";

interface SocialPostCardProps {
  post: Post;
  onPostDeleted?: (postId: string) => void;
  accessToken: string;
}

function SocialPostCardComponent({ post, onPostDeleted, accessToken }: SocialPostCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const currentUser = useUserData();

  // Only allow delete if current user is ADMIN or the author of the post
  const canDeletePost =
    !!currentUser && (currentUser.role === "ADMIN" || currentUser.userId === post.author.userId);

  const handleDelete = useCallback(async () => {
    if (!canDeletePost || isDeleting) return;
    const confirmDelete = window.confirm("Are you sure you want to delete this post?");
    if (!confirmDelete) return;

    setIsDeleting(true);
    try {
      const result = await deletePostController(accessToken, post.postId);
      if (result.success) {
        console.log("Post deleted successfully:", post.postId);
        onPostDeleted?.(post.postId.toString());
      } else {
        console.error("Failed to delete post:", result.message);
        alert(result.message || "Failed to delete post");
      }
    } catch (err) {
      console.error("Error deleting post:", err);
      alert("An error occurred while deleting the post.");
    } finally {
      setIsDeleting(false);
    }
  }, [accessToken, post.postId, onPostDeleted, isDeleting, canDeletePost]);

  return (
    <>
      <div className="w-full max-w-full mx-auto bg-white dark:bg-neutral-900 rounded-lg shadow-sm border border-gray-200 dark:border-neutral-800 relative">
        <PostHeader post={post} canDelete={canDeletePost} onDelete={handleDelete} isDeleting={isDeleting} />
        <div className="px-4 pb-4 space-y-4">
          <PostMedia post={post} />
          <PostText post={post} />
          <PostTaggedUsers post={post} />
          
          {/* View Details Button */}
          <div className="flex justify-between items-center">
            <button
              onClick={() => setShowDetailModal(true)}
              className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors duration-200"
            >
              <Eye className="w-4 h-4 mr-1.5" />
              View Details
            </button>
          </div>

          <div className="mb-0 mt-0">
            <PostActions postId={post.postId} />
          </div>
          <CommentDropdown postId={post.postId} />
        </div>
      </div>

      {/* Post Detail Modal */}
      <PostModal
        postId={post.postId}
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        accessToken={accessToken}
      />
    </>
  );
}

export const SocialPostCard = memo(SocialPostCardComponent);

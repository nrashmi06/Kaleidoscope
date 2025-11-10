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
import CommentDropdown from "./socialMediaPostCardComponents/CommentDropdown";
import { PostModal } from "@/components/ui/PostModal";
import { Eye, MessageCircle, ChevronDown, ChevronUp } from "lucide-react";

interface SocialPostCardProps {
  post: Post;
  onPostDeleted?: (postId: string) => void;
  accessToken: string;
}

function SocialPostCardComponent({ post, onPostDeleted, accessToken }: SocialPostCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showComments, setShowComments] = useState(false);
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
      <article className="w-full max-w-full mx-auto bg-white dark:bg-neutral-900 rounded-xl shadow-md hover:shadow-xl border border-gray-200 dark:border-neutral-800 transition-all duration-300 overflow-hidden">
        {/* Header */}
        <div className="bg-blue-50 dark:bg-blue-950/20 border-b border-gray-200 dark:border-neutral-800">
          <PostHeader 
            post={post} 
            canDelete={canDeletePost} 
            onDelete={handleDelete} 
            isDeleting={isDeleting} 
          />
        </div>

        {/* Content */}
        <div className="px-4 sm:px-6 pb-4">
          {/* Text Content */}
          <div className="mb-4 mt-4">
            <PostText post={post} />
          </div>

          {/* Media */}
          <div className="mb-4 -mx-2 sm:-mx-4">
            <PostMedia post={post} />
          </div>

          {/* Tagged Users */}
          {post.taggedUsers && post.taggedUsers.length > 0 && (
            <div className="mb-4 pb-4 border-b border-gray-200 dark:border-neutral-800">
              <PostTaggedUsers post={post} />
            </div>
          )}

          {/* Actions - Likes, Hearts, etc. */}
          <div className="mb-4">
            <PostActions postId={post.postId} />
          </div>

          {/* Action Buttons Row - Responsive */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 mb-4">
            <button
              onClick={() => setShowComments(!showComments)}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 sm:py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 bg-gray-100 dark:bg-neutral-800 hover:bg-blue-50 dark:hover:bg-blue-950/30 rounded-lg transition-all duration-200 group border border-gray-200 dark:border-neutral-700"
            >
              <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5 group-hover:scale-110 transition-transform" />
              <span className="text-sm sm:text-base">{showComments ? 'Hide' : 'Show'} Comments</span>
              {showComments ? (
                <ChevronUp className="w-4 h-4 ml-auto sm:ml-0" />
              ) : (
                <ChevronDown className="w-4 h-4 ml-auto sm:ml-0" />
              )}
            </button>
            
            <button
              onClick={() => setShowDetailModal(true)}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 sm:py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 rounded-lg transition-all duration-200 group shadow-sm hover:shadow-md"
            >
              <Eye className="w-4 h-4 sm:w-5 sm:h-5 group-hover:scale-110 transition-transform" />
              <span className="text-sm sm:text-base">View Details</span>
            </button>
          </div>

          {/* Comments Section with smooth animation */}
          {showComments && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-neutral-800 animate-in slide-in-from-top-2 duration-300">
              <CommentDropdown postId={post.postId} />
            </div>
          )}
        </div>
      </article>

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
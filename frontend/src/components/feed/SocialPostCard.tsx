"use client";

import { useState, useCallback, memo } from "react";
import { type Post } from "@/lib/types/post"; // Correct type import
import { deletePostController } from "@/controllers/postController/deletePost";
import { useUserData } from "@/hooks/useUserData";
import { PostHeader } from "./socialMediaPostCardComponents/PostHeader";
import { PostMedia } from "./socialMediaPostCardComponents/PostMedia";
import { PostTaggedUsers } from "./socialMediaPostCardComponents/PostTaggedUsers";
import { PostModal } from "@/components/ui/PostModal";
import { Eye } from "lucide-react";

// Types
interface SocialPostCardProps {
  post: Post;
  onPostDeleted?: (postId: string) => void;
  accessToken: string;
}

// --- Component ---

function SocialPostCardComponent({
  post,
  onPostDeleted,
  accessToken,
}: SocialPostCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const currentUser = useUserData();

  const canDeletePost =
    !!currentUser &&
    (currentUser.role === "ADMIN" || currentUser.userId === post.author.userId);

  // --- Handlers ---

  const handleDelete = useCallback(async () => {
    if (!canDeletePost || isDeleting) return;

    // This part is clean. The confirmation is handled by PostHeader.
    setIsDeleting(true);
    try {
      const result = await deletePostController(accessToken, post.postId);
      if (result.success) {
        console.log("Post deleted successfully:", post.postId);
        onPostDeleted?.(post.postId.toString());
      } else {
        console.error("Failed to delete post:", result.message);
      }
    } catch (err) {
      console.error("Error deleting post:", err);
    } finally {
      setIsDeleting(false);
    }
  }, [accessToken, post.postId, onPostDeleted, isDeleting, canDeletePost]);

  // --- Render ---

  return (
    <>
      {/* Card with fixed height */}
      <article className="w-full max-w-full mx-auto bg-white dark:bg-neutral-900 rounded-xl shadow-md hover:shadow-xl border border-gray-200 dark:border-neutral-800 transition-all duration-300 overflow-hidden flex flex-col h-[520px]">
        {/* === 1. Header === */}
        <div className="bg-blue-50 dark:bg-blue-950/20 border-b border-gray-200 dark:border-neutral-800">
          <PostHeader
            post={post}
            canDelete={canDeletePost}
            onDelete={handleDelete} // This function is now 100% popup-free
            isDeleting={isDeleting}
          />
        </div>

        {/* === 2. Media === */}
        <div className="w-full">
          <PostMedia post={post} />
        </div>

        {/* === 3. Content === */}
        <div className="p-4 sm:p-6 flex-1 flex flex-col overflow-hidden">
          
          {/* ✅ FIX: Added 'custom-scrollbar' class */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {/* Summary Text */}
            <div className="mb-4">
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                <span className="font-semibold text-gray-900 dark:text-white mr-1.5">
                  {post.author.username}
                </span>
                {post.summary}
              </p>
            </div>

            {/* Tagged Users */}
            {post.taggedUsers && post.taggedUsers.length > 0 && (
              <div className="mb-4">
                <PostTaggedUsers post={post} />
              </div>
            )}
          </div>
          {/* --- End of new scrollable wrapper --- */}

          {/* View Details Button */}
          <div className="mt-4 flex-shrink-0">
            <button
              onClick={() => setShowDetailModal(true)}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded-lg transition-all duration-200 group border border-blue-200 dark:border-blue-900/50"
            >
              <Eye className="w-4 h-4 sm:w-5 sm:h-5 group-hover:scale-110 transition-transform" />
              <span className="text-sm sm:text-base">
                View Full Post
              </span>
            </button>
          </div>
        </div>
      </article>

      {/* === 4. Post Detail Modal === */}
      <PostModal
        postId={post.postId}
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        accessToken={accessToken}
        currentUserId={currentUser.userId}
      />
    </>
  );
}

// Memoize the component
export const SocialPostCard = memo(SocialPostCardComponent);
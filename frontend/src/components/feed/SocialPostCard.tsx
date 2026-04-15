"use client";

import { useState, useCallback, useRef, useEffect, memo } from "react";
import Image from "next/image";
import { type Post } from "@/lib/types/post";
import { deletePostController } from "@/controllers/postController/deletePost";
import { hardDeletePostController } from "@/controllers/postController/hardDeletePostController";
import { useUserData } from "@/hooks/useUserData";
import { PostMedia } from "./socialMediaPostCardComponents/PostMedia";
import { PostTaggedUsers } from "./socialMediaPostCardComponents/PostTaggedUsers";
import { PostModal } from "@/components/ui/PostModal";
import DeleteConfirmationModal from "@/components/common/DeleteConfirmationModal";
import { Eye, MoreVertical, Trash2, Pencil, ShieldAlert } from "lucide-react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { toast } from "react-hot-toast";

interface SocialPostCardProps {
  post: Post;
  onPostDeleted?: (postId: string) => void;
  accessToken: string;
}

function SocialPostCardComponent({
  post,
  onPostDeleted,
  accessToken,
}: SocialPostCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isHardDeleting, setIsHardDeleting] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const currentUser = useUserData();

  const canDeletePost =
    !!currentUser &&
    (currentUser.role === "ADMIN" || currentUser.userId === post.author.userId);

  const isPostAuthor =
    !!currentUser && currentUser.userId === post.author.userId;

  const timeAgo = formatDistanceToNow(new Date(post.createdAt), {
    addSuffix: true,
  });

  const handleDelete = useCallback(async () => {
    if (!canDeletePost || isDeleting) return;
    setIsDeleting(true);
    try {
      const result = await deletePostController(accessToken, post.postId);
      if (result.success) {
        onPostDeleted?.(post.postId.toString());
      }
    } catch (err) {
      console.error("Error deleting post:", err);
    } finally {
      setIsDeleting(false);
    }
  }, [accessToken, post.postId, onPostDeleted, isDeleting, canDeletePost]);

  const handleHardDelete = useCallback(async () => {
    if (!currentUser || currentUser.role !== "ADMIN" || isHardDeleting) return;

    const confirmed = window.confirm(
      "This will permanently delete this post. This action cannot be undone. Continue?"
    );
    if (!confirmed) return;

    setIsHardDeleting(true);
    try {
      const result = await hardDeletePostController(accessToken, post.postId);
      if (result.success) {
        toast.success("Post permanently deleted.");
        onPostDeleted?.(post.postId.toString());
      } else {
        toast.error(result.message || "Failed to hard delete post.");
      }
    } catch (err) {
      console.error("Error hard deleting post:", err);
      toast.error("An unexpected error occurred.");
    } finally {
      setIsHardDeleting(false);
    }
  }, [accessToken, post.postId, onPostDeleted, isHardDeleting, currentUser]);

  useEffect(() => {
    if (!isMenuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isMenuOpen]);

  return (
    <>
      <article className="group relative w-full rounded-2xl overflow-hidden h-[480px] bg-cream-50 dark:bg-navy border border-cream-300/40 dark:border-navy-700/40 shadow-sm hover:shadow-xl hover:shadow-steel/[0.08] dark:hover:shadow-sky/[0.06] transition-all duration-300 hover:-translate-y-1">
        {/* ── Image Section (55%) ── */}
        <div
          className="relative w-full overflow-hidden"
          style={{ height: "55%" }}
        >
          <div className="absolute inset-0">
            <PostMedia post={post} fillContainer />
          </div>

          {/* Gradient overlay for text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/5 to-black/25 pointer-events-none" />

          {/* Author info overlay */}
          <div className="absolute bottom-20 left-4 z-10 flex items-center gap-2.5">
            <div
              onClick={() => router.push(`/profile/${post.author.userId}`)}
              className="relative w-9 h-9 rounded-full overflow-hidden ring-2 ring-white/25 bg-navy-700 flex-shrink-0 cursor-pointer hover:ring-white/50 transition-all"
            >
              <Image
                src={post.author.profilePictureUrl || "/default-avatar.png"}
                alt={post.author.username}
                fill
                className="object-cover"
                sizes="36px"
              />
            </div>
            <div>
              <span
                onClick={() => router.push(`/profile/${post.author.userId}`)}
                className="font-display font-semibold text-sm text-white drop-shadow-sm cursor-pointer hover:underline"
              >
                {post.author.username}
              </span>
              <p className="text-[11px] text-white/70 drop-shadow-sm">
                {timeAgo}
              </p>
            </div>
          </div>

          {/* Menu — only for own posts */}
          {canDeletePost && (
            <div className="absolute top-3 right-3 z-10" ref={menuRef}>
              <button
                onClick={() => setIsMenuOpen((p) => !p)}
                className="p-1.5 rounded-lg bg-black/30 hover:bg-black/50 text-white/80 hover:text-white backdrop-blur-sm transition-all cursor-pointer"
              >
                <MoreVertical className="w-4 h-4" />
              </button>
              {isMenuOpen && (
                <div className="absolute right-0 top-full mt-1 w-52 bg-cream-50 dark:bg-navy border border-cream-300 dark:border-navy-700 rounded-xl shadow-lg shadow-navy/10 dark:shadow-black/30 z-20 py-1 backdrop-blur-sm">
                  {isPostAuthor && (
                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        router.push(`/post/${post.postId}/edit`);
                      }}
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-navy dark:text-cream hover:bg-cream-300/40 dark:hover:bg-navy-700/40 rounded-lg transition-colors cursor-pointer"
                    >
                      <Pencil className="w-4 h-4" />
                      Edit Post
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      setIsDeleteModalOpen(true);
                    }}
                    disabled={isDeleting}
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                    {isDeleting ? "Deleting..." : "Delete Post"}
                  </button>
                  {currentUser?.role === "ADMIN" && (
                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        handleHardDelete();
                      }}
                      disabled={isHardDeleting}
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      <ShieldAlert className="w-4 h-4" />
                      {isHardDeleting ? "Deleting..." : "Hard Delete (Permanent)"}
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Wave SVG Divider ── */}
        <svg
          className="absolute left-0 w-full z-[5] pointer-events-none"
          style={{ top: "calc(55% - 80px)", height: "130px" }}
          viewBox="0 0 800 500"
          preserveAspectRatio="none"
        >
          <path
            d="M 0 30 C 150 30 250 200 400 200 S 650 30 800 30 L 800 500 L 0 500"
            className="fill-cream-50 dark:fill-navy"
          />
          <path
            d="M 0 30 C 150 30 250 200 400 200 S 650 30 800 30"
            className="stroke-cream dark:stroke-cream/80"
            fill="none"
            strokeWidth="6"
            strokeLinecap="round"
          />
        </svg>

        {/* ── Content Section (45%) ── */}
        <div
          className="relative z-[6] flex flex-col px-5 pb-4"
          style={{ height: "45%" }}
        >
          <div className="flex-1 overflow-y-auto custom-scrollbar min-h-0 pt-1">
            <p className="text-sm text-navy/80 dark:text-cream/80 leading-relaxed">
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  router.push(`/profile/${post.author.userId}`);
                }}
                className="font-semibold text-navy dark:text-cream mr-1.5 cursor-pointer hover:underline hover:text-steel dark:hover:text-sky transition-colors"
              >
                {post.author.username}
              </span>
              {post.summary}
            </p>
            {post.taggedUsers && post.taggedUsers.length > 0 && (
              <div className="mt-2">
                <PostTaggedUsers post={post} />
              </div>
            )}
          </div>

          <button
            onClick={() => setShowDetailModal(true)}
            className="mt-3 flex-shrink-0 w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl transition-all duration-200 cursor-pointer bg-steel/10 dark:bg-sky/10 text-steel dark:text-sky border border-steel/20 dark:border-sky/20 hover:bg-steel/20 dark:hover:bg-sky/20 hover:border-steel/30 dark:hover:border-sky/30 group/btn"
          >
            <Eye className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
            View Full Post
          </button>
        </div>
      </article>

      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onCancel={() => setIsDeleteModalOpen(false)}
        onConfirm={() => {
          handleDelete();
          setIsDeleteModalOpen(false);
        }}
        title="Delete Post"
        message="Are you sure you want to delete this post? This action cannot be undone."
      />

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

export const SocialPostCard = memo(SocialPostCardComponent);

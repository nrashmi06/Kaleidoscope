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
import { MoreVertical, Trash2, Pencil, ShieldAlert } from "lucide-react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { parseUTC } from "@/lib/utils/parseUTC";
import { toast } from "react-hot-toast";

interface SocialPostCardProps {
  post: Post;
  onPostDeleted?: (postId: string) => void;
  accessToken: string;
}

const PIN_ASPECTS = [
  "aspect-[3/4]",
  "aspect-[4/5]",
  "aspect-[1/1]",
  "aspect-[4/3]",
  "aspect-[2/3]",
];

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

  const timeAgo = formatDistanceToNow(parseUTC(post.createdAt), {
    addSuffix: true,
  });

  const hasMedia =
    (post.mediaDetails && post.mediaDetails.length > 0) || post.thumbnailUrl;
  const aspectClass = PIN_ASPECTS[post.postId % PIN_ASPECTS.length];

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
      <article
        onClick={() => setShowDetailModal(true)}
        className="group relative w-full cursor-pointer"
      >
        {/* Pin image / text-only */}
        {hasMedia ? (
          <div
            className={`relative w-full ${aspectClass} overflow-hidden rounded-2xl bg-cream-300/20 dark:bg-navy-700/20`}
          >
            <div className="absolute inset-0 transition-transform duration-500 ease-out group-hover:scale-[1.03]">
              <PostMedia post={post} fillContainer />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
          </div>
        ) : (
          <div className="rounded-2xl bg-gradient-to-br from-cream-300/40 to-cream-200/20 dark:from-navy-700/50 dark:to-navy-600/20 p-5 min-h-[140px] flex flex-col justify-end">
            {post.title && (
              <h3 className="text-base font-bold text-heading leading-snug line-clamp-4">
                {post.title}
              </h3>
            )}
            {!post.title && post.summary && (
              <p className="text-sm text-sub leading-relaxed line-clamp-4">
                {post.summary}
              </p>
            )}
          </div>
        )}

        {/* Floating menu */}
        {canDeletePost && (
          <div
            className="absolute top-2.5 right-2.5 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            ref={menuRef}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsMenuOpen((p) => !p);
              }}
              className={`p-2 rounded-full backdrop-blur-md transition-all cursor-pointer ${
                hasMedia
                  ? "bg-black/20 hover:bg-black/40 text-white/80 hover:text-white"
                  : "bg-navy/10 hover:bg-navy/20 dark:bg-cream/10 dark:hover:bg-cream/20 text-sub hover:text-heading"
              }`}
            >
              <MoreVertical className="w-4 h-4" />
            </button>
            {isMenuOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-48 bg-cream-50/95 dark:bg-navy/95 backdrop-blur-xl border border-cream-300/60 dark:border-navy-700/60 rounded-2xl shadow-2xl shadow-navy/10 dark:shadow-black/30 z-20 py-1.5 overflow-hidden">
                {isPostAuthor && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsMenuOpen(false);
                      router.push(`/post/${post.postId}/edit`);
                    }}
                    className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-heading hover:bg-surface-hover transition-colors cursor-pointer"
                  >
                    <Pencil className="w-4 h-4 text-steel/60 dark:text-sky/40" />
                    Edit Post
                  </button>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsMenuOpen(false);
                    setIsDeleteModalOpen(true);
                  }}
                  disabled={isDeleting}
                  className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50/50 dark:hover:bg-red-950/20 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  {isDeleting ? "Deleting..." : "Delete Post"}
                </button>
                {currentUser?.role === "ADMIN" && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsMenuOpen(false);
                      handleHardDelete();
                    }}
                    disabled={isHardDeleting}
                    className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50/50 dark:hover:bg-red-950/20 transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    <ShieldAlert className="w-4 h-4" />
                    {isHardDeleting ? "Deleting..." : "Hard Delete"}
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Content below pin */}
        <div className="px-1 pt-2.5 pb-1 space-y-1">
          {hasMedia && post.title && (
            <h3 className="text-[13px] font-semibold text-heading leading-snug line-clamp-2">
              {post.title}
            </h3>
          )}
          {hasMedia && post.summary && (
            <p className="text-xs text-steel/50 dark:text-sky/35 leading-relaxed line-clamp-2">
              {post.summary}
            </p>
          )}

          {/* Author row */}
          <div className="flex items-center gap-2 pt-0.5">
            <div
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/profile/${post.author.userId}`);
              }}
              className="relative w-6 h-6 rounded-full overflow-hidden bg-cream-300/50 dark:bg-navy-700/50 flex-shrink-0 cursor-pointer"
            >
              <Image
                src={post.author.profilePictureUrl || "/default-avatar.png"}
                alt={post.author.username}
                fill
                className="object-cover"
                sizes="24px"
              />
            </div>
            <span
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/profile/${post.author.userId}`);
              }}
              className="text-xs font-medium text-sub truncate cursor-pointer hover:text-steel dark:hover:text-sky transition-colors"
            >
              {post.author.username}
            </span>
          </div>

          {/* Tagged users */}
          {post.taggedUsers && post.taggedUsers.length > 0 && (
            <div onClick={(e) => e.stopPropagation()}>
              <PostTaggedUsers post={post} />
            </div>
          )}
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

"use client";

import Image from "next/image";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MoreVertical, Trash2, Tag } from "lucide-react";
import { CommentItem as CommentType } from "@/lib/types/comment";
import { deleteCommentController } from "@/controllers/postInteractionController/deleteCommentController";
import { useAccessToken } from "@/hooks/useAccessToken";
import CommentActions from "./CommentActions";
import CommentBody from "@/components/feed/socialMediaPostCardComponents/comments/CommentBody";
import DeleteConfirmationModal from "@/components/common/DeleteConfirmationModal";
import CommentTagManager from "./CommentTagManager";

interface CommentItemProps {
  comment: CommentType;
  postId: number;
  currentUser?: {
    username: string;
    userId: number;
  };
  onDelete?: (commentId: number) => void;
  onTagDeleted?: (commentId: number) => void;
}

export default function CommentItem({
  comment,
  postId,
  currentUser,
  onDelete,
  onTagDeleted,
}: CommentItemProps) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showTagManager, setShowTagManager] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const accessToken = useAccessToken();

  const isAuthor =
    currentUser &&
    (currentUser.userId === comment.author.userId ||
      currentUser.username === comment.author.username);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        menuRef.current?.contains(e.target as Node) ||
        buttonRef.current?.contains(e.target as Node)
      ) {
        return;
      }
      setMenuOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const confirmDelete = async () => {
    if (!accessToken) return;

    setIsDeleting(true);
    try {
      const res = await deleteCommentController(
        postId,
        comment.commentId,
        accessToken
      );
      if (res.success) {
        onDelete?.(comment.commentId);
      } else {
        console.error("Failed to delete comment:", res.message);
      }
    } catch (err) {
      console.error("[CommentItem] Error deleting comment:", err);
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
      setMenuOpen(false);
    }
  };

  return (
    <>
      <article className="group flex items-start gap-3 p-3 bg-cream-50/80 dark:bg-navy-700/30 rounded-xl border border-cream-300/40 dark:border-navy-700/40 hover:shadow-sm transition-all duration-200">
        <Image
          src={comment.author.profilePictureUrl || "/default-avatar.png"}
          alt={`${comment.author.username}'s profile`}
          width={36}
          height={36}
          onClick={() => router.push(`/profile/${comment.author.userId}`)}
          className="w-9 h-9 rounded-full object-cover border border-cream-300 dark:border-navy-700 cursor-pointer hover:opacity-80 transition-opacity"
        />

        <div className="flex-1">
          <header className="flex items-start justify-between">
            <div>
              <div
                onClick={() => router.push(`/profile/${comment.author.userId}`)}
                className="text-sm font-semibold text-navy dark:text-cream cursor-pointer hover:underline hover:text-steel dark:hover:text-sky transition-colors"
              >
                {comment.author.username}
              </div>
              <time
                className="text-xs text-steel/50 dark:text-sky/30"
                dateTime={comment.createdAt}
              >
                {new Date(comment.createdAt).toLocaleString()}
              </time>
            </div>

            {isAuthor && (
              <div className="relative" ref={menuRef}>
                <button
                  ref={buttonRef}
                  onClick={() => setMenuOpen((prev) => !prev)}
                  className="p-1.5 rounded-full hover:bg-cream-300/40 dark:hover:bg-navy-700/40 transition"
                  aria-label="Comment options"
                >
                  <MoreVertical size={18} className="text-steel/60 dark:text-sky/40" />
                </button>

                {menuOpen && (
                  <div
                    className="absolute right-0 mt-2 w-40 bg-cream-50 dark:bg-navy
                               border border-cream-300 dark:border-navy-700
                               rounded-xl shadow-lg shadow-navy/10 dark:shadow-black/30 z-50 overflow-hidden py-1"
                  >
                    <button
                      onClick={() => {
                        setShowTagManager(true);
                        setMenuOpen(false);
                      }}
                      className="flex items-center gap-2 px-3 py-2 w-full text-left
                                 text-navy/70 dark:text-cream/60 hover:bg-cream-300/40
                                 dark:hover:bg-navy-700/40 text-sm transition"
                    >
                      <Tag size={14} />
                      Manage Tags
                    </button>

                    <button
                      onClick={() => {
                        setShowDeleteModal(true);
                        setMenuOpen(false);
                      }}
                      disabled={isDeleting}
                      className="flex items-center gap-2 px-3 py-2 w-full text-left
                                 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20
                                 text-sm transition disabled:opacity-50"
                    >
                      <Trash2 size={14} />
                      Delete Comment
                    </button>
                  </div>
                )}
              </div>
            )}
          </header>

          <CommentBody body={comment.body} tags={comment.tags} />

          <CommentActions postId={postId} commentId={comment.commentId} />
        </div>
      </article>

      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onConfirm={confirmDelete}
        onCancel={() => setShowDeleteModal(false)}
        isDeleting={isDeleting}
      />

      {showTagManager && (
        <CommentTagManager
          comment={comment}
          onClose={() => setShowTagManager(false)}
          onTagDeleted={() => onTagDeleted?.(comment.commentId)}
        />
      )}
    </>
  );
}

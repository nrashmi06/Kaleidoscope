"use client";

import Image from "next/image";
import { useState, useRef, useEffect } from "react";
import { MoreVertical, Trash2, Tag } from "lucide-react";
import { CommentItem as CommentType } from "@/lib/types/comment";
import { deleteCommentController } from "@/controllers/postInteractionController/deleteCommentController";
import { useAccessToken } from "@/hooks/useAccessToken";
import CommentActions from "./CommentActions";
import CommentBody from "@/components/feed/comments/CommentBody";
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

  // ✅ Close dropdown on outside click
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

  /** ✅ Delete Comment Handler */
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
      <article className="group flex items-start gap-3 p-3 bg-white dark:bg-neutral-900/40 rounded-xl border border-gray-100 dark:border-gray-800 hover:shadow-sm transition-all duration-200">
        <Image
          src={comment.author.profilePictureUrl || "/default-avatar.png"}
          alt={`${comment.author.username}'s profile`}
          width={36}
          height={36}
          className="w-9 h-9 rounded-full object-cover border border-gray-200 dark:border-gray-700"
        />

        <div className="flex-1">
          <header className="flex items-start justify-between">
            <div>
              <div className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                {comment.author.username}
              </div>
              <time
                className="text-xs text-gray-400 dark:text-gray-500"
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
                  className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                  aria-label="Comment options"
                >
                  <MoreVertical size={18} className="text-gray-500" />
                </button>

                {menuOpen && (
                  <div
                    className="absolute right-0 mt-2 w-40 bg-white dark:bg-neutral-900 
                               border border-gray-200 dark:border-gray-700 
                               rounded-lg shadow-lg z-50 overflow-hidden animate-in fade-in"
                  >
                    <button
                      onClick={() => {
                        setShowTagManager(true);
                        setMenuOpen(false);
                      }}
                      className="flex items-center gap-2 px-3 py-2 w-full text-left 
                                 text-gray-700 dark:text-gray-300 hover:bg-gray-50 
                                 dark:hover:bg-neutral-800 text-sm transition"
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
                                 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 
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

          {/* Comment Text */}
          <CommentBody body={comment.body} tags={comment.tags} />

          {/* Comment Actions (Reply, Like, etc.) */}
          <CommentActions postId={postId} commentId={comment.commentId} />
        </div>
      </article>

      {/* ✅ Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onConfirm={confirmDelete}
        onCancel={() => setShowDeleteModal(false)}
        isDeleting={isDeleting}
      />

      {/* ✅ Tag Manager Modal */}
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

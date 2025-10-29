"use client";

import Image from "next/image";
import { useState, useRef, useEffect } from "react";
import { MoreVertical, Trash2 } from "lucide-react";
import { CommentItem as CommentType } from "@/lib/types/comment";
import { deleteCommentController } from "@/controllers/postInteractionController/deleteCommentController";
import { useAccessToken } from "@/hooks/useAccessToken";
import CommentActions from "./CommentActions";
import DeleteConfirmationModal from "@/components/common/DeleteConfirmationModal";

interface CommentItemProps {
  comment: CommentType;
  postId: number;
  currentUser?: {
    username: string;
    userId: number;
  };
  onDelete?: (commentId: number) => void; // parent triggers reload
}

export default function CommentItem({
  comment,
  postId,
  currentUser,
  onDelete,
}: CommentItemProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const accessToken = useAccessToken();

  const isAuthor =
    currentUser &&
    (currentUser.userId === comment.author.userId ||
      currentUser.username === comment.author.username);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current?.contains(event.target as Node) ||
        buttonRef.current?.contains(event.target as Node)
      ) {
        return;
      }
      setMenuOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /** ✅ Delete handler */
  const confirmDelete = async () => {
    if (!accessToken) return;

    setIsDeleting(true);
    try {
      const response = await deleteCommentController(
        postId,
        comment.commentId,
        accessToken
      );

      if (response.success) {
        // trigger parent refresh
        onDelete?.(comment.commentId);
      } else {
        console.error("Failed to delete:", response.message);
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
      <li className="border-b border-gray-100 dark:border-gray-800 pb-2 last:border-none relative">
        <article className="flex items-start gap-3">
          <Image
            src={comment.author.profilePictureUrl || "/default-avatar.png"}
            alt={`${comment.author.username}'s profile`}
            width={36}
            height={36}
            className="w-9 h-9 rounded-full object-cover border border-gray-200 dark:border-gray-700"
          />

          <div className="flex-1">
            <header className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                <span className="font-semibold">{comment.author.username}</span>
                <time
                  className="text-gray-400 text-xs"
                  dateTime={comment.createdAt}
                >
                  {new Date(comment.createdAt).toLocaleDateString()}
                </time>
              </div>

              {isAuthor && (
                <div className="relative" ref={menuRef}>
                  <button
                    ref={buttonRef}
                    onClick={() => setMenuOpen((prev) => !prev)}
                    className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                  >
                    <MoreVertical size={18} className="text-gray-500" />
                  </button>

                  {menuOpen && (
                    <div
                      className="absolute right-0 mt-1 w-32 bg-white dark:bg-gray-800 
                                 border border-gray-200 dark:border-gray-700 
                                 rounded-lg shadow-lg z-50 overflow-hidden"
                    >
                      <button
                        onClick={() => setShowDeleteModal(true)}
                        disabled={isDeleting}
                        className="flex items-center gap-2 px-3 py-2 w-full text-left 
                                   text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 
                                   text-sm transition disabled:opacity-50"
                      >
                        <Trash2 size={14} />
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              )}
            </header>

            <p className="text-gray-800 dark:text-gray-200 text-sm leading-snug mt-1">
              {comment.body}
            </p>

            <CommentActions postId={postId} commentId={comment.commentId} />
          </div>
        </article>
      </li>

      {/* ✅ Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onConfirm={confirmDelete}
        onCancel={() => setShowDeleteModal(false)}
        isDeleting={isDeleting}
      />
    </>
  );
}

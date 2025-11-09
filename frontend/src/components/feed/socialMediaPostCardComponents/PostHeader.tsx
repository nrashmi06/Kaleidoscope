"use client";
import { MoreHorizontal, Trash2, MapPin, Loader2 } from "lucide-react";
import { useRef, useEffect, useState, useCallback } from "react";
import { formatDistanceToNow } from "date-fns";
import Image from "next/image";
import { Post } from "@/services/post/fetchPosts";
import DeleteConfirmationModal from "@/components/common/DeleteConfirmationModal";
import FollowButton from "@/components/common/FollowButton";

interface PostHeaderProps {
  post: Post;
  canDelete: boolean;
  onDelete: () => Promise<void>;
  isDeleting?: boolean;
}

export function PostHeader({ post, canDelete, onDelete, isDeleting = false }: PostHeaderProps) {
  const [showDeleteMenu, setShowDeleteMenu] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const deleteMenuRef = useRef<HTMLDivElement>(null);

  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (deleteMenuRef.current && !deleteMenuRef.current.contains(e.target as Node)) {
      setShowDeleteMenu(false);
    }
  }, []);

  useEffect(() => {
    if (showDeleteMenu) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showDeleteMenu, handleClickOutside]);

  return (
    <div className="flex items-center justify-between p-4">
      <div className="flex items-center space-x-3">
        <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden relative">
          <Image
            src={post.author.profilePictureUrl || "/person.jpg"}
            alt={post.author.username}
            fill
            className="object-cover"
            sizes="48px"
          />
        </div>
        <div>
          <h3 className="font-semibold text-base text-gray-900 dark:text-white">
            {post.author.username}
          </h3>
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <span>{formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}</span>
            {post.location && (
              <>
                <span>•</span>
                <div className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  <span>
                    {post.location.name}, {post.location.city}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <FollowButton targetUserId={post.author.userId} />

        {canDelete && (
          <div className="relative" ref={deleteMenuRef}>
            <button
              onClick={() => setShowDeleteMenu((prev) => !prev)}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-neutral-800"
            >
              <MoreHorizontal className="h-4 w-4 text-gray-600 dark:text-gray-300" />
            </button>

            {showDeleteMenu && (
              <div className="absolute right-0 top-full mt-1 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg shadow-lg z-10 min-w-[120px]">
                <button
                  onClick={() => {
                    // Open confirmation modal instead of immediately deleting
                    setShowDeleteMenu(false);
                    setIsConfirmOpen(true);
                  }}
                  disabled={isDeleting}
                  className={`flex items-center gap-2 w-full px-4 py-2 rounded-lg text-sm transition-colors ${
                    isDeleting
                      ? "text-gray-400 cursor-not-allowed"
                      : "text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                  }`}
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" /> Delete Post
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Confirmation modal for deleting a post (shared component) */}
      <DeleteConfirmationModal
        isOpen={isConfirmOpen}
        onCancel={() => setIsConfirmOpen(false)}
        onConfirm={async () => {
          try {
            await onDelete();
          } finally {
            // Close modal after attempting deletion; parent may unmount this component on success
            setIsConfirmOpen(false);
          }
        }}
        isDeleting={isDeleting}
        title="Delete Post"
        message="Are you sure you want to delete this post? This action cannot be undone."
      />
    </div>
  );
}

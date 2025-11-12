"use client";

// ✅ 1. Import React hooks and Image component
import { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import { type Post } from "@/lib/types/post"; // Correct type import
import { formatDistanceToNow } from "date-fns";
import { MoreVertical, Trash2 } from "lucide-react";

// ✅ 2. Import DeleteConfirmationModal
import DeleteConfirmationModal from "@/components/common/DeleteConfirmationModal";

interface PostHeaderProps {
  post: Post;
  canDelete: boolean;
  onDelete: () => void; // This is the clean function from SocialPostCard
  isDeleting: boolean;
}

export function PostHeader({
  post,
  canDelete,
  onDelete, // Use this prop directly
  isDeleting, // This prop is still received, just not passed to the modal
}: PostHeaderProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  // State for our custom dropdown menu
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const timeAgo = formatDistanceToNow(new Date(post.createdAt), {
    addSuffix: true,
  });

  // This function is called when the user clicks "Confirm" in the modal.
  const handleConfirmDelete = () => {
    onDelete();
    setIsModalOpen(false);
  };

  // Logic to close the custom dropdown when clicking outside
  const handleClickOutside = useCallback(
    (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        setIsMenuOpen(false);
      }
    },
    []
  );

  useEffect(() => {
    if (isMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    // Cleanup on unmount
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMenuOpen, handleClickOutside]);
  // --- End of dropdown logic ---

  return (
    <>
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          {/* ✅ 3. Manual Avatar (replaces shadcn Avatar) */}
          <div className="relative h-10 w-10 overflow-hidden rounded-full bg-gray-200 dark:bg-neutral-700">
            <Image
              src={post.author.profilePictureUrl || "/default-avatar.png"}
              alt={post.author.username}
              fill
              className="object-cover"
              sizes="40px"
            />
          </div>
          {/* --- End of Manual Avatar --- */}

          <div>
            <span className="font-semibold text-sm text-gray-900 dark:text-white">
              {post.author.username}
            </span>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {timeAgo}
            </p>
          </div>
        </div>

        {/* ✅ 4. Manual Dropdown Menu (replaces shadcn DropdownMenu) */}
        <div className="relative" ref={menuRef}>
          {/* Trigger Button */}
          <button
            onClick={() => setIsMenuOpen((prev) => !prev)}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-neutral-800 text-gray-500 dark:text-gray-400"
          >
            <MoreVertical className="w-5 h-5" />
          </button>

          {/* Menu Panel */}
          {isMenuOpen && (
            <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded-lg shadow-lg z-20 py-1">
              {canDelete && (
                <button
                  onClick={() => {
                    setIsMenuOpen(false); // Close this menu
                    setIsModalOpen(true); // Open the delete modal
                  }}
                  // We still use isDeleting here to disable the button
                  disabled={isDeleting}
                  className={`flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 dark:text-red-500 hover:bg-gray-100 dark:hover:bg-neutral-800 ${
                    isDeleting ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  {isDeleting ? "Deleting..." : "Delete Post"}
                </button>
              )}
            </div>
          )}
        </div>
        {/* --- End of Manual Dropdown --- */}
      </div>

      {/* ✅ 5. Using YOUR DeleteConfirmationModal */}
      <DeleteConfirmationModal
        isOpen={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Post"
        message="Are you sure you want to delete this post? This action cannot be undone."
      />
    </>
  );
}
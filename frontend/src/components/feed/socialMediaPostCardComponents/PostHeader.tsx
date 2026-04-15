"use client";

// ✅ 1. Import React hooks and Image component
import { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { type Post } from "@/lib/types/post"; // Correct type import
import { formatDistanceToNow } from "date-fns";
import { parseUTC } from "@/lib/utils/parseUTC";
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
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  // State for our custom dropdown menu
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const timeAgo = formatDistanceToNow(parseUTC(post.createdAt), {
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
      <div className="flex items-center justify-between p-3.5">
        <div className="flex items-center gap-3">
          <div className="relative h-9 w-9 overflow-hidden rounded-full bg-cream-300 dark:bg-navy-700 ring-2 ring-cream-300/50 dark:ring-navy-600/50">
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
              className="font-semibold text-sm text-heading cursor-pointer hover:underline hover:text-steel dark:hover:text-sky transition-colors"
            >
              {post.author.username}
            </span>
            <p className="text-[11px] text-steel dark:text-sky/60">
              {timeAgo}
            </p>
          </div>
        </div>

        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setIsMenuOpen((prev) => !prev)}
            className="p-1.5 rounded-lg hover:bg-cream-300/50 dark:hover:bg-navy-700/50 text-steel dark:text-sky/60 transition-colors"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {isMenuOpen && (
            <div className="absolute right-0 top-full mt-1 w-44 bg-cream-50 dark:bg-navy border border-cream-300 dark:border-navy-700 rounded-xl shadow-lg shadow-navy/[0.06] dark:shadow-black/30 z-20 py-1 backdrop-blur-sm">
              {canDelete && (
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    setIsModalOpen(true);
                  }}
                  disabled={isDeleting}
                  className={`flex items-center gap-2 w-full px-3.5 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg mx-0.5 transition-colors ${
                    isDeleting ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  <Trash2 className="w-4 h-4" />
                  {isDeleting ? "Deleting..." : "Delete Post"}
                </button>
              )}
            </div>
          )}
        </div>
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
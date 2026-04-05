"use client";

import { PostDetails } from "@/components/post/PostDetails";
import { X } from "lucide-react";

interface PostModalProps {
  postId: number;
  isOpen: boolean;
  onClose: () => void;
  accessToken?: string;
  currentUserId?: number;
}

export function PostModal({ postId, isOpen, onClose, accessToken, currentUserId }: PostModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/50 backdrop-blur-sm">
      <div
        className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-cream-50 dark:bg-navy rounded-2xl shadow-2xl shadow-navy/10 dark:shadow-black/30 border border-cream-300/40 dark:border-navy-700/40 custom-scrollbar"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 bg-cream-50/90 dark:bg-navy-700/90 rounded-full shadow-lg hover:bg-cream-300/40 dark:hover:bg-navy-700 transition-colors border border-cream-300/40 dark:border-navy-600/40"
        >
          <X className="w-5 h-5 text-navy dark:text-cream" />
        </button>

        {/* Post content */}
        <PostDetails
          postId={postId}
          accessToken={accessToken}
          currentUserId={currentUserId}
          onPostNotFound={onClose}
          onAuthError={onClose}
        />
      </div>
    </div>
  );
}

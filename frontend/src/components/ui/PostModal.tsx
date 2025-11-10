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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white dark:bg-neutral-900 rounded-xl shadow-2xl">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 bg-white dark:bg-neutral-800 rounded-full shadow-lg hover:bg-gray-100 dark:hover:bg-neutral-700 transition-colors"
        >
          <X className="w-5 h-5" />
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

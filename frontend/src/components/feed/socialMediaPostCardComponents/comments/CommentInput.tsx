"use client";

import { useState } from "react";
import Image from "next/image";
import { Send } from "lucide-react";

interface CommentInputProps {
  currentUser: {
    username: string;
    profilePictureUrl: string;
    userId: number;
  };
  onSubmit: (comment: string) => Promise<void>;
  isPosting: boolean;
}

export default function CommentInput({
  currentUser,
  onSubmit,
  isPosting,
}: CommentInputProps) {
  const [comment, setComment] = useState("");

  const handleSend = async () => {
    if (!comment.trim()) return;
    await onSubmit(comment);
    setComment("");
  };

  return (
    <div className="flex items-center gap-3 mb-4">
      <Image
        src={currentUser.profilePictureUrl}
        alt={`${currentUser.username}'s avatar`}
        width={36}
        height={36}
        className="w-9 h-9 rounded-full object-cover"
      />
      <div className="flex-1 flex items-center bg-gray-50 dark:bg-gray-800 rounded-full border border-gray-200 dark:border-gray-700 px-3 py-1.5 focus-within:ring-1 focus-within:ring-blue-400 dark:focus-within:ring-blue-500 transition">
        <input
          type="text"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="Write a comment..."
          className="flex-1 bg-transparent outline-none text-sm text-gray-700 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500"
        />
        <button
          onClick={handleSend}
          disabled={!comment.trim() || isPosting}
          className="text-blue-600 dark:text-blue-400 disabled:text-gray-400 p-1.5 transition"
        >
          {isPosting ? (
            <span className="animate-pulse text-xs">...</span>
          ) : (
            <Send size={16} />
          )}
        </button>
      </div>
    </div>
  );
}

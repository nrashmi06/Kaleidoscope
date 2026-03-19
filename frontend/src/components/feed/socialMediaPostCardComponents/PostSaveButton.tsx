"use client";

import { useState, useEffect, useTransition } from "react";
import { Bookmark } from "lucide-react";
import { getPostSaveStatusController, togglePostSaveController } from "@/controllers/postController/postSaveController";
import { useAccessToken } from "@/hooks/useAccessToken";

interface PostSaveButtonProps {
  postId: number;
}

export function PostSaveButton({ postId }: PostSaveButtonProps) {
  const [isSaved, setIsSaved] = useState(false);
  const [isPending, startTransition] = useTransition();
  const accessToken = useAccessToken();

  useEffect(() => {
    if (!accessToken || !postId) return;
    startTransition(async () => {
      const res = await getPostSaveStatusController(postId, accessToken);
      if (res.success && res.data) {
        setIsSaved(res.data.saved);
      }
    });
  }, [postId, accessToken]);

  const handleToggle = () => {
    if (!accessToken) return;
    startTransition(async () => {
      const res = await togglePostSaveController(postId, accessToken);
      if (res.success && res.data) {
        setIsSaved(res.data.saved);
      }
    });
  };

  return (
    <button
      onClick={handleToggle}
      disabled={isPending}
      className={`p-2 rounded-lg transition-all duration-200 ${
        isSaved
          ? "text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400"
          : "text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-gray-400"
      }`}
      aria-label={isSaved ? "Unsave post" : "Save post"}
    >
      <Bookmark className={`w-5 h-5 ${isSaved ? "fill-current" : ""}`} />
    </button>
  );
}

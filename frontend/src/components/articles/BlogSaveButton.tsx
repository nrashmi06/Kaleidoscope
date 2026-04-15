"use client";

import { useState, useEffect, useTransition } from "react";
import { Bookmark } from "lucide-react";
import { getBlogSaveStatusController, toggleBlogSaveController } from "@/controllers/blog/blogSaveController";
import { useAccessToken } from "@/hooks/useAccessToken";

interface BlogSaveButtonProps {
  blogId: number;
}

export function BlogSaveButton({ blogId }: BlogSaveButtonProps) {
  const [isSaved, setIsSaved] = useState(false);
  const [isPending, startTransition] = useTransition();
  const accessToken = useAccessToken();

  useEffect(() => {
    if (!accessToken || !blogId) return;
    startTransition(async () => {
      const res = await getBlogSaveStatusController(blogId, accessToken);
      if (res.success && res.data) {
        setIsSaved(res.data.saved);
      }
    });
  }, [blogId, accessToken]);

  const handleToggle = () => {
    if (!accessToken) return;
    startTransition(async () => {
      const res = await toggleBlogSaveController(blogId, accessToken);
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
          ? "text-steel bg-steel/10 dark:bg-sky/15 dark:text-sky"
          : "text-steel/50 hover:bg-cream-300/30 dark:hover:bg-navy-700/40 dark:text-sky/40"
      }`}
      aria-label={isSaved ? "Unsave article" : "Save article"}
    >
      <Bookmark className={`w-5 h-5 ${isSaved ? "fill-current" : ""}`} />
    </button>
  );
}

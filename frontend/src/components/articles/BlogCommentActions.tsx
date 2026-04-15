"use client";

import { useEffect, useState, useTransition, useRef } from "react";
import { ReactionIcons, ReactionSummaryResponse, ReactionType } from "@/lib/types/reaction";
import { getBlogCommentReactionsController } from "@/controllers/blogInteractionController/getBlogCommentReactionsController";
import { reactToBlogCommentController } from "@/controllers/blogInteractionController/reactToBlogCommentController";
import { useAccessToken } from "@/hooks/useAccessToken";

interface BlogCommentActionsProps {
  blogId: number;
  commentId: number;
}

export function BlogCommentActions({ blogId, commentId }: BlogCommentActionsProps) {
  const [reactions, setReactions] = useState<ReactionSummaryResponse | null>(null);
  const [isPending, startTransition] = useTransition();
  const [showPicker, setShowPicker] = useState(false);
  const accessToken = useAccessToken();
  const fetchedRef = useRef(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!blogId || !commentId || !accessToken || fetchedRef.current) return;
    fetchedRef.current = true;
    startTransition(async () => {
      const response = await getBlogCommentReactionsController(blogId, commentId, accessToken);
      if (response.success) setReactions(response);
    });
  }, [blogId, commentId, accessToken]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) setShowPicker(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const summary = reactions?.data;
  const counts = summary?.countsByType ?? {};
  const total = summary?.totalReactions ?? 0;
  const currentUserReaction = summary?.currentUserReaction ?? null;

  const handleReaction = async (reaction: ReactionType) => {
    if (!accessToken) return;
    const isUnreact = currentUserReaction === reaction;
    setShowPicker(false);
    startTransition(async () => {
      const response = await reactToBlogCommentController(blogId, commentId, reaction, isUnreact, accessToken);
      if (response.success) setReactions(response);
    });
  };

  const topReactions = Object.entries(counts)
    .sort(([, a], [, b]) => (b as number) - (a as number))
    .slice(0, 3)
    .map(([type]) => type as ReactionType);

  return (
    <div className="mt-2 flex items-center justify-between text-xs text-steel/60 dark:text-sky/50">
      <div className="relative flex items-center gap-2" ref={pickerRef}>
        {showPicker && (
          <div className="absolute bottom-8 left-0 z-50 animate-in fade-in slide-in-from-bottom-2 duration-200" style={{ width: "max-content" }}>
            <div className="flex items-center gap-2 rounded-full bg-cream-50/95 px-3 py-2 shadow-xl ring-1 ring-navy/5 backdrop-blur-xl dark:bg-navy/95 dark:ring-cream/10">
              {(Object.keys(ReactionIcons) as ReactionType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => handleReaction(type)}
                  disabled={isPending}
                  className={`relative flex h-7 w-7 items-center justify-center rounded-full text-lg transition-all hover:-translate-y-1 hover:scale-110 cursor-pointer ${
                    currentUserReaction === type ? "ring-2 ring-steel bg-steel/15 dark:bg-sky/20 dark:ring-sky" : "hover:bg-surface-hover"
                  }`}
                >
                  {ReactionIcons[type]}
                </button>
              ))}
            </div>
          </div>
        )}
        <button
          onClick={() => setShowPicker(!showPicker)}
          className={`flex items-center gap-1 rounded-full px-2 py-1 transition-all cursor-pointer ${
            currentUserReaction ? "text-steel bg-steel/15 dark:bg-sky/15 dark:text-sky" : "text-steel/50 hover:bg-cream-300/40 dark:text-sky/40 dark:hover:bg-navy-700/40"
          }`}
        >
          <span className="text-base">{currentUserReaction ? ReactionIcons[currentUserReaction] : ReactionIcons.LIKE}</span>
          {total > 0 && <span className="ml-1">{total}</span>}
        </button>
      </div>
      {total > 0 && topReactions.length > 0 && (
        <div className="flex items-center gap-1">
          {topReactions.map((type) => {
            const count = counts[type] ?? 0;
            if (count <= 0) return null;
            return (
              <div key={type} className="flex items-center gap-1 rounded-full bg-cream-50/60 px-2 py-0.5 dark:bg-navy-700/30">
                <span className="text-sm">{ReactionIcons[type]}</span>
                <span className="text-xs font-semibold text-sub">{count}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

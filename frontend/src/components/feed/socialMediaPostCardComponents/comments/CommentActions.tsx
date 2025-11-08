"use client";

import { useEffect, useState, useTransition, useRef } from "react";
import {
  ReactionIcons,
  ReactionSummaryResponse,
  ReactionType,
} from "@/lib/types/reaction";
import { getCommentReactionsController } from "@/controllers/postInteractionController/getCommentReactionsController";
import { reactToCommentController } from "@/controllers/postInteractionController/reactToCommentController";
import { useAccessToken } from "@/hooks/useAccessToken";

interface CommentActionsProps {
  postId: number;
  commentId: number;
}

export function CommentActions({ postId, commentId }: CommentActionsProps) {
  const [reactions, setReactions] = useState<ReactionSummaryResponse | null>(
    null
  );
  const [isPending, startTransition] = useTransition();
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [hoveredReaction, setHoveredReaction] =
    useState<ReactionType | null>(null);
  const accessToken = useAccessToken();
  const fetchedRef = useRef(false);
  const reactionRef = useRef<HTMLDivElement>(null);

  /* -------------------------------------------------------------------------- */
  /*                          Fetch reactions for comment                       */
  /* -------------------------------------------------------------------------- */
  useEffect(() => {
    if (!postId || !commentId || !accessToken) return;
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    startTransition(async () => {
      try {
        const response = await getCommentReactionsController(
          postId,
          commentId,
          accessToken
        );
        if (response.success) {
          setReactions(response);
        } else {
          console.error("Failed to fetch comment reactions:", response.message);
        }
      } catch (error) {
        console.error("Error fetching comment reactions:", error);
      }
    });
  }, [postId, commentId, accessToken]);

  /* -------------------------------------------------------------------------- */
  /*                        Close picker when clicking outside                  */
  /* -------------------------------------------------------------------------- */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        reactionRef.current &&
        !reactionRef.current.contains(event.target as Node)
      ) {
        setShowReactionPicker(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const summary = reactions?.data;
  const counts = summary?.countsByType ?? {};
  const total = summary?.totalReactions ?? 0;
  const currentUserReaction = summary?.currentUserReaction ?? null;

  /* -------------------------------------------------------------------------- */
  /*                            Handle react / unreact                          */
  /* -------------------------------------------------------------------------- */
  const handleReactionClick = async (reaction: ReactionType) => {
    if (!accessToken) return;
    const isUnreact = currentUserReaction === reaction;

    setShowReactionPicker(false);

    startTransition(async () => {
      try {
        const response = await reactToCommentController(
          postId,
          commentId,
          reaction,
          isUnreact,
          accessToken
        );
        if (response.success) {
          setReactions(response);
        } else {
          console.error("Failed to react to comment:", response.message);
        }
      } catch (error) {
        console.error("Error reacting to comment:", error);
      }
    });
  };

  const mainReactions: ReactionType[] = [
    "LIKE",
    "CELEBRATE",
    "FUNNY",
    "LOVE",
    "INSIGHTFUL",
    "SUPPORT",
  ];

  // --- derive top reactions for display (like PostActions)
  const topReactions = Object.entries(counts)
    .sort(([, a], [, b]) => (b as number) - (a as number))
    .slice(0, 3)
    .map(([type]) => type as ReactionType);

  return (
    <div className="mt-2 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
      {/* Reaction Button + Picker */}
      <div className="relative flex items-center gap-2" ref={reactionRef}>
        {showReactionPicker && (
          <div
            className="absolute bottom-8 left-0 z-50 animate-in fade-in slide-in-from-bottom-2 duration-200"
            style={{ width: "max-content" }}
          >
            <div className="flex items-center gap-2 rounded-full bg-white/95 px-3 py-2 shadow-xl ring-1 ring-black/5 backdrop-blur-xl dark:bg-gray-900/95 dark:ring-white/10">
              {(Object.keys(ReactionIcons) as ReactionType[]).map((type) => {
                const isActive = currentUserReaction === type;
                return (
                  <button
                    key={type}
                    onClick={() => handleReactionClick(type)}
                    onMouseEnter={() => setHoveredReaction(type)}
                    onMouseLeave={() => setHoveredReaction(null)}
                    disabled={isPending}
                    className={`relative flex h-7 w-7 items-center justify-center rounded-full text-lg transition-all duration-200 hover:-translate-y-1 hover:scale-110 ${
                      isActive
                        ? "ring-2 ring-blue-500 bg-blue-100 dark:bg-blue-900/40"
                        : "hover:bg-gray-100 dark:hover:bg-gray-800"
                    }`}
                    aria-label={type}
                  >
                    <span>{ReactionIcons[type]}</span>
                    {hoveredReaction === type && (
                      <div className="absolute -top-7 left-1/2 -translate-x-1/2 rounded-md bg-gray-900 px-2 py-1 text-xs text-white dark:bg-gray-700">
                        {type.charAt(0) + type.slice(1).toLowerCase()}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <button
          onClick={() => setShowReactionPicker((prev) => !prev)}
          className={`flex items-center gap-1 rounded-full px-2 py-1 transition-all duration-200 ${
            currentUserReaction
              ? "text-blue-600 bg-blue-100 dark:bg-blue-900/30"
              : "text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800/50"
          }`}
          aria-label="React to comment"
        >
          <div className="flex -space-x-1">
            {mainReactions.map((type, i) => (
              <div
                key={type}
                className={`flex h-4 w-4 items-center justify-center rounded-full ring-2 transition-transform ${
                  currentUserReaction === type
                    ? "bg-blue-100 text-blue-600 ring-blue-300 dark:bg-blue-900/40 dark:ring-blue-700"
                    : "bg-white ring-white dark:bg-gray-900 dark:ring-gray-900"
                }`}
                style={{ zIndex: 3 - i }}
              >
                {ReactionIcons[type]}
              </div>
            ))}
          </div>
          {total > 0 && <span className="ml-1">{total}</span>}
        </button>
      </div>

      {/* Top reaction pills (icons + counts) */}
      {total > 0 && topReactions.length > 0 && (
        <div className="flex items-center gap-1">
          {topReactions.map((type) => {
            const count = counts[type] ?? 0;
            if (count <= 0) return null;
            return (
              <div
                key={type}
                className="group flex cursor-pointer items-center gap-1 rounded-full bg-gray-50 px-2.5 py-1 transition-all duration-200 hover:bg-gray-100 hover:scale-105 dark:bg-gray-800/50 dark:hover:bg-gray-800"
              >
                <span className="text-base transition-transform group-hover:scale-110">
                  {ReactionIcons[type as keyof typeof ReactionIcons]}
                </span>
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                  {count}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default CommentActions;

"use client";

import { useEffect, useState, useTransition, useRef } from "react";
import { getReactionsForPostController } from "@/controllers/postInteractionController/getReactionsForPostController";
import { reactToPostController } from "@/controllers/postInteractionController/reactToPostController";
import {
  ReactionIcons,
  ReactionSummaryResponse,
  ReactionType,
} from "@/lib/types/reaction";
import { useAccessToken } from "@/hooks/useAccessToken";

interface PostActionsProps {
  postId: number;
}

export function PostActions({ postId }: PostActionsProps) {
  const [reactions, setReactions] = useState<ReactionSummaryResponse | null>(null);
  const [isPending, startTransition] = useTransition();
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [hoveredReaction, setHoveredReaction] = useState<ReactionType | null>(null);
  const reactionRef = useRef<HTMLDivElement>(null);
  const accessToken = useAccessToken();
  const fetchedRef = useRef(false);

  // --- Fetch Reactions ---
  useEffect(() => {
    if (!postId || !accessToken) return;
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    startTransition(async () => {
      try {
        const response = await getReactionsForPostController(postId, accessToken);
        if (response.success) {
          setReactions(response);
        } else {
          console.error("Failed to fetch reactions:", response.message);
        }
      } catch (error) {
        console.error("Unexpected error fetching reactions:", error);
      }
    });
  }, [postId, accessToken]);

  // --- Close picker on outside click ---
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (reactionRef.current && !reactionRef.current.contains(event.target as Node)) {
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

  // --- Handle Reaction Click ---
  const handleReactionClick = async (reaction: ReactionType) => {
    if (!accessToken) return;

    // If user clicks the same reaction again → unreact
    const isUnreact = currentUserReaction === reaction;

    setShowReactionPicker(false);

    startTransition(async () => {
      try {
        const response = await reactToPostController(postId, reaction, isUnreact, accessToken);
        if (response.success) {
          // Update the local state to reflect the latest summary
          setReactions(response);
        } else {
          console.error("Failed to update reaction:", response.message);
        }
      } catch (error) {
        console.error("Error reacting to post:", error);
      }
    });
  };

  const mainReactions: ReactionType[] = ["LIKE", "CELEBRATE", "INSIGHTFUL", "SUPPORT"];
  const topReactions = Object.entries(counts)
    .sort(([, a], [, b]) => (b as number) - (a as number))
    .slice(0, 3)
    .map(([type]) => type as ReactionType);

  return (
    <div className="flex items-center justify-between border-t border-gray-100 pt-3 dark:border-gray-800">
      {/* Reaction Button & Picker */}
      <div className="relative flex items-center gap-2" ref={reactionRef}>
        {/* Reaction Picker */}
        {showReactionPicker && (
          <div
            className="absolute bottom-12 left-35 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-2 duration-200"
            style={{
              width: "max-content",
              maxWidth: "90vw",
            }}
          >
            <div className="flex flex-wrap justify-center items-center gap-2 sm:gap-3 rounded-full bg-white/95 px-3 py-2 sm:px-4 sm:py-3 shadow-xl ring-1 ring-black/5 backdrop-blur-xl dark:bg-gray-900/95 dark:ring-white/10">
              {(Object.keys(ReactionIcons) as ReactionType[]).map((type) => {
                const isActive = currentUserReaction === type;
                return (
                  <button
                    key={type}
                    onClick={() => handleReactionClick(type)}
                    onMouseEnter={() => setHoveredReaction(type)}
                    onMouseLeave={() => setHoveredReaction(null)}
                    disabled={isPending}
                    className={`group relative flex h-9 w-9 sm:h-11 sm:w-11 items-center justify-center rounded-full text-xl sm:text-2xl transition-all duration-200 ease-out 
                      hover:-translate-y-1 hover:scale-110 active:scale-95 
                      ${
                        isActive
                          ? "ring-2 ring-blue-500 bg-blue-100 dark:bg-blue-900/40"
                          : "hover:bg-gray-100 dark:hover:bg-gray-800"
                      }`}
                    aria-label={type}
                  >
                    <span className="relative z-10">{ReactionIcons[type]}</span>
                    {hoveredReaction === type && (
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-gray-900 px-2 py-1 text-xs font-medium text-white dark:bg-gray-700 shadow-md transition-all duration-150">
                        {type.charAt(0) + type.slice(1).toLowerCase()}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Main Reaction Button */}
        <button
          onClick={() => setShowReactionPicker((prev) => !prev)}
          className={`group relative flex items-center gap-2 overflow-hidden rounded-full px-3 py-2 text-sm font-medium transition-all duration-200 ${
            currentUserReaction
              ? "bg-gradient-to-r from-blue-500/10 to-blue-600/10 text-blue-600 ring-1 ring-blue-500/20 dark:from-blue-500/20 dark:to-blue-600/20 dark:text-blue-400 dark:ring-blue-500/30"
              : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800/50"
          }`}
        >
          <div className="flex -space-x-1.5">
            {mainReactions.map((type, index) => (
              <div
                key={index}
                className={`flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded-full text-base ring-2 transition-transform group-hover:-translate-y-0.5 ${
                  currentUserReaction === type
                    ? "bg-blue-100 text-blue-600 ring-blue-300 dark:bg-blue-900/40 dark:ring-blue-700"
                    : "bg-white ring-white dark:bg-gray-900 dark:ring-gray-900"
                }`}
                style={{
                  transitionDelay: `${index * 30}ms`,
                  zIndex: 3 - index,
                }}
              >
                {ReactionIcons[type]}
              </div>
            ))}
          </div>
          <span className="transition-colors">
            {currentUserReaction
              ? currentUserReaction.charAt(0) + currentUserReaction.slice(1).toLowerCase()
              : ""}
          </span>
        </button>

        {/* Reaction Count Pills */}
        {total > 0 && !isPending && topReactions.length > 0 && (
          <div className="flex items-center gap-1">
            {topReactions.map((type) => {
              const count = counts[type];
              if (!count || count <= 0) return null;
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

      {/* Total Reactions */}
      {total > 0 && (
        <button
          className={`group flex items-center gap-1.5 text-sm font-medium transition-all duration-200 ${
            isPending
              ? "animate-pulse text-gray-400 dark:text-gray-600"
              : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
          }`}
        >
          <span className="transition-transform group-hover:scale-110">{total}</span>
          <span className="text-xs uppercase tracking-wider opacity-75">
            {total === 1 ? "reaction" : "reactions"}
          </span>
        </button>
      )}
    </div>
  );
}

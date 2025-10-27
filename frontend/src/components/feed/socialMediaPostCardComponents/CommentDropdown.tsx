"use client";

import { useState } from "react";
import Image from "next/image";
import { MessageSquare, ChevronUp, ChevronDown } from "lucide-react";
import { getCommentsForPostController } from "@/controllers/postInteractionController/getCommentsForPostController";
import { CommentsListResponse, CommentItem } from "@/lib/types/comment";
import { useAccessToken } from "@/hooks/useAccessToken";

interface CommentSectionProps {
  postId: number;
}

// 💬 Skeleton loader for smooth UX (visible min 1.2s)
const CommentSkeleton = () => (
  <div className="animate-pulse flex items-start gap-3 py-2">
    <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
    <div className="flex-1 space-y-2">
      <div className="w-1/3 h-3 bg-gray-300 rounded"></div>
      <div className="w-2/3 h-3 bg-gray-200 rounded"></div>
      <div className="w-full h-3 bg-gray-200 rounded"></div>
    </div>
  </div>
);

export function CommentSection({ postId }: CommentSectionProps) {
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const accessToken = useAccessToken();

  const fetchComments = async (pageNumber: number) => {
    if (!accessToken) {
      setError("Missing access token. Please log in again.");
      return;
    }

    const startTime = Date.now();
    setIsLoading(true);
    setError(null);

    try {
      const response: CommentsListResponse = await getCommentsForPostController(
        postId,
        accessToken,
        pageNumber,
        5,
        "createdAt,desc"
      );

      // Keep loader visible for at least 1.2s
      const elapsed = Date.now() - startTime;
      if (elapsed < 1200) {
        await new Promise((resolve) => setTimeout(resolve, 1200 - elapsed));
      }

      if (response.success && response.data?.content) {
        if (pageNumber > 0) {
          setComments((prev) => [...prev, ...response.data!.content]);
        } else {
          setComments(response.data!.content);
        }

        setTotalPages(response.data!.totalPages || 1);
        setPage(pageNumber);
      } else {
        setError(response.message || "Failed to load comments");
      }
    } catch (err) {
      console.error("[CommentSection] Error fetching comments:", err);
      setError("Unexpected error fetching comments");
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = async () => {
    // Open dropdown first, then trigger loading and fetch
    if (!isExpanded) {
      setIsExpanded(true);
      setIsLoading(true); // immediately show skeleton
      await fetchComments(0);
    } else {
      setIsExpanded(false);
    }
  };

  const handleLoadMore = async () => {
    if (page + 1 < totalPages) {
      await fetchComments(page + 1);
    }
  };

  return (
    <section className="w-full mt-3">
      {/* Toggle Button */}
      <div className="flex justify-center">
        <button
          onClick={handleToggle}
          className="flex items-center justify-center gap-1 text-gray-300 hover:text-blue-600 focus:outline-none"
          aria-expanded={isExpanded}
          aria-controls={`comments-section-${postId}`}
        >
          <MessageSquare size={18} />
          <p className="text-sm font-medium">Comments</p>
          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {/* Comments Section */}
      {isExpanded && (
        <div id={`comments-section-${postId}`} className="mt-3 p-4 w-full">
          {error && <p className="text-red-600 text-sm">{error}</p>}

          {/* Skeleton loader always shown first when expanded */}
          {isLoading && comments.length === 0 && (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <CommentSkeleton key={i} />
              ))}
            </div>
          )}

          {!isLoading && comments.length > 0 && (
            <>
              <ul className="space-y-3">
                {comments.map((comment) => (
                  <li
                    key={comment.commentId}
                    className="border-b border-gray-100 pb-2 last:border-none"
                  >
                    <article className="flex items-start gap-3">
                      <Image
                        src={comment.author.profilePictureUrl}
                        alt={`${comment.author.username}'s profile`}
                        width={32}
                        height={32}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                      <div>
                        <header className="flex items-center gap-2 text-sm text-gray-700">
                          <span className="font-semibold">
                            {comment.author.username}
                          </span>
                          <time
                            className="text-gray-400 text-xs"
                            dateTime={comment.createdAt}
                          >
                            {new Date(comment.createdAt).toLocaleDateString()}
                          </time>
                        </header>
                        <p className="text-gray-800 text-sm leading-snug mt-1">
                          {comment.body}
                        </p>
                      </div>
                    </article>
                  </li>
                ))}
              </ul>

              {/* Load More Button */}
              {page + 1 < totalPages && (
                <div className="text-center mt-4">
                  <button
                    onClick={handleLoadMore}
                    disabled={isLoading}
                    className="px-4 py-2 text-sm text-blue-600 border border-blue-200 rounded-md hover:bg-blue-50 transition disabled:opacity-50"
                  >
                    {isLoading ? "Loading..." : "Load More"}
                  </button>
                </div>
              )}
            </>
          )}

          {/* Empty State */}
          {!isLoading && comments.length === 0 && !error && (
            <p className="text-gray-500 text-sm text-center">
              No comments yet. Be the first to comment!
            </p>
          )}
        </div>
      )}
    </section>
  );
}

export default CommentSection;

"use client";

import { useState } from "react";
import Image from "next/image";
import { MessageSquare, ChevronUp, ChevronDown, Send } from "lucide-react";
import { getCommentsForPostController } from "@/controllers/postInteractionController/getCommentsForPostController";
import { addCommentController } from "@/controllers/postInteractionController/addCommentController";
import { CommentsListResponse, CommentItem } from "@/lib/types/comment";
import { useAccessToken } from "@/hooks/useAccessToken";

interface CommentSectionProps {
  postId: number;
  currentUser?: {
    username: string;
    profilePictureUrl: string;
  };
}

// 💬 Skeleton loader
const CommentSkeleton = () => (
  <div className="animate-pulse flex items-start gap-3 py-2">
    <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
    <div className="flex-1 space-y-2">
      <div className="w-1/3 h-3 bg-gray-300 dark:bg-gray-600 rounded"></div>
      <div className="w-2/3 h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
      <div className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
    </div>
  </div>
);

export function CommentSection({
  postId,
  currentUser = {
    username: "You",
    profilePictureUrl: "/default-avatar.png",
  },
}: CommentSectionProps) {
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [newComment, setNewComment] = useState("");

  const accessToken = useAccessToken();

  // Fetch comments
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

  // Expand/collapse handler
  const handleToggle = async () => {
    if (!isExpanded) {
      setIsExpanded(true);
      setIsLoading(true);
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

  // ✅ Post Comment Integration
  const handlePostComment = async () => {
    if (!newComment.trim()) return;
    if (!accessToken) {
      setError("You must be logged in to comment.");
      return;
    }

    setIsPosting(true);
    setError(null);

    try {
      const payload = { body: newComment.trim() };
      const response = await addCommentController(postId, accessToken, payload);

      if (response.success && response.data) {
        // Optimistically prepend new comment to list
        const newCommentItem: CommentItem = {
          ...response.data,
          author: response.data.author || {
            username: currentUser.username,
            profilePictureUrl: currentUser.profilePictureUrl,
            userId: 0,
            email: "",
            accountStatus: "ACTIVE",
          },
          body: response.data.body || newComment.trim(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          tags: [],
        };

        setComments((prev) => [newCommentItem, ...prev]);
        setNewComment("");
      } else {
        setError(response.message || "Failed to post comment");
      }
    } catch (err) {
      console.error("[CommentSection] Error posting comment:", err);
      setError("Unexpected error while posting comment");
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <section className="w-full mt-1 border-t border-gray-100 dark:border-gray-800 pt-3">
      {/* Toggle Button */}
      <div className="flex justify-center">
        <button
          onClick={handleToggle}
          className="flex items-center justify-center gap-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 focus:outline-none"
          aria-expanded={isExpanded}
          aria-controls={`comments-section-${postId}`}
        >
          <MessageSquare size={18} />
          <p className="text-sm">
            {isExpanded ? "Hide Comments" : "Show Comments"}
          </p>
          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {/* Comments Section */}
      {isExpanded && (
        <div
          id={`comments-section-${postId}`}
          className="mt-3 p-4 w-full border-t border-gray-100 dark:border-gray-800"
        >
          {error && <p className="text-red-600 text-sm">{error}</p>}

          {/* ✏️ Comment Input */}
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
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handlePostComment();
                  }
                }}
                placeholder="Write a comment..."
                className="flex-1 bg-transparent outline-none text-sm text-gray-700 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500"
              />
              <button
                onClick={handlePostComment}
                disabled={!newComment.trim() || isPosting}
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

          {/* Loader */}
          {isLoading && comments.length === 0 && (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <CommentSkeleton key={i} />
              ))}
            </div>
          )}

          {/* Comments */}
          {!isLoading && comments.length > 0 && (
            <>
              <ul className="space-y-3">
                {comments.map((comment) => (
                  <li
                    key={comment.commentId}
                    className="border-b border-gray-100 dark:border-gray-800 pb-2 last:border-none"
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
                        <header className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
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
                        <p className="text-gray-800 dark:text-gray-200 text-sm leading-snug mt-1">
                          {comment.body}
                        </p>
                      </div>
                    </article>
                  </li>
                ))}
              </ul>

              {/* Load More */}
              {page + 1 < totalPages && (
                <div className="text-center mt-4">
                  <button
                    onClick={handleLoadMore}
                    disabled={isLoading}
                    className="px-4 py-2 text-sm text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/20 transition disabled:opacity-50"
                  >
                    {isLoading ? "Loading..." : "Load More"}
                  </button>
                </div>
              )}
            </>
          )}

          {/* Empty State */}
          {!isLoading && comments.length === 0 && !error && (
            <p className="text-gray-500 dark:text-gray-400 text-sm text-center">
              No comments yet. Be the first to comment!
            </p>
          )}
        </div>
      )}
    </section>
  );
}

export default CommentSection;

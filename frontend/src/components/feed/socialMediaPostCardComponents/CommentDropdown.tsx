"use client";

import { useState, useRef } from "react";
import { MessageSquare, ChevronUp, ChevronDown, Loader2 } from "lucide-react";
import { getCommentsForPostController } from "@/controllers/postInteractionController/getCommentsForPostController";
import { addCommentController } from "@/controllers/postInteractionController/addCommentController";
import {
  CommentsListResponse,
  CommentItem as CommentType,
} from "@/lib/types/comment";
import { useAccessToken } from "@/hooks/useAccessToken";
import { useUserData } from "@/hooks/useUserData";
import CommentItem from "./comments/CommentItem";
import CommentInput from "./comments/CommentInput";
import CommentSkeleton from "@/components/loading/CommentSkeleton";

interface CommentSectionProps {
  postId: number;
}

export default function CommentSection({ postId }: CommentSectionProps) {
  const [comments, setComments] = useState<CommentType[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const accessToken = useAccessToken();
  const currentUser = useUserData();
  const lastPostTimestampRef = useRef<number | null>(null);

  /** ✅ Fetch Comments */
  const fetchComments = async (pageNumber: number) => {
    if (!accessToken) {
      setError("Missing access token. Please log in again.");
      return;
    }

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

      if (response.success && response.data?.content) {
        const fetchedComments = response.data.content.map((c) => ({
          ...c,
          commentId: Number(c.commentId),
        }));

        setComments((prev) =>
          pageNumber > 0 ? [...prev, ...fetchedComments] : fetchedComments
        );
        setTotalPages(response.data.totalPages || 1);
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

  /** ✅ Toggle with instant skeleton and clear on collapse */
  const handleToggle = async () => {
    if (!isExpanded) {
      setIsExpanded(true);
      setComments([]); // Clear stale data
      setPage(0);
      setError(null);
      setIsLoading(true); // Show skeleton instantly
      await fetchComments(0);
    } else {
      setIsExpanded(false);
      setComments([]); // Clear comments on collapse
      setError(null);
    }
  };

  /** ✅ Pagination */
  const handleLoadMore = async () => {
    if (page + 1 < totalPages) {
      await fetchComments(page + 1);
    }
  };

  /** ✅ Post New Comment */
  const handlePostComment = async (body: string, selectedTags?: { userId: number; username: string }[] | null) => {
    if (!accessToken) {
      setError("You must be logged in to comment.");
      return;
    }
    const now = Date.now();
    if (lastPostTimestampRef.current && now - lastPostTimestampRef.current < 3000) {
      setError("Please wait a moment before posting again.");
      return;
    }
    lastPostTimestampRef.current = now;

    setIsPosting(true);
    setError(null);
    try {
      const response = await addCommentController(postId, accessToken, { body });

      if (response.success && response.data) {
        const newComment: CommentType = {
          ...response.data,
          commentId: Number(response.data.commentId) || Date.now(),
          author: response.data.author || {
            username: currentUser?.username || "You",
            profilePictureUrl:
              currentUser?.profilePictureUrl || "/default-avatar.png",
            userId: currentUser?.userId || 0,
            email: "",
            accountStatus: "ACTIVE",
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          tags: [],
        };

        setComments((prev) => [newComment, ...prev]);

        if (selectedTags && selectedTags.length > 0) {
          try {
            const tagModule = await import(
              "@/controllers/userTagController/createUserTagController"
            );

            for (const t of selectedTags) {
              try {
                await tagModule.createUserTagController(accessToken!, {
                  taggedUserId: t.userId,
                  contentType: "COMMENT",
                  contentId: Number(newComment.commentId),
                });
              } catch (tagErr) {
                console.error("Failed to create user tag for", t.username, tagErr);
              }
            }

            await fetchComments(0);
          } catch (err) {
            console.error("Failed to create user tags after posting comment:", err);
            try {
              await fetchComments(0);
            } catch (e) {
              console.error("Failed to refresh comments after tagging error:", e);
            }
          }
        }
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

  /** ✅ Delete Comment */
  const handleDeleteComment = async (commentId: number) => {
    setComments((prev) => prev.filter((c) => c.commentId !== commentId));
  };

  return (
    <section className="w-full mt-1 border-t border-gray-100 dark:border-gray-800 pt-2">
      <div className="flex justify-center">
        <button
          onClick={handleToggle}
          className="flex items-center gap-1.5 px-3 py-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 transition-colors focus:outline-none"
        >
          <MessageSquare size={16} />
          <span className="text-sm">{isExpanded ? "Hide" : "Comments"}</span>
          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      {isExpanded && (
        <div className="mt-2 pt-3 border-t border-gray-100 dark:border-gray-800">
          {error && (
            <div className="mb-3 px-3 py-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20 rounded">
              {error}
            </div>
          )}

          <div className="px-3">
            <CommentInput
              currentUser={{
                username: currentUser?.username || "You",
                profilePictureUrl:
                  currentUser?.profilePictureUrl || "/default-avatar.png",
                userId: currentUser?.userId || 0,
              }}
              onSubmit={handlePostComment}
              isPosting={isPosting}
            />
          </div>

          {isLoading && comments.length === 0 && (
            <div className="space-y-3 mt-3 px-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <CommentSkeleton key={`skeleton-${i}`} />
              ))}
            </div>
          )}

          {!isLoading && comments.length > 0 && (
            <>
              <ul className="space-y-3 mt-3 px-3">
                {comments.map((comment) => (
                  <CommentItem
                    key={comment.commentId}
                    comment={comment}
                    postId={postId}
                    currentUser={{
                      username: currentUser?.username || "You",
                      userId: currentUser?.userId || 0,
                    }}
                    onDelete={handleDeleteComment}
                    onTagDeleted={async () => {
                      try {
                        await fetchComments(0);
                      } catch (e) {
                        console.error("Failed refreshing comments after tag delete", e);
                      }
                    }}
                  />
                ))}
              </ul>

              {page + 1 < totalPages && (
                <div className="text-center mt-3 px-3">
                  <button
                    onClick={handleLoadMore}
                    disabled={isLoading}
                    className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 disabled:opacity-50 transition-colors"
                  >
                    {isLoading ? (
                      <span className="flex items-center gap-1.5 justify-center">
                        <Loader2 size={14} className="animate-spin" />
                        Loading...
                      </span>
                    ) : (
                      "Load more"
                    )}
                  </button>
                </div>
              )}
            </>
          )}

          {!isLoading && comments.length === 0 && !error && (
            <p className="text-gray-400 dark:text-gray-500 text-sm text-center mt-4 px-3">
              No comments yet
            </p>
          )}
        </div>
      )}
    </section>
  );
}
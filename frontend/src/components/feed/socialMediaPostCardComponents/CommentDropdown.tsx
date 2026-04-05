"use client";

import { useState, useRef, useEffect } from "react";
import { MessageSquare, Loader2, Sparkles } from "lucide-react";
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
  const [hasLoadedInitial, setHasLoadedInitial] = useState(false);

  const accessToken = useAccessToken();
  const currentUser = useUserData();
  const lastPostTimestampRef = useRef<number | null>(null);

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
        setHasLoadedInitial(true);
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

  useEffect(() => {
    if (postId && accessToken) {
      fetchComments(0);
    }
  }, [postId, accessToken]);

  const handleLoadMore = async () => {
    if (page + 1 < totalPages) {
      await fetchComments(page + 1);
    }
  };

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

  const handleDeleteComment = async (commentId: number) => {
    setComments((prev) => prev.filter((c) => c.commentId !== commentId));
  };

  return (
    <section className="w-full mt-4">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-gradient-to-br from-steel to-steel-600 dark:from-sky dark:to-steel rounded-lg shadow-sm shadow-steel/20 dark:shadow-sky/15">
            <MessageSquare className="w-5 h-5 text-cream-50" />
          </div>
          <h3 className="text-lg font-bold text-navy dark:text-cream">
            Comments
          </h3>
          {comments.length > 0 && (
            <span className="px-2.5 py-0.5 bg-cream-300/40 dark:bg-navy-700/40 text-navy/70 dark:text-cream/60 text-sm font-semibold rounded-full">
              {comments.length}
            </span>
          )}
        </div>

        {hasLoadedInitial && comments.length > 0 && (
          <div className="flex items-center gap-1 text-xs text-steel/60 dark:text-sky/40">
            <Sparkles className="w-3 h-3" />
            <span>Latest first</span>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 px-4 py-3 text-sm text-red-600 dark:text-red-400 bg-red-50/50 dark:bg-red-900/10 border border-red-200/60 dark:border-red-900/30 rounded-xl backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></div>
            {error}
          </div>
        </div>
      )}

      {/* Comment Input */}
      <div className="mb-6">
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

      {/* Loading Skeletons */}
      {isLoading && !hasLoadedInitial && (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <CommentSkeleton key={`skeleton-${i}`} />
          ))}
        </div>
      )}

      {/* Comments List */}
      {hasLoadedInitial && comments.length > 0 && (
        <div className="space-y-4">
          <ul className="space-y-4">
            {comments.map((comment, index) => (
              <li
                key={comment.commentId}
                className="transform transition-all duration-300 animate-in fade-in slide-in-from-top-2"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <CommentItem
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
              </li>
            ))}
          </ul>

          {/* Load More Button */}
          {page + 1 < totalPages && (
            <div className="flex justify-center pt-4">
              <button
                onClick={handleLoadMore}
                disabled={isLoading}
                className="group relative px-6 py-3 bg-cream-50/80 dark:bg-navy-700/30 hover:bg-steel/10 dark:hover:bg-sky/10 text-navy/70 dark:text-cream/60 rounded-xl font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md transform hover:scale-105 border border-cream-300/40 dark:border-navy-700/40 cursor-pointer"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Loading more comments...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    Load More
                    <div className="w-5 h-5 rounded-full bg-gradient-to-br from-steel to-steel-600 dark:from-sky dark:to-steel flex items-center justify-center text-cream-50 text-xs font-bold group-hover:scale-110 transition-transform">
                      {totalPages - page - 1}
                    </div>
                  </span>
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {hasLoadedInitial && comments.length === 0 && !error && !isLoading && (
        <div className="py-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-cream-300/30 dark:bg-navy-700/30 rounded-2xl flex items-center justify-center border border-cream-300/40 dark:border-navy-700/40">
            <MessageSquare className="w-8 h-8 text-steel/40 dark:text-sky/30" />
          </div>
          <h4 className="text-lg font-semibold text-navy dark:text-cream mb-2">
            No comments yet
          </h4>
          <p className="text-steel/60 dark:text-sky/40 text-sm">
            Be the first to share your thoughts!
          </p>
        </div>
      )}
    </section>
  );
}

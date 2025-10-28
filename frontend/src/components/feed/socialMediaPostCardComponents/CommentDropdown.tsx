"use client";

import { useState } from "react";
import { MessageSquare, ChevronUp, ChevronDown } from "lucide-react";
import { getCommentsForPostController } from "@/controllers/postInteractionController/getCommentsForPostController";
import { addCommentController } from "@/controllers/postInteractionController/addCommentController";
import { CommentsListResponse, CommentItem as CommentType } from "@/lib/types/comment";
import { useAccessToken } from "@/hooks/useAccessToken";

import CommentItem from "./comments/CommentItem";
import CommentInput from "./comments/CommentInput";
import CommentSkeleton from "@/components/loading/CommentSkeleton";

interface CommentSectionProps {
  postId: number;
  currentUser?: {
    username: string;
    profilePictureUrl: string;
  };
}

export function CommentSection({
  postId,
  currentUser = {
    username: "You",
    profilePictureUrl: "/default-avatar.png",
  },
}: CommentSectionProps) {
  const [comments, setComments] = useState<CommentType[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const accessToken = useAccessToken();

  const fetchComments = async (pageNumber: number) => {
    if (!accessToken) {
      setError("Missing access token. Please log in again.");
      return;
    }

    setIsLoading(true);
    try {
      const response: CommentsListResponse = await getCommentsForPostController(
        postId,
        accessToken,
        pageNumber,
        5,
        "createdAt,desc"
      );

      if (response.success && response.data?.content) {
        setComments((prev) =>
          pageNumber > 0 ? [...prev, ...response.data!.content] : response.data!.content
        );
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
    if (!isExpanded) {
      setIsExpanded(true);
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

  const handlePostComment = async (body: string) => {
    if (!accessToken) {
      setError("You must be logged in to comment.");
      return;
    }

    setIsPosting(true);
    try {
      const response = await addCommentController(postId, accessToken, { body });

      if (response.success && response.data) {
        const newComment: CommentType = {
          ...response.data,
          author: response.data.author || {
            username: currentUser.username,
            profilePictureUrl: currentUser.profilePictureUrl,
            userId: 0,
            email: "",
            accountStatus: "ACTIVE",
          },
          body,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          tags: [],
        };

        setComments((prev) => [newComment, ...prev]);
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
      <div className="flex justify-center">
        <button
          onClick={handleToggle}
          className="flex items-center justify-center gap-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 focus:outline-none"
        >
          <MessageSquare size={18} />
          <p className="text-sm">{isExpanded ? "Hide Comments" : "Show Comments"}</p>
          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {isExpanded && (
        <div className="mt-3 p-4 w-full border-t border-gray-100 dark:border-gray-800">
          {error && <p className="text-red-600 text-sm">{error}</p>}

          <CommentInput
            currentUser={currentUser}
            onSubmit={handlePostComment}
            isPosting={isPosting}
          />

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
                  <CommentItem key={comment.commentId} comment={comment} postId={postId} />
                ))}
              </ul>

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

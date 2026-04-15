"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MessageSquare, Loader2, Sparkles } from "lucide-react";
import { getCommentsForBlogController } from "@/controllers/blogInteractionController/getCommentsForBlogController";
import { addBlogCommentController } from "@/controllers/blogInteractionController/addBlogCommentController";
import { deleteBlogCommentController } from "@/controllers/blogInteractionController/deleteBlogCommentController";
import { CommentsListResponse, CommentItem as CommentType } from "@/lib/types/comment";
import { useAccessToken } from "@/hooks/useAccessToken";
import { parseUTC } from "@/lib/utils/parseUTC";
import { useUserData } from "@/hooks/useUserData";
import CommentInput from "@/components/feed/socialMediaPostCardComponents/comments/CommentInput";
import CommentSkeleton from "@/components/loading/CommentSkeleton";
import Image from "next/image";
import { MoreVertical, Trash2 } from "lucide-react";
import { BlogCommentActions } from "./BlogCommentActions";

interface BlogCommentSectionProps {
  blogId: number;
}

export function BlogCommentSection({ blogId }: BlogCommentSectionProps) {
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
    if (!accessToken) return;
    setIsLoading(true);
    setError(null);
    try {
      const response: CommentsListResponse = await getCommentsForBlogController(blogId, accessToken, pageNumber, 5);
      if (response.success && response.data?.content) {
        const fetched = response.data.content.map((c) => ({ ...c, commentId: Number(c.commentId) }));
        setComments((prev) => (pageNumber > 0 ? [...prev, ...fetched] : fetched));
        setTotalPages(response.data.totalPages || 1);
        setPage(pageNumber);
        setHasLoadedInitial(true);
      } else {
        setError(response.message || "Failed to load comments");
      }
    } catch {
      setError("Unexpected error fetching comments");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (blogId && accessToken) fetchComments(0);
  }, [blogId, accessToken]);

  const handlePostComment = async (body: string) => {
    if (!accessToken) return;
    const now = Date.now();
    if (lastPostTimestampRef.current && now - lastPostTimestampRef.current < 3000) {
      setError("Please wait a moment before posting again.");
      return;
    }
    lastPostTimestampRef.current = now;
    setIsPosting(true);
    setError(null);
    try {
      const response = await addBlogCommentController(blogId, accessToken, { body });
      if (response.success && response.data) {
        const newComment: CommentType = {
          ...response.data,
          commentId: Number(response.data.commentId) || Date.now(),
          author: response.data.author || {
            username: currentUser?.username || "You",
            profilePictureUrl: currentUser?.profilePictureUrl || "/default-avatar.png",
            userId: currentUser?.userId || 0,
            email: "",
            accountStatus: "ACTIVE",
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          tags: [],
        };
        setComments((prev) => [newComment, ...prev]);
      } else {
        setError(response.message || "Failed to post comment");
      }
    } catch {
      setError("Unexpected error while posting comment");
    } finally {
      setIsPosting(false);
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    if (!accessToken) return;
    try {
      const res = await deleteBlogCommentController(blogId, commentId, accessToken);
      if (res.success) {
        setComments((prev) => prev.filter((c) => c.commentId !== commentId));
      }
    } catch {
      console.error("Failed to delete comment");
    }
  };

  return (
    <section className="w-full mt-4">
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-gradient-to-br from-steel to-steel-600 dark:from-sky dark:to-steel rounded-lg shadow-sm shadow-steel/20 dark:shadow-sky/15">
            <MessageSquare className="w-5 h-5 text-cream-50" />
          </div>
          <h3 className="text-lg font-display font-bold text-heading">Comments</h3>
          {comments.length > 0 && (
            <span className="px-2.5 py-0.5 bg-steel/10 dark:bg-sky/10 text-steel dark:text-sky text-sm font-semibold rounded-full">
              {comments.length}
            </span>
          )}
        </div>
        {hasLoadedInitial && comments.length > 0 && (
          <div className="flex items-center gap-1 text-xs text-steel/50 dark:text-sky/40">
            <Sparkles className="w-3 h-3" />
            <span>Latest first</span>
          </div>
        )}
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 rounded-xl">
          {error}
        </div>
      )}

      <div className="mb-6">
        <CommentInput
          currentUser={{
            username: currentUser?.username || "You",
            profilePictureUrl: currentUser?.profilePictureUrl || "/default-avatar.png",
            userId: currentUser?.userId || 0,
          }}
          onSubmit={handlePostComment}
          isPosting={isPosting}
        />
      </div>

      {isLoading && !hasLoadedInitial && (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (<CommentSkeleton key={i} />))}
        </div>
      )}

      {hasLoadedInitial && comments.length > 0 && (
        <div className="space-y-4">
          <ul className="space-y-4">
            {comments.map((comment) => (
              <li key={comment.commentId}>
                <BlogCommentItem
                  comment={comment}
                  blogId={blogId}
                  currentUserId={currentUser?.userId}
                  onDelete={handleDeleteComment}
                />
              </li>
            ))}
          </ul>
          {page + 1 < totalPages && (
            <div className="flex justify-center pt-4">
              <button onClick={() => fetchComments(page + 1)} disabled={isLoading}
                className="px-6 py-3 bg-surface-alt hover:bg-steel/10 dark:hover:bg-sky/10 text-heading rounded-xl font-semibold transition-all shadow-sm hover:shadow-md border border-border-default cursor-pointer">
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Load More"}
              </button>
            </div>
          )}
        </div>
      )}

      {hasLoadedInitial && comments.length === 0 && !error && !isLoading && (
        <div className="py-12 text-center">
          <MessageSquare className="w-8 h-8 mx-auto mb-4 text-steel/40 dark:text-sky/30" />
          <h4 className="text-lg font-display font-semibold text-heading mb-2">No comments yet</h4>
          <p className="text-steel/60 dark:text-sky/50 text-sm">Be the first to share your thoughts!</p>
        </div>
      )}
    </section>
  );
}

function BlogCommentItem({
  comment,
  blogId,
  currentUserId,
  onDelete,
}: {
  comment: CommentType;
  blogId: number;
  currentUserId?: number;
  onDelete: (commentId: number) => void;
}) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const isAuthor = currentUserId === comment.author.userId;

  return (
    <article className="group flex items-start gap-3 p-3 bg-cream-50/50 dark:bg-navy-700/30 rounded-xl border border-border-subtle hover:shadow-sm transition-all">
      <Image
        src={comment.author.profilePictureUrl || "/default-avatar.png"}
        alt={comment.author.username}
        width={36}
        height={36}
        onClick={() => router.push(`/profile/${comment.author.userId}`)}
        className="w-9 h-9 rounded-full object-cover border border-cream-300/40 dark:border-navy-600/40 cursor-pointer hover:opacity-80 transition-opacity"
      />
      <div className="flex-1">
        <header className="flex items-start justify-between">
          <div>
            <div
              onClick={() => router.push(`/profile/${comment.author.userId}`)}
              className="text-sm font-semibold text-heading cursor-pointer hover:underline hover:text-steel dark:hover:text-sky transition-colors"
            >
              {comment.author.username}
            </div>
            <time className="text-xs text-steel/50 dark:text-sky/40">{parseUTC(comment.createdAt).toLocaleString()}</time>
          </div>
          {isAuthor && (
            <div className="relative">
              <button onClick={() => setMenuOpen(!menuOpen)} className="p-1.5 rounded-full hover:bg-surface-hover cursor-pointer">
                <MoreVertical size={18} className="text-steel/50 dark:text-sky/40" />
              </button>
              {menuOpen && (
                <div className="absolute right-0 mt-2 w-40 bg-cream-50 dark:bg-navy-700 border border-cream-300/40 dark:border-navy-600/40 rounded-lg shadow-lg z-50">
                  <button
                    onClick={() => { onDelete(comment.commentId); setMenuOpen(false); }}
                    className="flex items-center gap-2 px-3 py-2 w-full text-left text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 text-sm cursor-pointer"
                  >
                    <Trash2 size={14} /> Delete
                  </button>
                </div>
              )}
            </div>
          )}
        </header>
        <p className="mt-1 text-sm text-navy/80 dark:text-cream/80">{comment.body}</p>
        <BlogCommentActions blogId={blogId} commentId={comment.commentId} />
      </div>
    </article>
  );
}

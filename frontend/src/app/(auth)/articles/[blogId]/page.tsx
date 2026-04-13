"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { useAccessToken } from "@/hooks/useAccessToken";
import { useUserData } from "@/hooks/useUserData";
import { getBlogByIdController } from "@/controllers/blog/getBlogByIdController";
import { deleteBlogController } from "@/controllers/blog/deleteBlogController";
import { BlogDetailResponse } from "@/lib/types/blogDetail";
import {
  ArrowLeft,
  Trash2,
  Clock,
  MapPin,
  Loader2,
  X,
  User,
  BookOpen,
  Bookmark,
  ShieldAlert,
  Pencil,
} from "lucide-react";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { BlogActions } from "@/components/articles/BlogActions";
import { BlogCommentSection } from "@/components/articles/BlogCommentSection";
import { BlogSaveButton } from "@/components/articles/BlogSaveButton";
import DeleteConfirmationModal from "@/components/common/DeleteConfirmationModal";
import { hardDeleteBlogController } from "@/controllers/blog/hardDeleteBlogController";
import { updateBlogStatusController } from "@/controllers/blog/updateBlogStatusController";
import toast from "react-hot-toast";

export default function BlogDetailPage() {
  const params = useParams();
  const router = useRouter();
  const accessToken = useAccessToken();
  const currentUser = useUserData();
  const blogId = parseInt(params.blogId as string);

  const [blog, setBlog] = useState<BlogDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showHardDeleteModal, setShowHardDeleteModal] = useState(false);
  const [isHardDeleting, setIsHardDeleting] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const isAdmin = currentUser?.role === "ADMIN";

  const fetchBlog = useCallback(async () => {
    if (!accessToken || isNaN(blogId)) return;
    setLoading(true);
    setError(null);
    try {
      const res = await getBlogByIdController(accessToken, blogId);
      if (res.success && res.data) {
        setBlog(res.data);
      } else {
        setError(res.message || "Failed to load article.");
      }
    } catch {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  }, [accessToken, blogId]);

  useEffect(() => {
    if (blogId > 0) fetchBlog();
  }, [blogId, fetchBlog]);

  const handleDelete = async () => {
    if (!accessToken) return;
    setIsDeleting(true);
    try {
      const res = await deleteBlogController(accessToken, blogId);
      if (res.success) {
        router.push("/articles");
      } else {
        setError(res.message || "Failed to delete article.");
      }
    } catch {
      setError("Failed to delete article.");
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const handleHardDelete = async () => {
    if (!accessToken) return;
    setIsHardDeleting(true);
    try {
      const res = await hardDeleteBlogController(accessToken, blogId);
      if (res.success) {
        toast.success(res.message || "Blog permanently deleted.");
        router.push("/articles");
      } else {
        toast.error(res.message || "Failed to permanently delete article.");
      }
    } catch {
      toast.error("Failed to permanently delete article.");
    } finally {
      setIsHardDeleting(false);
      setShowHardDeleteModal(false);
    }
  };

  const handleStatusUpdate = async (status: BlogDetailResponse["blogStatus"]) => {
    if (!accessToken || !blog || blog.blogStatus === status) return;
    setIsUpdatingStatus(true);
    try {
      const res = await updateBlogStatusController(accessToken, blogId, status);
      if (res.success) {
        toast.success(res.message || "Blog status updated.");
        await fetchBlog();
      } else {
        toast.error(res.message || "Failed to update blog status.");
      }
    } catch {
      toast.error("Failed to update blog status.");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  if (isNaN(blogId) || blogId <= 0) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-navy dark:text-cream mb-2">
            Invalid Article ID
          </h1>
          <button
            onClick={() => router.push("/articles")}
            className="px-4 py-2 bg-steel text-cream-50 dark:bg-sky dark:text-navy rounded-xl font-medium"
          >
            Back to Articles
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-steel dark:text-sky" />
      </div>
    );
  }

  if (error || !blog) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="text-center p-8 bg-cream-50 dark:bg-navy-700/50 rounded-2xl border border-cream-300/40 dark:border-navy-700/40 max-w-lg">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/20 mx-auto mb-4">
            <X className="w-6 h-6 text-red-500" />
          </div>
          <h3 className="text-lg font-bold mb-2 text-navy dark:text-cream">
            Error Loading Article
          </h3>
          <p className="text-sm text-steel dark:text-sky/60 mb-6">{error}</p>
          <button
            onClick={fetchBlog}
            className="px-6 py-2 bg-steel text-cream-50 dark:bg-sky dark:text-navy rounded-xl font-semibold"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const isAuthor = currentUser?.userId === blog.author.userId;
  const canDelete = isAuthor || currentUser?.role === "ADMIN";
  const hasMedia = blog.media.length > 0;

  return (
    <>
      <div className="w-full relative">
        {/* Ambient background glows */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
          <div className="absolute top-32 right-1/4 w-[400px] h-[400px] bg-steel/[0.04] dark:bg-steel/[0.03] rounded-full blur-[100px]" />
          <div className="absolute bottom-1/3 left-[10%] w-80 h-80 bg-sky/[0.05] dark:bg-sky/[0.02] rounded-full blur-[80px]" />
        </div>

        {/* ── Hero Section ── */}
        <div className="relative w-full overflow-hidden rounded-2xl">
          {/* Hero Image or Gradient */}
          <div
            className={`relative w-full ${hasMedia ? "h-[28rem]" : "h-56"} overflow-hidden`}
          >
            {hasMedia ? (
              <Image
                src={blog.media[0].mediaUrl}
                alt={blog.title}
                fill
                className="object-cover"
                priority
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-steel/20 via-sky/10 to-steel/5 dark:from-steel/30 dark:via-sky/15 dark:to-navy" />
            )}

            {/* Gradient overlay for text readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-navy/90 via-navy/40 to-transparent" />

            {/* Top bar: back + actions — floating on the hero */}
            <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-6 py-4">
              <button
                onClick={() => router.back()}
                className="inline-flex items-center gap-2 text-sm font-medium text-cream-50/90 hover:text-cream-50 transition-colors cursor-pointer bg-navy/30 backdrop-blur-sm px-3 py-1.5 rounded-xl"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
              <div className="flex items-center gap-2">
                <div className="bg-navy/30 backdrop-blur-sm rounded-xl">
                  <BlogSaveButton blogId={blogId} />
                </div>
                {isAuthor && (
                  <button
                    onClick={() => router.push(`/articles/${blogId}/edit`)}
                    className="p-2 text-cream-50/80 hover:text-cream-50 bg-navy/30 backdrop-blur-sm rounded-xl transition-colors cursor-pointer"
                  >
                    <Pencil className="w-5 h-5" />
                  </button>
                )}
                {canDelete && (
                  <button
                    onClick={() => setShowDeleteModal(true)}
                    className="p-2 text-red-400 hover:text-red-300 bg-navy/30 backdrop-blur-sm rounded-xl transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>

            {/* Title + meta overlaid at the bottom of the hero */}
            <div className="absolute bottom-0 left-0 right-0 px-6 pb-16 z-10">
              <div className="max-w-3xl">
                <div className="flex items-center gap-2 mb-3">
                  <span
                    className={`text-[10px] font-bold tracking-wider px-2.5 py-1 rounded-full backdrop-blur-sm ${
                      blog.blogStatus === "PUBLISHED"
                        ? "bg-emerald-500/20 text-emerald-300"
                        : blog.blogStatus === "APPROVAL_PENDING"
                        ? "bg-blue-500/20 text-blue-300"
                        : blog.blogStatus === "FLAGGED"
                        ? "bg-orange-500/20 text-orange-300"
                        : blog.blogStatus === "REJECTED"
                        ? "bg-red-500/20 text-red-300"
                        : blog.blogStatus === "ARCHIVED"
                        ? "bg-gray-500/20 text-gray-300"
                        : "bg-amber-500/20 text-amber-300"
                    }`}
                  >
                    {blog.blogStatus === "APPROVAL_PENDING" ? "PENDING" : blog.blogStatus}
                  </span>
                  {blog.categories.map((cat) => (
                    <span
                      key={cat.categoryId}
                      className="text-[10px] font-semibold tracking-wider px-2.5 py-1 rounded-full bg-cream-50/10 text-cream-50/80 backdrop-blur-sm"
                    >
                      {cat.name}
                    </span>
                  ))}
                </div>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-cream-50 leading-tight drop-shadow-lg">
                  {blog.title}
                </h1>
              </div>
            </div>
          </div>

          {/* ── Floating Author Card ── overlaps the hero bottom */}
          <div className="relative -mt-10 z-20 mx-4 sm:mx-6">
            <div className="max-w-3xl mx-auto flex items-center justify-between gap-4 bg-cream-50/90 dark:bg-navy-700/90 backdrop-blur-md rounded-2xl px-5 py-4 border border-cream-300/40 dark:border-navy-600/40 shadow-lg shadow-navy/[0.06] dark:shadow-black/20">
              <div className="flex items-center gap-3">
                <div
                  onClick={() =>
                    router.push(`/profile/${blog.author.userId}`)
                  }
                  className="relative w-11 h-11 rounded-full overflow-hidden bg-cream-300 dark:bg-navy-600 flex-shrink-0 ring-2 ring-steel/20 dark:ring-sky/20 cursor-pointer hover:ring-steel/50 dark:hover:ring-sky/40 transition-all"
                >
                  <Image
                    src={blog.author.profilePictureUrl}
                    alt={blog.author.username}
                    fill
                    className="object-cover"
                  />
                </div>
                <div>
                  <p
                    onClick={() =>
                      router.push(`/profile/${blog.author.userId}`)
                    }
                    className="text-sm font-bold text-navy dark:text-cream cursor-pointer hover:text-steel dark:hover:text-sky transition-colors hover:underline"
                  >
                    {blog.author.username}
                  </p>
                  <div className="flex items-center gap-3 flex-wrap text-[11px] text-steel/60 dark:text-sky/40">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDistanceToNow(new Date(blog.createdAt), {
                        addSuffix: true,
                      })}
                    </span>
                    <span className="flex items-center gap-1">
                      <BookOpen className="w-3 h-3" />
                      {blog.readTimeMinutes} min read
                    </span>
                    <span>{blog.wordCount} words</span>
                    {blog.viewCount > 0 && (
                      <span>{blog.viewCount} view{blog.viewCount !== 1 ? "s" : ""}</span>
                    )}
                  </div>
                </div>
              </div>

              {blog.location && (
                <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-steel/60 dark:text-sky/40">
                  <MapPin className="w-3.5 h-3.5 text-red-500" />
                  <span>{blog.location.name}</span>
                </div>
              )}
            </div>
          </div>

          {/* ── Admin Controls ── */}
          {isAdmin && (
            <div className="max-w-3xl mx-auto mt-4">
              <div className="p-4 rounded-xl bg-amber-500/5 dark:bg-amber-500/5 border border-amber-500/20 dark:border-amber-500/20">
                <div className="flex items-center gap-2 mb-3">
                  <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <span className="text-[11px] font-bold tracking-wider text-amber-700 dark:text-amber-400 uppercase">
                    Admin Controls
                  </span>
                </div>

                {/* Status pills */}
                <div className="mb-3">
                  <p className="text-[11px] font-medium text-steel/60 dark:text-sky/40 mb-2">
                    Blog Status
                  </p>
                  <div className="flex items-center gap-2 flex-wrap">
                    {(["PUBLISHED", "DRAFT", "APPROVAL_PENDING", "FLAGGED", "REJECTED", "ARCHIVED"] as const).map((status) => {
                      const isActive = blog.blogStatus === status;
                      return (
                        <button
                          key={status}
                          onClick={() => handleStatusUpdate(status)}
                          disabled={isUpdatingStatus || isActive}
                          className={`px-3 py-1.5 text-xs font-semibold rounded-full border transition-colors cursor-pointer disabled:cursor-not-allowed ${
                            isActive
                              ? "bg-steel/10 dark:bg-sky/10 border-steel/30 dark:border-sky/30 text-navy dark:text-cream"
                              : "bg-cream-100/40 dark:bg-navy-700/20 border-cream-300/40 dark:border-navy-600/40 text-steel/60 dark:text-sky/40 hover:bg-steel/5 dark:hover:bg-sky/5"
                          }`}
                        >
                          {isUpdatingStatus && blog.blogStatus !== status ? (
                            <span className="flex items-center gap-1.5">
                              <Loader2 className="w-3 h-3 animate-spin" />
                              {status}
                            </span>
                          ) : (
                            status
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Hard delete */}
                <div className="pt-3 border-t border-amber-500/10 dark:border-amber-500/10">
                  <button
                    onClick={() => setShowHardDeleteModal(true)}
                    disabled={isHardDeleting}
                    className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl bg-red-600/10 dark:bg-red-600/10 border border-red-600/20 dark:border-red-600/20 text-red-600 dark:text-red-400 hover:bg-red-600/20 dark:hover:bg-red-600/20 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ShieldAlert className="w-4 h-4" />
                    Hard Delete (Permanent)
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Content Area ── no card wrapper, open flowing layout */}
        <div className="max-w-3xl mx-auto px-4 sm:px-6 mt-8 space-y-8">
          {/* Summary callout */}
          {blog.summary && (
            <blockquote className="relative pl-5 border-l-[3px] border-steel dark:border-sky bg-steel/[0.04] dark:bg-sky/[0.04] rounded-r-xl py-4 pr-5 italic text-navy/75 dark:text-cream/70 text-[15px] leading-relaxed">
              {blog.summary}
            </blockquote>
          )}

          {/* Tags */}
          {blog.tags && blog.tags.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              {blog.tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="text-xs font-medium px-2.5 py-1 rounded-full bg-steel/[0.06] dark:bg-sky/[0.06] text-steel dark:text-sky/70 border border-steel/10 dark:border-sky/10"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Article body */}
          <div className="prose dark:prose-invert max-w-none text-navy/80 dark:text-cream/80 leading-relaxed text-[16.5px]">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {blog.body}
            </ReactMarkdown>
          </div>

          {/* Meta info: reviewer, updated date */}
          {(blog.reviewer || blog.updatedAt !== blog.createdAt) && (
            <div className="flex items-center gap-4 flex-wrap text-[11px] text-steel/50 dark:text-sky/35">
              {blog.updatedAt && blog.updatedAt !== blog.createdAt && (
                <span>
                  Updated {formatDistanceToNow(new Date(blog.updatedAt), { addSuffix: true })}
                </span>
              )}
              {blog.reviewer && (
                <span>
                  Reviewed by{" "}
                  <span className="font-semibold text-steel/70 dark:text-sky/50">
                    {blog.reviewer.username}
                  </span>
                  {blog.reviewedAt && (
                    <> {formatDistanceToNow(new Date(blog.reviewedAt), { addSuffix: true })}</>
                  )}
                </span>
              )}
            </div>
          )}

          {/* Gradient divider */}
          <div className="h-px bg-gradient-to-r from-transparent via-cream-400/30 dark:via-navy-700/40 to-transparent" />

          {/* Reactions */}
          <BlogActions blogId={blogId} />

          {/* Gradient divider */}
          <div className="h-px bg-gradient-to-r from-transparent via-cream-400/30 dark:via-navy-700/40 to-transparent" />

          {/* Comments */}
          <BlogCommentSection blogId={blogId} />
        </div>
      </div>

      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteModal(false)}
        isDeleting={isDeleting}
      />

      <DeleteConfirmationModal
        isOpen={showHardDeleteModal}
        onConfirm={handleHardDelete}
        onCancel={() => setShowHardDeleteModal(false)}
        isDeleting={isHardDeleting}
        title="Permanently Delete Article"
        message="This will permanently delete this article and all associated data. This action cannot be undone."
      />
    </>
  );
}

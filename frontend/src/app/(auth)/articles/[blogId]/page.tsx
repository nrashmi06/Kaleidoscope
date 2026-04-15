"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect, useCallback, useRef } from "react";
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
  BookOpen,
  Pencil,
  ShieldAlert,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
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
import { parseUTC } from "@/lib/utils/parseUTC";

const STATUS_OPTIONS: { value: BlogDetailResponse["blogStatus"]; label: string; color: string }[] = [
  { value: "PUBLISHED",        label: "Published",  color: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20" },
  { value: "DRAFT",            label: "Draft",      color: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20" },
  { value: "APPROVAL_PENDING", label: "Pending",    color: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20" },
  { value: "FLAGGED",          label: "Flagged",    color: "bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20" },
  { value: "REJECTED",         label: "Rejected",   color: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20" },
  { value: "ARCHIVED",         label: "Archived",   color: "bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20" },
];

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
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);
  const statusRef = useRef<HTMLDivElement>(null);

  const isAdmin = currentUser?.role === "ADMIN";

  // Close status dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (statusRef.current && !statusRef.current.contains(e.target as Node)) {
        setStatusDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

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
    setStatusDropdownOpen(false);
    setIsUpdatingStatus(true);
    try {
      const res = await updateBlogStatusController(accessToken, blogId, status);
      if (res.success) {
        toast.success(res.message || "Status updated.");
        await fetchBlog();
      } else {
        toast.error(res.message || "Failed to update status.");
      }
    } catch {
      toast.error("Failed to update status.");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // ── Guards ──

  if (isNaN(blogId) || blogId <= 0) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-heading mb-2">Invalid Article ID</h1>
          <button onClick={() => router.push("/articles")} className="px-5 py-2 bg-btn-primary text-on-primary rounded-full font-medium cursor-pointer">
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
        <div className="text-center p-8 bg-surface-alt rounded-2xl border border-border-default max-w-lg">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/20 mx-auto mb-4">
            <X className="w-6 h-6 text-red-500" />
          </div>
          <h3 className="text-lg font-bold mb-2 text-heading">Error Loading Article</h3>
          <p className="text-sm text-muted mb-6">{error}</p>
          <button onClick={fetchBlog} className="px-6 py-2 bg-btn-primary text-on-primary rounded-full font-semibold cursor-pointer">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const isAuthor = currentUser?.userId === blog.author.userId;
  const canDelete = isAuthor || isAdmin;
  const hasMedia = blog.media.length > 0;
  const currentStatus = STATUS_OPTIONS.find((s) => s.value === blog.blogStatus) ?? STATUS_OPTIONS[0];

  return (
    <>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* ── Top bar ── */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 text-sm font-medium text-sub hover:text-heading transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <div className="flex items-center gap-2">
            <BlogSaveButton blogId={blogId} />
            {isAuthor && (
              <button
                onClick={() => router.push(`/articles/${blogId}/edit`)}
                className="p-2 rounded-full text-sub hover:text-heading hover:bg-surface-hover transition-colors cursor-pointer"
              >
                <Pencil className="w-[18px] h-[18px]" />
              </button>
            )}
            {canDelete && (
              <button
                onClick={() => setShowDeleteModal(true)}
                className="p-2 rounded-full text-red-500/60 hover:text-red-500 hover:bg-red-500/5 transition-colors cursor-pointer"
              >
                <Trash2 className="w-[18px] h-[18px]" />
              </button>
            )}
          </div>
        </div>

        {/* ── Media Gallery Card ── */}
        {hasMedia && (
          <div className="relative w-full overflow-hidden rounded-2xl bg-navy-700/5 dark:bg-navy-700/30">
            <div className="relative aspect-[16/10] sm:aspect-[16/9]">
              <Image
                src={blog.media[activeMediaIndex].mediaUrl}
                alt={`${blog.title} — image ${activeMediaIndex + 1}`}
                fill
                className="object-contain"
                priority={activeMediaIndex === 0}
              />
            </div>

            {/* Gallery navigation arrows */}
            {blog.media.length > 1 && (
              <>
                <button
                  onClick={() => setActiveMediaIndex((p) => Math.max(0, p - 1))}
                  disabled={activeMediaIndex === 0}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm hover:bg-black/60 disabled:opacity-30 transition-all cursor-pointer"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setActiveMediaIndex((p) => Math.min(blog.media.length - 1, p + 1))}
                  disabled={activeMediaIndex === blog.media.length - 1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm hover:bg-black/60 disabled:opacity-30 transition-all cursor-pointer"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
                {/* Dot indicators */}
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
                  {blog.media.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveMediaIndex(i)}
                      className={`rounded-full transition-all cursor-pointer ${
                        i === activeMediaIndex
                          ? "w-6 h-2 bg-white"
                          : "w-2 h-2 bg-white/40 hover:bg-white/70"
                      }`}
                    />
                  ))}
                </div>
              </>
            )}

            {/* Image counter */}
            {blog.media.length > 1 && (
              <span className="absolute top-3 right-3 px-2.5 py-1 text-xs font-bold rounded-full bg-black/50 text-white backdrop-blur-sm">
                {activeMediaIndex + 1} / {blog.media.length}
              </span>
            )}
          </div>
        )}

        {/* ── Article Card ── */}
        <div className="bg-surface-alt rounded-2xl border border-border-default p-6 sm:p-8 space-y-6">
          {/* Status + Categories row */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-[11px] font-bold tracking-wider px-2.5 py-1 rounded-full border ${currentStatus.color}`}>
              {currentStatus.label.toUpperCase()}
            </span>
            {blog.categories.map((cat) => (
              <span
                key={cat.categoryId}
                className="text-[11px] font-semibold tracking-wider px-2.5 py-1 rounded-full bg-steel/[0.06] dark:bg-sky/[0.06] text-steel dark:text-sky/70 border border-steel/10 dark:border-sky/10"
              >
                {cat.name}
              </span>
            ))}
          </div>

          {/* Title */}
          <h1 className="text-2xl sm:text-3xl font-extrabold text-heading leading-tight">
            {blog.title}
          </h1>

          {/* Author row */}
          <div className="flex items-center gap-3">
            <div
              onClick={() => router.push(`/profile/${blog.author.userId}`)}
              className="relative w-10 h-10 rounded-full overflow-hidden bg-cream-300 dark:bg-navy-600 flex-shrink-0 ring-2 ring-border-default cursor-pointer hover:ring-steel/40 dark:hover:ring-sky/40 transition-all"
            >
              <Image src={blog.author.profilePictureUrl} alt={blog.author.username} fill className="object-cover" />
            </div>
            <div className="min-w-0">
              <p
                onClick={() => router.push(`/profile/${blog.author.userId}`)}
                className="text-sm font-bold text-heading cursor-pointer hover:text-steel dark:hover:text-sky transition-colors"
              >
                {blog.author.username}
              </p>
              <div className="flex items-center gap-3 text-[11px] text-muted flex-wrap">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatDistanceToNow(parseUTC(blog.createdAt), { addSuffix: true })}
                </span>
                <span className="flex items-center gap-1">
                  <BookOpen className="w-3 h-3" />
                  {blog.readTimeMinutes} min read
                </span>
                <span>{blog.wordCount} words</span>
                {blog.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-red-500" />
                    {blog.location.name}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Summary */}
          {blog.summary && (
            <blockquote className="relative pl-5 border-l-[3px] border-steel dark:border-sky bg-steel/[0.03] dark:bg-sky/[0.03] rounded-r-xl py-4 pr-5 italic text-sub text-[15px] leading-relaxed">
              {blog.summary}
            </blockquote>
          )}

          {/* Tags (linked blogs) */}
          {blog.tags && blog.tags.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              {blog.tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="text-xs font-medium px-2.5 py-1 rounded-full bg-steel/[0.06] dark:bg-sky/[0.06] text-steel dark:text-sky/70 border border-steel/10 dark:border-sky/10"
                >
                  #{typeof tag === "string" ? tag : tag.title}
                </span>
              ))}
            </div>
          )}

          {/* Divider */}
          <div className="h-px bg-border-subtle" />

          {/* Article body */}
          <div className="prose dark:prose-invert max-w-none text-navy/80 dark:text-cream/80 leading-relaxed text-[16.5px]">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{blog.body}</ReactMarkdown>
          </div>

          {/* Meta: reviewer + updated */}
          {(blog.reviewer || blog.updatedAt !== blog.createdAt) && (
            <div className="flex items-center gap-4 flex-wrap text-[11px] text-faint pt-2">
              {blog.updatedAt && blog.updatedAt !== blog.createdAt && (
                <span>Updated {formatDistanceToNow(parseUTC(blog.updatedAt), { addSuffix: true })}</span>
              )}
              {blog.reviewer && (
                <span>
                  Reviewed by{" "}
                  <span className="font-semibold text-muted">{blog.reviewer.username}</span>
                  {blog.reviewedAt && (
                    <> {formatDistanceToNow(parseUTC(blog.reviewedAt), { addSuffix: true })}</>
                  )}
                </span>
              )}
            </div>
          )}
        </div>

        {/* ── Admin Controls Card ── */}
        {isAdmin && (
          <div className="bg-surface-alt rounded-2xl border border-amber-500/20 p-5 space-y-4">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span className="text-[11px] font-bold tracking-wider text-amber-700 dark:text-amber-400 uppercase">
                Admin Controls
              </span>
            </div>

            <div className="flex items-center gap-4 flex-wrap">
              {/* Status dropdown */}
              <div ref={statusRef} className="relative">
                <button
                  onClick={() => setStatusDropdownOpen((v) => !v)}
                  disabled={isUpdatingStatus}
                  className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-full border transition-colors cursor-pointer disabled:opacity-60 ${currentStatus.color}`}
                >
                  {isUpdatingStatus && <Loader2 className="w-3 h-3 animate-spin" />}
                  {currentStatus.label}
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${statusDropdownOpen ? "rotate-180" : ""}`} />
                </button>

                {statusDropdownOpen && (
                  <div className="absolute top-full left-0 mt-2 w-48 bg-cream-50 dark:bg-navy-700 border border-border-default rounded-xl shadow-xl shadow-black/[0.08] dark:shadow-black/30 z-50 py-1 overflow-hidden">
                    {STATUS_OPTIONS.map((opt) => {
                      const isActive = blog.blogStatus === opt.value;
                      return (
                        <button
                          key={opt.value}
                          onClick={() => handleStatusUpdate(opt.value)}
                          disabled={isActive}
                          className={`w-full px-4 py-2.5 text-left text-xs font-medium transition-colors cursor-pointer disabled:cursor-default flex items-center justify-between ${
                            isActive
                              ? "bg-steel/5 dark:bg-sky/5 text-heading font-bold"
                              : "text-sub hover:bg-surface-hover"
                          }`}
                        >
                          {opt.label}
                          {isActive && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-steel/10 dark:bg-sky/10 text-steel dark:text-sky">
                              Current
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Hard delete */}
              <button
                onClick={() => setShowHardDeleteModal(true)}
                disabled={isHardDeleting}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-full bg-red-600/10 border border-red-600/20 text-red-600 dark:text-red-400 hover:bg-red-600/20 transition-colors cursor-pointer disabled:opacity-50"
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                Hard Delete
              </button>
            </div>
          </div>
        )}

        {/* ── Reactions ── */}
        <BlogActions blogId={blogId} />

        {/* ── Divider ── */}
        <div className="h-px bg-gradient-to-r from-transparent via-border-default to-transparent" />

        {/* ── Comments ── */}
        <BlogCommentSection blogId={blogId} />
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

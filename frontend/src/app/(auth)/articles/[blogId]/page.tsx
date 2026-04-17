"use client";

import React from "react";
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
  Share2,
} from "lucide-react";
import Image from "next/image";
import { formatDistanceToNow, format } from "date-fns";
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

function ReadingProgressBar() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    function onScroll() {
      const el = document.documentElement;
      const scrollTop = el.scrollTop;
      const scrollHeight = el.scrollHeight - el.clientHeight;
      setProgress(scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-[3px]">
      <div
        className="h-full bg-gradient-to-r from-steel via-sky to-steel dark:from-sky dark:via-steel dark:to-sky transition-[width] duration-150 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}

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
  const statusRef = useRef<HTMLDivElement>(null);

  const isAdmin = currentUser?.role === "ADMIN";

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
    if (!accessToken || !blog || blog.blogStatus === status) return; // uses original blog state
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

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: blog?.title ?? "", url });
      } catch { /* user cancelled */ }
    } else {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard");
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

  // Non-null after the guards above
  const b = blog;
  const isAuthor = currentUser?.userId === b.author.userId;
  const canDelete = isAuthor || isAdmin;
  const currentStatus = STATUS_OPTIONS.find((s) => s.value === b.blogStatus) ?? STATUS_OPTIONS[0];

  const sortedMedia = [...b.media].sort((x, y) => x.position - y.position);
  const hasMarkers = /\{\{img:\d+\}\}/.test(b.body);
  const heroImage = sortedMedia[0];

  const createdDate = parseUTC(b.createdAt);
  const formattedDate = format(createdDate, "MMM d, yyyy");

  function renderArticleContent() {
    if (sortedMedia.length === 0 && !hasMarkers) {
      return <ReactMarkdown remarkPlugins={[remarkGfm]}>{b.body}</ReactMarkdown>;
    }

    if (hasMarkers) {
      const parts = b.body.split(/(\{\{img:\d+\}\})/);
      return (
        <>
          {parts.map((part, idx) => {
            const markerMatch = part.match(/^\{\{img:(\d+)\}\}$/);
            if (markerMatch) {
              const imgIdx = parseInt(markerMatch[1], 10);
              const media = sortedMedia[imgIdx];
              if (!media) return null;
              return (
                <figure key={idx} className="my-10 sm:my-14">
                  <div className="relative w-full max-h-[500px] overflow-hidden rounded-xl sm:rounded-2xl bg-navy/[0.03] dark:bg-cream/[0.03] flex items-center justify-center">
                    <Image
                      src={media.mediaUrl}
                      alt={`${b.title} — image ${imgIdx + 1}`}
                      width={media.width || 1200}
                      height={media.height || 700}
                      className="w-full h-auto max-h-[500px] object-contain"
                      sizes="(max-width: 768px) 100vw, 680px"
                      priority={imgIdx === 0}
                    />
                  </div>
                  {sortedMedia.length > 1 && (
                    <figcaption className="mt-3 text-center text-[13px] text-muted italic px-4">
                      {imgIdx + 1} / {sortedMedia.length}
                    </figcaption>
                  )}
                </figure>
              );
            }
            const text = part.trim();
            if (!text) return null;
            return (
              <React.Fragment key={idx}>
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>
              </React.Fragment>
            );
          })}
        </>
      );
    }

    // Legacy format: distribute images evenly
    const paragraphs = b.body.split(/\n\n+/).filter((p) => p.trim());
    const imageCount = sortedMedia.length;
    const totalSections = imageCount + 1;
    const parasPerSection = Math.max(1, Math.floor(paragraphs.length / totalSections));

    const sections: string[] = [];
    for (let i = 0; i < totalSections; i++) {
      const start = i * parasPerSection;
      const end = i === totalSections - 1 ? paragraphs.length : start + parasPerSection;
      const chunk = paragraphs.slice(start, end).join("\n\n");
      if (chunk.trim()) sections.push(chunk);
    }

    if (sections.length === 0) sections.push(b.body);

    return (
      <>
        {sections.map((section, idx) => (
          <React.Fragment key={idx}>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{section}</ReactMarkdown>
            {idx < sortedMedia.length && (
              <figure className="my-10 sm:my-14">
                <div className="relative w-full max-h-[500px] overflow-hidden rounded-xl sm:rounded-2xl bg-navy/[0.03] dark:bg-cream/[0.03] flex items-center justify-center">
                  <Image
                    src={sortedMedia[idx].mediaUrl}
                    alt={`${b.title} — image ${idx + 1}`}
                    width={sortedMedia[idx].width || 1200}
                    height={sortedMedia[idx].height || 700}
                    className="w-full h-auto max-h-[500px] object-contain"
                    sizes="(max-width: 768px) 100vw, 680px"
                    priority={idx === 0}
                  />
                </div>
                {sortedMedia.length > 1 && (
                  <figcaption className="mt-3 text-center text-[13px] text-muted italic px-4">
                    {idx + 1} / {sortedMedia.length}
                  </figcaption>
                )}
              </figure>
            )}
          </React.Fragment>
        ))}
        {sections.length <= sortedMedia.length &&
          sortedMedia.slice(sections.length).map((media, idx) => (
            <figure key={`extra-${idx}`} className="my-10 sm:my-14">
              <div className="relative w-full max-h-[500px] overflow-hidden rounded-xl sm:rounded-2xl bg-navy/[0.03] dark:bg-cream/[0.03] flex items-center justify-center">
                <Image
                  src={media.mediaUrl}
                  alt={`${b.title} — image ${sections.length + idx + 1}`}
                  width={media.width || 1200}
                  height={media.height || 700}
                  className="w-full h-auto max-h-[500px] object-contain"
                  sizes="(max-width: 768px) 100vw, 680px"
                />
              </div>
              {sortedMedia.length > 1 && (
                <figcaption className="mt-3 text-center text-[13px] text-muted italic px-4">
                  {sections.length + idx + 1} / {sortedMedia.length}
                </figcaption>
              )}
            </figure>
          ))}
      </>
    );
  }

  return (
    <>
      <ReadingProgressBar />

      <article className="animate-in fade-in duration-500">
        {/* ── Sticky top bar ── */}
        <div className="sticky top-0 z-40 backdrop-blur-xl bg-background/80 border-b border-border-subtle">
          <div className="max-w-[900px] mx-auto px-4 sm:px-6 h-12 flex items-center justify-between">
            <button
              onClick={() => router.back()}
              className="inline-flex items-center gap-2 text-sm font-medium text-muted hover:text-heading transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back</span>
            </button>

            <div className="flex items-center gap-1">
              <BlogSaveButton blogId={blogId} />
              <button
                onClick={handleShare}
                className="p-2 rounded-full text-muted hover:text-heading hover:bg-surface-hover transition-colors cursor-pointer"
              >
                <Share2 className="w-[18px] h-[18px]" />
              </button>
              {isAuthor && (
                <button
                  onClick={() => router.push(`/articles/${blogId}/edit`)}
                  className="p-2 rounded-full text-muted hover:text-heading hover:bg-surface-hover transition-colors cursor-pointer"
                >
                  <Pencil className="w-[18px] h-[18px]" />
                </button>
              )}
              {canDelete && (
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="p-2 rounded-full text-red-500/50 hover:text-red-500 hover:bg-red-500/5 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-[18px] h-[18px]" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── Hero image (first image, full-width breakout) ── */}
        {heroImage && !hasMarkers && (
          <div className="max-w-[680px] mx-auto mt-8 px-4 sm:px-6">
            <div className="relative w-full max-h-[500px] overflow-hidden rounded-xl sm:rounded-2xl bg-navy/[0.03] dark:bg-cream/[0.03] flex items-center justify-center">
              <Image
                src={heroImage.mediaUrl}
                alt={b.title}
                width={heroImage.width || 1200}
                height={heroImage.height || 700}
                className="w-full h-auto max-h-[500px] object-contain"
                sizes="(max-width: 768px) 100vw, 680px"
                priority
              />
            </div>
          </div>
        )}

        {/* ── Article header ── */}
        <header className="max-w-[680px] mx-auto px-4 sm:px-6 pt-10 sm:pt-14">
          {/* Categories */}
          <div className="flex items-center gap-2 flex-wrap mb-6">
            <span className={`text-[11px] font-bold tracking-wider px-2.5 py-1 rounded-full border ${currentStatus.color}`}>
              {currentStatus.label.toUpperCase()}
            </span>
            {b.categories.map((cat) => (
              <span
                key={cat.categoryId}
                className="text-[11px] font-semibold tracking-widest uppercase px-3 py-1 rounded-full text-steel dark:text-sky border border-steel/15 dark:border-sky/15"
              >
                {cat.name}
              </span>
            ))}
          </div>

          {/* Title */}
          <h1 className="font-display text-3xl sm:text-[2.75rem] lg:text-5xl font-bold text-heading leading-[1.15] tracking-tight mb-6">
            {b.title}
          </h1>

          {/* Summary as subtitle */}
          {b.summary && (
            <p className="text-lg sm:text-xl text-sub leading-relaxed mb-8 font-light">
              {b.summary}
            </p>
          )}

          {/* Author + meta row */}
          <div className="flex items-center gap-4 pb-8 border-b border-border-subtle">
            <div
              onClick={() => router.push(`/profile/${b.author.userId}`)}
              className="relative w-12 h-12 rounded-full overflow-hidden bg-cream-300 dark:bg-navy-600 flex-shrink-0 ring-2 ring-border-default cursor-pointer hover:ring-steel/40 dark:hover:ring-sky/40 transition-all"
            >
              <Image src={b.author.profilePictureUrl} alt={b.author.username} fill className="object-cover" />
            </div>
            <div className="min-w-0 flex-1">
              <p
                onClick={() => router.push(`/profile/${b.author.userId}`)}
                className="text-[15px] font-semibold text-heading cursor-pointer hover:text-steel dark:hover:text-sky transition-colors"
              >
                {b.author.username}
              </p>
              <div className="flex items-center gap-2 text-[13px] text-muted flex-wrap">
                <span>{formattedDate}</span>
                <span className="text-faint">·</span>
                <span className="flex items-center gap-1">
                  <BookOpen className="w-3 h-3" />
                  {b.readTimeMinutes} min read
                </span>
                {b.location && (
                  <>
                    <span className="text-faint">·</span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {b.location.name}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* ── Article body ── */}
        <div className="max-w-[680px] mx-auto px-4 sm:px-6 pt-10 sm:pt-12">
          {/* Tags (before content) */}
          {b.tags && b.tags.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap mb-10">
              {b.tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="text-xs font-medium px-3 py-1.5 rounded-full bg-steel/[0.05] dark:bg-sky/[0.05] text-steel dark:text-sky/80 border border-steel/10 dark:border-sky/10 hover:bg-steel/10 dark:hover:bg-sky/10 transition-colors"
                >
                  #{typeof tag === "string" ? tag : tag.title}
                </span>
              ))}
            </div>
          )}

          {/* Prose content */}
          <div
            className="
              prose dark:prose-invert max-w-none
              text-[18px] sm:text-[20px] leading-[1.8] text-navy/85 dark:text-cream/85
              prose-headings:font-display prose-headings:text-heading prose-headings:tracking-tight prose-headings:leading-tight
              prose-h2:text-2xl prose-h2:sm:text-3xl prose-h2:mt-14 prose-h2:mb-5
              prose-h3:text-xl prose-h3:sm:text-2xl prose-h3:mt-10 prose-h3:mb-4
              prose-p:mb-7
              prose-a:text-steel prose-a:dark:text-sky prose-a:underline prose-a:decoration-steel/30 prose-a:dark:decoration-sky/30 prose-a:underline-offset-2 prose-a:hover:decoration-steel prose-a:dark:hover:decoration-sky prose-a:transition-colors
              prose-blockquote:border-l-[3px] prose-blockquote:border-steel prose-blockquote:dark:border-sky prose-blockquote:bg-steel/[0.03] prose-blockquote:dark:bg-sky/[0.03] prose-blockquote:rounded-r-xl prose-blockquote:py-4 prose-blockquote:pr-6 prose-blockquote:not-italic prose-blockquote:text-sub
              prose-code:text-[15px] prose-code:font-mono prose-code:bg-navy/[0.05] prose-code:dark:bg-cream/[0.05] prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:before:content-none prose-code:after:content-none
              prose-pre:bg-navy/[0.04] prose-pre:dark:bg-cream/[0.04] prose-pre:rounded-xl prose-pre:border prose-pre:border-border-subtle
              prose-strong:text-heading prose-strong:font-semibold
              prose-img:rounded-2xl
              prose-li:mb-2
              prose-hr:border-border-subtle prose-hr:my-12
            "
          >
            {renderArticleContent()}
          </div>

          {/* ── End ornament ── */}
          <div className="flex items-center justify-center gap-3 my-14">
            <div className="h-px w-16 bg-gradient-to-r from-transparent to-border-default" />
            <div className="flex gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-steel/40 dark:bg-sky/40" />
              <span className="w-1.5 h-1.5 rounded-full bg-steel/60 dark:bg-sky/60" />
              <span className="w-1.5 h-1.5 rounded-full bg-steel/40 dark:bg-sky/40" />
            </div>
            <div className="h-px w-16 bg-gradient-to-l from-transparent to-border-default" />
          </div>

          {/* ── Article footer meta ── */}
          {(b.reviewer || b.updatedAt !== b.createdAt) && (
            <div className="flex items-center gap-4 flex-wrap text-[12px] text-faint pb-6">
              {b.updatedAt && b.updatedAt !== b.createdAt && (
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3 h-3" />
                  Updated {formatDistanceToNow(parseUTC(b.updatedAt), { addSuffix: true })}
                </span>
              )}
              {b.reviewer && (
                <span>
                  Reviewed by{" "}
                  <span className="font-semibold text-muted">{b.reviewer.username}</span>
                  {b.reviewedAt && (
                    <> {formatDistanceToNow(parseUTC(b.reviewedAt), { addSuffix: true })}</>
                  )}
                </span>
              )}
            </div>
          )}

          {/* ── Author card (bottom) ── */}
          <div className="py-8 border-t border-border-subtle">
            <div className="flex items-start gap-4">
              <div
                onClick={() => router.push(`/profile/${b.author.userId}`)}
                className="relative w-14 h-14 rounded-full overflow-hidden bg-cream-300 dark:bg-navy-600 flex-shrink-0 ring-2 ring-border-default cursor-pointer hover:ring-steel/40 dark:hover:ring-sky/40 transition-all"
              >
                <Image src={b.author.profilePictureUrl} alt={b.author.username} fill className="object-cover" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-muted uppercase tracking-widest mb-1">
                  Written by
                </p>
                <p
                  onClick={() => router.push(`/profile/${b.author.userId}`)}
                  className="text-lg font-bold text-heading cursor-pointer hover:text-steel dark:hover:text-sky transition-colors"
                >
                  {b.author.username}
                </p>
                <p className="text-sm text-muted mt-1">
                  {b.wordCount.toLocaleString()} words · {b.readTimeMinutes} min read
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Engagement section (wider container) ── */}
        <div className="max-w-[680px] mx-auto px-4 sm:px-6 pb-8 space-y-6">
          {/* Admin Controls */}
          {isAdmin && (
            <div className="bg-surface-alt rounded-2xl border border-amber-500/20 p-5 space-y-4">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span className="text-[11px] font-bold tracking-wider text-amber-700 dark:text-amber-400 uppercase">
                  Admin Controls
                </span>
              </div>

              <div className="flex items-center gap-4 flex-wrap">
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
                        const isActive = b.blogStatus === opt.value;
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

          {/* Reactions */}
          <BlogActions blogId={blogId} />

          {/* Divider */}
          <div className="h-px bg-gradient-to-r from-transparent via-border-default to-transparent" />

          {/* Comments */}
          <BlogCommentSection blogId={blogId} />
        </div>
      </article>

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

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAccessToken } from "@/hooks/useAccessToken";
import { useAppSelector } from "@/hooks/useAppSelector";
import { filterBlogsController } from "@/controllers/blog/blogFilter.controller";
import { updateBlogStatusController } from "@/controllers/blog/updateBlogStatusController";
import type { BlogItem, PaginationMeta, BlogStatus } from "@/lib/types/blogFilter.types";
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  ShieldAlert,
  Search,
  Eye,
  FileText,
  ChevronDown,
} from "lucide-react";
import Image from "next/image";
import { toast } from "react-hot-toast";
import { formatDistanceToNow } from "date-fns";
import { parseUTC } from "@/lib/utils/parseUTC";
import { useDebounce } from "@/hooks/useDebounce";

const STATUS_FILTERS: { value: BlogStatus | ""; label: string }[] = [
  { value: "", label: "All" },
  { value: "DRAFT", label: "Draft" },
  { value: "APPROVAL_PENDING", label: "Pending" },
  { value: "PUBLISHED", label: "Published" },
  { value: "FLAGGED", label: "Flagged" },
  { value: "REJECTED", label: "Rejected" },
  { value: "ARCHIVED", label: "Archived" },
];

const STATUS_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  PUBLISHED:        { bg: "bg-emerald-500/10", text: "text-emerald-700 dark:text-emerald-400", border: "border-emerald-500/20" },
  DRAFT:            { bg: "bg-amber-500/10",   text: "text-amber-700 dark:text-amber-400",     border: "border-amber-500/20" },
  APPROVAL_PENDING: { bg: "bg-blue-500/10",    text: "text-blue-700 dark:text-blue-400",       border: "border-blue-500/20" },
  FLAGGED:          { bg: "bg-orange-500/10",   text: "text-orange-700 dark:text-orange-400",   border: "border-orange-500/20" },
  REJECTED:         { bg: "bg-red-500/10",      text: "text-red-700 dark:text-red-400",         border: "border-red-500/20" },
  ARCHIVED:         { bg: "bg-gray-500/10",     text: "text-gray-600 dark:text-gray-400",       border: "border-gray-500/20" },
};

const STATUS_LABELS: Record<string, string> = {
  PUBLISHED: "Published",
  DRAFT: "Draft",
  APPROVAL_PENDING: "Pending",
  FLAGGED: "Flagged",
  REJECTED: "Rejected",
  ARCHIVED: "Archived",
};

const ALL_STATUSES: BlogStatus[] = ["PUBLISHED", "DRAFT", "APPROVAL_PENDING", "FLAGGED", "REJECTED", "ARCHIVED"];

const ARTICLES_PER_PAGE = 12;

const defaultPagination: PaginationMeta = {
  page: 0,
  size: ARTICLES_PER_PAGE,
  totalPages: 0,
  totalElements: 0,
  first: true,
  last: true,
};

function StatusDropdown({
  current,
  blogId,
  onUpdate,
  isUpdating,
}: {
  current: string;
  blogId: number;
  onUpdate: (blogId: number, status: BlogStatus) => void;
  isUpdating: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const style = STATUS_STYLES[current] ?? STATUS_STYLES.DRAFT;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
        disabled={isUpdating}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold rounded-full border transition-colors cursor-pointer disabled:opacity-60 ${style.bg} ${style.text} ${style.border}`}
      >
        {isUpdating && <Loader2 className="w-3 h-3 animate-spin" />}
        {STATUS_LABELS[current] || current}
        <ChevronDown className={`w-3 h-3 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1.5 w-40 bg-cream-50 dark:bg-navy-700 border border-border-default rounded-xl shadow-xl shadow-black/[0.08] dark:shadow-black/30 z-50 py-1 overflow-hidden" onClick={(e) => e.stopPropagation()}>
          {ALL_STATUSES.map((status) => {
            const isActive = current === status;
            return (
              <button
                key={status}
                onClick={() => { onUpdate(blogId, status); setOpen(false); }}
                disabled={isActive}
                className={`w-full px-3 py-2 text-left text-xs font-medium transition-colors cursor-pointer disabled:cursor-default flex items-center justify-between ${
                  isActive
                    ? "bg-steel/5 dark:bg-sky/5 text-heading font-bold"
                    : "text-sub hover:bg-surface-hover"
                }`}
              >
                {STATUS_LABELS[status]}
                {isActive && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-steel/10 dark:bg-sky/10 text-steel dark:text-sky">
                    Current
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function AdminArticlesPage() {
  const router = useRouter();
  const accessToken = useAccessToken();
  const role = useAppSelector((state) => state.auth.role);

  const [blogs, setBlogs] = useState<BlogItem[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>(defaultPagination);
  const [statusFilter, setStatusFilter] = useState<BlogStatus | "">("");
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 400);
  const [currentPage, setCurrentPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [updatingBlogId, setUpdatingBlogId] = useState<number | null>(null);

  const fetchBlogs = useCallback(
    async (page: number) => {
      if (!accessToken) return;
      setLoading(true);
      try {
        const filters: Record<string, unknown> = {
          page,
          size: ARTICLES_PER_PAGE,
          sort: "createdAt,desc",
          ...(statusFilter && { status: statusFilter }),
          ...(debouncedQuery.trim() && { q: debouncedQuery.trim() }),
        };
        if (!statusFilter) delete filters.status;
        const result = await filterBlogsController(accessToken, filters as Parameters<typeof filterBlogsController>[1]);
        if (result.success) {
          setBlogs(result.blogs);
          setPagination(result.pagination);
        } else {
          toast.error(result.error || "Failed to load articles.");
          setBlogs([]);
          setPagination(defaultPagination);
        }
      } catch {
        toast.error("Failed to load articles.");
      } finally {
        setLoading(false);
      }
    },
    [accessToken, statusFilter, debouncedQuery]
  );

  useEffect(() => {
    fetchBlogs(currentPage);
  }, [currentPage, fetchBlogs]);

  useEffect(() => {
    setCurrentPage(0);
  }, [statusFilter, debouncedQuery]);

  const handleStatusUpdate = async (blogId: number, newStatus: BlogStatus) => {
    if (!accessToken) return;
    setUpdatingBlogId(blogId);
    try {
      const res = await updateBlogStatusController(accessToken, blogId, newStatus);
      if (res.success) {
        toast.success(res.message || `Status updated to ${STATUS_LABELS[newStatus]}.`);
        setBlogs((prev) => prev.map((b) => (b.blogId === blogId ? { ...b, blogStatus: newStatus } : b)));
      } else {
        toast.error(res.message || "Failed to update status.");
      }
    } catch {
      toast.error("Failed to update status.");
    } finally {
      setUpdatingBlogId(null);
    }
  };

  if (role !== "ADMIN") {
    return (
      <div className="w-full max-w-5xl mx-auto px-4 py-20">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="flex items-center justify-center w-14 h-14 rounded-full bg-red-50 dark:bg-red-900/20 border border-red-200/60 dark:border-red-800/40 mb-4">
            <ShieldAlert className="w-7 h-7 text-red-500 dark:text-red-400" />
          </div>
          <h2 className="text-xl font-bold text-heading mb-2">Access Denied</h2>
          <p className="text-sm text-muted mb-6">You need admin privileges to access this page.</p>
          <button onClick={() => router.push("/feed")} className="px-5 py-2 text-sm font-semibold rounded-full bg-btn-primary text-on-primary cursor-pointer">
            Go to Feed
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* ── Header ── */}
      <div className="pt-6 pb-5 px-1">
        <h1 className="text-2xl font-display font-bold text-heading tracking-tight">
          Manage Articles
        </h1>
        <p className="mt-1 text-sm text-muted">
          Review, approve, and manage all articles
        </p>

        {/* Search */}
        <div className="mt-4 relative max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-steel/40 dark:text-sky/30" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search articles by title..."
            className="w-full h-10 pl-10 pr-4 rounded-xl bg-cream-300/30 dark:bg-navy-700/30 border-0 text-heading text-sm placeholder:text-steel/40 dark:placeholder:text-sky/25 focus:outline-none focus:ring-2 focus:ring-steel/20 dark:focus:ring-sky/20 transition-all"
          />
        </div>

        {/* Status filter pills */}
        <div className="mt-4 inline-flex p-1 rounded-full bg-cream-300/50 dark:bg-navy-700/50">
          {STATUS_FILTERS.map((filter) => {
            const isActive = statusFilter === filter.value;
            return (
              <button
                key={filter.value}
                onClick={() => setStatusFilter(filter.value as BlogStatus | "")}
                className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all duration-300 cursor-pointer ${
                  isActive
                    ? "bg-navy text-cream dark:bg-cream dark:text-navy shadow-sm"
                    : "text-navy/50 dark:text-cream/50 hover:text-navy dark:hover:text-cream"
                }`}
              >
                {filter.label}
              </button>
            );
          })}
        </div>

        {!loading && (
          <p className="mt-3 text-sm text-muted tabular-nums">
            {pagination.totalElements} article{pagination.totalElements !== 1 ? "s" : ""} found
          </p>
        )}
      </div>

      {/* ── Articles Grid ── */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-60 rounded-2xl bg-cream-300/30 dark:bg-navy-700/30 animate-pulse" />
          ))}
        </div>
      ) : blogs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-cream-200/50 dark:bg-navy-700/40 mb-3">
            <FileText className="w-6 h-6 text-steel/40 dark:text-sky/30" />
          </div>
          <p className="text-sm font-medium text-heading mb-1">No articles found</p>
          <p className="text-xs text-muted">Try adjusting your search or filter criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {blogs.map((blog) => (
            <div
              key={blog.blogId}
              onClick={() => router.push(`/articles/${blog.blogId}`)}
              className="group flex flex-col rounded-2xl bg-surface-alt border border-border-default hover:border-steel/30 dark:hover:border-sky/30 shadow-sm hover:shadow-lg hover:shadow-steel/[0.06] dark:hover:shadow-sky/[0.04] transition-all duration-300 cursor-pointer overflow-hidden"
            >
              {/* Thumbnail */}
              <div className="relative h-36 w-full overflow-hidden bg-cream-300/30 dark:bg-navy-700/40">
                {blog.thumbnailUrl ? (
                  <Image
                    src={blog.thumbnailUrl}
                    alt={blog.title}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full bg-gradient-to-br from-steel/10 to-sky/10 dark:from-steel/20 dark:to-sky/10">
                    <FileText className="w-8 h-8 text-steel/20 dark:text-sky/15" />
                  </div>
                )}
                {/* View count overlay */}
                {blog.viewCount > 0 && (
                  <div className="absolute top-2.5 right-2.5 flex items-center gap-1 px-2 py-0.5 rounded-lg bg-black/50 backdrop-blur-sm text-white text-[10px] font-medium">
                    <Eye className="w-3 h-3" />
                    {blog.viewCount}
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="flex flex-col flex-1 p-4 gap-2">
                {/* Status + Categories */}
                <div className="flex items-center gap-2 flex-wrap">
                  <StatusDropdown
                    current={blog.blogStatus}
                    blogId={blog.blogId}
                    onUpdate={handleStatusUpdate}
                    isUpdating={updatingBlogId === blog.blogId}
                  />
                  {blog.categories.slice(0, 2).map((cat) => (
                    <span key={cat.categoryId} className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-cream-200/50 dark:bg-navy-600/30 text-steel/70 dark:text-sky/50">
                      {cat.name}
                    </span>
                  ))}
                </div>

                {/* Title */}
                <h3 className="text-sm font-bold text-heading leading-snug line-clamp-2 group-hover:text-steel dark:group-hover:text-sky transition-colors">
                  {blog.title}
                </h3>

                <div className="flex-1" />

                {/* Footer */}
                <div className="flex items-center justify-between pt-2 border-t border-border-subtle">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-6 h-6 rounded-full overflow-hidden bg-cream-300 dark:bg-navy-600 flex-shrink-0">
                      {blog.author.profilePictureUrl ? (
                        <Image src={blog.author.profilePictureUrl} alt={blog.author.username} width={24} height={24} className="object-cover w-full h-full" />
                      ) : (
                        <div className="w-full h-full bg-steel/10 dark:bg-sky/10" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p
                        onClick={(e) => { e.stopPropagation(); router.push(`/profile/${blog.author.userId}`); }}
                        className="text-[11px] font-medium text-sub truncate cursor-pointer hover:underline hover:text-steel dark:hover:text-sky"
                      >
                        {blog.author.username}
                      </p>
                      <p className="text-[10px] text-faint">
                        {formatDistanceToNow(parseUTC(blog.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-[10px] text-faint">
                    {blog.reactionCount > 0 && <span>{blog.reactionCount} reactions</span>}
                    {blog.commentCount > 0 && <span>{blog.commentCount} comments</span>}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Pagination ── */}
      {!loading && pagination.totalPages > 1 && (
        <div className="mt-12 flex items-center justify-center gap-1">
          <button
            onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
            disabled={pagination.first}
            className="flex items-center justify-center w-10 h-10 rounded-full text-muted hover:text-navy dark:hover:text-cream hover:bg-surface-hover disabled:opacity-20 disabled:pointer-events-none transition-all cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {Array.from({ length: pagination.totalPages }, (_, i) => i)
            .filter((i) => {
              if (i === 0 || i === pagination.totalPages - 1) return true;
              if (Math.abs(i - currentPage) <= 1) return true;
              return false;
            })
            .reduce<(number | "ellipsis")[]>((acc, curr, idx, arr) => {
              if (idx > 0 && curr - (arr[idx - 1] as number) > 1) acc.push("ellipsis");
              acc.push(curr);
              return acc;
            }, [])
            .map((item, idx) =>
              item === "ellipsis" ? (
                <span key={`e-${idx}`} className="w-10 h-10 flex items-center justify-center text-sm text-navy/25 dark:text-cream/20">
                  ...
                </span>
              ) : (
                <button
                  key={item}
                  onClick={() => setCurrentPage(item)}
                  className={`w-10 h-10 rounded-full text-sm font-medium transition-all duration-200 cursor-pointer ${
                    currentPage === item
                      ? "bg-btn-primary text-on-primary"
                      : "text-muted hover:text-navy dark:hover:text-cream hover:bg-surface-hover"
                  }`}
                >
                  {item + 1}
                </button>
              )
            )}

          <button
            onClick={() => setCurrentPage((p) => Math.min(pagination.totalPages - 1, p + 1))}
            disabled={pagination.last}
            className="flex items-center justify-center w-10 h-10 rounded-full text-muted hover:text-navy dark:hover:text-cream hover:bg-surface-hover disabled:opacity-20 disabled:pointer-events-none transition-all cursor-pointer"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
}

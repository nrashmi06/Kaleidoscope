"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAccessToken } from "@/hooks/useAccessToken";
import { useAppSelector } from "@/hooks/useAppSelector";
import { filterBlogsController } from "@/controllers/blog/blogFilter.controller";
import { updateBlogStatusController } from "@/controllers/blog/updateBlogStatusController";
import type { BlogItem, PaginationMeta, BlogStatus } from "@/lib/types/blogFilter.types";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Loader2,
  ShieldAlert,
  FileCheck,
  Search,
  Eye,
  CheckCircle,
  Archive,
  FileText,
  Flag,
  XCircle,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { formatDistanceToNow } from "date-fns";
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

const ARTICLES_PER_PAGE = 15;

const defaultPagination: PaginationMeta = {
  page: 0,
  size: ARTICLES_PER_PAGE,
  totalPages: 0,
  totalElements: 0,
  first: true,
  last: true,
};

function getStatusBadgeClasses(status: string): string {
  switch (status) {
    case "PUBLISHED":
      return "bg-green-100/60 text-green-700 dark:bg-green-900/20 dark:text-green-400";
    case "DRAFT":
      return "bg-amber-100/60 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400";
    case "APPROVAL_PENDING":
      return "bg-blue-100/60 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400";
    case "FLAGGED":
      return "bg-orange-100/60 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400";
    case "REJECTED":
      return "bg-red-100/60 text-red-700 dark:bg-red-900/20 dark:text-red-400";
    case "ARCHIVED":
      return "bg-steel/10 text-steel dark:bg-sky/10 dark:text-sky";
    default:
      return "bg-steel/10 text-steel dark:bg-sky/10 dark:text-sky";
  }
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
        // Remove status default so admin sees all statuses
        if (!statusFilter) {
          delete filters.status;
        }
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
        toast.success(res.message || `Blog status updated to ${newStatus}.`);
        setBlogs((prev) =>
          prev.map((b) => (b.blogId === blogId ? { ...b, blogStatus: newStatus } : b))
        );
      } else {
        toast.error(res.message || "Failed to update blog status.");
      }
    } catch {
      toast.error("Failed to update blog status.");
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
          <h2 className="text-xl font-bold text-navy dark:text-cream mb-2">Access Denied</h2>
          <p className="text-sm text-steel/60 dark:text-sky/40 mb-6">
            You need admin privileges to access this page.
          </p>
          <button
            onClick={() => router.push("/feed")}
            className="px-5 py-2 text-sm font-semibold rounded-xl bg-steel text-cream-50 dark:bg-sky dark:text-navy cursor-pointer"
          >
            Go to Feed
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto px-2 sm:px-4 py-6 relative">
      {/* Ambient background glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-32 right-1/4 w-[400px] h-[400px] bg-steel/[0.04] dark:bg-steel/[0.03] rounded-full blur-[100px]" />
        <div className="absolute bottom-1/3 left-[10%] w-80 h-80 bg-sky/[0.05] dark:bg-sky/[0.02] rounded-full blur-[80px]" />
      </div>

      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-steel dark:text-sky hover:text-steel-600 dark:hover:text-sky/80 transition-colors mb-4 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-steel to-sky shadow-sm shadow-steel/20 dark:shadow-sky/15">
            <FileCheck className="w-5 h-5 text-cream-50" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-navy dark:text-cream">Manage Articles</h1>
            <p className="text-xs text-steel/60 dark:text-sky/40">
              Review, approve, and manage all articles
            </p>
          </div>
          <span className="ml-auto px-2.5 py-1 text-[10px] font-bold rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            ADMIN ONLY
          </span>
        </div>
        <div className="mt-4 h-px bg-gradient-to-r from-transparent via-cream-400/30 dark:via-navy-700/40 to-transparent" />
      </div>

      {/* Search & Filters */}
      <div className="space-y-4 mb-6">
        <div className="p-4 rounded-2xl bg-cream-50/80 dark:bg-navy-700/30 border border-cream-300/40 dark:border-navy-700/40">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-steel/50 dark:text-sky/40" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search articles by title..."
              className="w-full h-11 pl-10 pr-4 rounded-xl border border-cream-300 dark:border-navy-700 bg-white dark:bg-navy-700/40 text-navy dark:text-cream text-sm placeholder:text-steel/40 dark:placeholder:text-sky/30 focus:outline-none focus:ring-2 focus:ring-steel/30 dark:focus:ring-sky/30 focus:border-steel dark:focus:border-sky transition-all"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {STATUS_FILTERS.map((filter) => {
            const isActive = statusFilter === filter.value;
            return (
              <button
                key={filter.value}
                onClick={() => setStatusFilter(filter.value as BlogStatus | "")}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
                  isActive
                    ? "bg-steel/10 dark:bg-sky/10 border-steel/40 dark:border-sky/40 text-navy dark:text-cream shadow-sm"
                    : "bg-cream-100/40 dark:bg-navy-700/20 border-cream-300/40 dark:border-navy-700/40 text-steel/60 dark:text-sky/40 hover:border-steel/20 dark:hover:border-sky/20"
                }`}
              >
                {filter.label}
              </button>
            );
          })}
        </div>

        {!loading && (
          <p className="text-xs text-steel/50 dark:text-sky/35 px-1">
            {pagination.totalElements} article{pagination.totalElements !== 1 ? "s" : ""} found
          </p>
        )}
      </div>

      {/* Articles List */}
      <div className="space-y-3">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="w-7 h-7 text-steel dark:text-sky animate-spin mb-3" />
            <p className="text-sm text-steel/60 dark:text-sky/40">Loading articles...</p>
          </div>
        ) : blogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-cream-200/50 dark:bg-navy-700/40 mb-3">
              <FileText className="w-6 h-6 text-steel/40 dark:text-sky/30" />
            </div>
            <p className="text-sm font-medium text-navy dark:text-cream mb-1">No articles found</p>
            <p className="text-xs text-steel/50 dark:text-sky/35">
              Try adjusting your search or filter criteria.
            </p>
          </div>
        ) : (
          blogs.map((blog) => (
            <div
              key={blog.blogId}
              className="p-4 rounded-2xl bg-cream-50/80 dark:bg-navy-700/30 border border-cream-300/40 dark:border-navy-700/40"
            >
              <div className="flex items-start gap-4">
                {/* Thumbnail */}
                {blog.thumbnailUrl && (
                  <div className="flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden bg-cream-300/40 dark:bg-navy-700/40">
                    <img
                      src={blog.thumbnailUrl}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`flex-shrink-0 px-2 py-0.5 text-[10px] font-bold rounded-full ${getStatusBadgeClasses(
                        blog.blogStatus
                      )}`}
                    >
                      {blog.blogStatus}
                    </span>
                    {blog.categories.map((cat) => (
                      <span
                        key={cat.categoryId}
                        className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-cream-200/50 dark:bg-navy-600/30 text-steel/70 dark:text-sky/50"
                      >
                        {cat.name}
                      </span>
                    ))}
                  </div>

                  <h3
                    onClick={() => router.push(`/articles/${blog.blogId}`)}
                    className="text-sm font-semibold text-navy dark:text-cream truncate cursor-pointer hover:text-steel dark:hover:text-sky transition-colors"
                  >
                    {blog.title}
                  </h3>

                  <div className="flex items-center gap-3 mt-1 text-[11px] text-steel/50 dark:text-sky/35">
                    <span>by <span onClick={(e) => { e.stopPropagation(); router.push(`/profile/${blog.author.userId}`); }} className="cursor-pointer hover:underline hover:text-steel dark:hover:text-sky transition-colors">{blog.author.username}</span></span>
                    <span>{formatDistanceToNow(new Date(blog.createdAt), { addSuffix: true })}</span>
                    {blog.viewCount > 0 && <span>{blog.viewCount} views</span>}
                    {blog.reactionCount > 0 && <span>{blog.reactionCount} reactions</span>}
                    {blog.commentCount > 0 && <span>{blog.commentCount} comments</span>}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    onClick={() => router.push(`/articles/${blog.blogId}`)}
                    className="flex items-center justify-center w-8 h-8 rounded-lg border border-cream-300/40 dark:border-navy-700/40 bg-cream-100/40 dark:bg-navy-700/20 hover:border-steel/30 dark:hover:border-sky/30 transition-all cursor-pointer"
                    title="View"
                  >
                    <Eye className="w-3.5 h-3.5 text-steel/60 dark:text-sky/40" />
                  </button>

                  {blog.blogStatus !== "PUBLISHED" && (
                    <button
                      onClick={() => handleStatusUpdate(blog.blogId, "PUBLISHED")}
                      disabled={updatingBlogId === blog.blogId}
                      className="flex items-center justify-center w-8 h-8 rounded-lg border border-green-300/40 dark:border-green-700/40 bg-green-50/40 dark:bg-green-900/10 hover:border-green-400/60 dark:hover:border-green-600/40 transition-all cursor-pointer disabled:opacity-50"
                      title="Approve / Publish"
                    >
                      {updatingBlogId === blog.blogId ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-green-600" />
                      ) : (
                        <CheckCircle className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                      )}
                    </button>
                  )}

                  {blog.blogStatus !== "FLAGGED" && (
                    <button
                      onClick={() => handleStatusUpdate(blog.blogId, "FLAGGED")}
                      disabled={updatingBlogId === blog.blogId}
                      className="flex items-center justify-center w-8 h-8 rounded-lg border border-orange-300/40 dark:border-orange-700/40 bg-orange-50/40 dark:bg-orange-900/10 hover:border-orange-400/60 dark:hover:border-orange-600/40 transition-all cursor-pointer disabled:opacity-50"
                      title="Flag"
                    >
                      {updatingBlogId === blog.blogId ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-orange-600" />
                      ) : (
                        <Flag className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />
                      )}
                    </button>
                  )}

                  {blog.blogStatus !== "REJECTED" && (
                    <button
                      onClick={() => handleStatusUpdate(blog.blogId, "REJECTED")}
                      disabled={updatingBlogId === blog.blogId}
                      className="flex items-center justify-center w-8 h-8 rounded-lg border border-red-300/40 dark:border-red-700/40 bg-red-50/40 dark:bg-red-900/10 hover:border-red-400/60 dark:hover:border-red-600/40 transition-all cursor-pointer disabled:opacity-50"
                      title="Reject"
                    >
                      {updatingBlogId === blog.blogId ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-red-600" />
                      ) : (
                        <XCircle className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
                      )}
                    </button>
                  )}

                  {blog.blogStatus !== "ARCHIVED" && (
                    <button
                      onClick={() => handleStatusUpdate(blog.blogId, "ARCHIVED")}
                      disabled={updatingBlogId === blog.blogId}
                      className="flex items-center justify-center w-8 h-8 rounded-lg border border-cream-300/40 dark:border-navy-700/40 bg-cream-100/40 dark:bg-navy-700/20 hover:border-steel/30 dark:hover:border-sky/30 transition-all cursor-pointer disabled:opacity-50"
                      title="Archive"
                    >
                      {updatingBlogId === blog.blogId ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-steel/60" />
                      ) : (
                        <Archive className="w-3.5 h-3.5 text-steel/60 dark:text-sky/40" />
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {!loading && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <button
            onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
            disabled={pagination.first}
            className="flex items-center justify-center w-9 h-9 rounded-lg border border-cream-300/40 dark:border-navy-700/40 bg-cream-100/40 dark:bg-navy-700/20 hover:border-steel/30 dark:hover:border-sky/30 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4 text-steel dark:text-sky" />
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
                <span key={`e-${idx}`} className="px-1 text-steel/40 dark:text-sky/30 text-sm">
                  ...
                </span>
              ) : (
                <button
                  key={item}
                  onClick={() => setCurrentPage(item)}
                  className={`flex items-center justify-center w-9 h-9 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${
                    currentPage === item
                      ? "bg-steel/10 dark:bg-sky/10 border-steel/40 dark:border-sky/40 text-navy dark:text-cream"
                      : "border-cream-300/40 dark:border-navy-700/40 bg-cream-100/40 dark:bg-navy-700/20 text-steel/60 dark:text-sky/40 hover:border-steel/20 dark:hover:border-sky/20"
                  }`}
                >
                  {item + 1}
                </button>
              )
            )}

          <button
            onClick={() => setCurrentPage((p) => Math.min(pagination.totalPages - 1, p + 1))}
            disabled={pagination.last}
            className="flex items-center justify-center w-9 h-9 rounded-lg border border-cream-300/40 dark:border-navy-700/40 bg-cream-100/40 dark:bg-navy-700/20 hover:border-steel/30 dark:hover:border-sky/30 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-4 h-4 text-steel dark:text-sky" />
          </button>
        </div>
      )}
    </div>
  );
}

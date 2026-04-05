// src/app/(auth)/articles/page.tsx
'use client';

import React, { useState, useEffect, useCallback } from "react";
import { ArticleCard } from "@/components/articles/ArticleCard";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import {
  PencilLine,
  Search,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Inbox,
  Book,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { useAccessToken } from "@/hooks/useAccessToken";
import { useDebounce } from "@/hooks/useDebounce";
import { filterBlogsController } from "@/controllers/blog/blogFilter.controller";
import type { BlogItem, PaginationMeta } from "@/lib/types/blogFilter.types";
import { motion, AnimatePresence } from "framer-motion";
import { ContentSuggestionsSection } from "@/components/common/ContentSuggestions";

const ARTICLES_PER_PAGE = 9;
const defaultPagination: PaginationMeta = {
  page: 0,
  size: ARTICLES_PER_PAGE,
  totalPages: 0,
  totalElements: 0,
  first: true,
  last: true,
};

export default function ArticlesPage() {
  const router = useRouter();
  const accessToken = useAccessToken();

  const [blogs, setBlogs] = useState<BlogItem[]>([]);
  const [pagination, setPagination] =
    useState<PaginationMeta>(defaultPagination);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const debouncedQuery = useDebounce(query, 400);
  const [currentPage, setCurrentPage] = useState(0);

  const fetchBlogs = useCallback(
    async (page: number, searchQuery: string) => {
      if (!accessToken) {
        setLoading(false);
        setError("Authentication required.");
        return;
      }

      setLoading(true);
      setError(null);
      window.scrollTo(0, 0);

      const filters = {
        page,
        size: ARTICLES_PER_PAGE,
        ...(searchQuery.trim() && { q: searchQuery.trim() }),
      };

      try {
        const result = await filterBlogsController(accessToken, filters);
        if (result.success) {
          setBlogs(result.blogs);
          setPagination(result.pagination);
        } else {
          setError(result.error || "Failed to load articles.");
          setBlogs([]);
          setPagination(defaultPagination);
        }
      } catch (err) {
        setError(
          "An unexpected error occurred." +
            (err instanceof Error ? ` (${err.message})` : "")
        );
        setBlogs([]);
        setPagination(defaultPagination);
      } finally {
        setLoading(false);
      }
    },
    [accessToken]
  );

  useEffect(() => {
    fetchBlogs(currentPage, debouncedQuery);
  }, [debouncedQuery, currentPage, fetchBlogs]);

  useEffect(() => {
    if (currentPage !== 0 && debouncedQuery.trim() === query.trim()) {
      setCurrentPage(0);
    }
  }, [debouncedQuery]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 0 && newPage < pagination.totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    if (currentPage !== 0) setCurrentPage(0);
  };

  const handleRetry = () => {
    fetchBlogs(currentPage, debouncedQuery);
  };

  // Generate visible page numbers
  const getPageNumbers = () => {
    const total = pagination.totalPages;
    const current = currentPage;
    const pages: (number | "...")[] = [];

    if (total <= 5) {
      for (let i = 0; i < total; i++) pages.push(i);
    } else {
      pages.push(0);
      if (current > 2) pages.push("...");
      for (
        let i = Math.max(1, current - 1);
        i <= Math.min(total - 2, current + 1);
        i++
      ) {
        pages.push(i);
      }
      if (current < total - 3) pages.push("...");
      pages.push(total - 1);
    }
    return pages;
  };

  // --- Render Content ---
  const renderContent = () => {
    if (loading) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {[...Array(ARTICLES_PER_PAGE)].map((_, i) => (
            <div
              key={i}
              className="h-[22rem] rounded-2xl bg-cream-300/40 dark:bg-navy-700/40 animate-pulse"
            />
          ))}
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center text-center py-16 px-6 rounded-2xl border border-red-200/60 dark:border-red-900/30 bg-red-50/50 dark:bg-red-950/10 backdrop-blur-sm">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/20 border border-red-200/60 dark:border-red-800/40 mb-4">
            <AlertCircle className="w-6 h-6 text-red-500" />
          </div>
          <h3 className="text-base font-semibold text-red-700 dark:text-red-300 mb-1.5">
            Failed to Load Articles
          </h3>
          <p className="text-sm text-red-600/80 dark:text-red-400/80 mb-5 max-w-sm">
            {error}
          </p>
          <Button onClick={handleRetry} variant="destructive" size="sm">
            Try Again
          </Button>
        </div>
      );
    }

    if (blogs.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center text-center py-16 px-6 rounded-2xl border border-dashed border-cream-300 dark:border-navy-700 bg-cream-50/50 dark:bg-navy/50 backdrop-blur-sm">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-cream-300/50 dark:bg-navy-700/50 border border-cream-400/40 dark:border-navy-600/40 mb-4">
            <Inbox className="w-6 h-6 text-steel dark:text-sky/60" />
          </div>
          <h3 className="text-base font-semibold text-navy dark:text-cream mb-1.5">
            No Articles Found
          </h3>
          <p className="text-sm text-steel dark:text-sky/60">
            {debouncedQuery.trim()
              ? `No articles matching "${debouncedQuery}" were found.`
              : "There are no articles to display yet."}
          </p>
        </div>
      );
    }

    return (
      <AnimatePresence>
        <motion.div
          layout
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5"
        >
          {blogs.map((blog, index) => (
            <motion.div
              key={blog.blogId}
              layout
              initial={{ opacity: 0, y: 24, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -16, scale: 0.97 }}
              transition={{
                duration: 0.35,
                delay: index * 0.04,
                ease: "easeOut",
              }}
            >
              <ArticleCard
                title={blog.title}
                summary={blog.summary}
                author={blog.author}
                categories={blog.categories}
                thumbnailUrl={blog.thumbnailUrl}
                views={blog.viewCount}
                reactionCount={blog.reactionCount}
                commentCount={blog.commentCount}
                createdAt={blog.createdAt}
                blogId={blog.blogId}
                onClick={() => router.push(`/articles/${blog.blogId}`)}
              />
            </motion.div>
          ))}
        </motion.div>
      </AnimatePresence>
    );
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-6 relative">
      {/* Ambient background glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-32 right-1/4 w-[400px] h-[400px] bg-steel/[0.04] dark:bg-steel/[0.03] rounded-full blur-[100px]" />
        <div className="absolute bottom-1/3 left-[10%] w-80 h-80 bg-sky/[0.05] dark:bg-sky/[0.02] rounded-full blur-[80px]" />
      </div>

      {/* ── Header Section ── */}
      <div className="mb-6">
        {/* Title row */}
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-steel to-steel-600 shadow-lg shadow-steel/25 dark:shadow-steel/15 dark:from-sky dark:to-steel">
              <Book className="w-5 h-5 text-cream-50" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-navy dark:text-cream tracking-tight">
                Articles
              </h1>
              {!loading && pagination.totalElements > 0 && (
                <p className="text-[11px] text-steel dark:text-sky/60 tabular-nums">
                  {pagination.totalElements} articles
                  {pagination.totalPages > 1 &&
                    ` · Page ${currentPage + 1} of ${pagination.totalPages}`}
                </p>
              )}
            </div>
          </div>

          <Button
            onClick={() => router.push("/articles/create")}
            size="sm"
            className="h-9 rounded-xl bg-steel text-cream-50 hover:bg-steel-600 dark:bg-sky dark:text-navy dark:hover:bg-sky/80 shadow-sm shadow-steel/20 dark:shadow-sky/15"
          >
            <PencilLine className="w-3.5 h-3.5 mr-1.5" />
            Write
          </Button>
        </div>

        {/* Search bar — compact inline */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-steel/50 dark:text-sky/40" />
            <Input
              type="text"
              value={query}
              onChange={handleQueryChange}
              placeholder="Search articles..."
              className="pl-10 h-9 text-sm bg-cream-50/60 dark:bg-navy-700/30 border-cream-300/40 dark:border-navy-700/40 rounded-xl"
              disabled={loading}
            />
          </div>
        </div>

        {/* Gradient divider */}
        <div className="mt-5 h-px bg-gradient-to-r from-transparent via-cream-400/30 dark:via-navy-700/40 to-transparent" />
      </div>

      {/* ── Content Grid ── */}
      {renderContent()}

      {/* ── Pagination ── */}
      {!loading && blogs.length > 0 && pagination.totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-1.5">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={pagination.first}
            className="flex items-center justify-center w-9 h-9 rounded-xl text-steel dark:text-sky/70 hover:bg-cream-300/40 dark:hover:bg-navy-700/40 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {getPageNumbers().map((page, idx) =>
            page === "..." ? (
              <span
                key={`dots-${idx}`}
                className="w-9 h-9 flex items-center justify-center text-xs text-steel/50 dark:text-sky/30"
              >
                ...
              </span>
            ) : (
              <button
                key={page}
                onClick={() => handlePageChange(page as number)}
                className={`w-9 h-9 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  currentPage === page
                    ? "bg-steel text-cream-50 shadow-sm shadow-steel/20 dark:bg-sky dark:text-navy dark:shadow-sky/15"
                    : "text-navy/70 dark:text-cream/60 hover:bg-cream-300/40 dark:hover:bg-navy-700/40"
                }`}
              >
                {(page as number) + 1}
              </button>
            )
          )}

          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={pagination.last}
            className="flex items-center justify-center w-9 h-9 rounded-xl text-steel dark:text-sky/70 hover:bg-cream-300/40 dark:hover:bg-navy-700/40 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Suggested Articles */}
      {!loading && blogs.length > 0 && accessToken && (
        <ContentSuggestionsSection
          type="articles"
          accessToken={accessToken}
          title="Suggested Articles"
        />
      )}
    </div>
  );
}

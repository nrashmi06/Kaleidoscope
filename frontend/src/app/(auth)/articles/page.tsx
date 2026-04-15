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
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[...Array(ARTICLES_PER_PAGE)].map((_, i) => (
            <div
              key={i}
              className="h-[22rem] rounded-2xl bg-cream-300/30 dark:bg-navy-700/30 animate-pulse"
            />
          ))}
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center text-center py-20 px-6">
          <div className="flex items-center justify-center w-14 h-14 rounded-full bg-red-50 dark:bg-red-950/20 mb-5">
            <AlertCircle className="w-6 h-6 text-red-500 dark:text-red-400" />
          </div>
          <h3 className="text-lg font-display font-semibold text-navy dark:text-cream mb-2">
            Failed to Load Articles
          </h3>
          <p className="text-sm text-navy/40 dark:text-cream/35 mb-6 max-w-sm">
            {error}
          </p>
          <Button onClick={handleRetry} variant="destructive" size="sm" className="rounded-full px-6">
            Try Again
          </Button>
        </div>
      );
    }

    if (blogs.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center text-center py-20 px-6">
          <div className="flex items-center justify-center w-14 h-14 rounded-full bg-cream-300/30 dark:bg-navy-700/30 mb-5">
            <Inbox className="w-6 h-6 text-navy/25 dark:text-cream/25" />
          </div>
          <h3 className="text-lg font-display font-semibold text-navy dark:text-cream mb-2">
            No Articles Found
          </h3>
          <p className="text-sm text-navy/40 dark:text-cream/35">
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
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
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
    <div className="w-full">
      {/* ── Header Section ── */}
      <div className="pt-6 pb-5 px-1">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-display font-bold text-navy dark:text-cream tracking-tight">
              Articles
            </h1>
            {!loading && pagination.totalElements > 0 && (
              <p className="mt-1 text-sm text-steel/50 dark:text-sky/35 tabular-nums">
                {pagination.totalElements} articles
                {pagination.totalPages > 1 &&
                  ` · Page ${currentPage + 1} of ${pagination.totalPages}`}
              </p>
            )}
          </div>

          <Button
            onClick={() => router.push("/articles/create")}
            size="sm"
            className="h-8 rounded-full bg-navy text-cream-50 hover:bg-navy/80 dark:bg-cream dark:text-navy dark:hover:bg-cream/80 text-[13px] font-semibold px-4"
          >
            <PencilLine className="w-3.5 h-3.5 mr-1.5" />
            Write
          </Button>
        </div>

        {/* Search bar */}
        <div className="mt-4 flex items-center gap-3 max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-steel/40 dark:text-sky/30" />
            <Input
              type="text"
              value={query}
              onChange={handleQueryChange}
              placeholder="Search articles..."
              className="pl-10 h-10 text-sm bg-cream-300/30 dark:bg-navy-700/30 border-0 rounded-xl placeholder:text-steel/40 dark:placeholder:text-sky/25 focus-visible:ring-2 focus-visible:ring-steel/20 dark:focus-visible:ring-sky/20"
              disabled={loading}
            />
          </div>
        </div>
      </div>

      {/* ── Content Grid ── */}
      {renderContent()}

      {/* ── Pagination ── */}
      {!loading && blogs.length > 0 && pagination.totalPages > 1 && (
        <div className="mt-12 flex items-center justify-center gap-1">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={pagination.first}
            className="flex items-center justify-center w-10 h-10 rounded-full text-navy/50 dark:text-cream/40 hover:text-navy dark:hover:text-cream hover:bg-cream-300/40 dark:hover:bg-navy-700/40 disabled:opacity-20 disabled:pointer-events-none transition-all cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {getPageNumbers().map((page, idx) =>
            page === "..." ? (
              <span
                key={`dots-${idx}`}
                className="w-10 h-10 flex items-center justify-center text-sm text-navy/25 dark:text-cream/20"
              >
                ...
              </span>
            ) : (
              <button
                key={page}
                onClick={() => handlePageChange(page as number)}
                className={`w-10 h-10 rounded-full text-sm font-medium transition-all duration-200 cursor-pointer ${
                  currentPage === page
                    ? "bg-navy dark:bg-cream text-cream-50 dark:text-navy"
                    : "text-navy/50 dark:text-cream/40 hover:text-navy dark:hover:text-cream hover:bg-cream-300/40 dark:hover:bg-navy-700/40"
                }`}
              >
                {(page as number) + 1}
              </button>
            )
          )}

          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={pagination.last}
            className="flex items-center justify-center w-10 h-10 rounded-full text-navy/50 dark:text-cream/40 hover:text-navy dark:hover:text-cream hover:bg-cream-300/40 dark:hover:bg-navy-700/40 disabled:opacity-20 disabled:pointer-events-none transition-all cursor-pointer"
          >
            <ChevronRight className="w-5 h-5" />
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

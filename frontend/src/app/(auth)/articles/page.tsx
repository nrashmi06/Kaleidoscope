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
  Sparkles,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { useAccessToken } from "@/hooks/useAccessToken";
import { useDebounce } from "@/hooks/useDebounce";
import { filterBlogsController } from "@/controllers/blog/blogFilter.controller";
import { getBlogSuggestionsController } from "@/controllers/blog/blogSuggestionsController";
import type { BlogItem, PaginationMeta } from "@/lib/types/blogFilter.types";
import { motion, AnimatePresence } from "framer-motion";

type ArticleMode = "suggestions" | "search";

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

  const [mode, setMode] = useState<ArticleMode>("suggestions");

  // ── Suggestions state ──
  const [suggestions, setSuggestions] = useState<BlogItem[]>([]);
  const [suggestionsPage, setSuggestionsPage] = useState(0);
  const [suggestionsTotalPages, setSuggestionsTotalPages] = useState(0);
  const [suggestionsTotalElements, setSuggestionsTotalElements] = useState(0);
  const [suggestionsLoading, setSuggestionsLoading] = useState(true);

  // ── Search state ──
  const [blogs, setBlogs] = useState<BlogItem[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>(defaultPagination);
  const [query, setQuery] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debouncedQuery = useDebounce(query, 400);
  const [searchPage, setSearchPage] = useState(0);

  // ── Suggestions fetching ──
  const fetchSuggestions = useCallback(
    async (page: number) => {
      if (!accessToken) return;
      setSuggestionsLoading(true);
      try {
        const res = await getBlogSuggestionsController(accessToken, page, ARTICLES_PER_PAGE);
        if (res.success && res.data) {
          setSuggestions(res.data.content || []);
          setSuggestionsTotalPages(res.data.totalPages || 1);
          setSuggestionsTotalElements(res.data.totalElements || 0);
        }
      } catch (err) {
        console.error("Failed to fetch article suggestions:", err);
      } finally {
        setSuggestionsLoading(false);
      }
    },
    [accessToken]
  );

  useEffect(() => {
    if (mode === "suggestions") {
      fetchSuggestions(suggestionsPage);
    }
  }, [mode, suggestionsPage, fetchSuggestions]);

  // ── Search fetching ──
  const fetchBlogs = useCallback(
    async (page: number, searchQuery: string) => {
      if (!accessToken) {
        setSearchLoading(false);
        setError("Authentication required.");
        return;
      }

      setSearchLoading(true);
      setError(null);

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
        setSearchLoading(false);
      }
    },
    [accessToken]
  );

  useEffect(() => {
    if (mode === "search") {
      fetchBlogs(searchPage, debouncedQuery);
    }
  }, [mode, searchPage, debouncedQuery, fetchBlogs]);

  useEffect(() => {
    setSearchPage(0);
  }, [debouncedQuery]);

  // ── Mode switch ──
  const handleModeSwitch = (newMode: ArticleMode) => {
    if (newMode === mode) return;
    setMode(newMode);
    if (newMode === "search" && blogs.length === 0) {
      fetchBlogs(0, debouncedQuery);
    }
  };

  // ── Pagination ──
  const currentPage = mode === "suggestions" ? suggestionsPage : searchPage;
  const totalPages = mode === "suggestions" ? suggestionsTotalPages : pagination.totalPages;
  const totalElements = mode === "suggestions" ? suggestionsTotalElements : pagination.totalElements;
  const isFirst = currentPage === 0;
  const isLast = currentPage >= totalPages - 1;
  const currentLoading = mode === "suggestions" ? suggestionsLoading : searchLoading;
  const currentData = mode === "suggestions" ? suggestions : blogs;

  const handlePageChange = (newPage: number) => {
    if (newPage < 0 || newPage >= totalPages) return;
    if (mode === "suggestions") {
      setSuggestionsPage(newPage);
    } else {
      setSearchPage(newPage);
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const getPageNumbers = () => {
    if (totalPages <= 1) return [];
    const pages: (number | "...")[] = [];
    if (totalPages <= 5) {
      for (let i = 0; i < totalPages; i++) pages.push(i);
    } else {
      pages.push(0);
      if (currentPage > 2) pages.push("...");
      for (let i = Math.max(1, currentPage - 1); i <= Math.min(totalPages - 2, currentPage + 1); i++) {
        pages.push(i);
      }
      if (currentPage < totalPages - 3) pages.push("...");
      pages.push(totalPages - 1);
    }
    return pages;
  };

  // ── Render grid ──
  const renderContent = () => {
    if (currentLoading) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[...Array(ARTICLES_PER_PAGE)].map((_, i) => (
            <div key={i} className="h-[22rem] rounded-2xl bg-cream-300/30 dark:bg-navy-700/30 animate-pulse" />
          ))}
        </div>
      );
    }

    if (error && mode === "search") {
      return (
        <div className="flex flex-col items-center justify-center text-center py-20 px-6">
          <div className="flex items-center justify-center w-14 h-14 rounded-full bg-red-50 dark:bg-red-950/20 mb-5">
            <AlertCircle className="w-6 h-6 text-red-500 dark:text-red-400" />
          </div>
          <h3 className="text-lg font-display font-semibold text-heading mb-2">Failed to Load Articles</h3>
          <p className="text-sm text-faint mb-6 max-w-sm">{error}</p>
          <Button onClick={() => fetchBlogs(searchPage, debouncedQuery)} variant="destructive" size="sm" className="rounded-full px-6">
            Try Again
          </Button>
        </div>
      );
    }

    if (currentData.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center text-center py-20 px-6">
          <div className="flex items-center justify-center w-14 h-14 rounded-full bg-cream-300/30 dark:bg-navy-700/30 mb-5">
            <Inbox className="w-6 h-6 text-navy/25 dark:text-cream/25" />
          </div>
          <h3 className="text-lg font-display font-semibold text-heading mb-2">
            {mode === "suggestions" ? "No Suggestions Yet" : "No Articles Found"}
          </h3>
          <p className="text-sm text-faint">
            {mode === "suggestions"
              ? "Suggestions will appear as more articles are published."
              : debouncedQuery.trim()
              ? `No articles matching "${debouncedQuery}" were found.`
              : "There are no articles to display yet."}
          </p>
        </div>
      );
    }

    return (
      <AnimatePresence>
        <motion.div layout className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {currentData.map((blog, index) => (
            <motion.div
              key={blog.blogId}
              layout
              initial={{ opacity: 0, y: 24, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -16, scale: 0.97 }}
              transition={{ duration: 0.35, delay: index * 0.04, ease: "easeOut" }}
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
      {/* ── Header ── */}
      <div className="pt-6 pb-5 px-1">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-display font-bold text-heading tracking-tight">
              Articles
            </h1>
            {!currentLoading && totalElements > 0 && (
              <p className="mt-1 text-sm text-steel/50 dark:text-sky/35 tabular-nums">
                {totalElements} article{totalElements !== 1 ? "s" : ""}
                {totalPages > 1 && (
                  <span className="ml-1.5 text-steel/35 dark:text-sky/20">
                    · Page {currentPage + 1}/{totalPages}
                  </span>
                )}
              </p>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* Segmented control — For You / Browse */}
            <div className="inline-flex p-1 rounded-full bg-cream-300/50 dark:bg-navy-700/50">
              <button
                onClick={() => handleModeSwitch("suggestions")}
                className={`relative flex items-center gap-1.5 px-4 py-1.5 text-[13px] font-medium rounded-full transition-all duration-300 cursor-pointer ${
                  mode === "suggestions"
                    ? "bg-navy text-cream dark:bg-cream dark:text-navy shadow-sm"
                    : "text-navy/50 dark:text-cream/50 hover:text-navy dark:hover:text-cream"
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                For You
              </button>
              <button
                onClick={() => handleModeSwitch("search")}
                className={`relative flex items-center gap-1.5 px-4 py-1.5 text-[13px] font-medium rounded-full transition-all duration-300 cursor-pointer ${
                  mode === "search"
                    ? "bg-navy text-cream dark:bg-cream dark:text-navy shadow-sm"
                    : "text-navy/50 dark:text-cream/50 hover:text-navy dark:hover:text-cream"
                }`}
              >
                <Search className="w-3.5 h-3.5" />
                Browse
              </button>
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
        </div>

        {/* Search bar — only in search mode */}
        {mode === "search" && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="mt-4 max-w-md"
          >
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-steel/40 dark:text-sky/30" />
              <Input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search articles..."
                className="pl-10 h-10 text-sm bg-cream-300/30 dark:bg-navy-700/30 border-0 rounded-xl placeholder:text-steel/40 dark:placeholder:text-sky/25 focus-visible:ring-2 focus-visible:ring-steel/20 dark:focus-visible:ring-sky/20"
                disabled={currentLoading}
              />
            </div>
          </motion.div>
        )}
      </div>

      {/* ── Content Grid ── */}
      {renderContent()}

      {/* ── Pagination ── */}
      {!currentLoading && currentData.length > 0 && totalPages > 1 && (
        <div className="mt-12 flex items-center justify-center gap-1">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={isFirst}
            className="flex items-center justify-center w-10 h-10 rounded-full text-muted hover:text-navy dark:hover:text-cream hover:bg-surface-hover disabled:opacity-20 disabled:pointer-events-none transition-all cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {getPageNumbers().map((page, idx) =>
            page === "..." ? (
              <span key={`dots-${idx}`} className="w-10 h-10 flex items-center justify-center text-sm text-navy/25 dark:text-cream/20">
                ...
              </span>
            ) : (
              <button
                key={page}
                onClick={() => handlePageChange(page as number)}
                className={`w-10 h-10 rounded-full text-sm font-medium transition-all duration-200 cursor-pointer ${
                  currentPage === page
                    ? "bg-btn-primary text-on-primary"
                    : "text-muted hover:text-navy dark:hover:text-cream hover:bg-surface-hover"
                }`}
              >
                {(page as number) + 1}
              </button>
            )
          )}

          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={isLast}
            className="flex items-center justify-center w-10 h-10 rounded-full text-muted hover:text-navy dark:hover:text-cream hover:bg-surface-hover disabled:opacity-20 disabled:pointer-events-none transition-all cursor-pointer"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
}

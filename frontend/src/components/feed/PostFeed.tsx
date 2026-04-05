// src/components/feed/PostFeed.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAccessToken } from "@/hooks/useAccessToken";
import { useDebounce } from "@/hooks/useDebounce";
import { getPostsController } from "@/controllers/postController/getPostsController";
import { getParentCategoriesController } from "@/controllers/categoryController/getParentCategories";
import {
  type NormalizedPostFeedItem,
  type NormalizedPagination,
  type PostFilterParams,
} from "@/lib/types/postFeed";
import type { FlatCategory } from "@/lib/types/settings/category";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ChevronLeft,
  ChevronRight,
  Search,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react";

import { FeedFilterSheet } from "@/components/feed/FeedFilterSheet";
import { PostFeedGrid } from "@/components/feed/PostFeedGrid";
import { ContentSuggestionsSection } from "@/components/common/ContentSuggestions";

const defaultFilters: PostFilterParams = {
  q: "",
  hashtag: "",
  categoryId: undefined,
  visibility: undefined,
  page: 0,
  size: 9,
  sort: ["createdAt,desc"],
};

export default function PostFeed() {
  const accessToken = useAccessToken();

  const [posts, setPosts] = useState<NormalizedPostFeedItem[]>([]);
  const [pagination, setPagination] = useState<NormalizedPagination | null>(
    null
  );
  const [categories, setCategories] = useState<FlatCategory[]>([]);

  const [activeFilters, setActiveFilters] =
    useState<PostFilterParams>(defaultFilters);
  const [stagedFilters, setStagedFilters] =
    useState<PostFilterParams>(defaultFilters);
  const debouncedSearchQuery = useDebounce(stagedFilters.q || "", 400);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);

  useEffect(() => {
    if (!accessToken) return;
    getParentCategoriesController(accessToken)
      .then((res) => {
        if (res.success && res.data?.content) {
          setCategories(res.data.content);
        }
      })
      .catch((err) => console.error("Failed to fetch categories:", err));
  }, [accessToken]);

  const fetchFeed = useCallback(
    async (filters: PostFilterParams) => {
      if (!accessToken) {
        setError("Not authenticated.");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);
      window.scrollTo(0, 0);

      try {
        const result = await getPostsController(accessToken, filters);

        if (result.success) {
          setPosts(result.posts);
          setPagination(result.pagination);
        } else {
          throw new Error(result.error || "Failed to load posts");
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "An unknown error occurred"
        );
        setPosts([]);
        setPagination(null);
      } finally {
        setIsLoading(false);
      }
    },
    [accessToken]
  );

  useEffect(() => {
    setActiveFilters((prev) => ({
      ...prev,
      q: debouncedSearchQuery,
      page: 0,
    }));
  }, [debouncedSearchQuery]);

  useEffect(() => {
    fetchFeed(activeFilters);
  }, [activeFilters, fetchFeed]);

  const handleStagedFilterChange = (
    key: keyof PostFilterParams,
    value: string | number | undefined
  ) => {
    const processedValue =
      value === "all" || value === "" ? undefined : value;
    setStagedFilters((prev) => ({ ...prev, [key]: processedValue }));
  };

  const applyFilters = () => {
    setActiveFilters({ ...stagedFilters, page: 0 });
    setIsFilterSheetOpen(false);
  };

  const clearFilters = () => {
    setStagedFilters(defaultFilters);
    setActiveFilters(defaultFilters);
    setIsFilterSheetOpen(false);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 0 && newPage < (pagination?.totalPages || 0)) {
      setActiveFilters((prev) => ({ ...prev, page: newPage }));
    }
  };

  const handleQueryChange = (query: string) => {
    handleStagedFilterChange("q", query);
  };

  const handlePostDeleted = useCallback(() => {
    fetchFeed(activeFilters);
  }, [fetchFeed, activeFilters]);

  // Generate visible page numbers
  const getPageNumbers = () => {
    if (!pagination) return [];
    const total = pagination.totalPages;
    const current = pagination.currentPage;
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
              <Sparkles className="w-5 h-5 text-cream-50" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-navy dark:text-cream tracking-tight">
                Your Feed
              </h1>
              {!isLoading && pagination && (
                <p className="text-[11px] text-steel dark:text-sky/60 tabular-nums">
                  {pagination.totalElements} posts
                  {pagination.totalPages > 1 &&
                    ` · Page ${pagination.currentPage + 1} of ${pagination.totalPages}`}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Search & filter bar — compact inline */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-steel/50 dark:text-sky/40" />
            <Input
              type="text"
              value={stagedFilters.q || ""}
              onChange={(e) => handleQueryChange(e.target.value)}
              placeholder="Search posts..."
              className="pl-10 h-9 text-sm bg-cream-50/60 dark:bg-navy-700/30 border-cream-300/40 dark:border-navy-700/40 rounded-xl"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsFilterSheetOpen(true)}
            className="h-9 rounded-xl border-cream-300/40 dark:border-navy-700/40"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 mr-1.5" />
            Filters
          </Button>
        </div>

        {/* Gradient divider */}
        <div className="mt-5 h-px bg-gradient-to-r from-transparent via-cream-400/30 dark:via-navy-700/40 to-transparent" />
      </div>

      {/* Filter Modal */}
      <FeedFilterSheet
        isVisible={isFilterSheetOpen}
        categories={categories}
        stagedFilters={stagedFilters}
        onClose={() => setIsFilterSheetOpen(false)}
        onFilterChange={handleStagedFilterChange}
        onApply={applyFilters}
        onClear={clearFilters}
      />

      {/* ── Content Grid ── */}
      <PostFeedGrid
        isLoading={isLoading}
        error={error}
        posts={posts}
        accessToken={accessToken}
        onPostDeleted={() => handlePostDeleted()}
        onRetry={() => fetchFeed(activeFilters)}
      />

      {/* ── Pagination ── */}
      {!isLoading && pagination && pagination.totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-1.5">
          {/* Previous */}
          <button
            onClick={() => handlePageChange(pagination.currentPage - 1)}
            disabled={pagination.isFirst}
            className="flex items-center justify-center w-9 h-9 rounded-xl text-steel dark:text-sky/70 hover:bg-cream-300/40 dark:hover:bg-navy-700/40 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Page numbers */}
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
                  pagination.currentPage === page
                    ? "bg-steel text-cream-50 shadow-sm shadow-steel/20 dark:bg-sky dark:text-navy dark:shadow-sky/15"
                    : "text-navy/70 dark:text-cream/60 hover:bg-cream-300/40 dark:hover:bg-navy-700/40"
                }`}
              >
                {(page as number) + 1}
              </button>
            )
          )}

          {/* Next */}
          <button
            onClick={() => handlePageChange(pagination.currentPage + 1)}
            disabled={pagination.isLast}
            className="flex items-center justify-center w-9 h-9 rounded-xl text-steel dark:text-sky/70 hover:bg-cream-300/40 dark:hover:bg-navy-700/40 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Suggested Posts */}
      {!isLoading && posts.length > 0 && accessToken && (
        <ContentSuggestionsSection
          type="posts"
          accessToken={accessToken}
          title="Suggested Posts"
        />
      )}
    </div>
  );
}

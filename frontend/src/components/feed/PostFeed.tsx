// src/components/feed/PostFeed.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAccessToken } from "@/hooks/useAccessToken";
import { useDebounce } from "@/hooks/useDebounce";
import { getPostsController } from "@/controllers/postController/getPostsController";
import { getPostSuggestionsController } from "@/controllers/postController/postSuggestionsController";
import { getParentCategoriesController } from "@/controllers/categoryController/getParentCategories";
import {
  type NormalizedPostFeedItem,
  type NormalizedPagination,
  type PostFilterParams,
} from "@/lib/types/postFeed";
import type { FlatCategory } from "@/lib/types/settings/category";

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
import { motion } from "framer-motion";

type FeedMode = "suggestions" | "search";

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

  const [feedMode, setFeedMode] = useState<FeedMode>("suggestions");

  // --- Suggestions state ---
  const [suggestionsPage, setSuggestionsPage] = useState(0);
  const [suggestionsTotalPages, setSuggestionsTotalPages] = useState(0);
  const [suggestionsTotalElements, setSuggestionsTotalElements] = useState(0);
  const [suggestionsLoading, setSuggestionsLoading] = useState(true);
  const [suggestionsData, setSuggestionsData] = useState<NormalizedPostFeedItem[]>([]);

  // --- Search state ---
  const [posts, setPosts] = useState<NormalizedPostFeedItem[]>([]);
  const [pagination, setPagination] = useState<NormalizedPagination | null>(null);
  const [categories, setCategories] = useState<FlatCategory[]>([]);
  const [activeFilters, setActiveFilters] = useState<PostFilterParams>(defaultFilters);
  const [stagedFilters, setStagedFilters] = useState<PostFilterParams>(defaultFilters);
  const debouncedSearchQuery = useDebounce(stagedFilters.q || "", 400);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);

  // Fetch categories
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

  // --- Suggestions fetching ---
  const fetchSuggestions = useCallback(
    async (page: number) => {
      if (!accessToken) return;
      setSuggestionsLoading(true);
      try {
        const res = await getPostSuggestionsController(accessToken, page, 9);
        if (res.success && res.data) {
          const data = res.data as {
            content?: Array<{
              postId: number;
              title: string;
              summary: string;
              createdAt: string;
              author: { userId: number; username: string; profilePictureUrl?: string; email?: string; accountStatus?: string };
              thumbnailUrl?: string | null;
              mediaDetails?: Array<{ url: string; mediaType: string }>;
              commentCount: number;
              reactionCount: number;
              viewCount: number;
              categories?: Array<{ categoryId: number; name: string }>;
              hashtags?: string[];
              visibility?: "PUBLIC" | "FOLLOWERS";
            }>;
            totalPages?: number;
            totalElements?: number;
          };
          const content = data.content || [];
          const normalized: NormalizedPostFeedItem[] = content.map((item) => ({
            postId: item.postId,
            title: item.title,
            summary: item.summary || "",
            visibility: item.visibility || "PUBLIC",
            createdAt: new Date(item.createdAt),
            formattedCreatedAt: "",
            author: {
              userId: item.author.userId,
              email: item.author.email || "",
              username: item.author.username,
              profilePictureUrl: item.author.profilePictureUrl || "/default-avatar.png",
              accountStatus: item.author.accountStatus || "ACTIVE",
            },
            categories: item.categories || [],
            thumbnailUrl: item.thumbnailUrl || null,
            hashtags: item.hashtags || [],
            reactionCount: item.reactionCount || 0,
            commentCount: item.commentCount || 0,
            viewCount: item.viewCount || 0,
          }));
          setSuggestionsData(normalized);
          setSuggestionsTotalPages(data.totalPages || 1);
          setSuggestionsTotalElements(data.totalElements || content.length);
        }
      } catch (err) {
        console.error("Failed to fetch suggestions:", err);
      } finally {
        setSuggestionsLoading(false);
      }
    },
    [accessToken]
  );

  useEffect(() => {
    if (feedMode === "suggestions") {
      fetchSuggestions(suggestionsPage);
    }
  }, [feedMode, suggestionsPage, fetchSuggestions]);

  // --- Search / filter fetching ---
  const fetchFeed = useCallback(
    async (filters: PostFilterParams) => {
      if (!accessToken) {
        setError("Not authenticated.");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

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
    if (feedMode === "search") {
      setActiveFilters((prev) => ({
        ...prev,
        q: debouncedSearchQuery,
        page: 0,
      }));
    }
  }, [debouncedSearchQuery, feedMode]);

  useEffect(() => {
    if (feedMode === "search") {
      fetchFeed(activeFilters);
    }
  }, [activeFilters, fetchFeed, feedMode]);

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
    // Switch to search mode when filters are applied
    if (feedMode === "suggestions") {
      setFeedMode("search");
    }
  };

  const clearFilters = () => {
    setStagedFilters(defaultFilters);
    setActiveFilters(defaultFilters);
    setIsFilterSheetOpen(false);
  };

  const handlePageChange = (newPage: number) => {
    if (feedMode === "suggestions") {
      if (newPage >= 0 && newPage < suggestionsTotalPages) {
        setSuggestionsPage(newPage);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } else {
      if (newPage >= 0 && newPage < (pagination?.totalPages || 0)) {
        setActiveFilters((prev) => ({ ...prev, page: newPage }));
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    }
  };

  const handleQueryChange = (query: string) => {
    handleStagedFilterChange("q", query);
  };

  const handlePostDeleted = useCallback(() => {
    if (feedMode === "suggestions") {
      fetchSuggestions(suggestionsPage);
    } else {
      fetchFeed(activeFilters);
    }
  }, [feedMode, fetchSuggestions, suggestionsPage, fetchFeed, activeFilters]);

  const handleModeSwitch = (mode: FeedMode) => {
    if (mode === feedMode) return;
    setFeedMode(mode);
    if (mode === "search" && posts.length === 0) {
      setActiveFilters({ ...defaultFilters });
    }
  };

  // Pagination helpers
  const currentPage = feedMode === "suggestions" ? suggestionsPage : (pagination?.currentPage || 0);
  const totalPages = feedMode === "suggestions" ? suggestionsTotalPages : (pagination?.totalPages || 0);
  const totalElements = feedMode === "suggestions" ? suggestionsTotalElements : (pagination?.totalElements || 0);
  const isFirst = currentPage === 0;
  const isLast = currentPage >= totalPages - 1;
  const currentLoading = feedMode === "suggestions" ? suggestionsLoading : isLoading;

  const getPageNumbers = () => {
    if (totalPages <= 1) return [];
    const pages: (number | "...")[] = [];

    if (totalPages <= 5) {
      for (let i = 0; i < totalPages; i++) pages.push(i);
    } else {
      pages.push(0);
      if (currentPage > 2) pages.push("...");
      for (
        let i = Math.max(1, currentPage - 1);
        i <= Math.min(totalPages - 2, currentPage + 1);
        i++
      ) {
        pages.push(i);
      }
      if (currentPage < totalPages - 3) pages.push("...");
      pages.push(totalPages - 1);
    }
    return pages;
  };

  return (
    <div className="w-full relative">
      {/* ── Header ── */}
      <div className="pt-6 pb-5 px-1">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        >
          <div>
            <h1 className="text-2xl font-display font-bold text-navy dark:text-cream tracking-tight">
              Feed
            </h1>
            {!currentLoading && (
              <p className="mt-1 text-sm text-steel/50 dark:text-sky/35">
                {totalElements} post{totalElements !== 1 ? "s" : ""}
                {totalPages > 1 && (
                  <span className="ml-1.5 text-steel/35 dark:text-sky/20">
                    · Page {currentPage + 1}/{totalPages}
                  </span>
                )}
              </p>
            )}
          </div>

          {/* Controls row */}
          <div className="flex items-center gap-3">
            {/* Segmented control */}
            <div className="inline-flex p-1 rounded-full bg-cream-300/50 dark:bg-navy-700/50">
              <button
                onClick={() => handleModeSwitch("suggestions")}
                className={`relative flex items-center gap-1.5 px-4 py-1.5 text-[13px] font-medium rounded-full transition-all duration-300 cursor-pointer ${
                  feedMode === "suggestions"
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
                  feedMode === "search"
                    ? "bg-navy text-cream dark:bg-cream dark:text-navy shadow-sm"
                    : "text-navy/50 dark:text-cream/50 hover:text-navy dark:hover:text-cream"
                }`}
              >
                <Search className="w-3.5 h-3.5" />
                Search
              </button>
            </div>
          </div>
        </motion.div>

        {/* Search bar + Filters — always visible */}
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          transition={{ duration: 0.3 }}
          className="mt-4 flex items-center gap-3 max-w-lg"
        >
          {feedMode === "search" && (
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-steel/40 dark:text-sky/30" />
              <Input
                type="text"
                value={stagedFilters.q || ""}
                onChange={(e) => handleQueryChange(e.target.value)}
                placeholder="Search posts..."
                className="pl-10 h-10 text-sm bg-cream-300/30 dark:bg-navy-700/30 border-0 rounded-xl placeholder:text-steel/40 dark:placeholder:text-sky/25 focus-visible:ring-2 focus-visible:ring-steel/20 dark:focus-visible:ring-sky/20"
              />
            </div>
          )}
          <button
            onClick={() => setIsFilterSheetOpen(true)}
            className="flex items-center gap-1.5 h-10 px-4 text-[13px] font-medium text-navy/60 dark:text-cream/60 hover:text-navy dark:hover:text-cream bg-cream-300/30 dark:bg-navy-700/30 rounded-xl transition-colors cursor-pointer"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Filters
          </button>
        </motion.div>
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
      <div className="py-4">
        {feedMode === "suggestions" ? (
          <PostFeedGrid
            isLoading={suggestionsLoading}
            error={null}
            posts={suggestionsData}
            accessToken={accessToken}
            onPostDeleted={() => handlePostDeleted()}
            onRetry={() => fetchSuggestions(suggestionsPage)}
          />
        ) : (
          <PostFeedGrid
            isLoading={isLoading}
            error={error}
            posts={posts}
            accessToken={accessToken}
            onPostDeleted={() => handlePostDeleted()}
            onRetry={() => fetchFeed(activeFilters)}
          />
        )}

        {/* ── Pagination ── */}
        {!currentLoading && totalPages > 1 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-12 flex items-center justify-center gap-1"
          >
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={isFirst}
              className="flex items-center justify-center w-10 h-10 rounded-full text-steel/60 dark:text-sky/40 hover:text-navy dark:hover:text-cream hover:bg-cream-300/40 dark:hover:bg-navy-700/40 disabled:opacity-20 disabled:pointer-events-none transition-all cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            {getPageNumbers().map((page, idx) =>
              page === "..." ? (
                <span
                  key={`dots-${idx}`}
                  className="w-10 h-10 flex items-center justify-center text-sm text-steel/30 dark:text-sky/20"
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
                      : "text-steel/60 dark:text-sky/40 hover:text-navy dark:hover:text-cream hover:bg-cream-300/40 dark:hover:bg-navy-700/40"
                  }`}
                >
                  {(page as number) + 1}
                </button>
              )
            )}

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={isLast}
              className="flex items-center justify-center w-10 h-10 rounded-full text-steel/60 dark:text-sky/40 hover:text-navy dark:hover:text-cream hover:bg-cream-300/40 dark:hover:bg-navy-700/40 disabled:opacity-20 disabled:pointer-events-none transition-all cursor-pointer"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}

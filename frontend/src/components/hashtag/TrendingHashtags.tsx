// src/components/hashtag/TrendingHashtags.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAccessToken } from "@/hooks/useAccessToken";
import { useAppSelector } from "@/hooks/useAppSelector";
import { useDebounce } from "@/hooks/useDebounce";
import { getTrendingHashtagsController } from "@/controllers/hashtag/getTrendingHashtagsController";
import { deleteHashtagController } from "@/controllers/hashtag/deleteHashtagController";
import type { TrendingHashtag } from "@/lib/types/trendingHashtag";
import type { NormalizedPagination } from "@/controllers/hashtag/getTrendingHashtagsController";
import { AnimatePresence, motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Hash,
    Search,
    AlertCircle,
    X,
    TrendingUp,
  ChevronLeft,
  ChevronRight,
  Trash2
} from "lucide-react";
import toast from "react-hot-toast";

// Skeleton component for loading state
const HashtagSkeleton = () => (
  <div className="flex items-center justify-between p-4 bg-surface rounded-lg animate-pulse">
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-full bg-cream-300/60 dark:bg-navy-700/60" />
      <div className="w-24 h-4 bg-cream-300/60 dark:bg-navy-700/60 rounded" />
    </div>
    <div className="w-12 h-4 bg-cream-300/60 dark:bg-navy-700/60 rounded" />
  </div>
);

export const TrendingHashtags: React.FC = () => {
  const accessToken = useAccessToken();
  const role = useAppSelector((state) => state.auth.role);
  const [hashtags, setHashtags] = useState<TrendingHashtag[]>([]);
  const [pagination, setPagination] = useState<NormalizedPagination | null>(null);
  const [page, setPage] = useState(0);
  const [filter, setFilter] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const debouncedFilter = useDebounce(filter, 400);

  const fetchHashtags = useCallback(async (
    currentPage: number,
    currentFilter: string
  ) => {
    if (!accessToken) {
      setError("Not authenticated.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await getTrendingHashtagsController(
        {
          page: currentPage,
          size: 10,
          filter: currentFilter || undefined,
        },
        accessToken
      );

      if (result.success) {
        setHashtags(result.hashtags);
        setPagination(result.pagination);
      } else {
        throw new Error(result.error || "Failed to load hashtags");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred");
      setHashtags([]);
      setPagination(null);
    } finally {
      setIsLoading(false);
    }
  }, [accessToken]);

  // Fetch when page or debounced filter changes
  useEffect(() => {
    fetchHashtags(page, debouncedFilter);
  }, [page, debouncedFilter, fetchHashtags]);

  // Reset page to 0 when filter changes
  useEffect(() => {
    setPage(0);
  }, [debouncedFilter]);

  const handleRetry = () => {
    fetchHashtags(page, debouncedFilter);
  };

  const handleDelete = async (tag: TrendingHashtag) => {
    if (!accessToken) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete the hashtag "#${tag.name}"?`
    );
    if (!confirmed) return;

    setDeletingId(tag.hashtagId);
    try {
      const result = await deleteHashtagController(accessToken, tag.hashtagId);
      if (result.success) {
        toast.success(result.message || `Hashtag "#${tag.name}" deleted.`);
        fetchHashtags(page, debouncedFilter);
      } else {
        toast.error(result.message || "Failed to delete hashtag.");
      }
    } catch {
      toast.error("An unexpected error occurred while deleting.");
    } finally {
      setDeletingId(null);
    }
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <HashtagSkeleton key={i} />
          ))}
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center text-center p-8 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg">
          <AlertCircle className="w-8 h-8 text-red-500 mb-3" />
          <p className="font-semibold text-red-700 dark:text-red-300 mb-4">{error}</p>
          <Button onClick={handleRetry} variant="destructive" size="sm">
            Try Again
          </Button>
        </div>
      );
    }

    if (hashtags.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center text-center p-8 bg-surface border border-border-default rounded-lg">
          <Hash className="w-8 h-8 text-steel/50 dark:text-sky/30 mb-3" />
          <p className="font-semibold text-sub">
            No Trending Hashtags Found
          </p>
          <p className="text-sm text-steel/60 dark:text-sky/40 mt-1">
            {filter ? `No results for "${filter}".` : "Check back later!"}
          </p>
        </div>
      );
    }

    return (
      <motion.div
        className="space-y-3"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        {hashtags.map((tag) => (
          <motion.div
            key={tag.hashtagId}
            layout
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex items-center justify-between p-3.5 bg-cream-50 dark:bg-navy-700/30 border border-border-default rounded-lg shadow-sm hover:bg-cream-300/20 dark:hover:bg-navy-700/40 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-steel/10 dark:bg-sky/10 text-steel dark:text-sky">
                <Hash className="w-4 h-4" />
              </div>
              <span className="font-medium text-heading">
                {tag.name}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 text-sm text-steel/60 dark:text-sky/40">
                <TrendingUp className="w-4 h-4 text-green-500" />
                <span className="font-semibold">{tag.usageCount.toLocaleString()}</span>
              </div>
              {role === "ADMIN" && (
                <button
                  type="button"
                  onClick={() => handleDelete(tag)}
                  disabled={deletingId === tag.hashtagId}
                  className="ml-1 p-1.5 rounded-md text-steel/50 dark:text-sky/30 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title={`Delete #${tag.name}`}
                >
                  <Trash2 className={`w-3.5 h-3.5 ${deletingId === tag.hashtagId ? "animate-pulse" : ""}`} />
                </button>
              )}
            </div>
          </motion.div>
        ))}
      </motion.div>
    );
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-5">
      {/* Filter Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-steel/50 dark:text-sky/30" />
        <Input
          type="text"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filter trending hashtags..."
          className="pl-10 pr-10" // Padding for icons
          disabled={isLoading}
        />
        {filter && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 text-steel/50 dark:text-sky/30 hover:text-navy/70 dark:hover:text-cream/60"
            onClick={() => setFilter("")}
            disabled={isLoading}
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Content Area */}
      <AnimatePresence mode="wait">
        <motion.div
          key={isLoading ? "loading" : hashtags.length > 0 ? "data" : "empty"}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {renderContent()}
        </motion.div>
      </AnimatePresence>

      {/* Pagination Controls */}
      {pagination && pagination.totalElements > 0 && (
        <div className="flex items-center justify-between pt-4 border-t border-border-default">
          <Button
            onClick={() => setPage((p) => p - 1)}
            disabled={pagination.first || isLoading}
            variant="outline"
            size="sm"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Previous
          </Button>
          <span className="text-sm text-steel/70 dark:text-sky/40">
            Page {pagination.currentPage + 1} of {pagination.totalPages}
          </span>
          <Button
            onClick={() => setPage((p) => p + 1)}
            disabled={pagination.last || isLoading}
            variant="outline"
            size="sm"
          >
            Next
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      )}
    </div>
  );
};

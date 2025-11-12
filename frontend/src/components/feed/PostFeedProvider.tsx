// src/components/feed/PostFeedProvider.tsx (Renamed from PostFeed)

"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAccessToken } from "@/hooks/useAccessToken";
import { useDebounce } from "@/hooks/useDebounce";
import { getPostsController } from "@/controllers/postController/getPostsController";
import { getParentCategoriesController } from "@/controllers/categoryController/getParentCategories";
import { 
  mapFeedItemToPost,
  type NormalizedPostFeedItem, 
  type NormalizedPagination, 
  type PostFilterParams 
} from "@/lib/types/postFeed";
import type { FlatCategory } from "@/lib/types/settings/category";
import { Post } from "@/services/post/fetchPosts";

// UI Components
import { Button } from "@/components/ui/button";
import { SocialPostCard } from "@/components/feed/SocialPostCard";
import PostLoader from "@/components/loading/PostLoader";
import { AnimatePresence, motion } from "framer-motion";
import { 
  AlertCircle, 
  Inbox,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

// New Components
import { FeedFilterBar } from "@/components/feed/FeedFilterBar";
import { FeedFilterSheet } from "@/components/feed/FeedFilterSheet";

// Default state for filters
const defaultFilters: PostFilterParams = {
  q: "",
  hashtag: "",
  categoryId: undefined,
  visibility: undefined,
  page: 0,
  size: 9, // 9 items for a 3x3 grid
  sort: ["createdAt,desc"],
};

export default function PostFeedProvider() {
  const accessToken = useAccessToken();
  
  // State for data
  const [posts, setPosts] = useState<NormalizedPostFeedItem[]>([]);
  const [pagination, setPagination] = useState<NormalizedPagination | null>(null);
  const [categories, setCategories] = useState<FlatCategory[]>([]);
  
  // State for filters (Logic remains centralized here)
  const [activeFilters, setActiveFilters] = useState<PostFilterParams>(defaultFilters);
  const [stagedFilters, setStagedFilters] = useState<PostFilterParams>(defaultFilters);
  const debouncedSearchQuery = useDebounce(stagedFilters.q || "", 400);

  // State for UI
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);

  // --- 1. Data Fetching ---

  // Fetch categories for the filter dropdown
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
  
  // Main function to fetch posts based on *active* filters
  const fetchFeed = useCallback(async (filters: PostFilterParams) => {
    if (!accessToken) {
      setError("Not authenticated.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    window.scrollTo(0, 0); // Scroll to top on page change

    try {
      const result = await getPostsController(accessToken, filters);

      if (result.success) {
        setPosts(result.posts);
        setPagination(result.pagination);
      } else {
        throw new Error(result.error || "Failed to load posts");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred");
      setPosts([]);
      setPagination(null);
    } finally {
      setIsLoading(false);
    }
  }, [accessToken]);

  // --- 2. Filter & Pagination Handlers ---

  // Effect to apply debounced search query
  useEffect(() => {
    // Apply debounced 'q' filter directly to active filters
    setActiveFilters(prev => ({ ...prev, q: debouncedSearchQuery, page: 0 }));
  }, [debouncedSearchQuery]);

  // Trigger fetch when active filters (like page or search) change
  useEffect(() => {
    fetchFeed(activeFilters);
  }, [activeFilters, fetchFeed]);

  // Handle changes in the filter modal inputs (Passed to FeedFilterSheet)
  const handleStagedFilterChange = (
    key: keyof PostFilterParams, 
    value: string | number | undefined
  ) => {
    const processedValue = value === "all" || value === "" ? undefined : value;
    setStagedFilters(prev => ({ ...prev, [key]: processedValue }));
  };

  // Apply filters from modal to active state (Passed to FeedFilterSheet)
  const applyFilters = () => {
    setActiveFilters({ ...stagedFilters, page: 0 }); // Reset to page 0
    setIsFilterSheetOpen(false);
  };

  // Clear all filters (Passed to FeedFilterSheet)
  const clearFilters = () => {
    setStagedFilters(defaultFilters);
    setActiveFilters(defaultFilters);
    setIsFilterSheetOpen(false);
  };
  
  // Handle pagination
  const handlePageChange = (newPage: number) => {
    if (newPage >= 0 && newPage < (pagination?.totalPages || 0)) {
      setActiveFilters(prev => ({ ...prev, page: newPage }));
    }
  };

  // Handle query change (Passed to FeedFilterBar)
  const handleQueryChange = (query: string) => {
    handleStagedFilterChange('q', query);
  };


  // --- 3. Render Logic ---

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => <PostLoader key={i} />)}
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center text-center py-20 px-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg">
          <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
          <h3 className="text-xl font-semibold text-red-700 dark:text-red-300 mb-2">Failed to Load Feed</h3>
          <p className="text-red-600 dark:text-red-400 mb-6">{error}</p>
          <Button onClick={() => fetchFeed(activeFilters)} variant="destructive">
            Try Again
          </Button>
        </div>
      );
    }

    if (posts.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center text-center py-20 px-6 bg-gray-50 dark:bg-neutral-800/50 border border-dashed border-gray-200 dark:border-neutral-700 rounded-lg">
          <Inbox className="w-12 h-12 text-gray-400 dark:text-gray-500 mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">No Posts Found</h3>
          <p className="text-gray-500 dark:text-gray-400">
            Try adjusting your filters or check back later.
          </p>
        </div>
      );
    }

    return (
      <AnimatePresence>
        <motion.div
          layout
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {posts.map((postItem, index) => {
            const adaptedPost: Post = mapFeedItemToPost(postItem);
            
            return (
              <motion.div
                key={postItem.postId}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <SocialPostCard
                  post={adaptedPost}
                  accessToken={accessToken}
                  onPostDeleted={() => fetchFeed(activeFilters)}
                />
              </motion.div>
            );
          })}
        </motion.div>
      </AnimatePresence>
    );
  };
  
  // --- Main Render ---
  return (
    <div className="w-full max-w-7xl mx-auto p-4 space-y-6">
      
      {/* 1. Filter Bar Component */}
      <FeedFilterBar 
        stagedQuery={stagedFilters.q || ""}
        totalPosts={posts.length}
        pagination={pagination}
        isLoading={isLoading}
        onQueryChange={handleQueryChange}
        onOpenFilters={() => setIsFilterSheetOpen(true)}
      />

      {/* 2. Filter Modal Component */}
      <FeedFilterSheet 
        isVisible={isFilterSheetOpen}
        categories={categories}
        stagedFilters={stagedFilters}
        onClose={() => setIsFilterSheetOpen(false)}
        onFilterChange={handleStagedFilterChange}
        onApply={applyFilters}
        onClear={clearFilters}
      />

      {/* 3. Content Grid */}
      {renderContent()}

      {/* 4. Pagination (Kept in Provider as it requires state management) */}
      {!isLoading && pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between p-4 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-xl shadow-sm">
          <Button
            onClick={() => handlePageChange(pagination.currentPage - 1)}
            disabled={pagination.isFirst}
            variant="outline"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Page {pagination.currentPage + 1} of {pagination.totalPages}
          </span>
          <Button
            onClick={() => handlePageChange(pagination.currentPage + 1)}
            disabled={pagination.isLast}
            variant="outline"
          >
            Next
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      )}
    </div>
  );
}
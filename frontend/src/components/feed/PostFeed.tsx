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
import { Post } from "@/services/post/fetchPosts"; // ✅ Import the destination type

// UI Components
import { Input } from "@/components/ui/input"; // Your existing Input
import { Button } from "@/components/ui/button"; // Your existing Button
import { SocialPostCard } from "@/components/feed/SocialPostCard";
import PostLoader from "@/components/loading/PostLoader";
import { AnimatePresence, motion } from "framer-motion";
import { 
  Search, 
  Hash, 
  AlertCircle, 
  Inbox,
  SlidersHorizontal,
  X
} from "lucide-react";

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

export default function PostFeed() {
  const accessToken = useAccessToken();
  
  // State for data
  const [posts, setPosts] = useState<NormalizedPostFeedItem[]>([]);
  const [pagination, setPagination] = useState<NormalizedPagination | null>(null);
  const [categories, setCategories] = useState<FlatCategory[]>([]);
  
  // State for filters
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

  // Handle changes in the filter modal inputs
  const handleStagedFilterChange = (
    key: keyof PostFilterParams, 
    value: string | number | undefined
  ) => {
    const processedValue = value === "all" || value === "" ? undefined : value;
    setStagedFilters(prev => ({ ...prev, [key]: processedValue }));
  };

  // Apply filters from modal to active state
  const applyFilters = () => {
    setActiveFilters({ ...stagedFilters, page: 0 }); // Reset to page 0
    setIsFilterSheetOpen(false);
  };

  // Clear all filters
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
            // ✅ ADAPTER FUNCTION: Convert new API shape to old component shape
            // This is the type-safe way to avoid `any`
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
                  post={adaptedPost} // ✅ Pass the *adapted* post
                  accessToken={accessToken}
                  onPostDeleted={() => fetchFeed(activeFilters)} // Refetch on delete
                />
              </motion.div>
            );
          })}
        </motion.div>
      </AnimatePresence>
    );
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-4 space-y-6">
      
      {/* --- Filter Bar --- */}
      <div className="p-4 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-xl shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search Input (Debounced) */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
            <Input
              type="text"
              value={stagedFilters.q || ""}
              onChange={(e) => handleStagedFilterChange('q', e.target.value)}
              placeholder="Search by keyword..."
              className="pl-10"
            />
          </div>
          
          {/* Open Filters Button */}
          <Button 
            variant="outline" 
            onClick={() => setIsFilterSheetOpen(true)}
            className="flex-shrink-0"
          >
            <SlidersHorizontal className="w-4 h-4 mr-2" />
            All Filters
          </Button>
        </div>
        
        {/* Total Results */}
        {!isLoading && pagination && (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Showing <span className="font-semibold text-gray-900 dark:text-white">{posts.length}</span> of <span className="font-semibold text-gray-900 dark:text-white">{pagination.totalElements}</span> results.
          </p>
        )}
      </div>

      {/* --- Filter Modal/Sheet --- */}
      <AnimatePresence>
        {isFilterSheetOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsFilterSheetOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="relative w-full max-w-md bg-white dark:bg-neutral-900 rounded-xl shadow-2xl border border-gray-200 dark:border-neutral-800 p-6 space-y-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Filters</h3>
                <Button variant="ghost" size="icon" onClick={() => setIsFilterSheetOpen(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* Hashtag */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-900 dark:text-white">Hashtag</label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
                  <Input
                    type="text"
                    value={stagedFilters.hashtag || ""}
                    onChange={(e) => handleStagedFilterChange('hashtag', e.target.value)}
                    placeholder="e.g., typescript"
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Category */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-900 dark:text-white">Category</label>
                {/* ✅ Using plain, styled <select> */}
                <select
                  value={stagedFilters.categoryId || "all"}
                  onChange={(e) => handleStagedFilterChange('categoryId', e.target.value === "all" ? undefined : Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-700 rounded-md bg-gray-50 dark:bg-neutral-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="all">All Categories</option>
                  {categories.map(cat => (
                    <option key={cat.categoryId} value={cat.categoryId}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Visibility */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-900 dark:text-white">Visibility</label>
                {/* ✅ Using plain, styled <select> */}
                <select
                  value={stagedFilters.visibility || "all"}
                  onChange={(e) => handleStagedFilterChange('visibility', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-700 rounded-md bg-gray-50 dark:bg-neutral-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="all">All</option>
                  <option value="PUBLIC">Public</option>
                  <option value="FOLLOWERS">Followers</option>
                </select>
              </div>
              
              {/* Action Buttons */}
              <div className="flex gap-4 pt-4 border-t border-gray-200 dark:border-neutral-800">
                <Button variant="outline" onClick={clearFilters} className="flex-1">
                  Clear All
                </Button>
                <Button onClick={applyFilters} className="flex-1">
                  Apply Filters
                </Button>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- Content Grid --- */}
      {renderContent()}

      {/* --- Pagination --- */}
      {!isLoading && pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between p-4 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-xl shadow-sm">
          <Button
            onClick={() => handlePageChange(pagination.currentPage - 1)}
            disabled={pagination.isFirst}
            variant="outline"
          >
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
          </Button>
        </div>
      )}
    </div>
  );
}
// src/components/articles/LinkedBlogSearch.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { filterBlogsController } from "@/controllers/blog/blogFilter.controller";
import { BlogItem } from "@/lib/types/blogFilter.types";
import { useAccessToken } from "@/hooks/useAccessToken";
import { useDebounce } from "@/hooks/useDebounce";
import { Search, Loader2, Link, X, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface LinkedBlogSearchProps {
  onBlogSelect: (blogId: number | undefined, title: string | undefined) => void;
  selectedBlogId?: number;
  initialQuery?: string;
}

export default function LinkedBlogSearch({
  onBlogSelect,
  selectedBlogId,
}: LinkedBlogSearchProps) {
  const accessToken = useAccessToken();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<BlogItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debouncedQuery = useDebounce(query, 400);

  // --- Fetch Blogs based on search query ---
  const fetchBlogs = useCallback(async (searchQuery: string) => {
    if (!accessToken) {
      setError("Authentication required to search.");
      return;
    }
    if (!searchQuery) {
      setResults([]);
      return;
    }

    setLoading(true);
    setError(null);
    setResults([]);

    try {
      // Use the existing filterBlogsController with the 'q' parameter
      const result = await filterBlogsController(accessToken, {
        q: searchQuery,
        size: 10,
      });

      if (result.success) {
        setResults(result.blogs);
      } else {
        setError(result.error || "Failed to search blogs.");
      }
    } catch (err) {
      setError("An unexpected network error occurred." + (err instanceof Error ? ` (${err.message})` : ""));
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  // Trigger search on debounced query change
  useEffect(() => {
    fetchBlogs(debouncedQuery);
  }, [debouncedQuery, fetchBlogs]);

  // --- Handlers ---
  const handleSelect = (blog: BlogItem) => {
    onBlogSelect(blog.blogId, blog.title);
    setQuery(blog.title); // Display selected title in the input
    setResults([]); // Clear results
  };

  const handleClearSelection = () => {
    onBlogSelect(undefined, undefined);
    setQuery("");
    setResults([]);
  };

  const selectedBlog = selectedBlogId
    ? results.find(b => b.blogId === selectedBlogId)
    : undefined;

  return (
    <div className="relative space-y-3 ">
      {/* Search Input */}
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={selectedBlogId ? selectedBlog?.title : "Search and select a blog to link..."}
          className={cn(
            "w-full pl-10 pr-4 py-3 border rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-all",
            selectedBlogId ? "border-green-400 focus:border-green-500" : "border-gray-300 dark:border-neutral-700"
          )}
          disabled={loading}
        />
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400" />
        
        {loading && (
          <Loader2 className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-blue-500 animate-spin" />
        )}
      </div>

      {/* Selected Blog Indicator */}
      {selectedBlogId !== undefined && (
        <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 border border-green-300 dark:border-green-700 rounded-lg">
          <span className="text-sm font-medium text-green-700 dark:text-green-300 flex items-center gap-2">
            <Link className="w-4 h-4" />
            Linked Blog ID: {selectedBlogId} - {selectedBlog?.title || 'Title Unknown'}
          </span>
          <button onClick={handleClearSelection} className="p-1 text-green-700 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-800/50 rounded-full">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Search Results Dropdown */}
      {!loading && results.length > 0 && debouncedQuery && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-neutral-800 border border-gray-300 dark:border-neutral-700 rounded-lg shadow-xl max-h-60 overflow-y-auto">
          {results.map((blog) => (
            <button
              key={blog.blogId}
              onClick={() => handleSelect(blog)}
              className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-neutral-700 border-b border-gray-100 dark:border-neutral-700 last:border-b-0 transition-colors"
            >
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-1">
                {blog.title}
              </h4>
              <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 mt-1">
                {blog.summary}
              </p>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1">
                <User className="w-3 h-3" /> @{blog.author.username}
              </div>
            </button>
          ))}
          {/* Error Message */}
          {error && (
            <div className="p-3 text-red-500 dark:text-red-400 text-xs">{error}</div>
          )}
        </div>
      )}
      
      {/* No Results Message */}
      {!loading && !selectedBlogId && query.length > 0 && results.length === 0 && (
          <div className="p-3 text-sm text-gray-500 dark:text-gray-400">
              No results found for &quot;{query}&quot;.
          </div>
      )}
    </div>
  );
}
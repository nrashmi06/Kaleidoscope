"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { filterBlogsController } from "@/controllers/blog/blogFilter.controller";
import { BlogItem } from "@/lib/types/blogFilter.types";
import { useAccessToken } from "@/hooks/useAccessToken";
import { useDebounce } from "@/hooks/useDebounce";
import {  Loader2, Link, X, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface LinkedBlogSearchProps {
  // ✅ UPDATED: Now expects an array of selected IDs
  onBlogSelect: (linkedBlogIds: number[]) => void;
  // ✅ UPDATED: The currently selected IDs
  selectedBlogIds: number[]; 
}

export default function LinkedBlogSearch({
  onBlogSelect,
  selectedBlogIds,
}: LinkedBlogSearchProps) {
  const accessToken = useAccessToken();
  const [query, setQuery] = useState("");
  // 'results' holds all blogs fetched from the current search
  const [results, setResults] = useState<BlogItem[]>([]); 
  // 'selectedBlogData' caches the full objects of selected blogs for display
  const [selectedBlogData, setSelectedBlogData] = useState<BlogItem[]>([]); 
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const debouncedQuery = useDebounce(query, 400);

  const containerRef = useRef<HTMLDivElement>(null); 
  
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
      const result = await filterBlogsController(accessToken, {
        q: searchQuery,
        size: 10,
      });

      if (result.success) {
        setResults(result.blogs);
        setShowDropdown(result.blogs.length > 0);
      } else {
        setError(result.error || "Failed to search blogs.");
      }
    } catch (err) {
      setError("An unexpected network error occurred." + (err instanceof Error ? ` (${err.message})` : ""));
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  // Sync selectedBlogData with the IDs provided by the parent
  // When the component loads, or the parent state changes, try to build the display list.
  useEffect(() => {
    // Collect all blog data objects needed for display (from current results + cached data)
    const allKnownBlogs = [...results, ...selectedBlogData];
    
    const initialSelectedData = selectedBlogIds
      .map(id => allKnownBlogs.find(b => b.blogId === id))
      .filter((blog): blog is BlogItem => !!blog);

    // Filter out duplicates and set the authoritative list for display
    setSelectedBlogData(initialSelectedData.filter((blog, index, self) => 
        index === self.findIndex((b) => b.blogId === blog.blogId)
    ));

  }, [selectedBlogIds, results]);


  // Trigger search on debounced query change
  useEffect(() => {
    if (debouncedQuery.trim()) {
        fetchBlogs(debouncedQuery);
    } else {
        setShowDropdown(false);
        setResults([]);
    }
  }, [debouncedQuery, fetchBlogs]);
  
  // ✅ FIX: Dropdown Close Logic
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Allow blur events to happen if a selection is made, but manually control the dropdown
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // --- Handlers for Multiple Selection ---
  const handleSelect = (blog: BlogItem) => {
    const isSelected = selectedBlogIds.includes(blog.blogId);
    
    let newIds: number[];
    if (isSelected) {
      // Deselect: Remove ID
      newIds = selectedBlogIds.filter(id => id !== blog.blogId);
    } else {
      // Select: Add ID
      newIds = [...selectedBlogIds, blog.blogId];
    }
    
    onBlogSelect(newIds);
    setQuery(""); // Clear query to hide results/force re-search on next focus
  };

  const handleClearSelection = (blogId: number) => {
    const newIds = selectedBlogIds.filter(id => id !== blogId);
    onBlogSelect(newIds);
  };
  
  const handleInputFocus = () => {
      // Show dropdown if there is a query or if results were previously fetched
      if (query.trim().length > 0 || results.length > 0) {
          setShowDropdown(true);
      }
  };
  
  const isBlogSelected = (blogId: number) => selectedBlogIds.includes(blogId);
  
  // Filter results to show only non-selected blogs
  const filteredResults = results.filter(blog => !isBlogSelected(blog.blogId));

  return (
    <div className="relative space-y-4" ref={containerRef}>
      
      {/* 4. UI/UX Improvement: Search Input */}
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={handleInputFocus}
          placeholder={selectedBlogIds.length > 0 ? "Search to link another blog..." : "Search and select blogs to link..."}
          className={cn(
            "w-full pl-10 pr-4 py-3 border rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-all shadow-inner",
            selectedBlogIds.length > 0 ? "border-blue-400 focus:border-blue-500" : "border-gray-300 dark:border-neutral-700"
          )}
          disabled={loading}
        />
        
        {loading && (
          <Loader2 className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-blue-500 animate-spin" />
        )}
      </div>

      {/* 5. UI/UX Improvement: Selected Blogs as Pills */}
      {selectedBlogData.length > 0 && (
        <div className="flex flex-wrap gap-2 p-3 border border-gray-200 dark:border-neutral-700 rounded-xl bg-gray-50 dark:bg-neutral-800/50">
          {selectedBlogData.map((blog) => (
            <div
              key={blog.blogId}
              className="flex items-center gap-1.5 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full text-sm font-medium border border-blue-300 dark:border-blue-700 transition-all hover:shadow-md"
            >
              <Link className="w-3 h-3 text-blue-600 dark:text-blue-400 shrink-0" />
              <span className="truncate max-w-[150px]">{blog.title}</span>
              <button 
                onClick={() => handleClearSelection(blog.blogId)} 
                className="p-0.5 text-blue-700 dark:text-blue-300 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                title="Remove link"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Search Results Dropdown */}
      {showDropdown && !loading && (filteredResults.length > 0 || error) && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-neutral-800 border border-gray-300 dark:border-neutral-700 rounded-xl shadow-xl max-h-60 overflow-y-auto">
          
          {error && (
            <div className="p-3 text-red-500 dark:text-red-400 text-xs">{error}</div>
          )}

          {filteredResults.map((blog) => (
            <button
              key={blog.blogId}
              onClick={() => handleSelect(blog)}
              className={cn(
                "w-full px-4 py-3 text-left border-b border-gray-100 dark:border-neutral-700 last:border-b-0 transition-colors flex justify-between items-center",
                isBlogSelected(blog.blogId) 
                    ? "bg-green-50 dark:bg-green-900/20" 
                    : "hover:bg-gray-50 dark:hover:bg-neutral-700"
              )}
            >
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-1">
                  {blog.title}
                </h4>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1">
                  <User className="w-3 h-3" /> @{blog.author.username}
                </div>
              </div>
              <span className={cn(
                  "ml-3 px-2 py-0.5 rounded-full text-xs font-medium transition-colors",
                  isBlogSelected(blog.blogId) ? 'bg-green-200 text-green-800 dark:bg-green-800 dark:text-green-200' : 'bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400'
              )}>
                  {isBlogSelected(blog.blogId) ? 'Linked' : 'Link'}
              </span>
            </button>
          ))}
        </div>
      )}
      
      {/* No Results Message */}
      {!loading && query.length > 0 && filteredResults.length === 0 && !error && (
          <div className="p-3 text-sm text-gray-500 dark:text-gray-400">
              No published blogs found matching &quot;{query}&quot;.
          </div>
      )}
    </div>
  );
}
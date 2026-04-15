"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { filterBlogsController } from "@/controllers/blog/blogFilter.controller";
import { BlogItem } from "@/lib/types/blogFilter.types";
import { useAccessToken } from "@/hooks/useAccessToken";
import { useDebounce } from "@/hooks/useDebounce";
import { Loader2, Link, X, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface LinkedBlogSearchProps {
  onBlogSelect: (linkedBlogIds: number[]) => void;
  selectedBlogIds: number[];
}

export default function LinkedBlogSearch({
  onBlogSelect,
  selectedBlogIds,
}: LinkedBlogSearchProps) {
  const accessToken = useAccessToken();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<BlogItem[]>([]);
  const [selectedBlogData, setSelectedBlogData] = useState<BlogItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const debouncedQuery = useDebounce(query, 400);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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

  const blogCacheRef = useRef<Map<number, BlogItem>>(new Map());

  useEffect(() => {
    results.forEach((blog) => blogCacheRef.current.set(blog.blogId, blog));
  }, [results]);

  useEffect(() => {
    selectedBlogData.forEach((blog) => blogCacheRef.current.set(blog.blogId, blog));
  }, [selectedBlogData]);

  useEffect(() => {
    const newData = selectedBlogIds
      .map((id) => blogCacheRef.current.get(id))
      .filter((blog): blog is BlogItem => !!blog);

    const currentIds = selectedBlogData.map((b) => b.blogId).join(",");
    const newIds = newData.map((b) => b.blogId).join(",");
    if (currentIds !== newIds) {
      setSelectedBlogData(newData);
    }
  }, [selectedBlogIds]);

  useEffect(() => {
    if (debouncedQuery.trim()) {
      fetchBlogs(debouncedQuery);
    } else {
      setShowDropdown(false);
      setResults([]);
    }
  }, [debouncedQuery, fetchBlogs]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (blog: BlogItem) => {
    const isSelected = selectedBlogIds.includes(blog.blogId);

    let newIds: number[];
    if (isSelected) {
      newIds = selectedBlogIds.filter(id => id !== blog.blogId);
    } else {
      newIds = [...selectedBlogIds, blog.blogId];
    }

    onBlogSelect(newIds);
    setQuery("");
  };

  const handleClearSelection = (blogId: number) => {
    const newIds = selectedBlogIds.filter(id => id !== blogId);
    onBlogSelect(newIds);
  };

  const handleInputFocus = () => {
    if (query.trim().length > 0 || results.length > 0) {
      setShowDropdown(true);
    }
  };

  const isBlogSelected = (blogId: number) => selectedBlogIds.includes(blogId);

  const filteredResults = results.filter(blog => !isBlogSelected(blog.blogId));

  return (
    <div className="relative space-y-4" ref={containerRef}>

      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={handleInputFocus}
          placeholder={selectedBlogIds.length > 0 ? "Search to link another blog..." : "Search and select blogs to link..."}
          className={cn(
            "w-full pl-10 pr-4 py-3 border rounded-xl bg-cream-50 dark:bg-navy-700/30 text-navy dark:text-cream focus:ring-2 focus:ring-steel/30 dark:focus:ring-sky/30 transition-all placeholder-steel/40 dark:placeholder-sky/30",
            selectedBlogIds.length > 0 ? "border-steel/40 focus:border-steel/50 dark:border-sky/30 dark:focus:border-sky/40" : "border-cream-300/40 dark:border-navy-700/40"
          )}
          disabled={loading}
        />

        {loading && (
          <Loader2 className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-steel dark:text-sky animate-spin" />
        )}
      </div>

      {selectedBlogData.length > 0 && (
        <div className="flex flex-wrap gap-2 p-3 border border-cream-300/30 dark:border-navy-700/30 rounded-xl bg-cream-50/50 dark:bg-navy-700/20">
          {selectedBlogData.map((blog) => (
            <div
              key={blog.blogId}
              className="flex items-center gap-1.5 px-3 py-1 bg-steel/10 dark:bg-sky/10 text-steel dark:text-sky rounded-full text-sm font-medium border border-steel/20 dark:border-sky/20 transition-all hover:shadow-md"
            >
              <Link className="w-3 h-3 text-steel dark:text-sky shrink-0" />
              <span className="truncate max-w-[150px]">{blog.title}</span>
              <button
                onClick={() => handleClearSelection(blog.blogId)}
                className="p-0.5 text-steel/70 dark:text-sky/60 hover:text-red-600 dark:hover:text-red-400 transition-colors cursor-pointer"
                title="Remove link"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {showDropdown && !loading && (filteredResults.length > 0 || error) && (
        <div className="absolute z-50 w-full mt-1 bg-cream-50/95 dark:bg-navy/95 backdrop-blur-md border border-cream-300/40 dark:border-navy-700/40 rounded-xl shadow-lg shadow-navy/[0.06] dark:shadow-black/30 max-h-60 overflow-y-auto">

          {error && (
            <div className="p-3 text-red-500 dark:text-red-400 text-xs">{error}</div>
          )}

          {filteredResults.map((blog) => (
            <button
              key={blog.blogId}
              onClick={() => handleSelect(blog)}
              className={cn(
                "w-full px-4 py-3 text-left border-b border-cream-300/20 dark:border-navy-700/20 last:border-b-0 transition-colors flex justify-between items-center cursor-pointer",
                isBlogSelected(blog.blogId)
                  ? "bg-emerald-50 dark:bg-emerald-900/20"
                  : "hover:bg-cream-300/30 dark:hover:bg-navy-700/40"
              )}
            >
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold text-navy dark:text-cream line-clamp-1">
                  {blog.title}
                </h4>
                <div className="text-xs text-steel/60 dark:text-sky/50 mt-1 flex items-center gap-1">
                  <User className="w-3 h-3" /> @{blog.author.username}
                </div>
              </div>
              <span className={cn(
                "ml-3 px-2 py-0.5 rounded-full text-xs font-medium transition-colors",
                isBlogSelected(blog.blogId) ? 'bg-emerald-200 text-emerald-800 dark:bg-emerald-800/30 dark:text-emerald-200' : 'bg-steel/10 text-steel dark:bg-sky/10 dark:text-sky'
              )}>
                {isBlogSelected(blog.blogId) ? 'Linked' : 'Link'}
              </span>
            </button>
          ))}
        </div>
      )}

      {!loading && query.length > 0 && filteredResults.length === 0 && !error && (
        <div className="p-3 text-sm text-steel/60 dark:text-sky/50">
          No published blogs found matching &quot;{query}&quot;.
        </div>
      )}
    </div>
  );
}

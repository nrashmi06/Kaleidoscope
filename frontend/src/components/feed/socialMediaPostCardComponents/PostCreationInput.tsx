"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Post } from "@/services/post/fetchPosts";

interface PostCreationInputProps {
  onPostCreated?: (post: Post) => void;
  onSearch?: (query: string) => void;
  currentSearchQuery?: string;
}

export function PostCreationInput({ onPostCreated, onSearch, currentSearchQuery }: PostCreationInputProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState(currentSearchQuery || "");
  const [isSearchMode, setIsSearchMode] = useState(false);

  // Update local search query when prop changes
  useEffect(() => {
    setSearchQuery(currentSearchQuery || "");
  }, [currentSearchQuery]);

  const handleCreatePost = () => {
    // Store the callback in sessionStorage so create-post page can use it
    if (onPostCreated) {
      // We'll implement this in the create-post page
      router.push("/create-post");
    } else {
      router.push("/create-post");
    }
  };

  const handleSearchClick = () => {
    if (onSearch) {
      setIsSearchMode(true);
    } else {
      // Fallback to navigation if no search handler
      router.push("/create-post");
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch && searchQuery.trim()) {
      onSearch(searchQuery.trim());
    }
  };

  const handleSearchCancel = () => {
    setIsSearchMode(false);
    setSearchQuery("");
    if (onSearch) {
      onSearch(""); // Clear search to show all posts
    }
  };

  // Show current search state if we have a search query
  const hasActiveSearch = (currentSearchQuery || searchQuery) && (currentSearchQuery || searchQuery).trim() !== "";

  const handleInputClick = () => {
    if (onSearch) {
      // If search handler is available, activate search mode
      setIsSearchMode(true);
    } else {
      // Otherwise redirect to create post
      handleCreatePost();
    }
  };

  const handleInputFocus = () => {
    if (!onSearch) {
      // Only redirect if no search handler is provided
      handleCreatePost();
    }
  };

  return (
    <div className="w-full max-w-full mx-auto bg-white dark:bg-neutral-900 rounded-lg shadow-sm border border-gray-200 dark:border-neutral-800 mb-6">
      <div className="p-4">
        {/* Show active search indicator */}
        {hasActiveSearch && !isSearchMode && (
          <div className="mb-3 flex items-center justify-between bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <span className="text-blue-600 dark:text-blue-400 text-sm">
                🔍 Searching for: "<strong>{currentSearchQuery || searchQuery}</strong>"
              </span>
            </div>
            <button
              onClick={handleSearchCancel}
              className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 text-sm underline"
            >
              Clear search
            </button>
          </div>
        )}
        
        {!isSearchMode ? (
          <div className="flex items-center gap-3">
            <button
              onClick={handleInputClick}
              onFocus={handleInputFocus}
              className="flex-1 px-4 py-3 rounded-lg bg-gray-50 dark:bg-neutral-800 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-neutral-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-left hover:bg-gray-100 dark:hover:bg-neutral-700 transition-colors"
            >
              {hasActiveSearch ? "Update search..." : "What's on your mind?"}
            </button>
            <button 
              onClick={handleSearchClick}
              className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
            >
              Search Post
            </button>
          </div>
        ) : (
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-3">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search posts by content, hashtags, or mentions..."
              className="flex-1 px-4 py-3 rounded-lg bg-gray-50 dark:bg-neutral-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-neutral-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-400 dark:placeholder-gray-500"
              autoFocus
            />
            <button 
              type="submit"
              disabled={!searchQuery.trim()}
              className="px-6 py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
            >
              Search
            </button>
            <button 
              type="button"
              onClick={handleSearchCancel}
              className="px-4 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
            >
              Cancel
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

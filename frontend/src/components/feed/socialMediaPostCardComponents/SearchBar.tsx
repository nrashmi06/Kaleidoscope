"use client";

import { useState, useEffect } from "react";
import { IconSearch } from "@tabler/icons-react";

interface SearchBarProps {
  onSearch?: (query: string) => void;
  currentSearchQuery?: string;
}

export function SearchBar({ onSearch, currentSearchQuery }: SearchBarProps) {
  const [searchQuery, setSearchQuery] = useState(currentSearchQuery || "");

  // Update local search query when prop changes
  useEffect(() => {
    setSearchQuery(currentSearchQuery || "");
  }, [currentSearchQuery]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch && searchQuery.trim()) {
      onSearch(searchQuery.trim());
    }
  };

  const handleSearchClear = () => {
    setSearchQuery("");
    if (onSearch) {
      onSearch(""); // Clear search
    }
  };

  return (
    <form
      onSubmit={handleSearchSubmit}
      className="flex items-center w-full max-w-md mx-auto bg-white dark:bg-neutral-900 rounded-lg border border-gray-200 dark:border-neutral-700 shadow-sm overflow-hidden"
    >
      <span className="flex items-center justify-center px-3 text-gray-500 dark:text-gray-400">
        <IconSearch size={20} />
      </span>
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Search posts by content, hashtags, or mentions..."
        className="flex-1 px-2 py-3 bg-transparent text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none"
      />
      {searchQuery && (
        <button
          type="button"
          onClick={handleSearchClear}
          className="px-3 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
        >
          ✕
        </button>
      )}
    </form>
  );
}

// src/components/feed/FeedFilterBar.tsx

import { Search, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { NormalizedPagination } from "@/lib/types/postFeed";

interface FeedFilterBarProps {
  stagedQuery: string;
  totalPosts: number;
  pagination: NormalizedPagination | null;
  isLoading: boolean;
  onQueryChange: (query: string) => void;
  onOpenFilters: () => void;
}

export function FeedFilterBar({
  stagedQuery,
  totalPosts,
  pagination,
  isLoading,
  onQueryChange,
  onOpenFilters,
}: FeedFilterBarProps) {
  return (
    <div className="p-4 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-xl shadow-sm space-y-4">
      <div className="flex flex-col md:flex-row gap-4">
        {/* Search Input (Debounced) */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
          <Input
            type="text"
            value={stagedQuery}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Search by keyword..."
            className="pl-10"
          />
        </div>
        
        {/* Open Filters Button */}
        <Button 
          variant="outline" 
          onClick={onOpenFilters}
          className="flex-shrink-0"
        >
          <SlidersHorizontal className="w-4 h-4 mr-2" />
          All Filters
        </Button>
      </div>
      
      {/* Total Results */}
      {!isLoading && pagination && (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Showing <span className="font-semibold text-gray-900 dark:text-white">{totalPosts}</span> of <span className="font-semibold text-gray-900 dark:text-white">{pagination.totalElements}</span> results.
        </p>
      )}
    </div>
  );
}
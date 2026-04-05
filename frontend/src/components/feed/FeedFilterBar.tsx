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
    <div className="relative p-4 bg-cream-50/80 dark:bg-navy/80 backdrop-blur-sm border border-cream-300/60 dark:border-navy-700/60 rounded-2xl shadow-sm space-y-3 overflow-hidden">
      {/* Top accent line */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-steel/25 dark:via-sky/15 to-transparent" />

      <div className="flex flex-col md:flex-row gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-steel dark:text-sky/50" />
          <Input
            type="text"
            value={stagedQuery}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Search by keyword..."
            className="pl-10"
          />
        </div>

        <Button
          variant="outline"
          onClick={onOpenFilters}
          className="flex-shrink-0"
        >
          <SlidersHorizontal className="w-4 h-4 mr-2" />
          All Filters
        </Button>
      </div>

      {!isLoading && pagination && (
        <p className="text-xs text-steel dark:text-sky/60">
          Showing <span className="font-semibold text-navy dark:text-cream">{totalPosts}</span> of <span className="font-semibold text-navy dark:text-cream">{pagination.totalElements}</span> results
        </p>
      )}
    </div>
  );
}
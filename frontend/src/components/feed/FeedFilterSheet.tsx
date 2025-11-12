"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Hash, ListFilter } from "lucide-react"; // Import ListFilter for the header
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { PostFilterParams } from "@/lib/types/postFeed";
import type { FlatCategory } from "@/lib/types/settings/category";

interface FeedFilterSheetProps {
  isVisible: boolean;
  categories: FlatCategory[];
  stagedFilters: PostFilterParams;
  onClose: () => void;
  onFilterChange: (key: keyof PostFilterParams, value: string | number | undefined) => void;
  onApply: () => void;
  onClear: () => void;
}

export function FeedFilterSheet({
  isVisible,
  categories,
  stagedFilters,
  onClose,
  onFilterChange,
  onApply,
  onClear,
}: FeedFilterSheetProps) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          // Enhanced backdrop for better visual focus
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md" 
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }} // Added scale for a pop effect
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="relative w-full max-w-md bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-neutral-800 space-y-7 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header: Sticky and styled for prominence */}
            <div className="flex items-center justify-between sticky top-0 bg-white dark:bg-neutral-900 px-8 pt-6 pb-4 z-10 border-b border-gray-100 dark:border-neutral-800">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <ListFilter className="w-6 h-6 text-blue-600" /> Filter Options
              </h3>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={onClose}
                className="rounded-full hover:bg-gray-100 dark:hover:bg-neutral-800"
              >
                <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              </Button>
            </div>
            
            {/* Filter Content: Grouped sections with internal padding/borders */}
            <div className="space-y-6 px-8 pb-6"> 
                
                {/* Hashtag Filter Group */}
                <div className="p-4 rounded-lg bg-gray-50 dark:bg-neutral-800/50 border border-gray-200 dark:border-neutral-700 space-y-3">
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <Hash className="w-4 h-4 text-blue-500" /> Filter by Hashtag
                  </label>
                  <div className="relative">
                    <Input
                      type="text"
                      value={stagedFilters.hashtag || ""}
                      onChange={(e) => onFilterChange('hashtag', e.target.value)}
                      placeholder="e.g., react, javascript, ai"
                      className="h-10 border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Category Filter Group */}
                <div className="p-4 rounded-lg bg-gray-50 dark:bg-neutral-800/50 border border-gray-200 dark:border-neutral-700 space-y-3">
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 block">Select Category</label>
                  <select
                    value={stagedFilters.categoryId || "all"}
                    onChange={(e) => onFilterChange('categoryId', e.target.value === "all" ? undefined : Number(e.target.value))}
                    className="w-full px-3 py-2.5 border border-gray-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-900 text-gray-900 dark:text-white appearance-none focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer hover:border-blue-400 transition" // Improved select styling
                  >
                    <option value="all">All Categories</option>
                    {categories.map(cat => (
                      <option key={cat.categoryId} value={cat.categoryId}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Visibility Filter Group */}
                <div className="p-4 rounded-lg bg-gray-50 dark:bg-neutral-800/50 border border-gray-200 dark:border-neutral-700 space-y-3">
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 block">Visibility Scope</label>
                  <select
                    value={stagedFilters.visibility || "all"}
                    onChange={(e) => onFilterChange('visibility', e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-900 text-gray-900 dark:text-white appearance-none focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer hover:border-blue-400 transition" // Improved select styling
                  >
                    <option value="all">All (Public & Follower Posts)</option>
                    <option value="PUBLIC">Public Posts</option>
                    <option value="FOLLOWERS">Followers Only</option>
                  </select>
                </div>
            </div>
            
            {/* Action Buttons: Sticky Footer */}
            <div className="flex gap-4 pt-4 border-t border-gray-200 dark:border-neutral-800 sticky bottom-0 bg-white dark:bg-neutral-900 -mx-8 px-8 pb-4">
              <Button 
                variant="outline" 
                onClick={onClear} 
                className="flex-1 border-red-400 text-red-600 hover:bg-red-50 dark:hover:bg-neutral-800" // Clear button styled as warning
              >
                Clear All
              </Button>
              <Button 
                onClick={onApply} 
                className="flex-1 bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/30" // Apply button styled as primary action
              >
                Apply Filters
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
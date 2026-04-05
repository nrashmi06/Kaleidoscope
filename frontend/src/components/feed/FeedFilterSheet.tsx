// src/components/feed/FeedFilterSheet.tsx
"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Hash,
  ListFilter,
  Layers,
  Eye,
  Users,
  Globe,
  Sparkles,
  RotateCcw,
  Check,
} from "lucide-react";
import type { PostFilterParams } from "@/lib/types/postFeed";
import type { FlatCategory } from "@/lib/types/settings/category";

interface FeedFilterSheetProps {
  isVisible: boolean;
  categories: FlatCategory[];
  stagedFilters: PostFilterParams;
  onClose: () => void;
  onFilterChange: (
    key: keyof PostFilterParams,
    value: string | number | undefined
  ) => void;
  onApply: () => void;
  onClear: () => void;
}

const visibilityOptions = [
  {
    value: "all",
    label: "All Posts",
    icon: Globe,
    description: "Public & follower posts",
  },
  {
    value: "PUBLIC",
    label: "Public",
    icon: Eye,
    description: "Visible to everyone",
  },
  {
    value: "FOLLOWERS",
    label: "Followers",
    icon: Users,
    description: "Followers only",
  },
] as const;

export function FeedFilterSheet({
  isVisible,
  categories,
  stagedFilters,
  onClose,
  onFilterChange,
  onApply,
  onClear,
}: FeedFilterSheetProps) {
  const activeFilterCount = [
    stagedFilters.hashtag,
    stagedFilters.categoryId,
    stagedFilters.visibility && stagedFilters.visibility !== "all"
      ? stagedFilters.visibility
      : undefined,
  ].filter(Boolean).length;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/60 dark:bg-black/70 backdrop-blur-md"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ type: "spring", damping: 26, stiffness: 300 }}
            className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-cream-300/50 dark:border-navy-700/60 shadow-2xl shadow-navy/15 dark:shadow-black/50"
            onClick={(e) => e.stopPropagation()}
          >
            {/* ── Header with gradient accent ── */}
            <div className="relative bg-cream-50 dark:bg-navy border-b border-cream-300/40 dark:border-navy-700/40">
              {/* Subtle gradient strip at the very top */}
              <div className="h-1 w-full bg-gradient-to-r from-steel via-sky to-steel dark:from-sky dark:via-steel dark:to-sky" />

              <div className="flex items-center justify-between px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-steel to-sky shadow-sm shadow-steel/20 dark:shadow-sky/15">
                    <ListFilter className="w-4.5 h-4.5 text-cream-50" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-navy dark:text-cream leading-tight">
                      Filter Options
                    </h3>
                    <p className="text-[11px] text-steel/60 dark:text-sky/40 mt-0.5">
                      {activeFilterCount > 0
                        ? `${activeFilterCount} filter${activeFilterCount > 1 ? "s" : ""} active`
                        : "Refine your feed"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-cream-300/50 dark:hover:bg-navy-700/50 transition-colors cursor-pointer"
                >
                  <X className="w-4.5 h-4.5 text-steel/70 dark:text-sky/50" />
                </button>
              </div>
            </div>

            {/* ── Filter Body ── */}
            <div className="bg-cream-50 dark:bg-navy px-6 py-5 space-y-5 max-h-[65vh] overflow-y-auto">
              {/* ── Section 1: Hashtag ── */}
              <div className="space-y-2.5">
                <label className="flex items-center gap-2 text-sm font-semibold text-navy dark:text-cream">
                  <Hash className="w-4 h-4 text-sky" />
                  Hashtag
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={stagedFilters.hashtag || ""}
                    onChange={(e) =>
                      onFilterChange("hashtag", e.target.value)
                    }
                    placeholder="e.g. react, javascript, ai"
                    className="w-full h-11 px-4 pr-10 rounded-xl border border-cream-300 dark:border-navy-700 bg-white dark:bg-navy-700/40 text-navy dark:text-cream text-sm placeholder:text-steel/40 dark:placeholder:text-sky/30 focus:outline-none focus:ring-2 focus:ring-steel/30 dark:focus:ring-sky/30 focus:border-steel dark:focus:border-sky transition-all"
                  />
                  {stagedFilters.hashtag && (
                    <button
                      onClick={() => onFilterChange("hashtag", "")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded-full bg-cream-300/60 dark:bg-navy-600/60 hover:bg-cream-400/60 dark:hover:bg-navy-600 transition-colors cursor-pointer"
                    >
                      <X className="w-3 h-3 text-steel/70 dark:text-sky/50" />
                    </button>
                  )}
                </div>
              </div>

              {/* ── Divider ── */}
              <div className="h-px bg-gradient-to-r from-transparent via-cream-400/30 dark:via-navy-700/40 to-transparent" />

              {/* ── Section 2: Category ── */}
              <div className="space-y-2.5">
                <label className="flex items-center gap-2 text-sm font-semibold text-navy dark:text-cream">
                  <Layers className="w-4 h-4 text-steel dark:text-sky" />
                  Category
                </label>

                <div className="flex flex-wrap gap-2">
                  {/* "All" pill */}
                  <button
                    onClick={() =>
                      onFilterChange("categoryId", undefined)
                    }
                    className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer border ${
                      !stagedFilters.categoryId
                        ? "bg-steel text-cream-50 border-steel shadow-sm shadow-steel/20 dark:bg-sky dark:text-navy dark:border-sky dark:shadow-sky/15"
                        : "bg-cream-100/60 dark:bg-navy-700/40 text-steel/70 dark:text-sky/50 border-cream-300/50 dark:border-navy-700/50 hover:border-steel/30 dark:hover:border-sky/30 hover:bg-cream-200/50 dark:hover:bg-navy-700/60"
                    }`}
                  >
                    <Sparkles className="w-3 h-3" />
                    All
                  </button>

                  {categories.map((cat) => {
                    const isActive =
                      stagedFilters.categoryId === cat.categoryId;
                    return (
                      <button
                        key={cat.categoryId}
                        onClick={() =>
                          onFilterChange(
                            "categoryId",
                            isActive ? undefined : cat.categoryId
                          )
                        }
                        className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer border ${
                          isActive
                            ? "bg-steel text-cream-50 border-steel shadow-sm shadow-steel/20 dark:bg-sky dark:text-navy dark:border-sky dark:shadow-sky/15"
                            : "bg-cream-100/60 dark:bg-navy-700/40 text-steel/70 dark:text-sky/50 border-cream-300/50 dark:border-navy-700/50 hover:border-steel/30 dark:hover:border-sky/30 hover:bg-cream-200/50 dark:hover:bg-navy-700/60"
                        }`}
                      >
                        {isActive && <Check className="w-3 h-3" />}
                        {cat.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ── Divider ── */}
              <div className="h-px bg-gradient-to-r from-transparent via-cream-400/30 dark:via-navy-700/40 to-transparent" />

              {/* ── Section 3: Visibility ── */}
              <div className="space-y-2.5">
                <label className="flex items-center gap-2 text-sm font-semibold text-navy dark:text-cream">
                  <Eye className="w-4 h-4 text-steel dark:text-sky" />
                  Visibility
                </label>

                <div className="grid grid-cols-3 gap-2">
                  {visibilityOptions.map((opt) => {
                    const isActive =
                      (stagedFilters.visibility || "all") === opt.value;
                    const Icon = opt.icon;
                    return (
                      <button
                        key={opt.value}
                        onClick={() =>
                          onFilterChange("visibility", opt.value)
                        }
                        className={`relative flex flex-col items-center gap-1.5 px-3 py-3 rounded-xl text-center transition-all cursor-pointer border ${
                          isActive
                            ? "bg-steel/10 dark:bg-sky/10 border-steel/40 dark:border-sky/40 shadow-sm"
                            : "bg-cream-100/40 dark:bg-navy-700/30 border-cream-300/40 dark:border-navy-700/40 hover:border-steel/20 dark:hover:border-sky/20 hover:bg-cream-100/70 dark:hover:bg-navy-700/50"
                        }`}
                      >
                        {isActive && (
                          <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-steel dark:bg-sky flex items-center justify-center">
                            <Check className="w-2.5 h-2.5 text-cream-50 dark:text-navy" />
                          </div>
                        )}
                        <div
                          className={`flex items-center justify-center w-8 h-8 rounded-lg transition-colors ${
                            isActive
                              ? "bg-steel/15 dark:bg-sky/15"
                              : "bg-cream-300/30 dark:bg-navy-600/30"
                          }`}
                        >
                          <Icon
                            className={`w-4 h-4 ${
                              isActive
                                ? "text-steel dark:text-sky"
                                : "text-steel/50 dark:text-sky/40"
                            }`}
                          />
                        </div>
                        <span
                          className={`text-xs font-semibold leading-tight ${
                            isActive
                              ? "text-navy dark:text-cream"
                              : "text-steel/60 dark:text-sky/40"
                          }`}
                        >
                          {opt.label}
                        </span>
                        <span
                          className={`text-[10px] leading-tight ${
                            isActive
                              ? "text-steel/70 dark:text-sky/50"
                              : "text-steel/40 dark:text-sky/25"
                          }`}
                        >
                          {opt.description}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* ── Footer Actions ── */}
            <div className="bg-cream-50 dark:bg-navy border-t border-cream-300/40 dark:border-navy-700/40 px-6 py-4 flex gap-3">
              <button
                onClick={onClear}
                className="flex-1 h-10 inline-flex items-center justify-center gap-2 rounded-xl text-sm font-semibold text-steel dark:text-sky bg-steel/8 hover:bg-steel/15 dark:bg-sky/8 dark:hover:bg-sky/15 transition-all cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Clear All
              </button>
              <button
                onClick={onApply}
                className="flex-1 h-10 inline-flex items-center justify-center gap-2 rounded-xl text-sm font-semibold text-cream-50 bg-gradient-to-r from-steel to-steel-600 hover:from-steel-600 hover:to-steel dark:from-sky dark:to-sky/80 dark:hover:from-sky/90 dark:hover:to-sky dark:text-navy shadow-md shadow-steel/20 dark:shadow-sky/15 transition-all cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                Apply Filters
                {activeFilterCount > 0 && (
                  <span className="ml-0.5 px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-cream-50/20 dark:bg-navy/20">
                    {activeFilterCount}
                  </span>
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

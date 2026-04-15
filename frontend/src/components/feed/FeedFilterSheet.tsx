// src/components/feed/FeedFilterSheet.tsx
"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Hash,
  Layers,
  Eye,
  Users,
  Globe,
  Sparkles,
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
        <>
          {/* Scrim */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px]"
            onClick={onClose}
          />

          {/* Pinterest-style modal — bottom sheet on mobile, centered on desktop */}
          <motion.div
            initial={{ opacity: 0, y: 60, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.97 }}
            transition={{ type: "spring", damping: 30, stiffness: 400, mass: 0.8 }}
            className="fixed z-50
              inset-x-0 bottom-0 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2
              w-full sm:w-[460px] sm:max-w-[calc(100vw-2rem)]
              max-h-[85vh] sm:max-h-[80vh]
              bg-cream-50 dark:bg-navy-900
              rounded-t-[28px] sm:rounded-[24px]
              shadow-[0_-8px_40px_rgba(0,0,0,0.12)] sm:shadow-[0_24px_80px_rgba(0,0,0,0.18)]
              dark:shadow-[0_24px_80px_rgba(0,0,0,0.5)]
              flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drag handle — mobile only */}
            <div className="flex justify-center pt-3 pb-1 sm:hidden">
              <div className="w-10 h-1 rounded-full bg-navy/10 dark:bg-cream/10" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-4 sm:pt-6 pb-2">
              <h2 className="text-[18px] font-bold text-navy dark:text-cream tracking-tight">
                Filters
                {activeFilterCount > 0 && (
                  <span className="ml-2 inline-flex items-center justify-center w-5 h-5 text-[11px] font-bold rounded-full bg-steel text-cream-50 dark:bg-sky dark:text-navy">
                    {activeFilterCount}
                  </span>
                )}
              </h2>
              <button
                onClick={onClose}
                className="flex items-center justify-center w-9 h-9 -mr-1 rounded-full
                  hover:bg-navy/5 dark:hover:bg-cream/5 active:bg-navy/10 dark:active:bg-cream/10
                  transition-colors cursor-pointer"
              >
                <X className="w-5 h-5 text-navy/60 dark:text-cream/50" />
              </button>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto overscroll-contain px-6 pb-4 space-y-6">
              {/* ── Hashtag ── */}
              <section>
                <label className="flex items-center gap-2 text-[13px] font-semibold text-navy/70 dark:text-cream/60 mb-2.5 uppercase tracking-wide">
                  <Hash className="w-3.5 h-3.5" />
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
                    className="w-full h-12 px-4 rounded-2xl
                      bg-cream-300/30 dark:bg-navy-700/40
                      border-2 border-transparent
                      focus:border-steel/30 dark:focus:border-sky/30
                      text-navy dark:text-cream text-[15px]
                      placeholder:text-steel/35 dark:placeholder:text-sky/25
                      focus:outline-none transition-all duration-200"
                  />
                  {stagedFilters.hashtag && (
                    <button
                      onClick={() => onFilterChange("hashtag", "")}
                      className="absolute right-3 top-1/2 -translate-y-1/2
                        w-6 h-6 flex items-center justify-center rounded-full
                        bg-navy/8 dark:bg-cream/8 hover:bg-navy/15 dark:hover:bg-cream/15
                        transition-colors cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5 text-navy/50 dark:text-cream/40" />
                    </button>
                  )}
                </div>
              </section>

              {/* ── Category ── */}
              <section>
                <label className="flex items-center gap-2 text-[13px] font-semibold text-navy/70 dark:text-cream/60 mb-2.5 uppercase tracking-wide">
                  <Layers className="w-3.5 h-3.5" />
                  Category
                </label>

                <div className="flex flex-wrap gap-2">
                  {/* "All" pill */}
                  <button
                    onClick={() =>
                      onFilterChange("categoryId", undefined)
                    }
                    className={`inline-flex items-center gap-1.5 h-9 px-4 rounded-full text-[13px] font-semibold transition-all duration-200 cursor-pointer ${
                      !stagedFilters.categoryId
                        ? "bg-navy text-cream dark:bg-cream dark:text-navy shadow-sm"
                        : "bg-cream-300/40 dark:bg-navy-700/40 text-navy/60 dark:text-cream/50 hover:bg-cream-300/60 dark:hover:bg-navy-700/60"
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
                        className={`inline-flex items-center gap-1.5 h-9 px-4 rounded-full text-[13px] font-semibold transition-all duration-200 cursor-pointer ${
                          isActive
                            ? "bg-navy text-cream dark:bg-cream dark:text-navy shadow-sm"
                            : "bg-cream-300/40 dark:bg-navy-700/40 text-navy/60 dark:text-cream/50 hover:bg-cream-300/60 dark:hover:bg-navy-700/60"
                        }`}
                      >
                        {isActive && <Check className="w-3 h-3" />}
                        {cat.name}
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* ── Visibility ── */}
              <section>
                <label className="flex items-center gap-2 text-[13px] font-semibold text-navy/70 dark:text-cream/60 mb-2.5 uppercase tracking-wide">
                  <Eye className="w-3.5 h-3.5" />
                  Visibility
                </label>

                <div className="space-y-2">
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
                        className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl text-left transition-all duration-200 cursor-pointer ${
                          isActive
                            ? "bg-navy/[0.06] dark:bg-cream/[0.06] ring-2 ring-navy/20 dark:ring-cream/15"
                            : "hover:bg-navy/[0.03] dark:hover:bg-cream/[0.03]"
                        }`}
                      >
                        <div
                          className={`flex items-center justify-center w-10 h-10 rounded-full transition-colors ${
                            isActive
                              ? "bg-navy text-cream dark:bg-cream dark:text-navy"
                              : "bg-cream-300/50 dark:bg-navy-700/50 text-navy/40 dark:text-cream/30"
                          }`}
                        >
                          <Icon className="w-[18px] h-[18px]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p
                            className={`text-[14px] font-semibold leading-tight ${
                              isActive
                                ? "text-navy dark:text-cream"
                                : "text-navy/70 dark:text-cream/60"
                            }`}
                          >
                            {opt.label}
                          </p>
                          <p
                            className={`text-[12px] mt-0.5 leading-tight ${
                              isActive
                                ? "text-navy/50 dark:text-cream/40"
                                : "text-navy/35 dark:text-cream/25"
                            }`}
                          >
                            {opt.description}
                          </p>
                        </div>
                        {isActive && (
                          <div className="flex-shrink-0 w-5 h-5 rounded-full bg-navy dark:bg-cream flex items-center justify-center">
                            <Check className="w-3 h-3 text-cream dark:text-navy" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </section>
            </div>

            {/* Footer — sticky actions */}
            <div className="px-6 py-4 border-t border-navy/[0.06] dark:border-cream/[0.06] bg-cream-50 dark:bg-navy-900">
              <div className="flex gap-3">
                <button
                  onClick={onClear}
                  className="flex-1 h-12 rounded-full text-[15px] font-bold
                    text-navy/70 dark:text-cream/60
                    bg-cream-300/40 dark:bg-navy-700/40
                    hover:bg-cream-300/60 dark:hover:bg-navy-700/60
                    active:scale-[0.98]
                    transition-all duration-150 cursor-pointer"
                >
                  Reset
                </button>
                <button
                  onClick={onApply}
                  className="flex-[2] h-12 rounded-full text-[15px] font-bold
                    text-cream-50 dark:text-navy
                    bg-navy dark:bg-cream
                    hover:bg-navy/90 dark:hover:bg-cream/90
                    active:scale-[0.98]
                    shadow-md shadow-navy/15 dark:shadow-cream/10
                    transition-all duration-150 cursor-pointer"
                >
                  Apply
                  {activeFilterCount > 0 && (
                    <span className="ml-1.5 text-cream-50/70 dark:text-navy/60">
                      · {activeFilterCount}
                    </span>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

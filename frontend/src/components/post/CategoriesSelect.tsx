import React from "react";
import { LayoutGrid } from "lucide-react";

interface Category {
  categoryId: number;
  name: string;
}

interface Props {
  categories: Category[];
  selectedIds: number[];
  onToggle: (id: number) => void;
}

export default function CategoriesSelect({ categories, selectedIds, onToggle }: Props) {
  const noneSelected = selectedIds.length === 0;

  return (
    <div className="rounded-xl border border-border-default shadow-sm bg-surface-alt">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-cream-300/30 dark:border-navy-700/40">
        <div className="flex items-center gap-1.5">
          <LayoutGrid className="h-4 w-4 text-steel/50 dark:text-sky/40" />
          <span className="text-sm font-medium text-heading">Categories</span>
          <span className="text-red-500">*</span>
        </div>
        <div className="flex items-center gap-2">
          {noneSelected ? (
            <span className="text-xs text-red-500 dark:text-red-400 font-medium">
              Select at least one
            </span>
          ) : (
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-navy/10 dark:bg-cream/10 text-heading">
              {selectedIds.length} selected
            </span>
          )}
        </div>
      </div>

      {/* Pills */}
      <div className="p-4 flex flex-wrap gap-2">
        {categories.map((cat) => {
          const selected = selectedIds.includes(cat.categoryId);
          return (
            <button
              type="button"
              key={cat.categoryId}
              onClick={() => onToggle(cat.categoryId)}
              className={`px-3.5 py-1.5 rounded-full border text-sm font-medium transition-all duration-150 cursor-pointer ${
                selected
                  ? "bg-navy text-cream-50 border-navy dark:bg-cream dark:text-navy dark:border-cream shadow-sm scale-[1.03]"
                  : "bg-transparent text-muted border-border-default hover:text-heading hover:border-heading/30 dark:hover:border-cream/30 hover:bg-surface-hover"
              }`}
            >
              {cat.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}

import React from "react";

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
  return (
    <div className="bg-surface-alt rounded-xl border border-border-default p-6">
      <label className="block text-sm font-medium text-heading mb-2">
        Categories *
      </label>
      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => {
          const selected = selectedIds.includes(cat.categoryId);
          return (
            <button
              type="button"
              key={cat.categoryId}
              onClick={() => onToggle(cat.categoryId)}
              className={`px-3 py-1 rounded-full border transition-all cursor-pointer ${
                selected
                  ? "bg-navy text-cream-50 border-navy dark:bg-cream dark:text-navy dark:border-cream shadow-sm"
                  : "bg-surface-hover text-navy/60 dark:text-cream/50 border-border-default hover:bg-surface-hover"
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

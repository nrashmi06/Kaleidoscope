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
    <div className="bg-cream-50 dark:bg-navy-700/50 rounded-xl border border-cream-300/40 dark:border-navy-700/40 p-6">
      <label className="block text-sm font-medium text-navy dark:text-cream mb-2">
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
                  : "bg-cream-300/40 dark:bg-navy-700/40 text-navy/60 dark:text-cream/50 border-cream-300/40 dark:border-navy-700/40 hover:bg-cream-300/60 dark:hover:bg-navy-700/60"
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

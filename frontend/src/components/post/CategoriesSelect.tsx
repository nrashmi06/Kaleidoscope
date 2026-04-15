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
                  ? "bg-steel text-cream-50 border-steel dark:bg-sky dark:text-navy dark:border-sky"
                  : "bg-cream-300/40 dark:bg-navy-700/40 text-navy dark:text-cream border-cream-300/40 dark:border-navy-700/40 hover:border-steel/30 dark:hover:border-sky/30"
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

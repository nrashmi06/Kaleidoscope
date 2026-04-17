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
    <div className="flex flex-wrap gap-2">
      {categories.map((cat) => {
        const selected = selectedIds.includes(cat.categoryId);
        return (
          <button
            type="button"
            key={cat.categoryId}
            onClick={() => onToggle(cat.categoryId)}
            className={`px-3.5 py-1.5 rounded-full border text-sm font-medium transition-all cursor-pointer ${
              selected
                ? "bg-navy text-cream-50 border-navy dark:bg-cream dark:text-navy dark:border-cream shadow-sm"
                : "bg-transparent text-muted border-border-default hover:text-heading hover:border-heading/20 dark:hover:border-cream/20"
            }`}
          >
            {cat.name}
          </button>
        );
      })}
    </div>
  );
}

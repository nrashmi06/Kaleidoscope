import React from "react";

interface Props {
  categories: any[];
  selectedIds: number[];
  onToggle: (id: number) => void;
}

export default function CategoriesSelect({ categories, selectedIds, onToggle }: Props) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
              className={`px-3 py-1 rounded-full border transition-all ${
                selected
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-200 border-gray-300 dark:border-gray-600"
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

"use client";

import React from "react";

interface Category {
  categoryId: number;
  name: string;
  description: string;
  iconName: string;
  parentId: number | null;
}

interface CategoryCardProps {
  category: Category;
  isSelected: boolean;
  onToggle: (categoryId: number) => void;
}

const CategoryCard: React.FC<CategoryCardProps> = ({ category, isSelected, onToggle }) => {
  return (
    <div
      onClick={() => onToggle(category.categoryId)}
      className={`
        p-6 rounded-lg border-2 cursor-pointer transition-all duration-200
        ${isSelected
          ? 'border-blue-500 bg-blue-50 shadow-md'
          : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
        }
      `}
    >
      <div className="text-center">
        <div className="mb-3">
          {/* Icon placeholder - you can add actual icons here */}
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
            <span className="text-blue-600 text-xl font-bold">
              {category.name.charAt(0)}
            </span>
          </div>
        </div>
        <h3 className="font-semibold text-gray-900 mb-2">
          {category.name}
        </h3>
        <p className="text-sm text-gray-600">
          {category.description}
        </p>
      </div>
      
      {isSelected && (
        <div className="mt-4 flex justify-center">
          <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryCard;

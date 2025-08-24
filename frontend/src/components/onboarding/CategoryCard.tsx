"use client";

import React from "react";
import * as LucideIcons from "lucide-react";

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

const toPascalCase = (str: string | null | undefined) => {
  if (!str) return "";
  return str
    .replace(/[_-]+/g, " ")
    .replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .replace(/\s+/g, "");
};

const CategoryCard: React.FC<CategoryCardProps> = ({ category, isSelected, onToggle }) => {
  // Get the icon component
  const Icon = ((LucideIcons as unknown) as Record<string, React.ComponentType<React.SVGProps<SVGSVGElement>>>)[
    toPascalCase(category.iconName)
  ] || LucideIcons.HelpCircle;

  return (
    <div
      onClick={() => onToggle(category.categoryId)}
      className={`
        group p-6 rounded-2xl border-2 cursor-pointer transition-all duration-300 transform hover:scale-[1.02]
        ${isSelected
          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-lg dark:shadow-blue-900/20 dark:border-blue-400'
          : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-md dark:hover:shadow-lg'
        }
      `}
    >
      <div className="text-center">
        <div className="mb-4">
          <div className={`
            w-16 h-16 rounded-2xl flex items-center justify-center mx-auto transition-all duration-300
            ${isSelected
              ? 'bg-blue-100 dark:bg-blue-800/50'
              : 'bg-gray-100 dark:bg-gray-700 group-hover:bg-gray-200 dark:group-hover:bg-gray-600'
            }
          `}>
            <Icon className={`w-8 h-8 transition-colors duration-300 ${
              isSelected 
                ? 'text-blue-600 dark:text-blue-400' 
                : 'text-gray-600 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300'
            }`} />
          </div>
        </div>
        
        <h3 className={`font-bold text-lg mb-3 transition-colors duration-300 ${
          isSelected 
            ? 'text-blue-900 dark:text-blue-100' 
            : 'text-gray-900 dark:text-white'
        }`}>
          {category.name}
        </h3>
        
        <p className={`text-sm leading-relaxed transition-colors duration-300 ${
          isSelected 
            ? 'text-blue-700 dark:text-blue-200' 
            : 'text-gray-600 dark:text-gray-400'
        }`}>
          {category.description}
        </p>
      </div>
      
      {isSelected && (
        <div className="mt-6 flex justify-center">
          <div className="w-8 h-8 bg-blue-500 dark:bg-blue-600 rounded-full flex items-center justify-center animate-pulse">
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryCard;

"use client";

import React, { useEffect, useRef, useState } from "react";
import * as LucideIcons from "lucide-react";
import { getCategoryByIdController } from "@/controllers/categoryController/getCategoryById";
import { Category } from "@/lib/types/settings/category";
import { useAppSelector } from "@/hooks/useAppSelector";
import { Loader } from "@/components/common/Loader";

export interface ParentCategoryCardProps {
  name: string;
  description: string;
  iconName: string;
  categoryId: number;
  onCategorySelect: (category: Category) => void;
}

// Converts a string like "book-open" or "book_open" to "BookOpen"
const toPascalCase = (str: string) =>
  str
    .replace(/[_-]+/g, " ")
    .replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .replace(/\s+/g, "");

export const ParentCategoryCard: React.FC<ParentCategoryCardProps> = ({
  name,
  description,
  iconName,
  categoryId,
  onCategorySelect,
}) => {
  const accessToken = useAppSelector((state) => state.auth.accessToken);
  const [subcategories, setSubcategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const fetchedOnce = useRef(false);

  const Icon =
    ((LucideIcons as unknown) as Record<string, React.ComponentType<React.SVGProps<SVGSVGElement>>>)[
      toPascalCase(iconName)
    ] || LucideIcons.HelpCircle;

  useEffect(() => {
    const fetchSubcategories = async () => {
      if (!accessToken || fetchedOnce.current) return;

      setLoading(true);
      try {
        const response = await getCategoryByIdController({ categoryId }, accessToken);
        if (response.success && response.data?.subcategories?.length) {
          setSubcategories(response.data.subcategories);
        }
      } catch (error) {
        console.error("Failed to fetch subcategories:", error);
      } finally {
        setLoading(false);
        fetchedOnce.current = true;
      }
    };

    fetchSubcategories();
  }, [accessToken, categoryId]);

  const handleClick = () => {
    onCategorySelect({
      categoryId,
      name,
      description,
      iconName,
      parentId: null,
      subcategories: [],
    });
  };

  return (
    <div
      onClick={handleClick}
      className="cursor-pointer w-full rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6 shadow-sm hover:shadow-lg transition-shadow duration-200 flex flex-col gap-4"
    >
      <div className="flex items-start gap-4">
        <Icon className="w-10 h-10 text-blue-600 mt-1 shrink-0" />
        <div>
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">{name}</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{description}</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center mt-4">
          <Loader />
        </div>
      ) : subcategories.length > 0 ? (
        <div className="pl-14 flex flex-col gap-3 mt-2">
          {subcategories.map((sub) => {
            const SubIcon =
              ((LucideIcons as unknown) as Record<string, React.ComponentType<React.SVGProps<SVGSVGElement>>>)[
                toPascalCase(sub.iconName)
              ] || LucideIcons.HelpCircle;

            return (
              <div
                key={sub.categoryId}
                onClick={(e) => {
                  e.stopPropagation(); // Prevent parent click
                  onCategorySelect(sub);
                }}
                className="cursor-pointer flex items-start gap-3 p-3 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
              >
                <SubIcon className="w-4 h-4 mt-1 text-blue-500" />
                <div>
                  <strong className="text-gray-800 dark:text-white">{sub.name}</strong>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{sub.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="pl-14 text-sm text-gray-400 dark:text-gray-600">No subcategories available.</p>
      )}
    </div>
  );
};

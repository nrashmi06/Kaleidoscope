"use client";

import React, { useEffect, useRef, useState } from "react";
import * as LucideIcons from "lucide-react";
import { getCategoryByIdController } from "@/controllers/categoryController/getCategoryById";
import { deleteCategoryController } from "@/controllers/categoryController/deleteCategory";
import { Category } from "@/lib/types/settings/category";
import { useAppSelector } from "@/hooks/useAppSelector";
import { Loader } from "@/components/common/Loader";
import { Trash2 } from "lucide-react";

export interface ParentCategoryCardProps {
  name: string;
  description: string;
  iconName: string;
  categoryId: number;
  onCategorySelect: (category: Category) => void;
  onDeleted?: () => void;
}

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
  onDeleted,
}) => {
  const accessToken = useAppSelector((state) => state.auth.accessToken);
  const [subcategories, setSubcategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const fetchedOnce = useRef(false);

  const [showModal, setShowModal] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [isSubcategoryDelete, setIsSubcategoryDelete] = useState(false);

  const Icon =
    ((LucideIcons as unknown) as Record<string, React.ComponentType<React.SVGProps<SVGSVGElement>>>)[
      toPascalCase(iconName)
    ] || LucideIcons.HelpCircle;

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

  useEffect(() => {
    fetchSubcategories();
  }, [accessToken, categoryId]);

  const openDeleteModal = (id: number, isSub: boolean) => {
    setDeletingId(id);
    setIsSubcategoryDelete(isSub);
    setShowModal(true);
  };

  const confirmDelete = async () => {
    if (!deletingId || !accessToken) return;
    const response = await deleteCategoryController({ categoryId: deletingId }, accessToken);
    if (response.success) {
      if (isSubcategoryDelete) {
        setSubcategories((prev) => prev.filter((cat) => cat.categoryId !== deletingId));
      } else {
        onDeleted?.();
      }
    } else {
      alert(response.errors?.[0] || "Failed to delete category.");
    }
    setShowModal(false);
    setDeletingId(null);
  };

  const handleSelect = () => {
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
    <>
      <div
        onClick={handleSelect}
        className="cursor-pointer w-full rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6 shadow-sm hover:shadow-lg transition-shadow duration-200 flex flex-col gap-4"
      >
        <div className="flex items-start gap-4 justify-between">
          <div className="flex gap-4">
            <Icon className="w-10 h-10 text-blue-600 mt-1 shrink-0" />
            <div>
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white">{name}</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{description}</p>
            </div>
          </div>
          {subcategories.length === 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                openDeleteModal(categoryId, false);
              }}
              className="text-red-500 hover:text-red-600 transition-colors"
              title="Delete Category"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          )}
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
                    e.stopPropagation();
                    onCategorySelect(sub);
                  }}
                  className="group cursor-pointer flex items-start justify-between gap-3 p-3 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex gap-3">
                    <SubIcon className="w-4 h-4 mt-1 text-blue-500" />
                    <div>
                      <strong className="text-gray-800 dark:text-white">{sub.name}</strong>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{sub.description}</p>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openDeleteModal(sub.categoryId, true);
                    }}
                    className="text-red-400 hover:text-red-600 transition-colors"
                    title="Delete Subcategory"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="pl-14 text-sm text-gray-400 dark:text-gray-600">No subcategories available.</p>
        )}
      </div>

      {/* Custom Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg w-full max-w-md p-6">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
              Confirm Deletion
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
              Are you sure you want to delete this {isSubcategoryDelete ? "subcategory" : "category"}? This action cannot be undone.
            </p>
            <div className="mt-4 flex justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

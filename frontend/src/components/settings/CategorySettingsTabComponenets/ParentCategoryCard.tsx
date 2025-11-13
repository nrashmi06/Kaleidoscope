"use client";

import React, { useEffect, useRef, useState } from "react";
import * as LucideIcons from "lucide-react";
import { getCategoryByIdController } from "@/controllers/categoryController/getCategoryById";
import { deleteCategoryController } from "@/controllers/categoryController/deleteCategory";
import { Category } from "@/lib/types/settings/category";
import { useAppSelector } from "@/hooks/useAppSelector";
import { Loader } from "@/components/common/Loader";
import { Trash2 } from "lucide-react";
import { toast } from "react-hot-toast";

export interface ParentCategoryCardProps {
  name: string;
  description: string;
  iconName: string;
  categoryId: number;
  onCategorySelect: (category: Category) => void;
  onDeleted?: () => void;
  onSubcategoryAdded?: (parentId: number, subcategory: Category) => void;
  onSubcategoryDeleted?: (parentId: number, subcategoryId: number) => void;
}

const toPascalCase = (str: string | null | undefined) => {
  if (!str) return "";
  return str
    .replace(/[_-]+/g, " ")
    .replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .replace(/\s+/g, "");
};

// Define the ref interface
export interface ParentCategoryCardRef {
  addSubcategory: (subcategory: Category) => void;
}

export const ParentCategoryCard = React.forwardRef<
  ParentCategoryCardRef,
  ParentCategoryCardProps
>(({
  name,
  description,
  iconName,
  categoryId,
  onCategorySelect,
  onDeleted,
  onSubcategoryAdded,
  onSubcategoryDeleted,
}, ref) => {
  const accessToken = useAppSelector((state) => state.auth.accessToken);
  const role = useAppSelector((state) => state.auth.role);
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

  // Function to add a new subcategory dynamically
  const addSubcategory = (newSubcategory: Category) => {
    setSubcategories(prev => [...prev, newSubcategory]);
    // Mark as fetched so we don't overwrite with API data
    onSubcategoryAdded?.(categoryId, newSubcategory);
    fetchedOnce.current = true;
  };

  // Expose the addSubcategory function to parent component
  React.useImperativeHandle(ref, () => ({
    addSubcategory,
  }), []);

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
    
    console.log(`[ParentCategoryCard] Attempting to delete category ID: ${deletingId}, isSubcategory: ${isSubcategoryDelete}`);
    console.log(`[ParentCategoryCard] User role:`, role);
    
    // Check if user has admin role
    if (role !== 'ADMIN') {
      toast.error("You need admin privileges to delete categories.");
      setShowModal(false);
      setDeletingId(null);
      return;
    }
    
    try {
      const response = await deleteCategoryController({ categoryId: deletingId }, accessToken);
      console.log(`[ParentCategoryCard] Delete response:`, response);
      
      if (response.success) {
        toast.success(`${isSubcategoryDelete ? 'Subcategory' : 'Category'} deleted successfully`);
        if (isSubcategoryDelete) {
          setSubcategories((prev) => prev.filter((cat) => cat.categoryId !== deletingId));
          // Notify parent component about subcategory deletion
          onSubcategoryDeleted?.(categoryId, deletingId);
        } else {
          onDeleted?.();
        }
      } else {
        const errorMsg = response.errors?.[0] || "Failed to delete category.";
        console.error(`[ParentCategoryCard] Delete failed:`, errorMsg);
        toast.error(errorMsg);
      }
    } catch (error) {
      console.error(`[ParentCategoryCard] Delete error:`, error);
      toast.error("An error occurred while deleting the category.");
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
        className="group cursor-pointer w-full rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-md hover:shadow-xl dark:hover:shadow-2xl transition-all duration-300 flex flex-col gap-4 hover:border-blue-300 dark:hover:border-blue-600 hover:scale-[1.02]"
      >
        <div className="flex items-start gap-4 justify-between">
          <div className="flex gap-4">
            <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-900/30 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/50 transition-colors duration-300">
              <Icon className="w-8 h-8 text-blue-600 dark:text-blue-400 shrink-0" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300">{name}</h2>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">{description}</p>
            </div>
          </div>
          {/* Show delete icon only for admin users */}
          {role === 'ADMIN' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                openDeleteModal(categoryId, false);
              }}
              className="p-2 rounded-lg text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/30 transition-all duration-200"
              title="Delete category"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center items-center mt-4">
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
              <Loader />
            </div>
          </div>
        ) : subcategories.length > 0 ? (
          <div className="pl-4 flex flex-col gap-3 mt-4 border-l-2 border-gray-200 dark:border-gray-700">
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
                  className="group cursor-pointer flex items-start justify-between gap-3 p-4 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-200"
                >
                  <div className="flex gap-3">
                    <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/30 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/50 transition-colors duration-200">
                      <SubIcon className="w-4 h-4 text-blue-500 dark:text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-800 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200">{sub.name}</h4>
                      <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">{sub.description}</p>
                    </div>
                  </div>
                  {role === 'ADMIN' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openDeleteModal(sub.categoryId, true);
                      }}
                      className="p-2 rounded-lg text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/30 transition-all duration-200"
                      title="Delete Subcategory"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="pl-8 text-sm text-gray-500 dark:text-gray-400 italic">No subcategories available.</p>
        )}
      </div>

      {/* Enhanced Dark Mode Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg p-8 border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
              Confirm Deletion
            </h2>
            <div className="text-gray-600 dark:text-gray-300 mb-6">
              {isSubcategoryDelete ? (
                <p className="leading-relaxed">
                  Are you sure you want to delete this <span className="font-semibold text-red-600 dark:text-red-400">subcategory</span>? This action cannot be undone.
                </p>
              ) : (
                <div className="space-y-3">
                  <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                    <p className="font-semibold text-amber-800 dark:text-amber-200 mb-2">
                      ⚠️ Warning: This will permanently delete:
                    </p>
                    <ul className="text-sm text-amber-700 dark:text-amber-300 space-y-1">
                      <li>• The parent category</li>
                      <li>• All child categories</li>
                      <li>• Related user interests</li>
                    </ul>
                  </div>
                  <p className="leading-relaxed">
                    Are you sure you want to proceed with this <span className="font-semibold text-red-600 dark:text-red-400">irreversible action</span>?
                  </p>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setShowModal(false)}
                className="px-6 py-3 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 font-medium transition-all duration-200 border border-gray-200 dark:border-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-6 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
});

// Add displayName for better debugging
ParentCategoryCard.displayName = 'ParentCategoryCard';

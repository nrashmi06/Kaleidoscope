// src/components/settings/CategorySettingsTabComponenets/ParentCategoryCard.tsx
"use client";

import React, { useEffect, useRef, useState } from "react";
import * as LucideIcons from "lucide-react";
import { getCategoryByIdController } from "@/controllers/categoryController/getCategoryById";
import { deleteCategoryController } from "@/controllers/categoryController/deleteCategory";
import { Category } from "@/lib/types/settings/category";
import { useAppSelector } from "@/hooks/useAppSelector";
import { Loader } from "@/components/common/Loader";
import { Trash2, AlertTriangle } from "lucide-react";
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
    .replace(/\w\S*/g, (w) =>
      w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
    )
    .replace(/\s+/g, "");
};

export interface ParentCategoryCardRef {
  addSubcategory: (subcategory: Category) => void;
}

export const ParentCategoryCard = React.forwardRef<
  ParentCategoryCardRef,
  ParentCategoryCardProps
>(
  (
    {
      name,
      description,
      iconName,
      categoryId,
      onCategorySelect,
      onDeleted,
      onSubcategoryAdded,
      onSubcategoryDeleted,
    },
    ref
  ) => {
    const accessToken = useAppSelector((state) => state.auth.accessToken);
    const role = useAppSelector((state) => state.auth.role);
    const [subcategories, setSubcategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(false);
    const fetchedOnce = useRef(false);

    const [showModal, setShowModal] = useState(false);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [isSubcategoryDelete, setIsSubcategoryDelete] = useState(false);

    const Icon =
      (
        LucideIcons as unknown as Record<
          string,
          React.ComponentType<React.SVGProps<SVGSVGElement>>
        >
      )[toPascalCase(iconName)] || LucideIcons.HelpCircle;

    const fetchSubcategories = async () => {
      if (!accessToken || fetchedOnce.current) return;
      setLoading(true);
      try {
        const response = await getCategoryByIdController(
          { categoryId },
          accessToken
        );
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

    const addSubcategory = (newSubcategory: Category) => {
      setSubcategories((prev) => [...prev, newSubcategory]);
      onSubcategoryAdded?.(categoryId, newSubcategory);
      fetchedOnce.current = true;
    };

    React.useImperativeHandle(
      ref,
      () => ({
        addSubcategory,
      }),
      []
    );

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

      if (role !== "ADMIN") {
        toast.error("You need admin privileges to delete categories.");
        setShowModal(false);
        setDeletingId(null);
        return;
      }

      try {
        const response = await deleteCategoryController(
          { categoryId: deletingId },
          accessToken
        );

        if (response.success) {
          toast.success(
            `${isSubcategoryDelete ? "Subcategory" : "Category"} deleted successfully`
          );
          if (isSubcategoryDelete) {
            setSubcategories((prev) =>
              prev.filter((cat) => cat.categoryId !== deletingId)
            );
            onSubcategoryDeleted?.(categoryId, deletingId);
          } else {
            onDeleted?.();
          }
        } else {
          const errorMsg =
            response.errors?.[0] || "Failed to delete category.";
          toast.error(errorMsg);
        }
      } catch (error) {
        console.error("Delete error:", error);
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
          className="group cursor-pointer w-full rounded-2xl border border-border-default bg-surface p-5 hover:border-steel/30 dark:hover:border-sky/30 hover:shadow-md hover:shadow-steel/5 dark:hover:shadow-sky/5 transition-all duration-300 flex flex-col gap-3"
        >
          <div className="flex items-start gap-3 justify-between">
            <div className="flex gap-3 min-w-0">
              <div className="p-2.5 rounded-xl bg-steel/8 dark:bg-sky/8 group-hover:bg-steel/12 dark:group-hover:bg-sky/12 transition-colors shrink-0">
                <Icon className="w-6 h-6 text-steel dark:text-sky" />
              </div>
              <div className="min-w-0">
                <h2 className="text-base font-bold text-heading group-hover:text-steel dark:group-hover:text-sky transition-colors">
                  {name}
                </h2>
                <p className="text-xs text-steel/60 dark:text-sky/40 mt-0.5 line-clamp-2 leading-relaxed">
                  {description}
                </p>
              </div>
            </div>
            {role === "ADMIN" && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  openDeleteModal(categoryId, false);
                }}
                className="p-2 rounded-lg text-red-400 hover:text-red-500 hover:bg-red-500/10 transition-all shrink-0 cursor-pointer"
                title="Delete category"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>

          {loading ? (
            <div className="flex justify-center py-3">
              <Loader />
            </div>
          ) : subcategories.length > 0 ? (
            <div className="pl-3 flex flex-col gap-2 mt-1 border-l-2 border-cream-300/40 dark:border-navy-600/40">
              {subcategories.map((sub) => {
                const SubIcon =
                  (
                    LucideIcons as unknown as Record<
                      string,
                      React.ComponentType<React.SVGProps<SVGSVGElement>>
                    >
                  )[toPascalCase(sub.iconName)] || LucideIcons.HelpCircle;

                return (
                  <div
                    key={sub.categoryId}
                    onClick={(e) => {
                      e.stopPropagation();
                      onCategorySelect(sub);
                    }}
                    className="group/sub cursor-pointer flex items-start justify-between gap-2 p-3 rounded-xl bg-cream-100/40 dark:bg-navy-700/20 border border-border-subtle hover:border-steel/20 dark:hover:border-sky/20 transition-all"
                  >
                    <div className="flex gap-2.5 min-w-0">
                      <div className="p-1.5 rounded-lg bg-steel/6 dark:bg-sky/6 shrink-0">
                        <SubIcon className="w-3.5 h-3.5 text-steel/70 dark:text-sky/60" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-semibold text-heading group-hover/sub:text-steel dark:group-hover/sub:text-sky transition-colors">
                          {sub.name}
                        </h4>
                        <p className="text-[11px] text-steel/50 dark:text-sky/35 mt-0.5 line-clamp-1">
                          {sub.description}
                        </p>
                      </div>
                    </div>
                    {role === "ADMIN" && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openDeleteModal(sub.categoryId, true);
                        }}
                        className="p-1.5 rounded-lg text-red-400 hover:text-red-500 hover:bg-red-500/10 transition-all shrink-0 cursor-pointer"
                        title="Delete Subcategory"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="pl-6 text-[11px] text-steel/40 dark:text-sky/25 italic">
              No subcategories available.
            </p>
          )}
        </div>

        {/* Delete Confirmation Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 bg-navy/60 dark:bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-cream-50 dark:bg-navy rounded-2xl shadow-2xl shadow-navy/15 dark:shadow-black/50 w-full max-w-md p-6 border border-cream-300/50 dark:border-navy-700/60">
              <h2 className="text-lg font-bold text-heading mb-3">
                Confirm Deletion
              </h2>
              <div className="mb-5">
                {isSubcategoryDelete ? (
                  <p className="text-sm text-steel/70 dark:text-sky/50 leading-relaxed">
                    Are you sure you want to delete this{" "}
                    <span className="font-semibold text-red-500">
                      subcategory
                    </span>
                    ? This action cannot be undone.
                  </p>
                ) : (
                  <div className="space-y-3">
                    <div className="p-3.5 rounded-xl bg-amber-50/80 dark:bg-amber-900/15 border border-amber-200/60 dark:border-amber-800/30">
                      <p className="text-sm font-semibold text-amber-700 dark:text-amber-300 flex items-center gap-2 mb-1.5">
                        <AlertTriangle className="w-4 h-4" />
                        Warning
                      </p>
                      <ul className="text-xs text-amber-600 dark:text-amber-400 space-y-1 pl-6">
                        <li>The parent category</li>
                        <li>All child categories</li>
                        <li>Related user interests</li>
                      </ul>
                    </div>
                    <p className="text-sm text-steel/70 dark:text-sky/50">
                      Are you sure you want to proceed with this{" "}
                      <span className="font-semibold text-red-500">
                        irreversible action
                      </span>
                      ?
                    </p>
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold text-steel dark:text-sky bg-steel/8 hover:bg-steel/15 dark:bg-sky/8 dark:hover:bg-sky/15 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold text-cream-50 bg-red-500 hover:bg-red-600 shadow-sm shadow-red-500/20 transition-all cursor-pointer"
                >
                  Delete Permanently
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }
);

ParentCategoryCard.displayName = "ParentCategoryCard";

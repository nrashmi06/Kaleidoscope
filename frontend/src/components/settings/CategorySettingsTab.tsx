// src/components/settings/CategorySettingsTab.tsx
"use client";

import React, { useEffect, useState, useRef } from "react";
import { getParentCategoriesController } from "@/controllers/categoryController/getParentCategories";
import { getCategoryAnalyticsController } from "@/controllers/userInterest/getCategoryAnalyticsController";
import { Category, FlatCategory } from "@/lib/types/settings/category";
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Layers,
  FolderOpen,
  BarChart3,
  Users,
  TrendingUp,
} from "lucide-react";
import { Loader } from "@/components/common/Loader";
import {
  ParentCategoryCard,
  ParentCategoryCardRef,
} from "@/components/settings/CategorySettingsTabComponenets/ParentCategoryCard";
import { useAccessToken } from "@/hooks/useAccessToken";
import { CategoryForm } from "@/components/settings/CategorySettingsTabComponenets/CategoryForm";
import { toast } from "react-hot-toast";

interface CategoryAnalyticItem {
  categoryId: number;
  categoryName: string;
  userCount: number;
}


export const CategorySettingsTab = () => {
  const accessToken = useAccessToken();
  const [categories, setCategories] = useState<FlatCategory[]>([]);
  const [editingCategory, setEditingCategory] = useState<FlatCategory | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recentlyAddedId, setRecentlyAddedId] = useState<number | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(6);
  const [analytics, setAnalytics] = useState<CategoryAnalyticItem[]>([]);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  const categoryRefs = useRef<{
    [key: number]: ParentCategoryCardRef | null;
  }>({});

  useEffect(() => {
    if (accessToken) {
      fetchCategories();
      fetchAnalytics();
    }
  }, [accessToken]);

  const fetchAnalytics = async () => {
    setAnalyticsLoading(true);
    try {
      const res = await getCategoryAnalyticsController(accessToken, 0, 50);
      if (res.success && res.data) {
        const content = Array.isArray(res.data) ? res.data : (res.data as { content?: CategoryAnalyticItem[] }).content || [];
        setAnalytics(content);
      }
    } catch {
      // Silently fail — analytics is supplementary
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const fetchCategories = async () => {
    setLoading(true);
    const response = await getParentCategoriesController(accessToken);
    if (response.success && response.data?.content) {
      setCategories(response.data.content);
      setError(null);
    } else {
      setError(response.errors?.[0] || "Failed to load categories.");
    }
    setLoading(false);
  };

  const handleCategorySuccess = (newOrUpdatedCategory?: FlatCategory) => {
    if (newOrUpdatedCategory) {
      if (editingCategory) {
        setCategories((prev) =>
          prev.map((cat) =>
            cat.categoryId === newOrUpdatedCategory.categoryId
              ? newOrUpdatedCategory
              : cat
          )
        );
        setEditingCategory(null);
      } else {
        if (newOrUpdatedCategory.parentId) {
          const parentCategoryRef =
            categoryRefs.current[newOrUpdatedCategory.parentId];
          if (parentCategoryRef?.addSubcategory) {
            const subcategoryData = {
              categoryId: newOrUpdatedCategory.categoryId,
              name: newOrUpdatedCategory.name,
              description: newOrUpdatedCategory.description,
              iconName: newOrUpdatedCategory.iconName,
              parentId: newOrUpdatedCategory.parentId,
              subcategories: [],
            };
            parentCategoryRef.addSubcategory(subcategoryData);
            setRecentlyAddedId(newOrUpdatedCategory.parentId);
            setTimeout(() => setRecentlyAddedId(null), 3000);
          }
        } else {
          setCategories((prev) => [...prev, newOrUpdatedCategory]);
          setRecentlyAddedId(newOrUpdatedCategory.categoryId);
          setTimeout(() => setRecentlyAddedId(null), 3000);
          const newTotalCategories = categories.length + 1;
          const newTotalPages = Math.ceil(newTotalCategories / itemsPerPage);
          if (newTotalPages > totalPages) {
            setCurrentPage(newTotalPages);
          }
        }
      }
    } else {
      fetchCategories();
    }
  };

  const handleCategoryError = (error: string) => {
    toast.error(error);
    fetchCategories();
  };

  const handleCategoryDeleted = (deletedCategoryId: number) => {
    toast.success("Category deleted successfully!");
    setCategories((prev) =>
      prev.filter((cat) => cat.categoryId !== deletedCategoryId)
    );
    const newTotalCategories = categories.length - 1;
    const newTotalPages = Math.ceil(newTotalCategories / itemsPerPage);
    if (currentPage > newTotalPages && newTotalPages > 0) {
      setCurrentPage(newTotalPages);
    }
    if (editingCategory?.categoryId === deletedCategoryId) {
      setEditingCategory(null);
    }
  };

  const handleSubcategoryAdded = (parentId: number, subcategory: Category) => {
    console.log(
      `Subcategory ${subcategory.name} added to parent ${parentId}`
    );
  };

  const handleSubcategoryDeleted = (
    parentId: number,
    subcategoryId: number
  ) => {
    toast.success("Subcategory deleted successfully!");
    console.log(
      `Subcategory ${subcategoryId} deleted from parent ${parentId}`
    );
  };

  const sortedCategories = [...categories].sort((a, b) =>
    a.name.localeCompare(b.name)
  );
  const totalPages = Math.ceil(sortedCategories.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentCategories = sortedCategories.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const getPageNumbers = () => {
    const pages: (number | "...")[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push("...");
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (currentPage < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  };

  const topCategories = [...analytics]
    .sort((a, b) => b.userCount - a.userCount)
    .slice(0, 6);
  const totalUsers = analytics.reduce((sum, a) => sum + a.userCount, 0);

  return (
    <div className="space-y-6">
      {/* Category Analytics */}
      {analytics.length > 0 && (
        <div className="p-6 rounded-2xl bg-surface border border-border-default">
          <h3 className="text-base font-bold text-heading flex items-center gap-2 mb-5">
            <BarChart3 className="w-4.5 h-4.5 text-steel dark:text-sky" />
            Category Analytics
            <span className="ml-auto px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              ADMIN
            </span>
          </h3>

          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-5">
            <div className="p-3 rounded-xl bg-steel/5 dark:bg-sky/5 border border-steel/10 dark:border-sky/10 text-center">
              <p className="text-2xl font-bold text-heading">{analytics.length}</p>
              <p className="text-[11px] text-steel/60 dark:text-sky/40 flex items-center justify-center gap-1">
                <Layers className="w-3 h-3" /> Categories
              </p>
            </div>
            <div className="p-3 rounded-xl bg-steel/5 dark:bg-sky/5 border border-steel/10 dark:border-sky/10 text-center">
              <p className="text-2xl font-bold text-heading">{totalUsers}</p>
              <p className="text-[11px] text-steel/60 dark:text-sky/40 flex items-center justify-center gap-1">
                <Users className="w-3 h-3" /> Total Interests
              </p>
            </div>
            <div className="p-3 rounded-xl bg-steel/5 dark:bg-sky/5 border border-steel/10 dark:border-sky/10 text-center col-span-2 md:col-span-1">
              <p className="text-2xl font-bold text-heading">
                {analytics.length > 0 ? Math.round(totalUsers / analytics.length) : 0}
              </p>
              <p className="text-[11px] text-steel/60 dark:text-sky/40 flex items-center justify-center gap-1">
                <TrendingUp className="w-3 h-3" /> Avg per Category
              </p>
            </div>
          </div>

          {/* Top Categories */}
          {topCategories.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-steel/60 dark:text-sky/40 uppercase tracking-wider">
                Top Categories by User Interest
              </p>
              {topCategories.map((item, idx) => {
                const percentage = totalUsers > 0 ? (item.userCount / totalUsers) * 100 : 0;
                return (
                  <div key={item.categoryId} className="flex items-center gap-3">
                    <span className="w-5 text-xs font-bold text-steel/40 dark:text-sky/30 text-right">
                      {idx + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-heading truncate">
                          {item.categoryName}
                        </span>
                        <span className="text-xs font-semibold text-steel dark:text-sky ml-2 shrink-0">
                          {item.userCount} users
                        </span>
                      </div>
                      <div className="h-1.5 bg-surface-hover rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-steel to-steel-600 dark:from-sky dark:to-steel rounded-full transition-all duration-500"
                          style={{ width: `${Math.max(percentage, 2)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {analyticsLoading && (
            <div className="flex items-center justify-center py-4">
              <Loader />
            </div>
          )}
        </div>
      )}

      {/* Category Form */}
      <CategoryForm
        categories={categories}
        onSuccess={handleCategorySuccess}
        onError={handleCategoryError}
        editingCategory={editingCategory}
        onCancelEdit={() => setEditingCategory(null)}
      />

      {/* Categories Grid */}
      {loading ? (
        <div className="flex justify-center items-center py-16">
          <div className="p-6 rounded-2xl bg-surface border border-border-default">
            <Loader />
          </div>
        </div>
      ) : error ? (
        <div className="flex items-center justify-center gap-2 p-6 rounded-2xl text-red-600 dark:text-red-400 bg-red-50/50 dark:bg-red-900/10 border border-red-200/50 dark:border-red-900/30">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span className="text-sm">{error}</span>
        </div>
      ) : categories.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center py-16 rounded-2xl border border-dashed border-cream-300 dark:border-navy-700 bg-cream-50/50 dark:bg-navy/50">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-cream-300/50 dark:bg-navy-700/50 border border-cream-400/40 dark:border-navy-600/40 mb-4">
            <FolderOpen className="w-6 h-6 text-steel/50 dark:text-sky/40" />
          </div>
          <h3 className="text-base font-semibold text-heading mb-1.5">
            No Categories Yet
          </h3>
          <p className="text-sm text-steel/60 dark:text-sky/40">
            Create your first category using the form above.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {currentCategories.map((category) => (
              <div
                key={category.categoryId}
                className={`transition-all duration-500 ${
                  recentlyAddedId === category.categoryId
                    ? "ring-2 ring-sky/50 dark:ring-sky/40 shadow-lg shadow-sky/10"
                    : ""
                }`}
              >
                <ParentCategoryCard
                  ref={(ref) => {
                    if (ref) {
                      categoryRefs.current[category.categoryId] = ref;
                    }
                  }}
                  name={category.name}
                  description={category.description}
                  iconName={category.iconName}
                  categoryId={category.categoryId}
                  onCategorySelect={(cat) => setEditingCategory(cat)}
                  onDeleted={() =>
                    handleCategoryDeleted(category.categoryId)
                  }
                  onSubcategoryAdded={handleSubcategoryAdded}
                  onSubcategoryDeleted={handleSubcategoryDeleted}
                />
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium text-steel dark:text-sky bg-cream-100/60 dark:bg-navy-700/40 border border-border-default hover:bg-cream-200/60 dark:hover:bg-navy-700/60 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                Prev
              </button>

              {getPageNumbers().map((page, i) =>
                page === "..." ? (
                  <span
                    key={`ellipsis-${i}`}
                    className="px-2 text-steel/40 dark:text-sky/30 text-sm"
                  >
                    ...
                  </span>
                ) : (
                  <button
                    key={page}
                    onClick={() => goToPage(page)}
                    className={`w-9 h-9 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                      currentPage === page
                        ? "bg-steel text-cream-50 shadow-sm dark:bg-sky dark:text-navy"
                        : "text-steel/60 dark:text-sky/40 hover:bg-cream-200/50 dark:hover:bg-navy-700/50"
                    }`}
                  >
                    {page}
                  </button>
                )
              )}

              <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium text-steel dark:text-sky bg-cream-100/60 dark:bg-navy-700/40 border border-border-default hover:bg-cream-200/60 dark:hover:bg-navy-700/60 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Page Info */}
          {categories.length > 0 && (
            <p className="text-center text-xs text-steel/50 dark:text-sky/30">
              Showing {startIndex + 1}-
              {Math.min(endIndex, categories.length)} of {categories.length}{" "}
              categories
            </p>
          )}
        </div>
      )}
    </div>
  );
};

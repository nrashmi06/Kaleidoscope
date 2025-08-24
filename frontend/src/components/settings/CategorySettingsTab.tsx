"use client";

import React, { useEffect, useState } from "react";
import { getParentCategoriesController } from "@/controllers/categoryController/getParentCategories";
import { FlatCategory } from "@/lib/types/settings/category";
import { AlertCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { Loader } from "@/components/common/Loader";
import { ParentCategoryCard } from "@/components/settings/CategorySettingsTabComponenets/ParentCategoryCard";
import { useAccessToken } from "@/hooks/useAccessToken";
import { CategoryForm } from "@/components/settings/CategorySettingsTabComponenets/CategoryForm";

export const CategorySettingsTab = () => {
  const accessToken = useAccessToken();
  const [categories, setCategories] = useState<FlatCategory[]>([]);
  const [editingCategory, setEditingCategory] = useState<FlatCategory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(6); // Show 6 categories per page

  useEffect(() => {
    if (accessToken) fetchCategories();
  }, [accessToken]);

  const fetchCategories = async () => {
    setLoading(true);
    const response = await getParentCategoriesController(accessToken);
    if (response.success && response.data?.categories) {
      setCategories(response.data.categories);
      setError(null);
    } else {
      setError(response.errors?.[0] || "Failed to load categories.");
    }
    setLoading(false);
  };

  // Pagination calculations
  const sortedCategories = [...categories].sort((a, b) => a.name.localeCompare(b.name));
  const totalPages = Math.ceil(sortedCategories.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentCategories = sortedCategories.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const goToPrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-7xl mx-auto space-y-10">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-2 text-gray-800 dark:text-white">
            Category Settings
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your parent and subcategories with database-driven options.
          </p>
        </div>

        <CategoryForm
          categories={categories}
          onSuccess={fetchCategories}
          editingCategory={editingCategory}
          onCancelEdit={() => setEditingCategory(null)}
        />

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg">
              <Loader />
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center gap-2 text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-6 rounded-2xl border border-red-200 dark:border-red-800">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Categories Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {currentCategories.map((category) => (
                <ParentCategoryCard
                  key={category.categoryId}
                  name={category.name}
                  description={category.description}
                  iconName={category.iconName}
                  categoryId={category.categoryId}
                  onCategorySelect={(cat) => setEditingCategory(cat)}
                  onDeleted={fetchCategories}
                />
              ))}
            </div>

            {/* Show message if no categories */}
            {categories.length === 0 && (
              <div className="text-center py-16">
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg border border-gray-200 dark:border-gray-700">
                  <p className="text-gray-600 dark:text-gray-400 text-lg">
                    No categories available. Create your first category above.
                  </p>
                </div>
              </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center space-x-6 mt-8">
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-lg border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center space-x-4">
                    {/* Previous Button */}
                    <button
                      onClick={goToPrevPage}
                      disabled={currentPage === 1}
                      className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <span>Previous</span>
                    </button>

                    {/* Page Numbers */}
                    <div className="flex items-center space-x-2">
                      {[...Array(totalPages)].map((_, index) => {
                        const page = index + 1;
                        return (
                          <button
                            key={page}
                            onClick={() => goToPage(page)}
                            className={`w-10 h-10 rounded-lg font-medium transition-all duration-200 ${
                              currentPage === page
                                ? "bg-blue-600 text-white shadow-lg"
                                : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                            }`}
                          >
                            {page}
                          </button>
                        );
                      })}
                    </div>

                    {/* Next Button */}
                    <button
                      onClick={goToNextPage}
                      disabled={currentPage === totalPages}
                      className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                    >
                      <span>Next</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Pagination Info */}
            {categories.length > 0 && (
              <div className="text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Showing {startIndex + 1}-{Math.min(endIndex, categories.length)} of {categories.length} categories
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

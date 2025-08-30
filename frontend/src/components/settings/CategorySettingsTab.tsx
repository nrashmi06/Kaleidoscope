"use client";

import React, { useEffect, useState, useRef } from "react";
import { getParentCategoriesController } from "@/controllers/categoryController/getParentCategories";
import { FlatCategory } from "@/lib/types/settings/category";
import { AlertCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { Loader } from "@/components/common/Loader";
import { ParentCategoryCard, ParentCategoryCardRef } from "@/components/settings/CategorySettingsTabComponenets/ParentCategoryCard";
import { useAccessToken } from "@/hooks/useAccessToken";
import { CategoryForm } from "@/components/settings/CategorySettingsTabComponenets/CategoryForm";
import { toast } from "react-hot-toast";

export const CategorySettingsTab = () => {
  const accessToken = useAccessToken();
  const [categories, setCategories] = useState<FlatCategory[]>([]);
  const [editingCategory, setEditingCategory] = useState<FlatCategory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recentlyAddedId, setRecentlyAddedId] = useState<number | null>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(6); // Show 6 categories per page
  
  // Refs to access ParentCategoryCard methods
  const categoryRefs = useRef<{ [key: number]: ParentCategoryCardRef | null }>({});

  useEffect(() => {
    if (accessToken) fetchCategories();
  }, [accessToken]);

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

  // Function to handle successful category creation with optimistic updates
  const handleCategorySuccess = (newOrUpdatedCategory?: FlatCategory) => {
    if (newOrUpdatedCategory) {
      if (editingCategory) {
        // Update existing category
        setCategories(prev => 
          prev.map(cat => 
            cat.categoryId === newOrUpdatedCategory.categoryId 
              ? newOrUpdatedCategory 
              : cat
          )
        );
        setEditingCategory(null); // Clear editing state
      } else {
        // Check if this is a subcategory (has parentId)
        if (newOrUpdatedCategory.parentId) {
          // This is a subcategory - add it to the parent category's subcategories
          const parentCategoryRef = categoryRefs.current[newOrUpdatedCategory.parentId];
          if (parentCategoryRef?.addSubcategory) {
            const subcategoryData = {
              categoryId: newOrUpdatedCategory.categoryId,
              name: newOrUpdatedCategory.name,
              description: newOrUpdatedCategory.description,
              iconName: newOrUpdatedCategory.iconName,
              parentId: newOrUpdatedCategory.parentId,
              subcategories: []
            };
            parentCategoryRef.addSubcategory(subcategoryData);
            
            // Set visual feedback for the parent category
            setRecentlyAddedId(newOrUpdatedCategory.parentId);
            setTimeout(() => setRecentlyAddedId(null), 3000);
          }
        } else {
          // This is a parent category - add it to the main categories list
          setCategories(prev => [...prev, newOrUpdatedCategory]);
          
          // Set the recently added ID for visual feedback
          setRecentlyAddedId(newOrUpdatedCategory.categoryId);
          setTimeout(() => setRecentlyAddedId(null), 3000); // Clear after 3 seconds
          
          // Calculate if we need to navigate to a new page to show the new category
          const newTotalCategories = categories.length + 1;
          const newTotalPages = Math.ceil(newTotalCategories / itemsPerPage);
          
          // If the new category would be on a page beyond current pagination, navigate to it
          if (newTotalPages > totalPages) {
            setCurrentPage(newTotalPages);
          }
        }
      }
    } else {
      // Fallback: Refetch all categories
      fetchCategories();
    }
  };

  // Function to handle category creation/update errors
  const handleCategoryError = (error: string) => {
    toast.error(error);
    // Optionally refetch data to ensure consistency
    fetchCategories();
  };

  // Function to handle category deletion with optimistic updates
  const handleCategoryDeleted = (deletedCategoryId: number) => {
    // Show success toast
    toast.success("Category deleted successfully!");
    
    // Optimistic update: Remove deleted category immediately
    setCategories(prev => prev.filter(cat => cat.categoryId !== deletedCategoryId));
    
    // Calculate new pagination after deletion
    const newTotalCategories = categories.length - 1;
    const newTotalPages = Math.ceil(newTotalCategories / itemsPerPage);
    
    // If current page is now beyond available pages, go to last page
    if (currentPage > newTotalPages && newTotalPages > 0) {
      setCurrentPage(newTotalPages);
    }
    
    // Clear editing state if we were editing the deleted category
    if (editingCategory?.categoryId === deletedCategoryId) {
      setEditingCategory(null);
    }
  };

  // Function to handle subcategory addition
  const handleSubcategoryAdded = (parentId: number, subcategory: any) => {
    // This is handled automatically through the ref system
    console.log(`Subcategory ${subcategory.name} added to parent ${parentId}`);
  };

  // Function to handle subcategory deletion
  const handleSubcategoryDeleted = (parentId: number, subcategoryId: number) => {
    // Show success toast
    toast.success("Subcategory deleted successfully!");
    console.log(`Subcategory ${subcategoryId} deleted from parent ${parentId}`);
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
          onSuccess={handleCategorySuccess}
          onError={handleCategoryError}
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
                <div
                  key={category.categoryId}
                  className={`transition-all duration-500 ${
                    recentlyAddedId === category.categoryId
                      ? "animate-pulse border-2 border-green-400 shadow-lg shadow-green-200 dark:shadow-green-800"
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
                    onDeleted={() => handleCategoryDeleted(category.categoryId)}
                    onSubcategoryAdded={handleSubcategoryAdded}
                    onSubcategoryDeleted={handleSubcategoryDeleted}
                  />
                </div>
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

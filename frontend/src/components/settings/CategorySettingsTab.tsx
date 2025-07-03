"use client";

import React, { useEffect, useState } from "react";
import { getParentCategoriesController } from "@/controllers/categoryController/getParentCategories";
import { FlatCategory } from "@/lib/types/settings/category";
import { AlertCircle } from "lucide-react";
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

  return (
    <div className="p-8 max-w-full mx-auto space-y-10">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-2 text-gray-800 dark:text-white">
          Category Settings
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage your parent and subcategories.
        </p>
      </div>

      <CategoryForm
        categories={categories}
        onSuccess={fetchCategories}
        editingCategory={editingCategory}
        onCancelEdit={() => setEditingCategory(null)}
      />

      {loading ? (
        <div className="flex justify-center items-center py-10">
          <Loader />
        </div>
      ) : error ? (
        <div className="flex items-center gap-2 text-red-500">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      ) : (
        <div className="grid gap-6">
          {[...categories]
  .sort((a, b) => a.name.localeCompare(b.name))
  .map((category) => (
    <ParentCategoryCard
      key={category.categoryId}
      name={category.name}
      description={category.description}
      iconName={category.iconName}
      categoryId={category.categoryId}
      onCategorySelect={(cat) => setEditingCategory(cat)}
    />
))}

        </div>
      )}
    </div>
  );
};

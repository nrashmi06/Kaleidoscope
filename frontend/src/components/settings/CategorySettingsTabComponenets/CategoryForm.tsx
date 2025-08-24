"use client";

import React, { useEffect, useState } from "react";
import { createNewCategoryController } from "@/controllers/categoryController/createNewCategory";
import { updateCategoryController } from "@/controllers/categoryController/updateCategory";
import { CreateCategoryData, FlatCategory } from "@/lib/types/settings/category";
import { useAccessToken } from "@/hooks/useAccessToken";
import { IconSearchDropdown } from "./IconSearchDropdown";

interface Props {
  categories: FlatCategory[];
  onSuccess: () => void;
  editingCategory?: FlatCategory | null;
  onCancelEdit?: () => void;
}

export const CategoryForm: React.FC<Props> = ({
  categories,
  onSuccess,
  editingCategory,
  onCancelEdit,
}) => {
  const accessToken = useAccessToken();
  const isEditing = !!editingCategory;

  const [form, setForm] = useState<CreateCategoryData>({
    name: "",
    description: "",
    iconName: "",
    parentId: null,
  });

  const [iconQuery, setIconQuery] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (editingCategory) {
      setForm({
        name: editingCategory.name,
        description: editingCategory.description,
        iconName: editingCategory.iconName,
        parentId: editingCategory.parentId ?? null,
      });
      setIconQuery(editingCategory.iconName);
    } else {
      setForm({ name: "", description: "", iconName: "", parentId: null });
      setIconQuery("");
    }
  }, [editingCategory]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;

    setSubmitting(true);
    const response = isEditing
      ? await updateCategoryController(editingCategory!.categoryId, form, accessToken)
      : await createNewCategoryController(form, accessToken);

    if (response.success) {
      setForm({ name: "", description: "", iconName: "", parentId: null });
      setIconQuery("");
      onSuccess();
      onCancelEdit?.();
    } else {
      alert(response.errors?.[0] || "Operation failed.");
    }

    setSubmitting(false);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-8 bg-white dark:bg-gray-800 p-8 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-2xl backdrop-blur-sm"
    >
      <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
        <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
          {isEditing ? "Edit Category" : "Create New Category"}
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          {isEditing ? "Update category information" : "Add a new category with database integration"}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Name *</label>
          <input
            className="p-4 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 placeholder-gray-500 dark:placeholder-gray-400"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Enter category name"
            required
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            Parent Category <span className="font-normal text-gray-500 dark:text-gray-400">(optional)</span>
          </label>
          <select
            className="p-4 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            value={form.parentId ?? ""}
            onChange={(e) =>
              setForm({
                ...form,
                parentId: e.target.value ? Number(e.target.value) : null,
              })
            }
          >
            <option value="">None</option>
            {categories
              .filter((cat) => !editingCategory || cat.categoryId !== editingCategory.categoryId)
              .map((cat) => (
                <option key={cat.categoryId} value={cat.categoryId}>
                  {cat.name}
                </option>
              ))}
          </select>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Description *</label>
        <textarea
          className="p-4 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 placeholder-gray-500 dark:placeholder-gray-400 resize-none"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="Enter category description"
          rows={3}
          required
        />
      </div>

      <IconSearchDropdown
        iconQuery={iconQuery}
        setIconQuery={setIconQuery}
        onIconSelect={(iconName) => {
          setForm({ ...form, iconName });
          setIconQuery(iconName);
        }}
      />

      <div className="flex gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
        <button
          type="submit"
          className="flex-1 px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          disabled={submitting}
        >
          {submitting
            ? isEditing
              ? "Saving Changes..."
              : "Creating Category..."
            : isEditing
            ? "Save Changes"
            : "Create Category"}
        </button>

        {isEditing && onCancelEdit && (
          <button
            type="button"
            onClick={onCancelEdit}
            className="px-6 py-4 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-medium rounded-xl transition-all duration-200 shadow-md hover:shadow-lg"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
};

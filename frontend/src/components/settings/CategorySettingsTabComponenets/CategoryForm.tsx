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
      className="space-y-6 bg-white dark:bg-gray-900 p-8 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-xl"
    >
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
        {isEditing ? "Edit Category" : "Create New Category"}
      </h2>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Name</label>
        <input
          className="p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Description</label>
        <textarea
          className="p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
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

      <div className="flex flex-col gap-1">
        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          Parent Category <span className="font-normal text-gray-400">(optional)</span>
        </label>
        <select
          className="p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
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

      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={submitting}
        >
          {submitting
            ? isEditing
              ? "Saving..."
              : "Creating..."
            : isEditing
            ? "Save Changes"
            : "Create Category"}
        </button>

        {isEditing && onCancelEdit && (
          <button
            type="button"
            onClick={onCancelEdit}
            className="px-5 py-2.5 bg-gray-300 hover:bg-gray-400 text-gray-800 font-medium rounded-lg transition-all duration-200"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
};

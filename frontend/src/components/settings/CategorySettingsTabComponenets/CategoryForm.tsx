// src/components/settings/CategorySettingsTabComponenets/CategoryForm.tsx
"use client";

import React, { useEffect, useState } from "react";
import { createNewCategoryController } from "@/controllers/categoryController/createNewCategory";
import { updateCategoryController } from "@/controllers/categoryController/updateCategory";
import { CreateCategoryData, FlatCategory } from "@/lib/types/settings/category";
import { useAccessToken } from "@/hooks/useAccessToken";
import { IconSearchDropdown } from "./IconSearchDropdown";
import { toast } from "react-hot-toast";
import { Plus, Pencil } from "lucide-react";

interface Props {
  categories: FlatCategory[];
  onSuccess: (newCategory?: FlatCategory) => void;
  onError?: (error: string) => void;
  editingCategory?: FlatCategory | null;
  onCancelEdit?: () => void;
}

export const CategoryForm: React.FC<Props> = ({
  categories,
  onSuccess,
  onError,
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
      ? await updateCategoryController(
          editingCategory!.categoryId,
          form,
          accessToken
        )
      : await createNewCategoryController(form, accessToken);

    if (response.success) {
      setForm({ name: "", description: "", iconName: "", parentId: null });
      setIconQuery("");

      toast.success(
        isEditing
          ? "Category updated successfully!"
          : "Category created successfully!"
      );

      if (response.data) {
        const categoryData: FlatCategory = {
          categoryId: response.data.categoryId,
          name: response.data.name,
          description: response.data.description,
          iconName: response.data.iconName,
          parentId: response.data.parentId,
        };
        onSuccess(categoryData);
      } else {
        onSuccess();
      }

      onCancelEdit?.();
    } else {
      const errorMessage = response.errors?.[0] || "Operation failed.";
      toast.error(errorMessage);
      onError?.(errorMessage);
    }

    setSubmitting(false);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="p-6 rounded-2xl bg-surface border border-border-default space-y-5"
    >
      {/* Form Header */}
      <div className="flex items-center gap-2 pb-4 border-b border-border-subtle">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-steel/8 dark:bg-sky/8">
          {isEditing ? (
            <Pencil className="w-4 h-4 text-steel dark:text-sky" />
          ) : (
            <Plus className="w-4 h-4 text-steel dark:text-sky" />
          )}
        </div>
        <div>
          <h2 className="text-base font-bold text-heading">
            {isEditing ? "Edit Category" : "Create New Category"}
          </h2>
          <p className="text-[11px] text-steel/50 dark:text-sky/35">
            {isEditing
              ? "Update category information"
              : "Add a new category to the system"}
          </p>
        </div>
      </div>

      {/* Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-heading">
            Name *
          </label>
          <input
            className="w-full h-11 px-4 rounded-xl border border-cream-300 dark:border-navy-700 bg-white dark:bg-navy-700/40 text-heading text-sm placeholder:text-steel/40 dark:placeholder:text-sky/30 focus:outline-none focus:ring-2 focus:ring-steel/30 dark:focus:ring-sky/30 focus:border-steel dark:focus:border-sky transition-all"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Enter category name"
            required
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-heading">
            Parent Category{" "}
            <span className="font-normal text-steel/40 dark:text-sky/30">
              (optional)
            </span>
          </label>
          <select
            className="w-full h-11 px-4 rounded-xl border border-cream-300 dark:border-navy-700 bg-white dark:bg-navy-700/40 text-heading text-sm focus:outline-none focus:ring-2 focus:ring-steel/30 dark:focus:ring-sky/30 focus:border-steel dark:focus:border-sky transition-all appearance-none cursor-pointer"
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
              .filter(
                (cat) =>
                  !editingCategory ||
                  cat.categoryId !== editingCategory.categoryId
              )
              .map((cat) => (
                <option key={cat.categoryId} value={cat.categoryId}>
                  {cat.name}
                </option>
              ))}
          </select>
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-semibold text-heading">
          Description *
        </label>
        <textarea
          className="w-full px-4 py-3 rounded-xl border border-cream-300 dark:border-navy-700 bg-white dark:bg-navy-700/40 text-heading text-sm placeholder:text-steel/40 dark:placeholder:text-sky/30 focus:outline-none focus:ring-2 focus:ring-steel/30 dark:focus:ring-sky/30 focus:border-steel dark:focus:border-sky transition-all resize-none"
          value={form.description}
          onChange={(e) =>
            setForm({ ...form, description: e.target.value })
          }
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

      {/* Actions */}
      <div className="flex gap-3 pt-4 border-t border-border-subtle">
        <button
          type="submit"
          className="flex-1 h-11 inline-flex items-center justify-center gap-2 rounded-xl text-sm font-semibold text-cream-50 bg-gradient-to-r from-steel to-steel-600 hover:from-steel-600 hover:to-steel dark:from-sky dark:to-sky/80 dark:hover:from-sky/90 dark:hover:to-sky dark:text-navy shadow-md shadow-steel/20 dark:shadow-sky/15 transition-all cursor-pointer disabled:opacity-50"
          disabled={submitting}
        >
          {submitting
            ? isEditing
              ? "Saving Changes..."
              : "Creating..."
            : isEditing
              ? "Save Changes"
              : "Create Category"}
        </button>

        {isEditing && onCancelEdit && (
          <button
            type="button"
            onClick={onCancelEdit}
            className="px-5 h-11 rounded-xl text-sm font-semibold text-steel dark:text-sky bg-steel/8 hover:bg-steel/15 dark:bg-sky/8 dark:hover:bg-sky/15 transition-all cursor-pointer disabled:opacity-50"
            disabled={submitting}
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
};

// src/components/articles/form-components/TagsAndMediaSection.tsx

import React from "react";
import { BlogRequest } from "@/lib/types/createBlog";
import { cn } from "@/lib/utils";
import { Tag, Image as ImageIcon } from "lucide-react";

interface TagsAndMediaSectionProps {
  formData: BlogRequest;
  // Change type of name to only allow 'blogTagIds' for internal logic
  onArrayChange: (name: 'blogTagIds', id: number) => void; 
  onMockMediaAdd: () => void;
}

/**
 * Component for handling blog tags, and mock media for the blog form.
 * Category selection logic has been moved to BlogForm.tsx to reuse CategoriesSelect.
 */
export const TagsAndMediaSection: React.FC<TagsAndMediaSectionProps> = ({
  formData,
  onArrayChange,
  onMockMediaAdd,
}) => {
  return (
    <section className="space-y-6">

      {/* Blog Tags Selection (Keep this for blogTagIds) */}
      <div className="p-4 mt-6 rounded-lg bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700">
        <label className="block mb-3 font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
          <Tag className="w-4 h-4" /> Blog Tags
        </label>
        <div className="flex flex-wrap gap-2">
          {[10, 20, 30].map((id) => (
            <button
              key={id}
              type="button"
              // Name is explicitly 'blogTagIds' now
              onClick={() => onArrayChange("blogTagIds", id)} 
              className={cn(
                "px-4 py-2 text-sm font-medium rounded-full border transition-all duration-200 cursor-pointer",
                formData.blogTagIds.includes(id)
                  ? "bg-purple-600 border-purple-600 text-white hover:bg-purple-700 dark:bg-purple-700 dark:border-purple-700 dark:hover:bg-purple-800"
                  : "bg-white border-gray-300 text-gray-700 hover:bg-gray-100 dark:bg-neutral-900 dark:border-neutral-700 dark:text-gray-300 dark:hover:bg-neutral-700"
              )}
            >
              Tag {id}
            </button>
          ))}
        </div>
      </div>

      {/* Mocked Media Upload Area */}
      <div className="p-4 rounded-lg border border-blue-400 dark:border-blue-600 bg-blue-50 dark:bg-blue-900/20">
        <p className="font-bold mb-3 text-blue-800 dark:text-blue-300 flex items-center gap-2">
          <ImageIcon className="w-4 h-4" /> Media Details ({formData.mediaDetails?.length || 0})
        </p>
        <button
          type="button"
          onClick={onMockMediaAdd}
          className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 transition-colors"
        >
          Add Mock Image
        </button>
      </div>
    </section>
  );
};
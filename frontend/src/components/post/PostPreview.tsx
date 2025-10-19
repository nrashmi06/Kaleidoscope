import React from "react";
import { PostCreateRequestDTO, LocationOption } from "@/lib/types/post";

interface Props {
  formData: PostCreateRequestDTO;
  mediaPreviewLength: number;
  selectedLocation: LocationOption | null;
}

export default function PostPreview({ formData, mediaPreviewLength, selectedLocation }: Props) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Preview</h2>
      <p className="text-gray-700 dark:text-gray-300 mb-1">
        <strong>Title:</strong> {formData.title || "N/A"}
      </p>
      <p className="text-gray-700 dark:text-gray-300 mb-1">
        <strong>Body:</strong> {formData.body || "N/A"}
      </p>
      <p className="text-gray-700 dark:text-gray-300 mb-1">
        <strong>Summary:</strong> {formData.summary || "N/A"}
      </p>
      <p className="text-gray-700 dark:text-gray-300 mb-1">
        <strong>Visibility:</strong> {formData.visibility}
      </p>
      <p className="text-gray-700 dark:text-gray-300 mb-1">
        <strong>Location:</strong> {selectedLocation?.name || "N/A"}
      </p>
      <p className="text-gray-700 dark:text-gray-300 mb-1">
        <strong>Categories:</strong> {formData.categoryIds?.join(", ") || "N/A"}
      </p>
      <p className="text-gray-700 dark:text-gray-300 mb-1">
        <strong>Media count:</strong> {mediaPreviewLength}
      </p>
      <p className="text-gray-700 dark:text-gray-300">
        <strong>Tagged Users:</strong> {formData.taggedUserIds?.join(", ") || "N/A"}
      </p>
    </div>
  );
}

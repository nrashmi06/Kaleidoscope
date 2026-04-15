import React from "react";
import { PostCreateRequestDTO, LocationOption } from "@/lib/types/post";

interface Props {
  formData: PostCreateRequestDTO;
  mediaPreviewLength: number;
  selectedLocation: LocationOption | null;
}

export default function PostPreview({ formData, mediaPreviewLength, selectedLocation }: Props) {
  return (
    <div className="bg-surface-alt rounded-xl border border-border-default p-6">
      <h2 className="text-lg font-display font-semibold text-heading mb-2">Preview</h2>
      <p className="text-navy/70 dark:text-cream/70 mb-1">
        <strong>Title:</strong> {formData.title || "N/A"}
      </p>
      <p className="text-navy/70 dark:text-cream/70 mb-1">
        <strong>Body:</strong> {formData.body || "N/A"}
      </p>
      <p className="text-navy/70 dark:text-cream/70 mb-1">
        <strong>Summary:</strong> {formData.summary || "N/A"}
      </p>
      <p className="text-navy/70 dark:text-cream/70 mb-1">
        <strong>Visibility:</strong> {formData.visibility}
      </p>
      <p className="text-navy/70 dark:text-cream/70 mb-1">
        <strong>Location:</strong> {selectedLocation?.name || "N/A"}
      </p>
      <p className="text-navy/70 dark:text-cream/70 mb-1">
        <strong>Categories:</strong> {formData.categoryIds?.join(", ") || "N/A"}
      </p>
      <p className="text-navy/70 dark:text-cream/70 mb-1">
        <strong>Media count:</strong> {mediaPreviewLength}
      </p>
      <p className="text-navy/70 dark:text-cream/70">
        <strong>Tagged Users:</strong> {formData.taggedUserIds?.join(", ") || "N/A"}
      </p>
    </div>
  );
}

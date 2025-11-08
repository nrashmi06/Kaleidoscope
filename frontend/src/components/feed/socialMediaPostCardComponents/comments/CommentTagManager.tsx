"use client";

import { useState } from "react";
import { X, Trash2 } from "lucide-react";
import { deleteUserTagController } from "@/controllers/userTagController/deleteUserTagController";
import { useAccessToken } from "@/hooks/useAccessToken";
import { CommentItem as CommentType } from "@/lib/types/comment";

interface CommentTagManagerProps {
  comment: CommentType;
  onClose: () => void;
  onTagDeleted?: () => void;
}

export default function CommentTagManager({
  comment,
  onClose,
  onTagDeleted,
}: CommentTagManagerProps) {
  const accessToken = useAccessToken();
  const [deletingTagId, setDeletingTagId] = useState<number | null>(null);

  const handleDeleteTag = async (tagId: number) => {
    if (!accessToken) return;
    setDeletingTagId(tagId);
    try {
      const resp = await deleteUserTagController(accessToken, tagId);
      if (resp.success) {
        onTagDeleted?.();
      }
    } catch (err) {
      console.error("Error deleting tag:", err);
    } finally {
      setDeletingTagId(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm flex items-center justify-center z-[999]">
      <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 w-full max-w-md p-6 animate-in fade-in duration-300">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Manage Tags
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-neutral-800"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tags List */}
        {comment.tags && comment.tags.length > 0 ? (
          <div className="space-y-2">
            {comment.tags.map((tag) => (
              <div
                key={tag.tagId}
                className="flex items-center justify-between bg-gray-50 dark:bg-neutral-800 px-3 py-2 rounded-lg border border-gray-100 dark:border-gray-700"
              >
                <span className="text-sm text-gray-800 dark:text-gray-200">
                  @{tag.taggedUsername}
                </span>
                <button
                  onClick={() => handleDeleteTag(tag.tagId)}
                  disabled={deletingTagId === tag.tagId}
                  className="flex items-center gap-1 text-xs text-red-600 hover:text-red-700 dark:text-red-400 disabled:opacity-50"
                >
                  <Trash2 size={14} />
                  {deletingTagId === tag.tagId ? "Deleting..." : "Delete"}
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No tags found for this comment.
          </div>
        )}

        {/* Footer */}
        <div className="mt-5 flex justify-end">
          <button
            onClick={onClose}
            className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-800 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

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
    <div className="fixed inset-0 bg-navy/50 backdrop-blur-sm flex items-center justify-center z-[999]">
      <div className="bg-cream-50 dark:bg-navy rounded-2xl shadow-xl shadow-navy/10 dark:shadow-black/30 border border-cream-300/40 dark:border-navy-700/40 w-full max-w-md p-6 animate-in fade-in duration-300">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-navy dark:text-cream">
            Manage Tags
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-cream-300/40 dark:hover:bg-navy-700/40 transition"
          >
            <X size={18} className="text-navy dark:text-cream" />
          </button>
        </div>

        {/* Tags List */}
        {comment.tags && comment.tags.length > 0 ? (
          <div className="space-y-2">
            {comment.tags.map((tag) => (
              <div
                key={tag.tagId}
                className="flex items-center justify-between bg-cream-100/40 dark:bg-navy-700/30 px-3 py-2 rounded-lg border border-cream-300/40 dark:border-navy-700/40"
              >
                <span className="text-sm text-navy/80 dark:text-cream/80">
                  @{tag.taggedUsername}
                </span>
                <button
                  onClick={() => handleDeleteTag(tag.tagId)}
                  disabled={deletingTagId === tag.tagId}
                  className="flex items-center gap-1 text-xs text-red-600 hover:text-red-700 dark:text-red-400 disabled:opacity-50 cursor-pointer"
                >
                  <Trash2 size={14} />
                  {deletingTagId === tag.tagId ? "Deleting..." : "Delete"}
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-steel/60 dark:text-sky/40">
            No tags found for this comment.
          </div>
        )}

        {/* Footer */}
        <div className="mt-5 flex justify-end">
          <button
            onClick={onClose}
            className="flex items-center gap-2 text-sm font-medium text-navy/70 dark:text-cream/60 px-4 py-2 rounded-lg hover:bg-cream-300/40 dark:hover:bg-navy-700/40 transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

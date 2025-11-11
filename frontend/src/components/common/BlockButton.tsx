// src/components/common/BlockButton.tsx
"use client";

import React, { useState } from "react";
import { useAppDispatch } from "@/hooks/appDispatch";
import { useAppSelector } from "@/hooks/useAppSelector";
import { startUnblockUser } from "@/store/blockThunks";
import { BlockUserModal } from "@/components/user-blocks/BlockUserModal";
import DeleteConfirmationModal from "@/components/common/DeleteConfirmationModal";
import { toast } from "react-hot-toast";
import { Loader2, UserX } from "lucide-react";

interface BlockButtonProps {
  targetUserId: number;
  targetUsername: string;
  onUnblockSuccess?: () => void; // Optional callback for lists
}

export default function BlockButton({
  targetUserId,
  targetUsername,
  onUnblockSuccess,
}: BlockButtonProps) {
  const dispatch = useAppDispatch();
  const myUserId = useAppSelector((state) => state.auth.userId);
  
  // Read block status from the new blockSlice
  const isBlocked = useAppSelector((state) =>
    state.block.blockedUserIds.includes(targetUserId)
  );

  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);
  const [isUnblockModalOpen, setIsUnblockModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Don't show button on your own profile
  if (myUserId === targetUserId) {
    return null;
  }

  const handleConfirmUnblock = async () => {
    setIsSubmitting(true);
    const toastId = toast.loading("Unblocking user...");

    try {
      await dispatch(startUnblockUser(targetUserId)).unwrap();
      
      toast.success("User unblocked", { id: toastId });
      setIsUnblockModalOpen(false);
      onUnblockSuccess?.(); // Call optional callback

    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to unblock";
      toast.error(message, { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {isBlocked ? (
        // --- UNBLOCK BUTTON (Yellow) ---
        <button
          onClick={() => setIsUnblockModalOpen(true)}
          disabled={isSubmitting}
          className="px-4 py-2.5 text-sm font-semibold rounded-full bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 hover:bg-yellow-200 dark:hover:bg-yellow-900/40 inline-flex items-center gap-2 transition-all duration-200 border border-yellow-300 dark:border-yellow-700 disabled:opacity-50"
          title="Unblock this user"
        >
          {isSubmitting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <UserX className="w-4 h-4" />
          )}
          {isSubmitting ? "Unblocking..." : "Unblock"}
        </button>
      ) : (
        // --- BLOCK BUTTON (Red) ---
        <button
          onClick={() => setIsBlockModalOpen(true)}
          disabled={isSubmitting}
          className="p-2 px-3 text-xs font-semibold rounded-full bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 inline-flex items-center gap-2 transition-all duration-200 border border-red-200 dark:border-red-700"
          title="Block this user"
        >
          <UserX className="w-3 h-3" /> Block
        </button>
      )}

      {/* --- MODALS --- */}
      
      {/* 1. Block Modal (gets reason) */}
      <BlockUserModal
        isOpen={isBlockModalOpen}
        onClose={() => setIsBlockModalOpen(false)}
        targetUser={{ userId: targetUserId, username: targetUsername }}
        onBlockSuccess={() => setIsBlockModalOpen(false)} // Modal dispatches its own thunk
      />

      {/* 2. Unblock Modal (confirmation) */}
      <DeleteConfirmationModal
        isOpen={isUnblockModalOpen}
        onCancel={() => setIsUnblockModalOpen(false)}
        onConfirm={handleConfirmUnblock}
        isDeleting={isSubmitting}
        title="Unblock User"
        message={`Are you sure you want to unblock @${targetUsername}? They will be able to see your posts and interact with you again.`}
      />
    </>
  );
}
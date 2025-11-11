// src/components/user-blocks/BlockUserModal.tsx
"use client";

import React, { useState } from "react";
import { blockUserController } from "@/controllers/user-blocks/blockUserController";
import { useAccessToken } from "@/hooks/useAccessToken";
import { Loader2, UserX, ShieldCheck, AlertCircle, X } from "lucide-react";

interface BlockUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetUser: { userId: number; username: string };
  onBlockSuccess: () => void; // Callback to refresh profile
}

/**
 * A modal component to confirm and capture a reason for blocking a user.
 */
export const BlockUserModal: React.FC<BlockUserModalProps> = ({
  isOpen,
  onClose,
  targetUser,
  onBlockSuccess,
}) => {
  const [reason, setReason] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const accessToken = useAccessToken();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    if (!accessToken) {
      setError("You are not authenticated.");
      setIsLoading(false);
      return;
    }

    // Call the controller with the block request
    const result = await blockUserController(
      { userIdToBlock: targetUser.userId, reason },
      accessToken
    );

    if (result.success) {
      setSuccess(result.message);
      setReason("");
      // After 1.5s, call the success callback which
      // will refresh the profile and close the modal.
      setTimeout(() => {
        onBlockSuccess();
      }, 1500);
    } else {
      setError(result.message);
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md p-6 bg-white dark:bg-neutral-900 rounded-xl shadow-lg border border-gray-200 dark:border-neutral-800"
        onClick={(e) => e.stopPropagation()} // Prevent closing on modal click
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-full"
          aria-label="Close modal"
          disabled={isLoading}
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <UserX className="w-5 h-5 text-red-500" />
          Block @{targetUser.username}?
        </h2>

        <p className="text-sm text-gray-600 dark:text-neutral-400 mb-6">
          They will not be able to follow you, message you, or see your posts. You will not see their notifications.
        </p>

        {/* Form is only shown if not successful */}
        {!success && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="block_reason"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Reason (Required)
              </label>
              <textarea
                id="block_reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Enter a reason (min 10 characters)..."
                required
                minLength={10}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 dark:border-neutral-700 rounded-lg bg-gray-50 dark:bg-neutral-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="px-5 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-neutral-800 border border-gray-300 dark:border-neutral-700 rounded-lg hover:bg-gray-50 dark:hover:bg-neutral-700 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading || reason.trim().length < 10}
                className="flex items-center justify-center px-5 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  "Confirm Block"
                )}
              </button>
            </div>
          </form>
        )}

        {/* Success Message */}
        {success && (
          <div className="mt-4 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm font-medium">{success}</p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mt-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
};
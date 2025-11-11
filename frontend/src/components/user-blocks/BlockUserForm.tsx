// src/components/user-blocks/BlockUserForm.tsx
"use client";

import React, { useState } from "react";
import { blockUserController } from "@/controllers/user-blocks/blockUserController";
import { useAccessToken } from "@/hooks/useAccessToken";
import { Loader2, UserX, ShieldCheck, AlertCircle } from "lucide-react";

/**
 * Skeleton loader for the BlockUserForm component.
 */
export const BlockUserFormSkeleton: React.FC = () => {
  return (
    <div className="w-full max-w-lg p-6 bg-white dark:bg-neutral-800 rounded-lg shadow-md border border-gray-200 dark:border-neutral-700 animate-pulse">
      <div className="h-7 w-1/3 bg-gray-300 dark:bg-neutral-700 rounded-md mb-6"></div>
      <div className="space-y-5">
        <div>
          <div className="h-4 w-1/4 bg-gray-300 dark:bg-neutral-700 rounded mb-2"></div>
          <div className="h-10 w-full bg-gray-200 dark:bg-neutral-700 rounded-lg"></div>
        </div>
        <div>
          <div className="h-4 w-1/4 bg-gray-300 dark:bg-neutral-700 rounded mb-2"></div>
          <div className="h-24 w-full bg-gray-200 dark:bg-neutral-700 rounded-lg"></div>
        </div>
        <div className="h-12 w-full bg-red-300 dark:bg-red-700 rounded-lg mt-4"></div>
      </div>
    </div>
  );
};

/**
 * A form component to allow an authenticated user to block another user.
 */
export const BlockUserForm: React.FC = () => {
  const [userIdToBlock, setUserIdToBlock] = useState("");
  const [reason, setReason] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Assuming a custom hook retrieves the JWT from Redux/storage
  const accessToken = useAccessToken(); 

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    if (!accessToken) {
      setError("You are not authenticated. Please log in.");
      setIsLoading(false);
      return;
    }

    const userIdNum = parseInt(userIdToBlock, 10);
    if (isNaN(userIdNum)) {
      setError("User ID must be a valid number.");
      setIsLoading(false);
      return;
    }

    // Call the controller, not the service
    const result = await blockUserController(
      { userIdToBlock: userIdNum, reason },
      accessToken
    );

    if (result.success) {
      setSuccess(result.message);
      // Clear form on success
      setUserIdToBlock("");
      setReason("");
    } else {
      setError(result.message);
    }
    setIsLoading(false);
  };

  return (
    <div className="w-full max-w-lg p-6 bg-white dark:bg-neutral-900 rounded-xl shadow-lg border border-gray-200 dark:border-neutral-800">
      <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
        <UserX className="w-6 h-6 text-red-500" />
        Block a New User
      </h2>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* User ID Input */}
        <div>
          <label 
            htmlFor="userIdToBlock" 
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            User ID to Block
          </label>
          <input
            type="number"
            id="userIdToBlock"
            value={userIdToBlock}
            onChange={(e) => setUserIdToBlock(e.target.value)}
            placeholder="Enter the numeric User ID (e.g., 123)"
            required
            className="w-full px-4 py-2 border border-gray-300 dark:border-neutral-700 rounded-lg bg-gray-50 dark:bg-neutral-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        {/* Reason Textarea */}
        <div>
          <label 
            htmlFor="reason" 
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Reason
          </label>
          <textarea
            id="reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Enter a reason (min 10 characters)..."
            required
            minLength={10}
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 dark:border-neutral-700 rounded-lg bg-gray-50 dark:bg-neutral-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex items-center justify-center px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            "Confirm Block"
          )}
        </button>
      </form>

      {/* Success Message */}
      {success && (
        <div className="mt-5 p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 flex items-center gap-3">
          <ShieldCheck className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm font-medium">{success}</p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mt-5 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}
    </div>
  );
};
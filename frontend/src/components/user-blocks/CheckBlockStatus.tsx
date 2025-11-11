// src/components/CheckBlockStatus.tsx
"use client";

import React, { useState } from "react";
import { userBlockStatusController } from "@/controllers/user-blocks/userBlockStatusController";
import { useAccessToken } from "@/hooks/useAccessToken";
import type { UserBlockStatusData } from "@/lib/types/userBlockStatus";
import {
  Loader2,
  Search,
  AlertCircle,
  Info,
  ShieldCheck,
  ShieldAlert,
  Users,
} from "lucide-react";

/**
 * Skeleton loader for the CheckBlockStatus component.
 */
export const CheckBlockStatusSkeleton: React.FC = () => {
  return (
    <div className="w-full max-w-lg p-6 bg-white dark:bg-neutral-800 rounded-lg shadow-md border border-gray-200 dark:border-neutral-700 animate-pulse">
      <div className="h-7 w-1/3 bg-gray-300 dark:bg-neutral-700 rounded-md mb-6"></div>
      <div className="space-y-4">
        <div>
          <div className="h-4 w-1/4 bg-gray-300 dark:bg-neutral-700 rounded mb-2"></div>
          <div className="h-10 w-full bg-gray-200 dark:bg-neutral-700 rounded-lg"></div>
        </div>
        <div className="h-12 w-full bg-blue-300 dark:bg-blue-700 rounded-lg mt-2"></div>
      </div>
      <div className="mt-6 h-24 bg-gray-100 dark:bg-neutral-700 rounded-lg"></div>
    </div>
  );
};

/**
 * A component to check the block status of a target user.
 */
export const CheckBlockStatus: React.FC = () => {
  const [targetUserId, setTargetUserId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<UserBlockStatusData | null>(null);

  const accessToken = useAccessToken();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setResult(null);

    if (!accessToken) {
      setError("You are not authenticated. Please log in.");
      setIsLoading(false);
      return;
    }

    const userIdNum = parseInt(targetUserId, 10);
    if (isNaN(userIdNum) || userIdNum <= 0) {
      setError("User ID must be a valid positive number.");
      setIsLoading(false);
      return;
    }

    // Call the controller
    const response = await userBlockStatusController(
      { targetUserId: userIdNum },
      accessToken
    );

    if (response.success && response.data) {
      setResult(response.data);
    } else {
      setError(response.message);
    }
    setIsLoading(false);
  };

  /**
   * Helper component to render the result.
   */
  const ResultDisplay: React.FC<{ data: UserBlockStatusData }> = ({
    data,
  }) => {
    const { isBlocked, isBlockedBy } = data;

    if (!isBlocked && !isBlockedBy) {
      return (
        <div className="mt-6 p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 flex items-center gap-3">
          <ShieldCheck className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm font-medium">
            No block detected. You and this user can interact freely.
          </p>
        </div>
      );
    }

    return (
      <div className="mt-6 p-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 text-yellow-700 dark:text-yellow-300 flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <ShieldAlert className="w-5 h-5 flex-shrink-0" />
          <h3 className="text-sm font-semibold">Block Status Alert</h3>
        </div>
        <div className="pl-8 text-sm font-medium">
          {isBlocked && (
            <p>
              - You HAVE blocked this user. (Block ID: {data.blockId || "N/A"})
            </p>
          )}
          {isBlockedBy && <p>- This user HAS blocked you.</p>}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full max-w-lg p-6 bg-white dark:bg-neutral-900 rounded-xl shadow-lg border border-gray-200 dark:border-neutral-800">
      <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
        <Users className="w-6 h-6 text-blue-500" />
        Check Block Status
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* User ID Input */}
        <div>
          <label
            htmlFor="targetUserId"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Target User ID
          </label>
          <input
            type="number"
            id="targetUserId"
            value={targetUserId}
            onChange={(e) => setTargetUserId(e.target.value)}
            placeholder="Enter the User ID to check (e.g., 456)"
            required
            className="w-full px-4 py-2 border border-gray-300 dark:border-neutral-700 rounded-lg bg-gray-50 dark:bg-neutral-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex items-center justify-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <Search className="w-5 h-5 mr-2" />
              Check Status
            </>
          )}
        </button>
      </form>

      {/* Error Message */}
      {error && (
        <div className="mt-6 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {/* Success/Result Display */}
      {result && <ResultDisplay data={result} />}

      {/* Empty State */}
      {!isLoading && !error && !result && (
        <div className="mt-6 p-4 rounded-lg bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 text-gray-500 dark:text-gray-400 flex items-center gap-3">
          <Info className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm font-medium">
            Enter a User ID and click &quot;Check Status&quot; to see the results.
          </p>
        </div>
      )}
    </div>
  );
};
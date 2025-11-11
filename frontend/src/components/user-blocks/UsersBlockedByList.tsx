// src/components/user-blocks/UsersBlockedByList.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { getUsersBlockedByController } from "@/controllers/user-blocks/getUsersBlockedByController";
import { useAccessToken } from "@/hooks/useAccessToken";
import type { BlockedByUser, UsersBlockedByPage } from "@/lib/types/usersBlockedBy";
import { 
  ShieldOff, 
  AlertCircle, 
  UserX, 
  ChevronLeft, 
  ChevronRight,
  RefreshCw 
} from "lucide-react";

/**
 * Skeleton Card for loading state
 */
const UserBlockedByCardSkeleton: React.FC = () => (
  <div className="flex items-center justify-between p-4 bg-white dark:bg-neutral-800 rounded-lg shadow-sm border border-gray-200 dark:border-neutral-700 animate-pulse">
    <div className="flex items-center gap-4">
      <div className="w-12 h-12 rounded-full bg-gray-300 dark:bg-neutral-700"></div>
      <div className="space-y-2">
        <div className="h-4 w-32 rounded bg-gray-300 dark:bg-neutral-700"></div>
        <div className="h-3 w-40 rounded bg-gray-200 dark:bg-neutral-600"></div>
      </div>
    </div>
  </div>
);

/**
 * Main Component to display the list of users who blocked you.
 */
export const UsersBlockedByList: React.FC = () => {
  const [state, setState] = useState<{
    users: BlockedByUser[];
    pagination: Omit<UsersBlockedByPage, "blockedUsers"> | null;
    isLoading: boolean;
    error: string | null;
  }>({
    users: [],
    pagination: null,
    isLoading: true,
    error: null,
  });

  const accessToken = useAccessToken();

  const fetchPage = useCallback(async (page: number) => {
    if (!accessToken) {
      setState(s => ({ ...s, isLoading: false, error: "Not authenticated." }));
      return;
    }

    setState(s => ({ ...s, isLoading: true, error: null }));

    try {
      const result = await getUsersBlockedByController(
        { page, size: 5 }, // 5 items per page
        accessToken
      );

      if (result.success && result.data) {
        setState({
          users: result.data.blockedUsers,
          pagination: {
            currentPage: result.data.currentPage,
            totalPages: result.data.totalPages,
            totalElements: result.data.totalElements,
          },
          isLoading: false,
          error: null,
        });
      } else {
        throw new Error(result.message || "Failed to load blocked-by list.");
      }
    } catch (err) {
      setState(s => ({
        ...s,
        isLoading: false,
        error: err instanceof Error ? err.message : "An unknown error occurred.",
      }));
    }
  }, [accessToken]);

  // Initial fetch
  useEffect(() => {
    fetchPage(0);
  }, [fetchPage]);

  const { users, pagination, isLoading, error } = state;
  const page = pagination?.currentPage ?? 0;
  const totalPages = pagination?.totalPages ?? 0;

  return (
    <div className="w-full max-w-lg p-6 bg-white dark:bg-neutral-900 rounded-xl shadow-lg border border-gray-200 dark:border-neutral-800">
      <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
        <ShieldOff className="w-6 h-6 text-yellow-500" />
        Blocked By Others
      </h2>

      {/* Loading State */}
      {isLoading && users.length === 0 && (
        <div className="space-y-3">
          <UserBlockedByCardSkeleton />
          <UserBlockedByCardSkeleton />
          <UserBlockedByCardSkeleton />
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="text-center py-12 bg-red-50 dark:bg-red-900/20 rounded-lg border border-dashed border-red-300 dark:border-red-700">
          <AlertCircle className="w-10 h-10 mx-auto text-red-500 dark:text-red-400 mb-3" />
          <h3 className="font-semibold text-red-700 dark:text-red-300">
            Error loading list
          </h3>
          <p className="text-sm text-red-600 dark:text-red-400 mt-1 mb-4">
            {error}
          </p>
          <button
            onClick={() => fetchPage(0)}
            className="flex items-center gap-2 mx-auto px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg transition"
            aria-label="Retry fetching list"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </button>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && users.length === 0 && (
        <div className="text-center py-12 bg-gray-50 dark:bg-neutral-800 rounded-lg border border-dashed border-gray-300 dark:border-neutral-700">
          <UserX className="w-10 h-10 mx-auto text-gray-400 dark:text-neutral-500 mb-3" />
          <h3 className="font-semibold text-gray-700 dark:text-gray-300">
            No Users Found
          </h3>
          <p className="text-sm text-gray-500 dark:text-neutral-400 mt-1">
            No users are currently blocking your account.
          </p>
        </div>
      )}

      {/* Content List */}
      {!error && users.length > 0 && (
        <div className="space-y-3">
          {users.map(user => (
            <BlockedByUserCard 
              key={user.userId} 
              user={user} 
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination && totalPages > 1 && (
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200 dark:border-neutral-800">
          <button
            onClick={() => fetchPage(page - 1)}
            disabled={page === 0 || isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Go to previous page"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </button>
          <span className="text-sm text-gray-600 dark:text-neutral-400" aria-live="polite">
            Page {page + 1} of {totalPages}
          </span>
          <button
            onClick={() => fetchPage(page + 1)}
            disabled={page + 1 >= totalPages || isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Go to next page"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

/**
 * Single Card for a User Who Blocked You (Display Only)
 */
interface BlockedByUserCardProps {
  user: BlockedByUser;
}

const BlockedByUserCard: React.FC<BlockedByUserCardProps> = ({ user }) => {
  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-neutral-800 rounded-lg shadow-sm border border-gray-200 dark:border-neutral-700">
      <div className="flex items-center gap-4">
        <Image
          src={user.profilePictureUrl || "/default-avatar.png"}
          alt={user.username}
          width={48}
          height={48}
          className="w-12 h-12 rounded-full object-cover border-2 border-white dark:border-neutral-900"
        />
        <div>
          <h4 className="text-base font-semibold text-gray-900 dark:text-white">
            {user.username}
          </h4>
          <p className="text-xs text-gray-600 dark:text-neutral-400">
            {user.email}
          </p>
        </div>
      </div>
      <span className="text-xs font-medium text-gray-500 dark:text-gray-400 px-3 py-1 bg-gray-200 dark:bg-neutral-700 rounded-full">
        {user.accountStatus}
      </span>
    </div>
  );
};
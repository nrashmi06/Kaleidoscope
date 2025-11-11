// src/components/user-blocks/BlockedUsersList.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { getBlockedUsersController } from "@/controllers/user-blocks/getBlockedUsersController";
import { unblockUserController } from "@/controllers/user-blocks/unblockUserController";
import { useAccessToken } from "@/hooks/useAccessToken";
import type { BlockedUser, BlockedUsersPage } from "@/lib/types/blockedUsersList";
import { 
  ShieldAlert, 
  AlertCircle, 
  UserX, 
  ChevronLeft,  // ✅ 1. Re-add missing icon
  ChevronRight, // ✅ 2. Re-add missing icon
  RefreshCw,    // ✅ 3. Re-add missing icon
} from "lucide-react";
import { toast } from "react-hot-toast";
import DeleteConfirmationModal from "@/components/common/DeleteConfirmationModal";

/**
 * Skeleton Card for loading state
 */
const BlockedUserCardSkeleton: React.FC = () => (
  <div className="flex items-center justify-between p-4 bg-white dark:bg-neutral-800 rounded-lg shadow-sm border border-gray-200 dark:border-neutral-700 animate-pulse">
    <div className="flex items-center gap-4">
      <div className="w-12 h-12 rounded-full bg-gray-300 dark:bg-neutral-700"></div>
      <div className="space-y-2">
        <div className="h-4 w-32 rounded bg-gray-300 dark:bg-neutral-700"></div>
        <div className="h-3 w-40 rounded bg-gray-200 dark:bg-neutral-600"></div>
      </div>
    </div>
    <div className="h-9 w-24 rounded-lg bg-gray-300 dark:bg-neutral-700"></div>
  </div>
);

/**
 * Main Component to display the list of blocked users
 */
export const BlockedUsersList: React.FC = () => {
  const [state, setState] = useState<{
    users: BlockedUser[];
    pagination: Omit<BlockedUsersPage, "blockedUsers"> | null;
    isLoading: boolean;
    error: string | null;
  }>({
    users: [],
    pagination: null,
    isLoading: true,
    error: null,
  });

  const [userToUnblock, setUserToUnblock] = useState<BlockedUser | null>(null);
  const [isUnblocking, setIsUnblocking] = useState(false);

  const accessToken = useAccessToken();

  const fetchPage = useCallback(async (page: number) => {
    if (!accessToken) {
      setState(s => ({ ...s, isLoading: false, error: "Not authenticated." }));
      return;
    }

    setState(s => ({ ...s, isLoading: true, error: null }));

    try {
      const result = await getBlockedUsersController(
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
        throw new Error(result.message || "Failed to load blocked users.");
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

  // Handler to confirm and execute unblock
  const handleConfirmUnblock = async () => {
    if (!userToUnblock || !accessToken) return;

    setIsUnblocking(true);
    const toastId = toast.loading("Unblocking user...");

    const result = await unblockUserController(
      { userIdToUnblock: userToUnblock.userId }, 
      accessToken
    );

    if (result.success) {
      toast.success(result.message, { id: toastId });
      
      // Optimistic update: remove user from list
      setState(s => ({
        ...s,
        users: s.users.filter(u => u.userId !== userToUnblock.userId),
        pagination: s.pagination ? {
          ...s.pagination,
          totalElements: s.pagination.totalElements - 1,
        } : null,
      }));

      // If the page is now empty, refetch the (previous) page
      if (state.users.length === 1 && state.pagination && state.pagination.currentPage > 0) {
        fetchPage(state.pagination.currentPage - 1);
      }
    } else {
      toast.error(result.message, { id: toastId });
    }

    setIsUnblocking(false);
    setUserToUnblock(null); // Close modal
  };


  const { users, pagination, isLoading, error } = state;
  const page = pagination?.currentPage ?? 0; // ✅ 5. 'page' is now used below
  const totalPages = pagination?.totalPages ?? 0;

  return (
    <>
      <div className="w-full max-w-lg p-6 bg-white dark:bg-neutral-900 rounded-xl shadow-lg border border-gray-200 dark:border-neutral-800">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
          <UserX className="w-6 h-6 text-red-500" />
          Manage Blocked Users
        </h2>

        {/* Loading State */}
        {isLoading && users.length === 0 && (
          <div className="space-y-3">
            <BlockedUserCardSkeleton />
            <BlockedUserCardSkeleton />
            <BlockedUserCardSkeleton />
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-12 bg-red-50 dark:bg-red-900/20 rounded-lg border border-dashed border-red-300 dark:border-red-700">
            <AlertCircle className="w-10 h-10 mx-auto text-red-500 dark:text-red-400 mb-3" />
            <h3 className="font-semibold text-red-700 dark:text-red-300">
              Error loading users
            </h3>
            <p className="text-sm text-red-600 dark:text-red-400 mt-1 mb-4">
              {error}
            </p>
            <button
              onClick={() => fetchPage(0)}
              className="flex items-center gap-2 mx-auto px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg transition"
            >
              <RefreshCw className="w-4 h-4" />
              Retry
            </button>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && users.length === 0 && (
          <div className="text-center py-12 bg-gray-50 dark:bg-neutral-800 rounded-lg border border-dashed border-gray-300 dark:border-neutral-700">
            <ShieldAlert className="w-10 h-10 mx-auto text-gray-400 dark:text-neutral-500 mb-3" />
            <h3 className="font-semibold text-gray-700 dark:text-gray-300">
              No Blocked Users
            </h3>
            <p className="text-sm text-gray-500 dark:text-neutral-400 mt-1">
              Users you block will appear here.
            </p>
          </div>
        )}

        {/* Content List */}
        {!error && users.length > 0 && (
          <div className="space-y-3">
            {users.map(user => (
              <BlockedUserCard 
                key={user.userId} 
                user={user} 
                onUnblockClick={() => setUserToUnblock(user)}
              />
            ))}
          </div>
        )}

        {/* ✅ 6. Add pagination controls back */}
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

      {/* Render Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={!!userToUnblock}
        onCancel={() => setUserToUnblock(null)}
        onConfirm={handleConfirmUnblock}
        isDeleting={isUnblocking}
        title="Unblock User"
        message={`Are you sure you want to unblock @${userToUnblock?.username}? They will be able to see your posts and interact with you again.`}
      />
    </>
  );
};

/**
 * Single Card for a Blocked User (Modified)
 */
interface BlockedUserCardProps {
  user: BlockedUser;
  onUnblockClick: () => void;
}

const BlockedUserCard: React.FC<BlockedUserCardProps> = ({ user, onUnblockClick }) => {
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
       
      {/* Add Unblock Button */}
      <button
        onClick={onUnblockClick}
        className="flex items-center justify-center gap-2 px-4 h-9 bg-yellow-100 hover:bg-yellow-200 dark:bg-yellow-900/30 dark:hover:bg-yellow-900/50 text-yellow-800 dark:text-yellow-300 text-sm font-semibold rounded-lg transition"
        aria-label={`Unblock ${user.username}`}
      >
        Unblock
      </button>
    </div>
  );
};
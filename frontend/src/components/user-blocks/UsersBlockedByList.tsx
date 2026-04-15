// src/components/user-blocks/UsersBlockedByList.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { getUsersBlockedByController } from "@/controllers/user-blocks/getUsersBlockedByController";
import { useAccessToken } from "@/hooks/useAccessToken";
import type {
  BlockedByUser,
  UsersBlockedByPage,
} from "@/lib/types/usersBlockedBy";
import {
  ShieldOff,
  AlertCircle,
  UserX,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from "lucide-react";

const UserBlockedByCardSkeleton: React.FC = () => (
  <div className="flex items-center justify-between p-4 rounded-xl bg-cream-50/50 dark:bg-navy-700/20 border border-border-subtle animate-pulse">
    <div className="flex items-center gap-3">
      <div className="w-11 h-11 rounded-full bg-cream-300/60 dark:bg-navy-600/60" />
      <div className="space-y-2">
        <div className="h-4 w-28 rounded bg-cream-300/50 dark:bg-navy-600/50" />
        <div className="h-3 w-36 rounded bg-cream-300/40 dark:bg-navy-600/40" />
      </div>
    </div>
    <div className="h-6 w-16 rounded-full bg-cream-300/50 dark:bg-navy-600/50" />
  </div>
);

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

  const fetchPage = useCallback(
    async (page: number) => {
      if (!accessToken) {
        setState((s) => ({
          ...s,
          isLoading: false,
          error: "Not authenticated.",
        }));
        return;
      }

      setState((s) => ({ ...s, isLoading: true, error: null }));

      try {
        const result = await getUsersBlockedByController(
          { page, size: 5 },
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
          throw new Error(
            result.message || "Failed to load blocked-by list."
          );
        }
      } catch (err) {
        setState((s) => ({
          ...s,
          isLoading: false,
          error:
            err instanceof Error ? err.message : "An unknown error occurred.",
        }));
      }
    },
    [accessToken]
  );

  useEffect(() => {
    fetchPage(0);
  }, [fetchPage]);

  const { users, pagination, isLoading, error } = state;
  const page = pagination?.currentPage ?? 0;
  const totalPages = pagination?.totalPages ?? 0;

  return (
    <div className="w-full max-w-xl mx-auto">
      <div className="p-6 rounded-2xl bg-surface border border-border-default">
        <h2 className="text-lg font-bold text-heading flex items-center gap-2 mb-5">
          <ShieldOff className="w-5 h-5 text-steel dark:text-sky" />
          Blocked By Others
          {pagination && (
            <span className="px-2.5 py-0.5 text-[11px] font-semibold rounded-full bg-steel/10 dark:bg-sky/10 text-steel dark:text-sky">
              {pagination.totalElements}
            </span>
          )}
        </h2>

        {/* Loading */}
        {isLoading && users.length === 0 && (
          <div className="space-y-3">
            <UserBlockedByCardSkeleton />
            <UserBlockedByCardSkeleton />
            <UserBlockedByCardSkeleton />
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex flex-col items-center justify-center text-center py-12 rounded-xl border border-dashed border-red-200/50 dark:border-red-900/30 bg-red-50/30 dark:bg-red-900/10">
            <AlertCircle className="w-8 h-8 text-red-500 dark:text-red-400 mb-3" />
            <h3 className="text-sm font-semibold text-heading mb-1">
              Error loading list
            </h3>
            <p className="text-xs text-steel/60 dark:text-sky/40 mb-4">
              {error}
            </p>
            <button
              onClick={() => fetchPage(0)}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl text-cream-50 bg-steel dark:bg-sky dark:text-navy transition-all cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Retry
            </button>
          </div>
        )}

        {/* Empty */}
        {!isLoading && !error && users.length === 0 && (
          <div className="flex flex-col items-center justify-center text-center py-12 rounded-xl border border-dashed border-cream-300 dark:border-navy-700 bg-cream-50/50 dark:bg-navy/50">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-cream-300/50 dark:bg-navy-700/50 border border-cream-400/40 dark:border-navy-600/40 mb-4">
              <UserX className="w-6 h-6 text-steel/50 dark:text-sky/40" />
            </div>
            <h3 className="text-sm font-semibold text-heading mb-1">
              No Users Found
            </h3>
            <p className="text-xs text-steel/60 dark:text-sky/40">
              No users are currently blocking your account.
            </p>
          </div>
        )}

        {/* List */}
        {!error && users.length > 0 && (
          <div className="space-y-2.5">
            {users.map((user) => (
              <div
                key={user.userId}
                className="flex items-center justify-between p-3 rounded-xl bg-cream-100/40 dark:bg-navy-700/20 border border-border-subtle"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Image
                    src={user.profilePictureUrl || "/default-avatar.png"}
                    alt={user.username}
                    width={44}
                    height={44}
                    className="w-11 h-11 rounded-full object-cover border-2 border-cream dark:border-navy-900 shrink-0"
                  />
                  <div className="min-w-0">
                    <h4 className="text-sm font-semibold text-heading truncate">
                      {user.username}
                    </h4>
                    <p className="text-[11px] text-steel/50 dark:text-sky/40 truncate">
                      {user.email}
                    </p>
                  </div>
                </div>
                <span className="shrink-0 px-2.5 py-1 text-[10px] font-semibold rounded-full bg-cream-300/40 dark:bg-navy-600/40 text-steel/60 dark:text-sky/40 border border-border-subtle">
                  {user.accountStatus}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination && totalPages > 1 && (
          <div className="flex items-center justify-between mt-5 pt-4 border-t border-border-subtle">
            <button
              onClick={() => fetchPage(page - 1)}
              disabled={page === 0 || isLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-steel dark:text-sky bg-cream-100/60 dark:bg-navy-700/40 border border-border-default hover:bg-cream-200/60 dark:hover:bg-navy-700/60 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              Previous
            </button>
            <span className="text-xs text-steel/50 dark:text-sky/30">
              Page {page + 1} of {totalPages}
            </span>
            <button
              onClick={() => fetchPage(page + 1)}
              disabled={page + 1 >= totalPages || isLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-steel dark:text-sky bg-cream-100/60 dark:bg-navy-700/40 border border-border-default hover:bg-cream-200/60 dark:hover:bg-navy-700/60 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
            >
              Next
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

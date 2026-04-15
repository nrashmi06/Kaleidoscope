// src/components/friends/FollowersList.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { fetchFollowersController } from "@/controllers/followController/fetchFollowersController";
import { useAccessToken } from "@/hooks/useAccessToken";
import { useUserData } from "@/hooks/useUserData";
import type { FollowerUser } from "@/lib/types/followers";
import type { SuggestedUser } from "@/lib/types/followSuggestions";
import FollowerItem from "./FollowerItem";
import { Loader2, Users, AlertCircle } from "lucide-react";

interface FollowersListProps {
  targetUserId?: number;
  initialPageSize?: number;
  onUserFollowed: (user: SuggestedUser) => void;
  initialFollowers: FollowerUser[];
  initialLoading: boolean;
  initialTotalElements: number;
}

export default function FollowersList({
  targetUserId,
  initialPageSize = 10,
  onUserFollowed,
  initialFollowers,
  initialLoading,
  initialTotalElements,
}: FollowersListProps) {
  const token = useAccessToken();
  const currentAuthUser = useUserData();

  const userId =
    targetUserId ??
    (currentAuthUser.userId ? Number(currentAuthUser.userId) : undefined);

  const [followers, setFollowers] = useState<FollowerUser[]>(initialFollowers);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [pagination, setPagination] = useState({
    currentPage: 0,
    totalPages: Math.ceil(initialTotalElements / initialPageSize) || 1,
    totalElements: initialTotalElements,
  });

  const hasMore = pagination.currentPage + 1 < pagination.totalPages;

  useEffect(() => {
    setFollowers(initialFollowers);
    setPagination((prev) => ({
      ...prev,
      totalPages: Math.ceil(initialTotalElements / initialPageSize) || 1,
      totalElements: initialTotalElements,
    }));
  }, [initialFollowers, initialTotalElements, initialPageSize]);

  const fetchFollowers = useCallback(
    async (pageToFetch: number) => {
      if (!token || userId === undefined) {
        setError("User not authenticated or ID missing.");
        return;
      }

      setIsFetchingMore(true);
      setError(null);

      try {
        const res = await fetchFollowersController(token, {
          userId: userId,
          page: pageToFetch,
          size: initialPageSize,
        });

        if (res.success && res.data) {
          const data = res.data;

          setFollowers((prev) => [...prev, ...data.users]);
          setPagination((prev) => ({
            ...prev,
            currentPage: data.currentPage,
            totalPages: data.totalPages,
            totalElements: data.totalElements,
          }));
        } else {
          setError(res.message || res.error || "Failed to load followers.");
        }
      } catch (err) {
        setError("An unexpected error occurred while fetching followers.");
        console.error(err);
      } finally {
        setIsFetchingMore(false);
      }
    },
    [token, userId, initialPageSize]
  );

  const handleFollowerRemoved = useCallback((removedUserId: number) => {
    setFollowers((prev) => prev.filter((user) => user.userId !== removedUserId));
    setPagination((prev) => ({
      ...prev,
      totalElements: prev.totalElements - 1,
    }));
  }, []);

  const handleLoadMore = () => {
    if (hasMore && !isFetchingMore) {
      fetchFollowers(pagination.currentPage + 1);
    }
  };

  if (initialLoading && followers.length === 0) {
    return (
      <div className="space-y-2.5">
        {Array.from({ length: initialPageSize / 2 }).map((_, index) => (
          <div
            key={index}
            className="flex items-center justify-between p-3 rounded-xl bg-cream-100/50 dark:bg-navy-700/30 border border-border-subtle animate-pulse"
          >
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-cream-300 dark:bg-navy-700" />
              <div className="space-y-1.5">
                <div className="w-28 h-3.5 bg-cream-300 dark:bg-navy-700 rounded-full" />
                <div className="w-36 h-2.5 bg-cream-300/70 dark:bg-navy-700/70 rounded-full" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-red-600 dark:text-red-400 bg-red-50/50 dark:bg-red-950/10 rounded-xl border border-red-200/60 dark:border-red-900/30 flex items-center gap-2 text-sm">
        <AlertCircle className="w-4 h-4 flex-shrink-0" />
        <span>{error}</span>
      </div>
    );
  }

  if (followers.length === 0) {
    return (
      <div className="text-center py-10 space-y-2">
        <div className="inline-flex items-center justify-center w-11 h-11 rounded-full bg-cream-300/50 dark:bg-navy-700/50 border border-cream-400/40 dark:border-navy-600/40 mb-1">
          <Users className="w-5 h-5 text-steel dark:text-sky/60" />
        </div>
        <h3 className="text-sm font-semibold text-heading">
          No Followers Yet
        </h3>
        <p className="text-xs text-steel dark:text-sky/60">
          Time to share your posts and grow your audience!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      {followers.map((user) => (
        <FollowerItem
          key={user.userId}
          user={user}
          onItemRemoved={handleFollowerRemoved}
          onUserFollowed={onUserFollowed}
        />
      ))}

      {hasMore && (
        <div className="text-center pt-3">
          <button
            onClick={handleLoadMore}
            disabled={isFetchingMore}
            className="inline-flex items-center justify-center gap-2 px-5 py-2 text-sm font-medium rounded-full bg-steel/10 dark:bg-sky/10 text-steel dark:text-sky border border-steel/20 dark:border-sky/20 hover:bg-steel/20 dark:hover:bg-sky/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isFetchingMore ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading...
              </>
            ) : (
              "Load More"
            )}
          </button>
        </div>
      )}
    </div>
  );
}

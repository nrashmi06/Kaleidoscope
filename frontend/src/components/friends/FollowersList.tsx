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
    initialLoading, // Used directly in render
    initialTotalElements,
}: FollowersListProps) {
  const token = useAccessToken();
  const currentAuthUser = useUserData();
  
  const userId = targetUserId ?? (currentAuthUser.userId ? Number(currentAuthUser.userId) : undefined); 
  
  // Initialize state from props
  const [followers, setFollowers] = useState<FollowerUser[]>(initialFollowers);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [pagination, setPagination] = useState({
      currentPage: 0,
      totalPages: Math.ceil(initialTotalElements / initialPageSize) || 1,
      totalElements: initialTotalElements,
  });
  
  const hasMore = pagination.currentPage + 1 < pagination.totalPages;

  // Sync local state with props on update/tab switch (CRITICAL FIX)
  useEffect(() => {
    setFollowers(initialFollowers);
    setPagination(prev => ({ 
        ...prev, 
        totalPages: Math.ceil(initialTotalElements / initialPageSize) || 1,
        totalElements: initialTotalElements
    }));
  }, [initialFollowers, initialTotalElements, initialPageSize]);


  // --- Core Fetch Function (Only used for PAGINATION) ---
  const fetchFollowers = useCallback(async (pageToFetch: number) => {
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
            size: initialPageSize 
        });

        if (res.success && res.data) {
            const data = res.data;
            
            setFollowers(prev => [...prev, ...data.users]);
            setPagination(prev => ({
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
  }, [token, userId, initialPageSize]);

  
  // Handler to remove a follower from the list upon successful unfollow
  const handleFollowerRemoved = useCallback((removedUserId: number) => {
    setFollowers(prev => prev.filter(user => user.userId !== removedUserId));
    setPagination(prev => ({ 
        ...prev, 
        totalElements: prev.totalElements - 1 
    }));
  }, []);

  const handleLoadMore = () => {
    if (hasMore && !isFetchingMore) {
        fetchFollowers(pagination.currentPage + 1);
    }
  };


  // RENDER LOGIC: Use initialLoading prop directly.
  if (initialLoading && followers.length === 0) {
    return (
        <div className="space-y-3">
            {/* Skeleton loader (aligned with new item size) */}
            {Array.from({ length: initialPageSize / 2 }).map((_, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-neutral-800 rounded-xl shadow-sm animate-pulse">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-full bg-gray-300 dark:bg-neutral-700" />
                    <div className="space-y-1">
                      <div className="w-28 h-4 bg-gray-300 dark:bg-neutral-700 rounded" />
                      <div className="w-40 h-3 bg-gray-200 dark:bg-neutral-700 rounded" />
                    </div>
                  </div>
                </div>
            ))}
        </div>
    );
  }

  if (error) {
    return (
        <div className="p-4 text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-700 flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
        </div>
    );
  }

  if (followers.length === 0) {
    return (
        <div className="text-center py-10 text-gray-500 dark:text-gray-400 space-y-2">
             <Users className="w-8 h-8 mx-auto" />
             <h3 className="text-lg font-semibold">No Followers Yet</h3>
             <p className="text-sm">Time to share your posts and grow your audience!</p>
        </div>
    );
  }

  return (
    <div className="space-y-4">
      {followers.map((user) => (
        <FollowerItem 
            key={user.userId} 
            user={user} 
            onItemRemoved={handleFollowerRemoved} 
            onUserFollowed={onUserFollowed} 
        />
      ))}
      
      {hasMore && (
        <div className="text-center pt-2">
          <button
            onClick={handleLoadMore}
            disabled={isFetchingMore}
            className="flex items-center justify-center gap-2 px-5 py-2 text-sm font-medium rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-800/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mx-auto"
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
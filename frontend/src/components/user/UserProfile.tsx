// src/components/user/UserProfile.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { getUserProfileController } from "@/controllers/userController/getUserProfileController";
import { type MappedUserProfile } from "@/lib/types/userProfile";
import { useAccessToken } from "@/hooks/useAccessToken";
import { useUserData } from "@/hooks/useUserData";
import { RefreshCw, X } from "lucide-react";
import { userBlockStatusController } from "@/controllers/user-blocks/userBlockStatusController";
import type { UserBlockStatusData } from "@/lib/types/userBlockStatus";
import PostLoader from "@/components/loading/PostLoader";

// ✅ 1. Import the new child components
import { UserProfileHeader } from "./UserProfileHeader";
import { UserProfileStats } from "./UserProfileStats";
import { UserProfilePosts } from "./UserProfilePosts";

interface UserProfileProps {
  userId: number;
}

/**
 * Renders a full user profile page using a clean, minimalist layout.
 * This component now fetches data and delegates rendering to child components.
 */
export function UserProfile({ userId }: UserProfileProps) {
  const [profile, setProfile] = useState<MappedUserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [blockStatus, setBlockStatus] = useState<UserBlockStatusData | null>(
    null
  );

  const accessToken = useAccessToken();
  const currentUser = useUserData();
  const isOwner = currentUser?.userId === userId;

  const fetchProfile = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    setBlockStatus(null);

    try {
      // Fetch main profile
      const result = await getUserProfileController(userId, accessToken);

      if (result.success && result.data) {
        setProfile(result.data);

        // After setting profile, check if we need to fetch block status
        const isProfileOwner = currentUser?.userId === result.data.userId;

        if (!isProfileOwner && accessToken) {
          const statusResult = await userBlockStatusController(
            { targetUserId: result.data.userId },
            accessToken
          );

          if (statusResult.success && statusResult.data) {
            setBlockStatus(statusResult.data);
          } else {
            console.error("Failed to fetch block status:", statusResult.message);
          }
        }
      } else {
        setError(result.message || "Failed to load profile.");
      }
    } catch (err) {
      setError("An unexpected network error occurred.");
      console.error("Error fetching user profile:", err);
    } finally {
      setLoading(false);
    }
  }, [userId, accessToken, currentUser?.userId]);

  useEffect(() => {
    if (userId > 0) {
      fetchProfile();
    }
  }, [userId, fetchProfile]);

  const handlePostDeleted = useCallback(() => {
    fetchProfile();
  }, [fetchProfile]);

  // --- Loading State (Minimalist Skeleton) ---
  if (loading) {
    return (
      <div className="w-full max-w-4xl mx-auto rounded-xl shadow-lg border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-0 overflow-hidden animate-pulse">
        <div className="h-48 bg-gray-200 dark:bg-neutral-800 w-full"></div>
        <div className="px-8 pb-6">
          <div className="w-32 h-32 -mt-16 rounded-full bg-gray-300 dark:bg-neutral-700 border-4 border-white dark:border-neutral-900 shadow-md"></div>
          <div className="pt-4 space-y-3">
            <div className="h-8 w-4/5 bg-gray-300 dark:bg-neutral-700 rounded-md"></div>
            <div className="h-5 w-3/5 bg-gray-200 dark:bg-neutral-700 rounded-md"></div>
            <div className="h-4 w-4/5 bg-gray-200 dark:bg-neutral-700 rounded-md"></div>
            <div className="flex space-x-3 pt-4">
              <div className="h-9 w-24 bg-blue-500 rounded-full"></div>
              <div className="h-9 w-24 bg-gray-200 dark:bg-neutral-700 rounded-full"></div>
            </div>
          </div>
        </div>
        <div className="px-6 pt-6 border-t border-gray-100 dark:border-neutral-800 space-y-4">
          <div className="h-6 w-32 bg-gray-200 dark:bg-neutral-700 rounded"></div>
          <PostLoader />
        </div>
      </div>
    );
  }

  // --- Error State ---
  if (error) {
    return (
      <div className="w-full max-w-2xl mx-auto p-8 text-center bg-white dark:bg-neutral-900 rounded-xl shadow-2xl border border-red-200 dark:border-red-900/50">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
          <X className="w-8 h-8 text-red-500 dark:text-red-400" />
        </div>
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Profile Error
        </h3>
        <p className="text-gray-600 dark:text-neutral-400 mb-6">{error}</p>
        <button
          onClick={fetchProfile}
          className="px-6 py-3 bg-blue-600 text-white rounded-full flex items-center gap-2 mx-auto hover:bg-blue-700 transition-all duration-300 shadow-md font-semibold"
        >
          <RefreshCw className="w-5 h-5" /> Try Again
        </button>
      </div>
    );
  }

  if (!profile) return null;

  // ❌ 2. The 'mappedPosts' variable is GONE.
  // The logic is now inside UserProfilePosts.tsx

  const isPostsPrivate =
    profile.isPrivate &&
    profile.followStatus !== "FOLLOWING" &&
    !isOwner &&
    profile.followStatus !== "PENDING";

  return (
    <div className="w-full max-w-4xl mx-auto bg-white dark:bg-neutral-900 rounded-xl shadow-2xl border border-gray-200 dark:border-neutral-800 overflow-hidden">
      {/* --- 3. Render the new child components --- */}
      
      {/* Header: Cover, Avatar, Name, Actions */}
      <UserProfileHeader
        profile={profile}
        isOwner={isOwner}
        blockStatus={blockStatus}
      />

      {/* Stats: Followers, Following, Status */}
      <UserProfileStats
        followerCount={profile.followerCount}
        followingCount={profile.followingCount}
        followStatus={profile.followStatus}
        isPrivate={profile.isPrivate}
      />

      {/* Posts: Grid, Private Lock, No Posts */}
      <UserProfilePosts
        posts={profile.posts}
        isPostsPrivate={isPostsPrivate}
        followStatus={profile.followStatus}
        accessToken={accessToken!}
        onPostDeleted={handlePostDeleted}
        username={profile.username}
      />
    </div>
  );
}
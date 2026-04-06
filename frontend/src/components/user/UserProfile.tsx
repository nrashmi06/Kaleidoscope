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

import { UserProfileHeader } from "./UserProfileHeader";
import { UserProfileStats } from "./UserProfileStats";
import { UserProfilePosts } from "./UserProfilePosts";
import { UserProfileArticles } from "./UserProfileArticles";

interface UserProfileProps {
  userId: number;
}

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
      const result = await getUserProfileController(userId, accessToken);

      if (result.success && result.data) {
        setProfile(result.data);

        const isProfileOwner = currentUser?.userId === result.data.userId;

        if (!isProfileOwner && accessToken) {
          const statusResult = await userBlockStatusController(
            { targetUserId: result.data.userId },
            accessToken
          );

          if (statusResult.success && statusResult.data) {
            setBlockStatus(statusResult.data);
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

  // --- Loading ---
  if (loading) {
    return (
      <div className="w-full overflow-hidden animate-pulse">
        <div className="h-52 bg-cream-300/40 dark:bg-navy-700/40 w-full rounded-2xl" />
        <div className="px-6 sm:px-8 pb-6 -mt-2">
          <div className="w-28 h-28 -mt-14 rounded-full bg-cream-300/60 dark:bg-navy-600/60 border-4 border-cream dark:border-navy-900 shadow-md" />
          <div className="pt-4 space-y-3">
            <div className="h-7 w-2/5 bg-cream-300/50 dark:bg-navy-600/50 rounded-md" />
            <div className="h-4 w-3/5 bg-cream-300/40 dark:bg-navy-600/40 rounded-md" />
            <div className="h-3 w-4/5 bg-cream-300/30 dark:bg-navy-600/30 rounded-md" />
            <div className="flex gap-3 pt-3">
              <div className="h-9 w-24 bg-steel/20 dark:bg-sky/10 rounded-full" />
              <div className="h-9 w-24 bg-cream-300/40 dark:bg-navy-600/40 rounded-full" />
            </div>
          </div>
        </div>
        <div className="h-px bg-gradient-to-r from-transparent via-cream-400/30 dark:via-navy-700/40 to-transparent mx-6" />
        <div className="px-6 pt-6 space-y-4">
          <div className="h-6 w-32 bg-cream-300/40 dark:bg-navy-600/40 rounded" />
          <PostLoader />
        </div>
      </div>
    );
  }

  // --- Error ---
  if (error) {
    return (
      <div className="w-full max-w-2xl mx-auto p-8 text-center bg-cream-50 dark:bg-navy-700/50 rounded-2xl border border-red-200/60 dark:border-red-900/30">
        <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
          <X className="w-7 h-7 text-red-500" />
        </div>
        <h3 className="text-xl font-bold text-navy dark:text-cream mb-2">
          Profile Error
        </h3>
        <p className="text-sm text-steel dark:text-sky/60 mb-6">{error}</p>
        <button
          onClick={fetchProfile}
          className="px-6 py-2.5 bg-steel text-cream-50 dark:bg-sky dark:text-navy rounded-xl flex items-center gap-2 mx-auto transition-all font-semibold cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" /> Try Again
        </button>
      </div>
    );
  }

  if (!profile) return null;

  const isPostsPrivate =
    profile.isPrivate &&
    profile.followStatus !== "FOLLOWING" &&
    !isOwner &&
    profile.followStatus !== "PENDING";

  return (
    <div className="w-full overflow-hidden">
      <UserProfileHeader
        profile={profile}
        isOwner={isOwner}
        blockStatus={blockStatus}
      />

      <UserProfileStats
        followerCount={profile.followerCount}
        followingCount={profile.followingCount}
        followStatus={profile.followStatus}
        isPrivate={profile.isPrivate}
      />

      <UserProfilePosts
        posts={profile.posts}
        isPostsPrivate={isPostsPrivate}
        followStatus={profile.followStatus}
        accessToken={accessToken!}
        onPostDeleted={handlePostDeleted}
        username={profile.username}
      />

      {!isPostsPrivate && accessToken && (
        <UserProfileArticles
          userId={userId}
          accessToken={accessToken}
          isOwner={isOwner}
          isPrivate={profile.isPrivate}
          username={profile.username}
        />
      )}
    </div>
  );
}

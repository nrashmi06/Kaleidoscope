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

  // --- Loading skeleton (Pinterest-style centered) ---
  if (loading) {
    return (
      <div className="w-full overflow-hidden animate-pulse">
        <div className="h-56 bg-cream-300/30 dark:bg-navy-700/30 w-full" />
        <div className="max-w-3xl mx-auto px-6 sm:px-8 -mt-16 flex flex-col items-center">
          <div className="w-32 h-32 rounded-full bg-cream-300/50 dark:bg-navy-600/50 border-4 border-cream-50 dark:border-navy-900 shadow-lg" />
          <div className="pt-4 space-y-3 w-full flex flex-col items-center">
            <div className="h-7 w-48 bg-cream-300/40 dark:bg-navy-600/40 rounded-md" />
            <div className="h-4 w-32 bg-cream-300/30 dark:bg-navy-600/30 rounded-md" />
            <div className="h-3 w-64 bg-cream-300/20 dark:bg-navy-600/20 rounded-md" />
            <div className="flex gap-3 pt-3">
              <div className="h-10 w-28 bg-cream-300/40 dark:bg-navy-600/40 rounded-full" />
            </div>
          </div>
        </div>
        <div className="max-w-5xl mx-auto px-6 pt-8">
          <div className="h-px bg-gradient-to-r from-transparent via-cream-400/30 dark:via-navy-700/40 to-transparent mb-6" />
          <div className="h-6 w-32 bg-cream-300/30 dark:bg-navy-600/30 rounded mb-4" />
          <PostLoader />
        </div>
      </div>
    );
  }

  // --- Error ---
  if (error) {
    return (
      <div className="w-full max-w-2xl mx-auto p-8 text-center rounded-2xl bg-cream-50/50 dark:bg-navy-700/20 border border-cream-300/40 dark:border-navy-700/40">
        <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-red-100/60 dark:bg-red-900/20 flex items-center justify-center">
          <X className="w-7 h-7 text-red-500" />
        </div>
        <h3 className="text-xl font-display font-bold text-navy dark:text-cream mb-2">
          Profile Error
        </h3>
        <p className="text-sm text-navy/50 dark:text-cream/40 mb-6">{error}</p>
        <button
          onClick={fetchProfile}
          className="h-10 px-6 text-sm font-semibold rounded-full text-cream-50 dark:text-navy bg-navy dark:bg-cream hover:bg-navy/90 dark:hover:bg-cream/90 inline-flex items-center gap-2 transition-all cursor-pointer"
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

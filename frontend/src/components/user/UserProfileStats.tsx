// src/components/user/UserProfileStats.tsx
"use client";

import { Users, UserPlus, Lock } from "lucide-react";
import { type FollowStatus } from "@/lib/types/userProfile";

// Follow Status Pill Sub-component
const FollowStatusPill: React.FC<{ status: FollowStatus; isPrivate: boolean }> = ({
  status,
  isPrivate,
}) => {
  if (isPrivate && status === "NOT_FOLLOWING") {
    return (
      <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400 flex items-center gap-1">
        <Lock className="w-3 h-3" /> Private
      </span>
    );
  }
  switch (status) {
    case "FOLLOWING":
      return (
        <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400">
          Following
        </span>
      );
    case "PENDING":
      return (
        <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400">
          Requested
        </span>
      );
    default:
      return null;
  }
};

interface UserProfileStatsProps {
  followerCount: number;
  followingCount: number;
  followStatus: FollowStatus;
  isPrivate: boolean;
}

export function UserProfileStats({
  followerCount,
  followingCount,
  followStatus,
  isPrivate,
}: UserProfileStatsProps) {
  return (
    <div className="px-8 pb-6">
      <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-neutral-400">
        <div className="flex items-center gap-1.5">
          <Users className="w-4 h-4 text-blue-500" />
          <span className="font-semibold text-gray-900 dark:text-white">
            {followerCount}
          </span>
          <span>Followers</span>
        </div>
        <span className="text-gray-300 dark:text-neutral-700">•</span>
        <div className="flex items-center gap-1.5">
          <UserPlus className="w-4 h-4 text-cyan-500" />
          <span className="font-semibold text-gray-900 dark:text-white">
            {followingCount}
          </span>
          <span>Following</span>
        </div>
        <span className="text-gray-300 dark:text-neutral-700">•</span>
        <FollowStatusPill status={followStatus} isPrivate={isPrivate} />
      </div>
    </div>
  );
}
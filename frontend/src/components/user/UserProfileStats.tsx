// src/components/user/UserProfileStats.tsx
"use client";

import { Users, UserPlus, Lock } from "lucide-react";
import { type FollowStatus } from "@/lib/types/userProfile";

const FollowStatusPill: React.FC<{
  status: FollowStatus;
  isPrivate: boolean;
}> = ({ status, isPrivate }) => {
  if (isPrivate && status === "NOT_FOLLOWING") {
    return (
      <span className="px-2.5 py-0.5 text-[11px] font-semibold rounded-full bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400 flex items-center gap-1">
        <Lock className="w-3 h-3" /> Private
      </span>
    );
  }
  switch (status) {
    case "FOLLOWING":
      return (
        <span className="px-2.5 py-0.5 text-[11px] font-semibold rounded-full bg-steel/10 text-steel dark:bg-sky/10 dark:text-sky">
          Following
        </span>
      );
    case "PENDING":
      return (
        <span className="px-2.5 py-0.5 text-[11px] font-semibold rounded-full bg-sky/10 text-sky dark:bg-sky/15 dark:text-sky">
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
    <div className="px-6 sm:px-8 pb-6">
      <div className="flex items-center gap-4 text-sm text-steel/70 dark:text-sky/50">
        <div className="flex items-center gap-1.5">
          <Users className="w-4 h-4 text-steel dark:text-sky" />
          <span className="font-semibold text-navy dark:text-cream">
            {followerCount}
          </span>
          <span>Followers</span>
        </div>
        <span className="text-cream-400 dark:text-navy-600">•</span>
        <div className="flex items-center gap-1.5">
          <UserPlus className="w-4 h-4 text-sky" />
          <span className="font-semibold text-navy dark:text-cream">
            {followingCount}
          </span>
          <span>Following</span>
        </div>
        <span className="text-cream-400 dark:text-navy-600">•</span>
        <FollowStatusPill status={followStatus} isPrivate={isPrivate} />
      </div>

      {/* Gradient divider */}
      <div className="mt-5 h-px bg-gradient-to-r from-transparent via-cream-400/30 dark:via-navy-700/40 to-transparent" />
    </div>
  );
}

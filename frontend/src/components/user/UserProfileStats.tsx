// src/components/user/UserProfileStats.tsx
"use client";

import { Lock } from "lucide-react";
import { type FollowStatus } from "@/lib/types/userProfile";

const FollowStatusPill: React.FC<{
  status: FollowStatus;
  isPrivate: boolean;
}> = ({ status, isPrivate }) => {
  if (isPrivate && status === "NOT_FOLLOWING") {
    return (
      <span className="px-3 py-1 text-[11px] font-bold rounded-full bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400 flex items-center gap-1 uppercase tracking-wide">
        <Lock className="w-3 h-3" /> Private
      </span>
    );
  }
  switch (status) {
    case "FOLLOWING":
      return (
        <span className="px-3 py-1 text-[11px] font-bold rounded-full bg-navy/8 text-navy dark:bg-cream/8 dark:text-cream uppercase tracking-wide">
          Following
        </span>
      );
    case "PENDING":
      return (
        <span className="px-3 py-1 text-[11px] font-bold rounded-full bg-sky/10 text-sky dark:bg-sky/15 dark:text-sky uppercase tracking-wide">
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
    <div className="max-w-3xl mx-auto px-6 sm:px-8 pt-5 pb-6">
      {/* Pinterest-style centered stat row */}
      <div className="flex items-center justify-center gap-5 text-sm">
        <div className="flex items-center gap-1.5">
          <span className="font-bold text-navy dark:text-cream">
            {followerCount}
          </span>
          <span className="text-navy/50 dark:text-cream/40">followers</span>
        </div>
        <span className="w-1 h-1 rounded-full bg-cream-400 dark:bg-navy-600" />
        <div className="flex items-center gap-1.5">
          <span className="font-bold text-navy dark:text-cream">
            {followingCount}
          </span>
          <span className="text-navy/50 dark:text-cream/40">following</span>
        </div>
        <FollowStatusPill status={followStatus} isPrivate={isPrivate} />
      </div>

      {/* Divider */}
      <div className="mt-6 h-px bg-gradient-to-r from-transparent via-cream-400/30 dark:via-navy-700/40 to-transparent" />
    </div>
  );
}

// src/components/friends/FriendsTabContainer.tsx
"use client";

import React, { useState } from "react";
import FollowingList from "./FollowingList";
import FollowersList from "./FollowersList";
import type { SuggestedUser } from "@/lib/types/followSuggestions";
import type { FollowerUser } from "@/lib/types/followers";
import { cn } from "@/lib/utils";
import { Users, UserPlus } from "lucide-react";

interface FriendsTabContainerProps {
  followingUsers: SuggestedUser[];
  followingLoading: boolean;
  currentUserId: number | null;
  onNewFollowingUser: (user: SuggestedUser) => void;
  initialFollowers: FollowerUser[];
  initialLoading: boolean;
  initialTotalElements: number;
}

type Tab = "FOLLOWING" | "FOLLOWERS";

const TabButton: React.FC<{
  active: boolean;
  label: string;
  count: number;
  icon: React.ReactNode;
  onClick: () => void;
}> = ({ active, label, count, icon, onClick }) => (
  <button
    onClick={onClick}
    className={cn(
      "flex-1 flex items-center justify-center gap-2 p-3 text-sm font-semibold rounded-xl transition-all duration-200 cursor-pointer",
      active
        ? "bg-steel text-cream-50 shadow-md shadow-steel/25 dark:bg-sky dark:text-navy dark:shadow-sky/20"
        : "bg-cream-100/50 dark:bg-navy-700/50 text-steel dark:text-sky/70 hover:bg-cream-300/50 dark:hover:bg-navy-700"
    )}
  >
    {icon}
    <span>{label}</span>
    {count > 0 && (
      <span
        className={cn(
          "ml-1 px-2 py-0.5 text-xs font-bold rounded-full",
          active
            ? "bg-cream-50/90 text-steel dark:bg-navy/80 dark:text-sky"
            : "bg-cream-300/60 dark:bg-navy-700 text-navy dark:text-cream/80"
        )}
      >
        {count}
      </span>
    )}
  </button>
);

export default function FriendsTabContainer({
  followingUsers,
  followingLoading,
  currentUserId,
  onNewFollowingUser,
  initialFollowers,
  initialLoading,
  initialTotalElements,
}: FriendsTabContainerProps) {
  const [activeTab, setActiveTab] = useState<Tab>("FOLLOWING");

  const followingCount = followingUsers.length;

  const renderContent = () => {
    if (activeTab === "FOLLOWING") {
      return (
        <FollowingList users={followingUsers} loading={followingLoading} />
      );
    }

    return (
      <FollowersList
        targetUserId={currentUserId || undefined}
        onUserFollowed={onNewFollowingUser}
        initialFollowers={initialFollowers}
        initialLoading={initialLoading}
        initialTotalElements={initialTotalElements}
      />
    );
  };

  return (
    <div className="relative rounded-2xl border border-cream-300/60 dark:border-navy-700/60 bg-cream-50/80 dark:bg-navy/80 backdrop-blur-sm shadow-sm overflow-hidden">
      {/* Top accent */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-steel/25 dark:via-sky/15 to-transparent" />

      <div className="p-5 space-y-5">
        {/* Tab Navigation */}
        <div className="flex gap-3 p-1.5 rounded-xl bg-cream-100/60 dark:bg-navy-700/30 border border-cream-300/30 dark:border-navy-700/30">
          <TabButton
            active={activeTab === "FOLLOWING"}
            label="Following"
            count={followingCount}
            icon={<Users className="w-4 h-4" />}
            onClick={() => setActiveTab("FOLLOWING")}
          />
          <TabButton
            active={activeTab === "FOLLOWERS"}
            label="Followers"
            count={initialTotalElements}
            icon={<UserPlus className="w-4 h-4" />}
            onClick={() => setActiveTab("FOLLOWERS")}
          />
        </div>

        {/* Tab Content */}
        <div className="min-h-[300px]">{renderContent()}</div>
      </div>
    </div>
  );
}

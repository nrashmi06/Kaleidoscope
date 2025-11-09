// src/components/friends/FriendsTabContainer.tsx
"use client";

import React, { useState } from "react";
import FollowingList from "./FollowingList";
import FollowersList from "./FollowersList";
import type { SuggestedUser } from "@/lib/types/followSuggestions";
import type { FollowerUser } from "@/lib/types/followers"; // ✅ IMPORTED
import { cn } from "@/lib/utils";
import { Users, UserPlus } from "lucide-react";

interface FriendsTabContainerProps {
  followingUsers: SuggestedUser[];
  followingLoading: boolean;
  currentUserId: number | null;
  onNewFollowingUser: (user: SuggestedUser) => void;
  // ✅ NEW PROPS
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
  onClick: () => void 
}> = ({
  active,
  label,
  count,
  icon,
  onClick,
}) => (
  <button
    onClick={onClick}
    className={cn(
      "flex-1 flex items-center justify-center gap-2 p-3 text-sm font-semibold rounded-lg transition-all duration-200",
      active
        ? "bg-blue-600 text-white shadow-md shadow-blue-500/30"
        : "bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-neutral-700"
    )}
  >
    {icon}
    <span>{label}</span>
    {count > 0 && (
      <span
        className={cn(
          "ml-1 px-2 py-0.5 text-xs font-bold rounded-full",
          active
            ? "bg-white text-blue-600"
            : "bg-gray-200 dark:bg-neutral-700 text-gray-800 dark:text-gray-200"
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
  // ✅ Destructure new props
  initialFollowers,
  initialLoading,
  initialTotalElements,
}: FriendsTabContainerProps) {
  const [activeTab, setActiveTab] = useState<Tab>("FOLLOWING");

  const followingCount = followingUsers.length;
  
  const renderContent = () => {
    if (activeTab === "FOLLOWING") {
      return (
        <FollowingList 
          users={followingUsers} 
          loading={followingLoading} 
        />
      );
    }
    
    // ✅ Pass cached data down
    return <FollowersList 
             targetUserId={currentUserId || undefined}
             onUserFollowed={onNewFollowingUser} 
             initialFollowers={initialFollowers}
             initialLoading={initialLoading}
             initialTotalElements={initialTotalElements}
           />;
  };

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-xl border border-gray-200 dark:border-neutral-800 p-6 space-y-6">
      {/* Tab Navigation */}
      <div className="flex gap-4 p-2 rounded-xl bg-gray-50 dark:bg-neutral-800/50">
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
          count={initialTotalElements} // ✅ Use total count from parent cache
          icon={<UserPlus className="w-4 h-4" />}
          onClick={() => setActiveTab("FOLLOWERS")}
        />
      </div>

      {/* Tab Content (unchanged) */}
      <div className="min-h-[300px]">
        {renderContent()}
      </div>
    </div>
  );
}
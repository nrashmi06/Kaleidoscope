// src/components/friends/FollowingList.tsx
"use client";

import React from "react";
import type { SuggestedUser } from "@/lib/types/followSuggestions";
import FollowingItem from "@/components/friends/FollowingItem";
import { Users } from "lucide-react"; 

interface Props {
  users: SuggestedUser[];
  loading?: boolean; // ✅ Added loading prop
}

// Helper component for rendering multiple list item skeletons
const FollowingListSkeleton = () => (
  <div className="space-y-3">
    {Array.from({ length: 5 }).map((_, index) => (
      <div 
        key={index} 
        className="flex items-center justify-between gap-3 p-3 rounded-xl bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 shadow-sm animate-pulse"
      >
        <div className="flex items-center gap-4">
          {/* Avatar Skeleton (w-12 h-12) */}
          <div className="w-12 h-12 rounded-full bg-gray-300 dark:bg-neutral-700 flex-shrink-0" />
          
          {/* Text Skeletons (Username and Email) */}
          <div className="min-w-0 space-y-1.5">
            <div className="w-32 h-4 bg-gray-300 dark:bg-neutral-700 rounded" />
            <div className="w-40 h-3 bg-gray-200 dark:bg-neutral-700 rounded" />
          </div>
        </div>

        {/* FollowButton Skeleton (w-16 h-8) */}
        <div className="w-16 h-8 bg-gray-300 dark:bg-neutral-700 rounded-full" />
      </div>
    ))}
  </div>
);


export default function FollowingList({ users, loading }: Props) {
  if (loading) {
    // Renders the detailed skeleton when loading
    return <FollowingListSkeleton />;
  }
  
  if (!users || users.length === 0) {
    return (
        <div className="text-center py-10 text-gray-500 dark:text-gray-400 space-y-2">
            <Users className="w-8 h-8 mx-auto" />
            <p className="text-sm">You are not following anyone yet.</p>
        </div>
    );
  }

  return (
    <div className="space-y-3">
      {users.map((u) => (
        <FollowingItem key={u.userId} user={u} />
      ))}
    </div>
  );
}
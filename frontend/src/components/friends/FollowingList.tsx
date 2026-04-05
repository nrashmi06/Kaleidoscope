// src/components/friends/FollowingList.tsx
"use client";

import React from "react";
import type { SuggestedUser } from "@/lib/types/followSuggestions";
import FollowingItem from "@/components/friends/FollowingItem";
import { Users } from "lucide-react";

interface Props {
  users: SuggestedUser[];
  loading?: boolean;
}

const FollowingListSkeleton = () => (
  <div className="space-y-2.5">
    {Array.from({ length: 5 }).map((_, index) => (
      <div
        key={index}
        className="flex items-center justify-between gap-3 p-3 rounded-xl bg-cream-100/50 dark:bg-navy-700/30 border border-cream-300/30 dark:border-navy-700/30 animate-pulse"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-cream-300 dark:bg-navy-700 flex-shrink-0" />
          <div className="space-y-1.5">
            <div className="w-28 h-3.5 bg-cream-300 dark:bg-navy-700 rounded-full" />
            <div className="w-36 h-2.5 bg-cream-300/70 dark:bg-navy-700/70 rounded-full" />
          </div>
        </div>
        <div className="w-16 h-7 bg-cream-300 dark:bg-navy-700 rounded-full" />
      </div>
    ))}
  </div>
);

export default function FollowingList({ users, loading }: Props) {
  if (loading) {
    return <FollowingListSkeleton />;
  }

  if (!users || users.length === 0) {
    return (
      <div className="text-center py-10 space-y-2">
        <div className="inline-flex items-center justify-center w-11 h-11 rounded-full bg-cream-300/50 dark:bg-navy-700/50 border border-cream-400/40 dark:border-navy-600/40 mb-1">
          <Users className="w-5 h-5 text-steel dark:text-sky/60" />
        </div>
        <p className="text-sm text-steel dark:text-sky/60">
          You are not following anyone yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      {users.map((u) => (
        <FollowingItem key={u.userId} user={u} />
      ))}
    </div>
  );
}

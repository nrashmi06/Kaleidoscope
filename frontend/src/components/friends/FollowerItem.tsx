// src/components/friends/FollowerItem.tsx
"use client";

import React from "react";
import Image from "next/image";
import type { FollowerUser } from "@/lib/types/followers"; 
import FollowButton from "@/components/common/FollowButton";
import { Mail } from "lucide-react";

interface Props {
  user: FollowerUser;
}

// Consistent styling with FollowingItem.tsx
export default function FollowerItem({ user }: Props) {
  return (
    <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-gray-50 dark:bg-neutral-800 hover:bg-gray-100 dark:hover:bg-neutral-700 transition-colors duration-200 border border-gray-200 dark:border-neutral-700 shadow-sm">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-300 dark:bg-neutral-700 flex-shrink-0">
          <Image
            src={user.profilePictureUrl || "/person.jpg"}
            width={48}
            height={48}
            alt={user.username}
            className="object-cover w-full h-full"
          />
        </div>
        <div className="min-w-0">
          <div className="text-base font-semibold text-gray-800 dark:text-white truncate">{user.username}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-0.5">
            <Mail className="w-3 h-3" />
            <span className="truncate">{user.email}</span>
          </div>
        </div>
      </div>

      <div>
        <FollowButton targetUserId={user.userId} />
      </div>
    </div>
  );
}
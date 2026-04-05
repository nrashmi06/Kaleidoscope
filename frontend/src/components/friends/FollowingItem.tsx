"use client";

import React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import type { SuggestedUser } from "@/lib/types/followSuggestions";
import FollowButton from "@/components/common/FollowButton";

interface Props {
  user: SuggestedUser;
}

export default function FollowingItem({ user }: Props) {
  const router = useRouter();

  return (
    <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-cream-100/50 dark:bg-navy-700/30 border border-cream-300/40 dark:border-navy-700/40 hover:bg-cream-300/30 dark:hover:bg-navy-700/50 transition-colors">
      <div
        className="flex items-center gap-3 min-w-0 cursor-pointer"
        onClick={() => router.push(`/profile/${user.userId}`)}
      >
        <div className="w-10 h-10 rounded-full overflow-hidden bg-cream-300 dark:bg-navy-700 ring-2 ring-cream-300/50 dark:ring-navy-600/50 flex-shrink-0">
          <Image
            src={user.profilePictureUrl || "/person.jpg"}
            width={40}
            height={40}
            alt={user.username}
            className="object-cover w-full h-full"
          />
        </div>
        <div className="min-w-0">
          <div className="text-sm font-medium text-navy dark:text-cream truncate hover:underline">
            {user.username}
          </div>
        </div>
      </div>

      <div className="flex-shrink-0">
        <FollowButton targetUserId={user.userId} />
      </div>
    </div>
  );
}

"use client";

import React from "react";
import Image from "next/image";
import type { SuggestedUser } from "@/lib/types/followSuggestions";
import FollowButton from "@/components/common/FollowButton";

interface Props {
  user: SuggestedUser;
}

export default function FollowingItem({ user }: Props) {
  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 dark:bg-neutral-800">
          <Image
            src={user.profilePictureUrl || "/person.jpg"}
            width={40}
            height={40}
            alt={user.username}
            className="object-cover w-full h-full"
          />
        </div>
        <div className="min-w-0">
          <div className="text-sm font-medium text-gray-800 dark:text-white truncate">{user.username}</div>
        </div>
      </div>

      <div>
        <FollowButton targetUserId={user.userId} />
      </div>
    </div>
  );
}

// src/components/sidebar/UserProfileCard.tsx
"use client";

import Image from "next/image";
import React from "react";
import { RootState } from "@/store";
import { useSelector } from "react-redux";
import { User } from "lucide-react";
import { useRouter } from "next/navigation";

export function UserProfileCard() {
  const user = useSelector((state: RootState) => state.auth);
  const router = useRouter();

  const handleViewProfile = () => {
    if (user.userId) {
      router.push(`/profile/${user.userId}`);
    }
  };

  const isUserAuthenticated = user.userId > 0;

  return (
    <div className="w-full mb-1">
      <button
        onClick={handleViewProfile}
        disabled={!isUserAuthenticated}
        className="w-full flex items-center gap-3 px-3 py-3 rounded-2xl hover:bg-cream-300/40 dark:hover:bg-navy-700/40 transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
      >
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          <div className="w-10 h-10 rounded-full overflow-hidden bg-cream-300/60 dark:bg-navy-700/60 flex items-center justify-center shadow-sm">
            {user.profilePictureUrl ? (
              <Image
                src={user.profilePictureUrl}
                alt={user.username || "User"}
                width={40}
                height={40}
                className="object-cover w-full h-full"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            ) : (
              <User className="w-4.5 h-4.5 text-navy/30 dark:text-cream/30" />
            )}
          </div>
          <span className="absolute -bottom-0.5 -right-0.5 block w-3 h-3 bg-emerald-400 rounded-full border-2 border-[#f5f0e8] dark:border-[#0a0a0f]" />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0 text-left">
          <h3 className="font-semibold text-navy dark:text-cream truncate text-[13px] leading-tight">
            {user.username || "Anonymous"}
          </h3>
          <p className="text-[11px] text-steel/60 dark:text-sky/40 truncate mt-0.5">
            {user.email || "No email"}
          </p>
        </div>
      </button>
    </div>
  );
}

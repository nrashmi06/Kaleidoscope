// src/components/sidebar/UserProfileCard.tsx
"use client";

import Image from "next/image";
import React from "react";
import { RootState } from "@/store";
import { useSelector } from "react-redux";
import { Mail, User } from "lucide-react";
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
    <div className="w-full">
      <div className="flex items-center gap-3 px-3 py-3">
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          <div className="w-11 h-11 rounded-full overflow-hidden ring-2 ring-cream-300/50 dark:ring-navy-700/50 bg-cream-300 dark:bg-navy-700 flex items-center justify-center">
            {user.profilePictureUrl ? (
              <Image
                src={user.profilePictureUrl}
                alt={user.username || "User"}
                width={44}
                height={44}
                className="object-cover w-full h-full"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            ) : (
              <User className="w-5 h-5 text-steel dark:text-sky" />
            )}
          </div>
          <span className="absolute bottom-0 right-0 block w-3 h-3 bg-emerald-500 rounded-full border-2 border-cream dark:border-navy-900" />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-navy dark:text-cream truncate text-sm">
            {user.username || "Anonymous"}
          </h3>
          <div className="flex items-center gap-1.5 mt-0.5 text-steel/70 dark:text-sky/50">
            <Mail className="w-3 h-3 flex-shrink-0" />
            <p className="text-[11px] truncate">{user.email || "No email"}</p>
          </div>
        </div>
      </div>

      {/* View Profile button */}
      <div className="px-3 pb-2">
        <button
          onClick={handleViewProfile}
          disabled={!isUserAuthenticated}
          className={`w-full text-xs font-semibold text-steel dark:text-sky bg-steel/8 hover:bg-steel/15 dark:bg-sky/8 dark:hover:bg-sky/15 rounded-xl py-2 transition-all duration-150 cursor-pointer ${
            !isUserAuthenticated ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          View Profile
        </button>
      </div>

      {/* Subtle gradient separator */}
      <div className="mx-3 mt-1 h-px bg-gradient-to-r from-transparent via-cream-400/30 dark:via-navy-700/40 to-transparent" />
    </div>
  );
}

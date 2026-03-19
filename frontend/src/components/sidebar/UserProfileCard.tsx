// src/components/sidebar/UserProfileCard.tsx
"use client";

import Image from "next/image";
import React from "react";
import { RootState } from "@/store";
import { useSelector } from "react-redux";
import { Mail, User } from "lucide-react";
import { useRouter } from "next/navigation"; // ✅ Import useRouter

export function UserProfileCard() {
  const user = useSelector((state: RootState) => state.auth);
  const router = useRouter(); // ✅ Get router instance

  const handleViewProfile = () => {
    if (user.userId) {
      router.push(`/profile/${user.userId}`);
    }
  };

  const isUserAuthenticated = user.userId > 0;

  return (
    <div className="w-full max-w-xs mx-auto">
      <div className="relative rounded-xl border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm overflow-hidden p-4">
        {/* Avatar & Info */}
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-gray-200 dark:border-neutral-700 bg-gray-100 dark:bg-neutral-800 flex items-center justify-center">
              {user.profilePictureUrl ? (
                <Image
                  src={user.profilePictureUrl}
                  alt={user.username || "User"}
                  width={48}
                  height={48}
                  className="object-cover w-full h-full"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              ) : (
                <User className="w-5 h-5 text-gray-400 dark:text-neutral-500" />
              )}
            </div>
            {/* Online Status */}
            <span className="absolute bottom-0 right-0 block w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-neutral-900" />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 dark:text-white truncate text-sm">
              {user.username || "Anonymous"}
            </h3>
            <div className="flex items-center gap-1.5 mt-0.5 text-gray-500 dark:text-neutral-400">
              <Mail className="w-3 h-3 flex-shrink-0" />
              <p className="text-xs truncate">
                {user.email || "No email"}
              </p>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={handleViewProfile}
          disabled={!isUserAuthenticated}
          className={`
            mt-3 w-full text-xs font-semibold
            text-blue-600 dark:text-blue-400
            bg-blue-50 hover:bg-blue-100
            dark:bg-blue-950/30 dark:hover:bg-blue-900/40
            rounded-lg py-2 transition-all duration-150
            ${!isUserAuthenticated ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
        >
          View Profile
        </button>
      </div>
    </div>
  );
}
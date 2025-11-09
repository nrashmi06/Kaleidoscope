"use client";

import Image from "next/image";
import React from "react";
import { RootState } from "@/store";
import { useSelector } from "react-redux";
import { Mail, User } from "lucide-react";

export function UserProfileCard() {
  const user = useSelector((state: RootState) => state.auth);

  return (
    <div className="w-full max-w-xs mx-auto">
      <div className="
        relative rounded-xl border border-gray-200 dark:border-zinc-700 
        bg-white dark:bg-zinc-900 
        shadow-sm hover:shadow-md transition-all duration-200
        overflow-hidden p-4
      ">
        {/* Avatar & Info */}
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="relative">
            <div className="w-14 h-14 rounded-full overflow-hidden border border-gray-200 dark:border-zinc-700 bg-gray-100 dark:bg-zinc-800 flex items-center justify-center">
              {user.profilePictureUrl ? (
                <Image
                  src={user.profilePictureUrl}
                  alt={user.username || "User"}
                  width={56}
                  height={56}
                  className="object-cover w-full h-full"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              ) : (
                <User className="w-6 h-6 text-gray-400 dark:text-gray-500" />
              )}
            </div>

            {/* Online Status */}
            <span className="absolute bottom-0 right-0 block w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white dark:border-zinc-900" />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-gray-900 dark:text-white truncate text-base">
              {user.username || "Anonymous"}
            </h3>
            <div className="flex items-center gap-1.5 mt-0.5 text-gray-600 dark:text-gray-400">
              <Mail className="w-3.5 h-3.5 flex-shrink-0" />
              <p className="text-xs break-all leading-snug">
                {user.email || "No email"}
              </p>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <button
          className="
            mt-4 w-full text-sm font-medium 
            text-blue-600 dark:text-blue-400 
            bg-blue-50 hover:bg-blue-100 
            dark:bg-blue-950/20 dark:hover:bg-blue-900/30
            border border-transparent dark:border-blue-900/50
            rounded-lg py-1.5 transition-all
          "
        >
          View Profile
        </button>
      </div>
    </div>
  );
}

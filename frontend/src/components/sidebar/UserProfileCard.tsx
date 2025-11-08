"use client";

import Image from "next/image";
import React from "react";
import { RootState } from "@/store";
import { useSelector } from "react-redux";
import { Mail, User } from "lucide-react";

export function UserProfileCard() {
  const user = useSelector((state: RootState) => state.auth);

  return (
    <div className="w-full max-w-sm mx-auto">
      <div className="relative bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-zinc-900 dark:to-zinc-800 rounded-2xl border border-gray-200 dark:border-zinc-700 shadow-md overflow-hidden">
        {/* Subtle background accents */}
        <div className="absolute top-0 right-0 w-28 h-28 bg-blue-400/10 dark:bg-blue-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-indigo-400/10 dark:bg-indigo-500/5 rounded-full blur-2xl" />

        {/* Main Content */}
        <div className="relative z-10 p-6">
          {/* Avatar and Info */}
          <div className="flex items-center gap-4 mb-5">
            {/* Avatar */}
            <div className="relative shrink-0">
              <div className="w-20 h-20 rounded-full overflow-hidden bg-gradient-to-br from-blue-400 to-indigo-500 p-[2px] shadow-md">
                <div className="w-full h-full rounded-full overflow-hidden bg-gray-200 dark:bg-zinc-700 flex items-center justify-center">
                  {user.profilePictureUrl ? (
                    <Image
                      src={user.profilePictureUrl}
                      alt={user.username || "User"}
                      width={80}
                      height={80}
                      className="object-cover w-full h-full"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  ) : (
                    <User className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                  )}
                </div>
              </div>
              {/* Online Indicator */}
              <div className="absolute bottom-1 right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-zinc-800 shadow-sm" />
            </div>

            {/* User Info */}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-xl text-gray-900 dark:text-white truncate">
                {user.username || "Anonymous"}
              </h3>
              <div className="flex items-center gap-2 mt-1 text-gray-600 dark:text-gray-400">
                <Mail className="w-4 h-4 flex-shrink-0" />
                <p className="text-sm break-all">{user.email || "No email available"}</p>
              </div>
            </div>
          </div>

          {/* Single Action Button */}
          <div className="mt-6">
            <button className="w-full bg-blue-500 hover:bg-blue-600 text-white cursor-pointer font-medium py-2.5 rounded-lg shadow-md hover:shadow-lg transition-all">
              View Profile
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

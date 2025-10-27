"use client";

import Image from "next/image";
import React from "react";
import { RootState } from "@/store";
import { useSelector } from "react-redux";

export function UserProfileCard() {
  const user = useSelector((state: RootState) => state.auth);

  return (
    <div className="w-full max-w-sm mx-auto bg-white dark:bg-neutral-900 rounded-lg border border-gray-200 dark:border-neutral-800 p-6">
      <div className="flex flex-col space-y-4">
        {/* Avatar and User Info in row */}
        <div className="flex items-center space-x-4">
          {/* Profile Avatar */}
          <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center text-sm font-semibold text-gray-500">
            <Image
              src="/person.jpg"
              alt="UserName"
              width={64}          // Set width
              height={64}         // Set height
              className="object-cover w-full h-full"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          </div>

          {/* User Info */}
          <div>
            <h3 className="font-semibold text-lg text-gray-900 dark:text-white">{user.username}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
          </div>
        </div>

        {/* Stats */}
        <div className="flex w-full justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="text-center flex-1">
            <div className="font-semibold text-lg text-gray-900 dark:text-white">2.3k</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Followers</div>
          </div>
          <div className="text-center flex-1">
            <div className="font-semibold text-lg text-gray-900 dark:text-white">2.3k</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Following</div>
          </div>
          <div className="text-center flex-1">
            <div className="font-semibold text-lg text-gray-900 dark:text-white">2.3k</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Posts</div>
          </div>
        </div>
      </div>
    </div>
  );
}

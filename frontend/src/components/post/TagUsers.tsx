"use client";

import React from "react";

interface Props {
  accessToken: string | null;
  userSearchQuery: string;
  setUserSearchQuery: (query: string) => void;
  users: { userId: number; username: string }[];
  taggedUserIds?: number[];
  onToggle: (id: number) => void;
}

export default function TagUsers({
  userSearchQuery,
  setUserSearchQuery,
  users,
  taggedUserIds = [],
  onToggle,
}: Props) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Tag Users
      </label>
      <input
        type="text"
        value={userSearchQuery}
        onChange={(e) => setUserSearchQuery(e.target.value)}
        placeholder="Search users..."
        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all mb-2"
      />
      <div className="flex flex-wrap gap-2">
        {users.map((user) => {
          const selected = taggedUserIds.includes(user.userId);
          return (
            <button
              type="button"
              key={user.userId}
              onClick={() => onToggle(user.userId)}
              className={`px-3 py-1 rounded-full border transition-all ${
                selected
                  ? "bg-green-600 text-white border-green-600"
                  : "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-200 border-gray-300 dark:border-gray-600"
              }`}
            >
              {user.username}
            </button>
          );
        })}
      </div>
    </div>
  );
}

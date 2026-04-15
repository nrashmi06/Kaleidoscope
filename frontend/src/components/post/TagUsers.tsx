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
    <div className="bg-surface-alt rounded-xl border border-border-default p-6">
      <label className="block text-sm font-medium text-heading mb-2">
        Tag Users
      </label>
      <input
        type="text"
        value={userSearchQuery}
        onChange={(e) => setUserSearchQuery(e.target.value)}
        placeholder="Search users..."
        className="w-full px-4 py-2 border border-border-default rounded-xl bg-cream-50/60 dark:bg-navy-700/30 text-heading placeholder-steel/40 dark:placeholder-sky/30 focus:ring-2 focus:ring-steel/30 dark:focus:ring-sky/30 focus:border-steel dark:focus:border-sky transition-all mb-2"
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
                  ? "bg-steel text-cream-50 border-steel dark:bg-sky dark:text-navy dark:border-sky"
                  : "bg-surface-hover text-heading border-border-default"
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

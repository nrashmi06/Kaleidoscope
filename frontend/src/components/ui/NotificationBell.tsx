"use client";

import React from "react";
import { Bell } from "lucide-react";
import { useAppSelector } from "@/hooks/useAppSelector";

export default function NotificationBell() {
  const { count = 0, connected = false } = useAppSelector((s) => s.notifications ?? {});

  return (
    <div className="relative inline-flex items-center">
      <button
        aria-label="Notifications"
        title="Notifications"
        className="p-1 rounded hover:bg-gray-100 dark:hover:bg-zinc-800 transition"
        type="button"
      >
        <Bell className={`w-5 h-5 ${connected ? "text-blue-500" : "text-neutral-500"}`} />
      </button>

      {count > 0 && (
        <span className="absolute -top-1 -right-1 inline-flex items-center justify-center rounded-full bg-red-600 text-white text-xs font-bold px-1.5 py-0.5">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </div>
  );
}

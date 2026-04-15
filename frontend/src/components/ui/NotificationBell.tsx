"use client";

import React from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { useAppSelector } from "@/hooks/useAppSelector";

export default function NotificationBell() {
  const { count = 0, connected = false } = useAppSelector((s) => s.notifications ?? {});

  React.useEffect(() => {
    // Dev log when count changes
    try {
      console.debug('[notification UI] count updated', { count, connected });
    } catch {}
  }, [count, connected]);

  return (
    <div className="relative inline-flex items-center">
      <Link href="/notifications" aria-label="Notifications" title="Notifications">
        <button
          className="p-1 rounded hover:bg-cream-300/50 dark:hover:bg-navy-700/50 transition cursor-pointer"
          type="button"
        >
          <Bell className={`w-5 h-5 ${connected ? "text-steel dark:text-sky" : "text-navy/50 dark:text-cream/50"}`} />
        </button>
      </Link>

      {count > 0 && (
        <span className="absolute -top-1 -right-1 inline-flex items-center justify-center rounded-full bg-red-600 text-white text-xs font-bold px-1.5 py-0.5">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </div>
  );
}

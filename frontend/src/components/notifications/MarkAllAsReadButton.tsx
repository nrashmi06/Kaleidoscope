"use client";

import React, { useState } from "react";
import { Loader2, CheckCheck } from "lucide-react";
import { useAppDispatch } from "@/hooks/appDispatch";
import { setCount } from "@/store/notificationSlice";
import { markAllAsRead } from "@/controllers/notificationController/notificationsController";

interface Props {
  token: string | null;
  onMarkedAll?: () => void;
}

export default function MarkAllAsReadButton({ token, onMarkedAll }: Props) {
  const dispatch = useAppDispatch();
  const [busy, setBusy] = useState(false);

  const handleMarkAll = async () => {
    if (!token || busy) return;
    setBusy(true);
    try {
      const res = await markAllAsRead(token);
      if (res.success) {
        dispatch(setCount(0));
        onMarkedAll?.();
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      onClick={handleMarkAll}
      disabled={!token || busy}
      className={`
        group relative inline-flex items-center gap-2.5 px-5 py-2.5 
        text-sm font-medium tracking-wide transition-all duration-300
        bg-white dark:bg-neutral-900
        text-neutral-900 dark:text-neutral-100
        border border-neutral-200 dark:border-neutral-800
        hover:border-neutral-900 dark:hover:border-neutral-100
        rounded-md
        disabled:opacity-40 disabled:cursor-not-allowed
        disabled:hover:border-neutral-200 dark:disabled:hover:border-neutral-800
        overflow-hidden
        ${busy ? '' : 'active:scale-[0.98]'}
      `}
    >
      {/* Subtle hover background effect */}
      <span className="absolute inset-0 bg-neutral-900 dark:bg-neutral-100 opacity-0 group-hover:opacity-5 transition-opacity duration-300" />
      
      {/* Content */}
      <span className="relative flex items-center gap-2.5">
        {busy ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <CheckCheck className="w-4 h-4 transition-transform duration-300 group-hover:scale-110" />
        )}
        <span className="relative">
          {busy ? "Processing" : "Mark all read"}
        </span>
      </span>
    </button>
  );
}
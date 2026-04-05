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
      className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl
        bg-steel/8 hover:bg-steel/15 text-steel dark:bg-sky/8 dark:hover:bg-sky/15 dark:text-sky
        disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 cursor-pointer"
    >
      {busy ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : (
        <CheckCheck className="w-3.5 h-3.5" />
      )}
      {busy ? "Processing" : "Mark all read"}
    </button>
  );
}

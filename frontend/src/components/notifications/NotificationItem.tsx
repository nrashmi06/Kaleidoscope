"use client";

import React, { useState } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { useAppDispatch } from "@/hooks/appDispatch";
import { useAppSelector } from "@/hooks/useAppSelector";
import { setCount } from "@/store/notificationSlice";
import {
  markAsRead,
  deleteNotification,
} from "@/controllers/notificationController/notificationsController";
import type { NotificationItem as NotificationType } from "@/lib/types/notifications";

interface Props {
  item: NotificationType;
  token: string | null;
  onRemoved?: (id: number) => void;
  onUpdated?: (updated: NotificationType) => void;
}

export default function NotificationItem({
  item,
  token,
  onRemoved,
  onUpdated,
}: Props) {
  const dispatch = useAppDispatch();
  const unreadCount = useAppSelector((s) => s.notifications.count);

  const [isMarking, setIsMarking] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isReadLocal, setIsReadLocal] = useState(item.isRead);
  const busy = isMarking || isDeleting;

  const handleMarkRead = async () => {
    // 🧠 Only mark this notification if it’s unread
    if (!token || isReadLocal || busy) return;

    // Optimistic UI update
    setIsReadLocal(true);
    dispatch(setCount(Math.max(0, unreadCount - 1)));

    setIsMarking(true);
    try {
      const res = await markAsRead(token, item.notificationId);
      if (res.success && res.data) {
        onUpdated?.(res.data as NotificationType);
      }
    } catch {
      // Rollback if API fails
      setIsReadLocal(false);
      dispatch(setCount(unreadCount + 1));
    } finally {
      setIsMarking(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation(); // prevent marking as read
    if (!token || busy) return;
    if (!confirm("Delete this notification?")) return;
    setIsDeleting(true);
    try {
      const res = await deleteNotification(token, item.notificationId);
      if (res.success) {
        if (!isReadLocal) {
          dispatch(setCount(Math.max(0, unreadCount - 1)));
        }
        onRemoved?.(item.notificationId);
      }
    } finally {
      setIsDeleting(false);
    }
  };

  // UI state classes
  const bgClass = isReadLocal
    ? "bg-white dark:bg-neutral-900"
    : "bg-neutral-50 dark:bg-neutral-800/50";
  const borderClass = isReadLocal
    ? "border-neutral-200 dark:border-neutral-800"
    : "border-blue-200/50 dark:border-blue-900/50";
  const textClass = isReadLocal
    ? "text-neutral-700 dark:text-neutral-300"
    : "text-neutral-900 dark:text-neutral-100 font-medium";

  return (
    <li
      onClick={handleMarkRead}
      className={`
        group relative flex flex-col gap-2 p-4 m-2 rounded-xl border ${borderClass} ${bgClass}
        hover:bg-neutral-100 dark:hover:bg-neutral-800
        transition-all duration-200 cursor-pointer
        ${busy ? "opacity-70 pointer-events-none" : ""}
      `}
    >
      <div className="flex items-start justify-between">
        <p className={`text-sm leading-relaxed ${textClass}`}>
          {item.message}
        </p>

        <button
          onClick={handleDelete}
          disabled={busy}
          title="Delete notification"
          className={`
            flex items-center justify-center w-8 h-8 rounded-md
            text-neutral-500 dark:text-neutral-400
            hover:text-red-600 dark:hover:text-red-400
            hover:bg-red-50 dark:hover:bg-red-900/20
            opacity-0 group-hover:opacity-100 focus:opacity-100
            transition-all duration-200
          `}
        >
          {isDeleting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Trash2 className="w-4 h-4 cursor-pointer" />
          )}
        </button>
      </div>

      <span className="text-xs text-neutral-500 dark:text-neutral-500">
        {new Date(item.createdAt).toLocaleString(undefined, {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })}
      </span>

      {/* Unread indicator — subtle blue dot */}
      {!isReadLocal && (
        <span className="absolute top-3 right-3 w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
      )}
    </li>
  );
}

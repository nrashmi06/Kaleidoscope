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
import DeleteConfirmationModal from "@/components/common/DeleteConfirmationModal";
import type { NotificationItem as NotificationType } from "@/lib/types/notifications";
import Image from "next/image";

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
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isReadLocal, setIsReadLocal] = useState(item.isRead);

  const busy = isMarking || isDeleting;

  // Sync when updated externally (e.g., mark all as read)
  React.useEffect(() => {
    setIsReadLocal(item.isRead);
  }, [item.isRead]);

  const handleMarkRead = async () => {
    if (!token || isReadLocal || busy) return;

    // Optimistic update
    setIsReadLocal(true);
    dispatch(setCount(Math.max(0, unreadCount - 1)));

    setIsMarking(true);
    try {
      const res = await markAsRead(token, item.notificationId);
      if (res.success && res.data) {
        onUpdated?.(res.data as NotificationType);
      }
    } catch {
      // Rollback if error
      setIsReadLocal(false);
      dispatch(setCount(unreadCount + 1));
    } finally {
      setIsMarking(false);
    }
  };

  const confirmDelete = async () => {
    if (!token || busy) return;
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
      setShowDeleteModal(false);
    }
  };

  // Styles
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
    <>
      <li
        onClick={handleMarkRead}
        className={`group relative flex flex-row items-start gap-3 p-4 m-2 rounded-xl border ${borderClass} ${bgClass}
          hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all duration-200 cursor-pointer
          ${busy ? "opacity-70 pointer-events-none" : ""}`}
      >
        {/* Avatar */}
        <div className="flex-shrink-0">
          <Image
            src={item.actorProfilePictureUrl || "/person.jpg"} // fallback avatar
            alt={item.actorUsername || "User Avatar"}
            width={40}  // required
            height={40} // required
            className="w-10 h-10 rounded-full object-cover bg-gray-100 dark:bg-neutral-800"
            onError={(e) => {
              const target = e.currentTarget as HTMLImageElement;
              target.src = "/person.jpg"; // ensure fallback if image fails
            }}
          />
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="min-w-0">
              <p className={`text-sm leading-relaxed ${textClass}`}>
                {item.message}
              </p>

              <span className="text-xs text-neutral-500 dark:text-neutral-500">
                {new Date(item.createdAt).toLocaleString(undefined, {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>

            {/* Delete button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowDeleteModal(true);
              }}
              disabled={busy}
              title="Delete notification"
              className="flex items-center justify-center w-8 h-8 rounded-md
                text-neutral-500 dark:text-neutral-400 hover:text-red-600 dark:hover:text-red-400
                hover:bg-red-50 dark:hover:bg-red-900/20 opacity-0 group-hover:opacity-100
                focus:opacity-100 transition-all duration-200"
            >
              {isDeleting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4 cursor-pointer" />
              )}
            </button>
          </div>
        </div>

        {/* Unread blue dot */}
        {!isReadLocal && (
          <span className="absolute top-3 right-3 w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
        )}
      </li>

      {/* Delete Modal */}
      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onConfirm={confirmDelete}
        onCancel={() => setShowDeleteModal(false)}
        isDeleting={isDeleting}
        title="Delete Notification"
        message="Are you sure you want to delete this notification? This action cannot be undone."
      />
    </>
  );
}

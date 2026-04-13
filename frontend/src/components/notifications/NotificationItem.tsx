"use client";

import React, { useState } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
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
  const router = useRouter();
  const dispatch = useAppDispatch();
  const unreadCount = useAppSelector((s) => s.notifications.count);

  const [isMarking, setIsMarking] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isReadLocal, setIsReadLocal] = useState(item.isRead);

  const busy = isMarking || isDeleting;

  React.useEffect(() => {
    setIsReadLocal(item.isRead);
  }, [item.isRead]);

  const getNotificationRoute = (): string | null => {
    const t = (item.type || "").toUpperCase();

    if (t.includes("FOLLOW")) return "/friends";

    if (item.contentId) {
      const ct = (item.contentType || "").toUpperCase();
      if (ct === "BLOG" || ct === "ARTICLE") return `/articles/${item.contentId}`;
      if (ct === "POST") return `/post/${item.contentId}`;
      if (ct === "COMMENT") return `/post/${item.contentId}`;
    }

    if (item.link) return item.link;

    if (item.actorUserId) return `/profile/${item.actorUserId}`;

    return null;
  };

  const handleClick = async () => {
    if (busy) return;

    // Mark as read if unread
    if (!isReadLocal && token) {
      setIsReadLocal(true);
      dispatch(setCount(Math.max(0, unreadCount - 1)));

      setIsMarking(true);
      try {
        const res = await markAsRead(token, item.notificationId);
        if (res.success && res.data) {
          onUpdated?.(res.data as NotificationType);
        }
      } catch {
        setIsReadLocal(false);
        dispatch(setCount(unreadCount + 1));
      } finally {
        setIsMarking(false);
      }
    }

    // Navigate to the relevant page
    const route = getNotificationRoute();
    if (route) router.push(route);
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

  const handleAvatarClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (item.actorUserId) {
      router.push(`/profile/${item.actorUserId}`);
    }
  };

  return (
    <>
      <div
        onClick={handleClick}
        className={`group relative flex items-start gap-3 p-4 rounded-xl border transition-all duration-200 cursor-pointer ${
          isReadLocal
            ? "bg-cream-50/50 dark:bg-navy-700/30 border-cream-300/30 dark:border-navy-700/30"
            : "bg-cream-50 dark:bg-navy-700/50 border-steel/20 dark:border-sky/20"
        } hover:bg-cream-100/60 dark:hover:bg-navy-700/50 ${
          busy ? "opacity-70 pointer-events-none" : ""
        }`}
      >
        {/* Avatar */}
        <div className="flex-shrink-0">
          <Image
            src={item.actorProfilePictureUrl || "/person.jpg"}
            alt={item.actorUsername || "User"}
            width={40}
            height={40}
            onClick={handleAvatarClick}
            className="w-10 h-10 rounded-full object-cover bg-cream-300 dark:bg-navy-600 cursor-pointer hover:opacity-80 transition-opacity ring-2 ring-cream-300/40 dark:ring-navy-600/40"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = "/person.jpg";
            }}
          />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="min-w-0">
              <p
                className={`text-sm leading-relaxed ${
                  isReadLocal
                    ? "text-navy/70 dark:text-cream/60"
                    : "text-navy dark:text-cream font-medium"
                }`}
              >
                {item.message}
              </p>
              <span className="text-[11px] text-steel/50 dark:text-sky/40">
                {new Date(item.createdAt).toLocaleString(undefined, {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>

            {/* Delete */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowDeleteModal(true);
              }}
              disabled={busy}
              title="Delete notification"
              className="flex items-center justify-center w-8 h-8 rounded-lg
                text-steel/40 dark:text-sky/30 hover:text-red-600 dark:hover:text-red-400
                hover:bg-red-500/10 dark:hover:bg-red-900/20 opacity-0 group-hover:opacity-100
                focus:opacity-100 transition-all duration-200 cursor-pointer"
            >
              {isDeleting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Unread dot */}
        {!isReadLocal && (
          <span className="absolute top-3 right-3 w-2 h-2 rounded-full bg-sky animate-pulse" />
        )}
      </div>

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

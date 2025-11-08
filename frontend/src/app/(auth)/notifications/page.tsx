"use client";

import React, { useEffect, useState } from "react";
import { useAccessToken } from "@/hooks/useAccessToken";
import { getNotifications } from "@/controllers/notificationController/notificationsController";
import type { NotificationItem } from "@/lib/types/notifications";
import NotificationItemComponent from "@/components/notifications/NotificationItem";
import MarkAllAsReadButton from "@/components/notifications/MarkAllAsReadButton";
import { Bell, Inbox } from "lucide-react";

export default function NotificationsPage() {
  const token = useAccessToken();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unread, setUnread] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    let mounted = true;
    setLoading(true);
    (async () => {
      const res = await getNotifications(token, { page: 0, size: 50 });
      if (!mounted) return;
      setLoading(false);
      if (!res.success) {
        setError(res.error || "Failed to load notifications");
        return;
      }
      const payload = res.data?.data;
      if (payload) {
        setItems(payload.notifications.content || []);
        setUnread(payload.unreadCount || 0);
      }
    })();

    return () => { mounted = false; };
  }, [token]);

  return (
    <div className="h-full mb-3 bg-gradient-to-br rounded-sm from-neutral-50 to-neutral-100 dark:from-zinc-950 dark:to-zinc-900">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Bell className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">
              Notifications
            </h1>
          </div>
          <p className="text-neutral-600 dark:text-neutral-400 ml-14">
            Stay updated with your latest activity
          </p>
        </div>

        {/* Stats and Actions Bar */}
        <div className="bg-white dark:bg-zinc-800 rounded-xl shadow-sm border border-neutral-200 dark:border-zinc-700 p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  Total
                </span>
                <span className="px-3 py-1 bg-neutral-100 dark:bg-zinc-700 rounded-full text-sm font-semibold text-neutral-900 dark:text-white">
                  {items.length}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  Unread
                </span>
                <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 rounded-full text-sm font-semibold text-blue-700 dark:text-blue-400">
                  {unread}
                </span>
              </div>
            </div>
            <MarkAllAsReadButton
              token={token}
              onMarkedAll={() => {
                setItems((prev) => prev.map((x) => ({ ...x, isRead: true })));
                setUnread(0);
              }}
            />
          </div>
        </div>

        {/* Notifications List */}
        <div className="bg-white dark:bg-zinc-800 rounded-xl shadow-sm border border-neutral-200 dark:border-zinc-700 overflow-hidden">
          {loading && (
            <div className="flex flex-col items-center justify-center py-16 px-4">
              <div className="w-12 h-12 border-4 border-blue-200 dark:border-blue-900 border-t-blue-600 dark:border-t-blue-400 rounded-full animate-spin mb-4"></div>
              <p className="text-neutral-600 dark:text-neutral-400">Loading notifications...</p>
            </div>
          )}

          {error && (
            <div className="flex flex-col items-center justify-center py-16 px-4">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
                <span className="text-2xl">⚠️</span>
              </div>
              <p className="text-red-600 dark:text-red-400 font-medium text-center">{error}</p>
              <p className="text-neutral-500 dark:text-neutral-400 text-sm mt-2">
                Please try again later
              </p>
            </div>
          )}

          {!loading && !error && items.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 px-4">
              <div className="w-20 h-20 bg-neutral-100 dark:bg-zinc-700 rounded-full flex items-center justify-center mb-4">
                <Inbox className="w-10 h-10 text-neutral-400 dark:text-neutral-500" />
              </div>
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">
                All caught up!
              </h3>
              <p className="text-neutral-500 dark:text-neutral-400 text-center max-w-sm">
                You don&apos;t have any notifications right now. Check back later for updates.
              </p>
            </div>
          )}

          {!loading && !error && items.length > 0 && (
            <ul className="divide-y divide-neutral-200 dark:divide-zinc-700">
              {items.map((n) => (
                <NotificationItemComponent
                  key={n.notificationId}
                  item={n}
                  token={token}
                  onRemoved={(id) => setItems((prev) => prev.filter((x) => x.notificationId !== id))}
                  onUpdated={(updated) => setItems((prev) => prev.map((x) => (x.notificationId === updated.notificationId ? updated : x)))}
                />
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
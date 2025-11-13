"use client";

import React, { useEffect, useState } from "react";
import { useAccessToken } from "@/hooks/useAccessToken";
import { getNotifications } from "@/controllers/notificationController/notificationsController";
import type { NotificationItem } from "@/lib/types/notifications";
import NotificationItemComponent from "@/components/notifications/NotificationItem";
import MarkAllAsReadButton from "@/components/notifications/MarkAllAsReadButton";
import NotificationSkeleton from "@/components/loading/NotificationSkeleton";
import { Bell, Inbox, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button"; // Import the Button component

// Define a type for our pagination state
interface PaginationInfo {
  totalPages: number;
  isFirst: boolean;
  isLast: boolean;
}

export default function NotificationsPage() {
  const token = useAccessToken();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unread, setUnread] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  // --- New Pagination State ---
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const NOTIFICATIONS_PER_PAGE = 15; // Set a page size

  // --- Updated Data Fetching Logic ---
  useEffect(() => {
    if (!token) return;
    let mounted = true;
    setLoading(true);
    setError(null);
    window.scrollTo(0, 0); // Scroll to top on page change

    (async () => {
      const res = await getNotifications(token, {
        page: currentPage,
        size: NOTIFICATIONS_PER_PAGE,
      });
      if (!mounted) return;
      setLoading(false);

      if (!res.success) {
        setError(res.error || "Failed to load notifications");
        setItems([]); // Clear items on error
        setPagination(null); // Clear pagination on error
        return;
      }

      const payload = res.data;

      if (payload) {
        setItems(payload.notifications.content || []);
        setUnread(payload.unreadCount || 0);
        // Store pagination details
        setPagination({
          totalPages: payload.notifications.totalPages,
          isFirst: payload.notifications.first,
          isLast: payload.notifications.last,
        });
      }
    })();

    return () => {
      mounted = false;
    };
  }, [token, currentPage]); // Re-run effect when currentPage changes

  // --- New Page Change Handler ---
  const handlePageChange = (newPage: number) => {
    if (newPage >= 0 && (!pagination || newPage < pagination.totalPages)) {
      setCurrentPage(newPage);
    }
  };

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
              {/* Total count is now from pagination, not items.length */}
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  Total
                </span>
                <span className="px-3 py-1 bg-neutral-100 dark:bg-zinc-700 rounded-full text-sm font-semibold text-neutral-900 dark:text-white">
                  {pagination ? pagination.totalPages * NOTIFICATIONS_PER_PAGE : items.length}
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
          {/* Skeleton Loader */}
          {loading && (
            <div className="divide-y divide-neutral-200 dark:divide-zinc-700">
              {Array.from({ length: 6 }).map((_, i) => (
                <NotificationSkeleton key={i} />
              ))}
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
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

          {/* Empty State */}
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

          {/* Notifications */}
          {!loading && !error && items.length > 0 && (
            <ul className="divide-y divide-neutral-200 dark:divide-zinc-700">
              {items.map((n) => (
                <NotificationItemComponent
                  key={n.notificationId}
                  item={n}
                  token={token}
                  onRemoved={(id) =>
                    setItems((prev) =>
                      prev.filter((x) => x.notificationId !== id)
                    )
                  }
                  onUpdated={(updated) =>
                    setItems((prev) =>
                      prev.map((x) =>
                        x.notificationId === updated.notificationId
                          ? updated
                          : x
                      )
                    )
                  }
                />
              ))}
            </ul>
          )}
        </div>

        {/* --- New Pagination Controls --- */}
        {!loading && pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between mt-6 p-4 bg-white dark:bg-zinc-800 rounded-xl shadow-sm border border-neutral-200 dark:border-zinc-700">
            <Button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={pagination.isFirst}
              variant="outline"
              className="dark:bg-zinc-700 dark:hover:bg-zinc-600 dark:border-zinc-600"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>
            <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
              Page {currentPage + 1} of {pagination.totalPages}
            </span>
            <Button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={pagination.isLast}
              variant="outline"
              className="dark:bg-zinc-700 dark:hover:bg-zinc-600 dark:border-zinc-600"
            >
              Next
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
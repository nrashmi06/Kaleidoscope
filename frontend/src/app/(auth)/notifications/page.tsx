"use client";

import React, { useEffect, useState } from "react";
import { useAccessToken } from "@/hooks/useAccessToken";
import { getNotifications } from "@/controllers/notificationController/notificationsController";
import type { NotificationItem } from "@/lib/types/notifications";
import NotificationItemComponent from "@/components/notifications/NotificationItem";
import MarkAllAsReadButton from "@/components/notifications/MarkAllAsReadButton";
import NotificationSkeleton from "@/components/loading/NotificationSkeleton";
import { Bell, Inbox, ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationInfo {
  totalPages: number;
  isFirst: boolean;
  isLast: boolean;
}

const NOTIFICATIONS_PER_PAGE = 15;

export default function NotificationsPage() {
  const token = useAccessToken();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unread, setUnread] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);

  useEffect(() => {
    if (!token) return;
    let mounted = true;
    setLoading(true);
    setError(null);
    window.scrollTo(0, 0);

    (async () => {
      const res = await getNotifications(token, {
        page: currentPage,
        size: NOTIFICATIONS_PER_PAGE,
      });
      if (!mounted) return;
      setLoading(false);

      if (!res.success) {
        setError(res.error || "Failed to load notifications");
        setItems([]);
        setPagination(null);
        return;
      }

      const payload = res.data;
      if (payload) {
        setItems(payload.notifications.content || []);
        setUnread(payload.unreadCount || 0);
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
  }, [token, currentPage]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 0 && (!pagination || newPage < pagination.totalPages)) {
      setCurrentPage(newPage);
    }
  };

  const getPageNumbers = () => {
    if (!pagination) return [];
    const total = pagination.totalPages;
    const current = currentPage;
    const pages: (number | "...")[] = [];
    if (total <= 5) {
      for (let i = 0; i < total; i++) pages.push(i);
    } else {
      pages.push(0);
      if (current > 2) pages.push("...");
      for (let i = Math.max(1, current - 1); i <= Math.min(total - 2, current + 1); i++) pages.push(i);
      if (current < total - 3) pages.push("...");
      pages.push(total - 1);
    }
    return pages;
  };

  return (
    <div className="w-full">
      {/* ── Header ── */}
      <div className="pt-6 pb-5 px-1">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-display font-bold text-navy dark:text-cream tracking-tight">
              Notifications
            </h1>
            {!loading && (
              <div className="flex items-center gap-2 mt-1 text-sm">
                {unread > 0 && (
                  <span className="text-steel/60 dark:text-sky/40 font-medium">
                    {unread} unread
                  </span>
                )}
                {pagination && pagination.totalPages > 1 && (
                  <span className="text-steel/35 dark:text-sky/20">
                    · Page {currentPage + 1} of {pagination.totalPages}
                  </span>
                )}
              </div>
            )}
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

      {/* ── Notifications List ── */}
      <div className="space-y-2">
        {/* Loading */}
        {loading &&
          Array.from({ length: 6 }).map((_, i) => (
            <NotificationSkeleton key={i} />
          ))}

        {/* Error */}
        {error && !loading && (
          <div className="flex flex-col items-center justify-center text-center py-20 px-6">
            <div className="flex items-center justify-center w-14 h-14 rounded-full bg-red-50 dark:bg-red-950/20 mb-5">
              <span className="text-2xl">⚠️</span>
            </div>
            <h3 className="text-lg font-display font-semibold text-navy dark:text-cream mb-2">
              Failed to Load
            </h3>
            <p className="text-sm text-navy/40 dark:text-cream/35">
              {error}
            </p>
          </div>
        )}

        {/* Empty */}
        {!loading && !error && items.length === 0 && (
          <div className="flex flex-col items-center justify-center text-center py-20 px-6">
            <div className="flex items-center justify-center w-14 h-14 rounded-full bg-cream-300/30 dark:bg-navy-700/30 mb-5">
              <Inbox className="w-6 h-6 text-navy/25 dark:text-cream/25" />
            </div>
            <h3 className="text-lg font-display font-semibold text-navy dark:text-cream mb-2">
              All caught up!
            </h3>
            <p className="text-sm text-navy/40 dark:text-cream/35">
              You don&apos;t have any notifications right now.
            </p>
          </div>
        )}

        {/* Items */}
        {!loading &&
          !error &&
          items.length > 0 &&
          items.map((n) => (
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
                    x.notificationId === updated.notificationId ? updated : x
                  )
                )
              }
            />
          ))}
      </div>

      {/* ── Pagination ── */}
      {!loading && pagination && pagination.totalPages > 1 && (
        <div className="mt-12 flex items-center justify-center gap-1">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={pagination.isFirst}
            className="flex items-center justify-center w-10 h-10 rounded-full text-navy/50 dark:text-cream/40 hover:text-navy dark:hover:text-cream hover:bg-cream-300/40 dark:hover:bg-navy-700/40 disabled:opacity-20 disabled:pointer-events-none transition-all cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {getPageNumbers().map((page, idx) =>
            page === "..." ? (
              <span
                key={`dots-${idx}`}
                className="w-10 h-10 flex items-center justify-center text-sm text-navy/25 dark:text-cream/20"
              >
                ...
              </span>
            ) : (
              <button
                key={page}
                onClick={() => handlePageChange(page as number)}
                className={`w-10 h-10 rounded-full text-sm font-medium transition-all duration-200 cursor-pointer ${
                  currentPage === page
                    ? "bg-navy dark:bg-cream text-cream-50 dark:text-navy"
                    : "text-navy/50 dark:text-cream/40 hover:text-navy dark:hover:text-cream hover:bg-cream-300/40 dark:hover:bg-navy-700/40"
                }`}
              >
                {(page as number) + 1}
              </button>
            )
          )}

          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={pagination.isLast}
            className="flex items-center justify-center w-10 h-10 rounded-full text-navy/50 dark:text-cream/40 hover:text-navy dark:hover:text-cream hover:bg-cream-300/40 dark:hover:bg-navy-700/40 disabled:opacity-20 disabled:pointer-events-none transition-all cursor-pointer"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
}

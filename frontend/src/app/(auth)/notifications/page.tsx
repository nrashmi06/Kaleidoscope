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
    <div className="w-full max-w-4xl mx-auto px-4 py-6 relative">
      {/* Ambient background glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-32 right-1/4 w-[400px] h-[400px] bg-steel/[0.04] dark:bg-steel/[0.03] rounded-full blur-[100px]" />
        <div className="absolute bottom-1/3 left-[10%] w-80 h-80 bg-sky/[0.05] dark:bg-sky/[0.02] rounded-full blur-[80px]" />
      </div>

      {/* ── Header ── */}
      <div className="mb-6">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-steel to-steel-600 shadow-lg shadow-steel/25 dark:shadow-steel/15 dark:from-sky dark:to-steel">
              <Bell className="w-5 h-5 text-cream-50" />
            </div>
            <div>
              <h1 className="text-xl font-display font-bold text-navy dark:text-cream tracking-tight">
                Notifications
              </h1>
              {!loading && (
                <div className="flex items-center gap-2 text-[11px] tabular-nums">
                  {unread > 0 && (
                    <span className="text-steel dark:text-sky font-semibold">
                      {unread} unread
                    </span>
                  )}
                  {pagination && pagination.totalPages > 1 && (
                    <span className="text-steel/50 dark:text-sky/40">
                      · Page {currentPage + 1} of {pagination.totalPages}
                    </span>
                  )}
                </div>
              )}
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

        {/* Gradient divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-cream-400/30 dark:via-navy-700/40 to-transparent" />
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
          <div className="flex flex-col items-center justify-center text-center py-16 px-6 rounded-2xl border border-red-200/60 dark:border-red-900/30 bg-red-50/50 dark:bg-red-950/10 backdrop-blur-sm">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/20 mb-4">
              <span className="text-2xl">⚠️</span>
            </div>
            <h3 className="text-base font-display font-semibold text-red-700 dark:text-red-300 mb-1.5">
              Failed to Load
            </h3>
            <p className="text-sm text-red-600/80 dark:text-red-400/80">
              {error}
            </p>
          </div>
        )}

        {/* Empty */}
        {!loading && !error && items.length === 0 && (
          <div className="flex flex-col items-center justify-center text-center py-16 px-6 rounded-2xl border border-dashed border-cream-300 dark:border-navy-700 bg-cream-50/50 dark:bg-navy/50 backdrop-blur-sm">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-cream-300/50 dark:bg-navy-700/50 border border-cream-400/40 dark:border-navy-600/40 mb-4">
              <Inbox className="w-6 h-6 text-steel dark:text-sky/60" />
            </div>
            <h3 className="text-base font-display font-semibold text-navy dark:text-cream mb-1.5">
              All caught up!
            </h3>
            <p className="text-sm text-steel dark:text-sky/60">
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
        <div className="mt-8 flex items-center justify-center gap-1.5">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={pagination.isFirst}
            className="flex items-center justify-center w-9 h-9 rounded-xl text-steel dark:text-sky/70 hover:bg-cream-300/40 dark:hover:bg-navy-700/40 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {getPageNumbers().map((page, idx) =>
            page === "..." ? (
              <span
                key={`dots-${idx}`}
                className="w-9 h-9 flex items-center justify-center text-xs text-steel/50 dark:text-sky/30"
              >
                ...
              </span>
            ) : (
              <button
                key={page}
                onClick={() => handlePageChange(page as number)}
                className={`w-9 h-9 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  currentPage === page
                    ? "bg-steel text-cream-50 shadow-sm shadow-steel/20 dark:bg-sky dark:text-navy dark:shadow-sky/15"
                    : "text-navy/70 dark:text-cream/60 hover:bg-cream-300/40 dark:hover:bg-navy-700/40"
                }`}
              >
                {(page as number) + 1}
              </button>
            )
          )}

          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={pagination.isLast}
            className="flex items-center justify-center w-9 h-9 rounded-xl text-steel dark:text-sky/70 hover:bg-cream-300/40 dark:hover:bg-navy-700/40 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

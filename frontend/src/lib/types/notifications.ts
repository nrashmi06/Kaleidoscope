// src/lib/types/notifications.ts

// ✅ 1. IMPORT 'PaginatedResponse' from './post'
import type { PaginatedResponse } from "./post";


export interface StandardAPIResponse<T> {
  success: boolean;
  data: T | null;
  errors: string[];
  message: string;
  timestamp: number;
  path: string;
}


// Backend returns flattened actor fields
export interface NotificationItem {
  notificationId: number;
  type: string;
  message: string;
  link?: string | null;
  isRead: boolean;
  createdAt: string;
  actorUserId?: number | null;
  actorUsername?: string | null;
  actorProfilePictureUrl?: string | null;
  contentId?: number | null;
  contentType?: string | null;
}

// ✅ 3. EXPORT this interface so the controller can use it
export interface NotificationsPagePayload {
  unreadCount: number;
  notifications: PaginatedResponse<NotificationItem>;
}

/**
 * The full API response from GET /api/notifications
 * (Using 'type' alias to fix the ESLint error)
 */
export type GetNotificationsResponse =
  StandardAPIResponse<NotificationsPagePayload>;

export interface GetNotificationsParams {
  page?: number;
  size?: number;
  isRead?: boolean;
}

// Response type for PATCH /notifications/read-all
export type MarkAllReadResponse = StandardAPIResponse<Record<string, string>>;

// Response type for a single notification (e.g., mark as read)
export type GetNotificationResponse = StandardAPIResponse<NotificationItem>;
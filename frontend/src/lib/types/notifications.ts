import { StandardAPIResponse } from "@/lib/types/auth";

// Backend returns flattened actor fields (actorUserId, actorUsername, actorProfilePictureUrl)
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

export interface NotificationsPage {
  content: NotificationItem[];
  page: number;
  size: number;
  totalPages: number;
  totalElements: number;
  first: boolean;
  last: boolean;
}

export interface NotificationsPagePayload {
  unreadCount: number;
  notifications: NotificationsPage;
}

// API returns the standard wrapper with data: NotificationsPagePayload
export type GetNotificationsResponse = StandardAPIResponse<NotificationsPagePayload>;

export interface GetNotificationsParams {
  page?: number;
  size?: number;
  isRead?: boolean;
}

// Response type for PATCH /notifications/read-all
export type MarkAllReadResponse = StandardAPIResponse<Record<string, string>>;


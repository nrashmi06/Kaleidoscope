import fetchNotificationsService from "@/services/notifications/fetchNotifications";
import markAsReadService from "@/services/notifications/markAsRead";
import deleteNotificationService from "@/services/notifications/deleteNotification";
import markAllAsReadService from "@/services/notifications/markAllAsRead";
import type { GetNotificationsResponse, NotificationItem } from "@/lib/types/notifications";

export const getNotifications = async (
  accessToken: string,
  options?: { page?: number; size?: number; isRead?: boolean }
): Promise<{ success: boolean; data?: GetNotificationsResponse; error?: string }> => {
  return await fetchNotificationsService(accessToken, options);
};

export const markAsRead = async (
  accessToken: string,
  notificationId: number
): Promise<{ success: boolean; data?: NotificationItem; error?: string }> => {
  return await markAsReadService(accessToken, notificationId);
};

export const deleteNotification = async (
  accessToken: string,
  notificationId: number
): Promise<{ success: boolean; data?: string; error?: string }> => {
  return await deleteNotificationService(accessToken, notificationId);
};

export const markAllAsRead = async (
  accessToken: string
): Promise<{ success: boolean; data?: Record<string, string> | undefined; error?: string }> => {
  return await markAllAsReadService(accessToken);
};

const NotificationsController = { getNotifications, markAsRead, deleteNotification, markAllAsRead };
export default NotificationsController;

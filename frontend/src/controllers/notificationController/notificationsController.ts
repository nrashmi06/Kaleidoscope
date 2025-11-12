// src/controllers/notificationController/notificationsController.ts

import { getNotificationsService } from "@/services/notifications/fetchNotifications";
import { markAsReadService } from "@/services/notifications/markAsRead";
import { deleteNotificationService } from "@/services/notifications/deleteNotification";
import { markAllAsReadService } from "@/services/notifications/markAllAsRead";
import type {
  GetNotificationsResponse,
  NotificationItem,
  NotificationsPagePayload, // ✅ 1. Import the nested data type
  GetNotificationResponse,
  MarkAllReadResponse,
} from "@/lib/types/notifications";
import type { StandardAPIResponse } from "@/lib/types/auth";

/**
 * Fetches the user's notifications and maps the response.
 */
export const getNotifications = async (
  token: string,
  params: { page: number; size: number }
): Promise<{
  // ✅ 2. This is the simple return type for the component
  success: boolean;
  data: NotificationsPagePayload | null;
  error?: string;
}> => {
  try {
    // 1. Get the full response from the service
    const responseData: GetNotificationsResponse =
      await getNotificationsService(token, params);

    // 2. Map it to the simple object
    if (responseData.success) {
      return { success: true, data: responseData.data };
    } else {
      return { success: false, data: null, error: responseData.message };
    }
  } catch (error) {
    return {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : "An unknown error",
    };
  }
};

/**
 * Marks a single notification as read and maps the response.
 */
export const markAsRead = async (
  token: string,
  notificationId: number
): Promise<{ success: boolean; data?: NotificationItem | null; error?: string }> => {
  try {
    const res: GetNotificationResponse = await markAsReadService(
      token,
      notificationId
    );
    if (res.success) {
      return { success: true, data: res.data };
    }
    return { success: false, error: res.message };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unknown error",
    };
  }
};

/**
 * Deletes a single notification and maps the response.
 */
export const deleteNotification = async (
  token: string,
  notificationId: number
): Promise<{ success: boolean; data?: null; error?: string }> => {
  try {
    const res: StandardAPIResponse<null> = await deleteNotificationService(
      token,
      notificationId
    );
    if (res.success) {
      return { success: true, data: null };
    }
    return { success: false, error: res.message };
  } catch (error) {
    return {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : "An unknown error",
    };
  }
};

/**
 * Marks all of user's notifications as read.
 */
export const markAllAsRead = async (
  token: string
): Promise<{ success: boolean; data?: Record<string, string> | null; error?: string }> => {
  try {
    const res: MarkAllReadResponse = await markAllAsReadService(token);
    if (res.success) {
      return { success: true, data: res.data };
    }
    return { success: false, error: res.message };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unknown error",
    };
  }
};
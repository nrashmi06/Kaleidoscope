import {
  getNotificationPreferencesService,
  updateNotificationPreferencesService,
  updateChannelPreferencesService,
  resetNotificationPreferencesService,
  toggleAllEmailService,
  toggleAllPushService,
  NotificationPreferencesData,
  ChannelPreferences,
} from "@/services/notification-preferences/notificationPreferencesService";

interface ControllerResponse {
  success: boolean;
  message: string;
  data?: unknown;
}

export async function getNotificationPreferencesController(
  accessToken: string
): Promise<ControllerResponse> {
  if (!accessToken) return { success: false, message: "Not authenticated." };
  try {
    const res = await getNotificationPreferencesService(accessToken);
    return {
      success: res.success,
      message:
        res.message ||
        (res.success
          ? "Notification preferences loaded."
          : "Failed to load notification preferences."),
      data: res.data,
    };
  } catch {
    return { success: false, message: "An unexpected error occurred." };
  }
}

export async function updateNotificationPreferencesController(
  accessToken: string,
  data: NotificationPreferencesData
): Promise<ControllerResponse> {
  if (!accessToken) return { success: false, message: "Not authenticated." };
  try {
    const res = await updateNotificationPreferencesService(accessToken, data);
    return {
      success: res.success,
      message:
        res.message ||
        (res.success
          ? "Notification preferences updated."
          : "Failed to update notification preferences."),
      data: res.data,
    };
  } catch {
    return { success: false, message: "An unexpected error occurred." };
  }
}

export async function updateChannelPreferencesController(
  accessToken: string,
  channel: string,
  data: ChannelPreferences
): Promise<ControllerResponse> {
  if (!accessToken) return { success: false, message: "Not authenticated." };
  try {
    const res = await updateChannelPreferencesService(
      accessToken,
      channel,
      data
    );
    return {
      success: res.success,
      message:
        res.message ||
        (res.success
          ? `${channel} preferences updated.`
          : `Failed to update ${channel} preferences.`),
      data: res.data,
    };
  } catch {
    return { success: false, message: "An unexpected error occurred." };
  }
}

export async function resetNotificationPreferencesController(
  accessToken: string
): Promise<ControllerResponse> {
  if (!accessToken) return { success: false, message: "Not authenticated." };
  try {
    const res = await resetNotificationPreferencesService(accessToken);
    return {
      success: res.success,
      message:
        res.message ||
        (res.success
          ? "Notification preferences reset to defaults."
          : "Failed to reset notification preferences."),
      data: res.data,
    };
  } catch {
    return { success: false, message: "An unexpected error occurred." };
  }
}

export async function toggleAllEmailController(
  accessToken: string,
  enable: boolean
): Promise<ControllerResponse> {
  if (!accessToken) return { success: false, message: "Not authenticated." };
  try {
    const res = await toggleAllEmailService(accessToken, enable);
    return {
      success: res.success,
      message:
        res.message ||
        (res.success
          ? `All email notifications ${enable ? "enabled" : "disabled"}.`
          : `Failed to ${enable ? "enable" : "disable"} all email notifications.`),
      data: res.data,
    };
  } catch {
    return { success: false, message: "An unexpected error occurred." };
  }
}

export async function toggleAllPushController(
  accessToken: string,
  enable: boolean
): Promise<ControllerResponse> {
  if (!accessToken) return { success: false, message: "Not authenticated." };
  try {
    const res = await toggleAllPushService(accessToken, enable);
    return {
      success: res.success,
      message:
        res.message ||
        (res.success
          ? `All push notifications ${enable ? "enabled" : "disabled"}.`
          : `Failed to ${enable ? "enable" : "disable"} all push notifications.`),
      data: res.data,
    };
  } catch {
    return { success: false, message: "An unexpected error occurred." };
  }
}

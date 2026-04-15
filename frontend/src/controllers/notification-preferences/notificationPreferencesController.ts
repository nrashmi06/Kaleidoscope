import {
  getNotificationPreferencesService,
  patchNotificationPreferencesService,
  resetNotificationPreferencesService,
  type PartialNotificationPreferences,
} from "@/services/notification-preferences/notificationPreferencesService";

interface ControllerResponse {
  success: boolean;
  message: string;
  data?: unknown;
}

/** GET current user's notification preferences */
export async function getNotificationPreferencesController(
  accessToken: string
): Promise<ControllerResponse> {
  if (!accessToken) return { success: false, message: "Not authenticated." };
  try {
    const res = await getNotificationPreferencesService(accessToken);
    return {
      success: res.success,
      message: res.message || (res.success ? "Loaded." : "Failed to load."),
      data: res.data,
    };
  } catch {
    return { success: false, message: "An unexpected error occurred." };
  }
}

/** PATCH — update any subset of preference fields */
export async function updateChannelPreferencesController(
  accessToken: string,
  channel: string,
  data: { email: boolean; push: boolean }
): Promise<ControllerResponse> {
  if (!accessToken) return { success: false, message: "Not authenticated." };

  // Map channel + email/push to the flat field names the backend expects
  const patch: PartialNotificationPreferences = {
    [`${channel}Email`]: data.email,
    [`${channel}Push`]: data.push,
  } as PartialNotificationPreferences;

  try {
    const res = await patchNotificationPreferencesService(accessToken, patch);
    return {
      success: res.success,
      message: res.message || (res.success ? `${channel} updated.` : `Failed to update ${channel}.`),
      data: res.data,
    };
  } catch {
    return { success: false, message: "An unexpected error occurred." };
  }
}

/** PATCH — toggle all email fields at once */
export async function toggleAllEmailController(
  accessToken: string,
  enable: boolean
): Promise<ControllerResponse> {
  if (!accessToken) return { success: false, message: "Not authenticated." };

  const patch: PartialNotificationPreferences = {
    commentsEmail: enable,
    likesEmail: enable,
    followsEmail: enable,
    mentionsEmail: enable,
    systemEmail: enable,
  };

  try {
    const res = await patchNotificationPreferencesService(accessToken, patch);
    return {
      success: res.success,
      message: res.message || (res.success
        ? `All email notifications ${enable ? "enabled" : "disabled"}.`
        : "Failed to update."),
      data: res.data,
    };
  } catch {
    return { success: false, message: "An unexpected error occurred." };
  }
}

/** PATCH — toggle all push fields at once */
export async function toggleAllPushController(
  accessToken: string,
  enable: boolean
): Promise<ControllerResponse> {
  if (!accessToken) return { success: false, message: "Not authenticated." };

  const patch: PartialNotificationPreferences = {
    commentsPush: enable,
    likesPush: enable,
    followsPush: enable,
    mentionsPush: enable,
    systemPush: enable,
    followRequestPush: enable,
    followAcceptPush: enable,
  };

  try {
    const res = await patchNotificationPreferencesService(accessToken, patch);
    return {
      success: res.success,
      message: res.message || (res.success
        ? `All push notifications ${enable ? "enabled" : "disabled"}.`
        : "Failed to update."),
      data: res.data,
    };
  } catch {
    return { success: false, message: "An unexpected error occurred." };
  }
}

/** POST — reset to defaults */
export async function resetNotificationPreferencesController(
  accessToken: string
): Promise<ControllerResponse> {
  if (!accessToken) return { success: false, message: "Not authenticated." };
  try {
    const res = await resetNotificationPreferencesService(accessToken);
    return {
      success: res.success,
      message: res.message || (res.success ? "Reset to defaults." : "Failed to reset."),
      data: res.data,
    };
  } catch {
    return { success: false, message: "An unexpected error occurred." };
  }
}

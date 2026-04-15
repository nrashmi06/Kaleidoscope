import { axiosInstance, isAxiosError, AxiosError } from "@/hooks/axios";
import { UserNotificationPreferencesMapper } from "@/mapper/user-notification-preferences";

// ── Types ──────────────────────────────────────────────────────────────────────

/**
 * Flat field names matching the backend DTO:
 *   likesEmail, likesPush, commentsEmail, commentsPush,
 *   followsEmail, followsPush, mentionsEmail, mentionsPush,
 *   systemEmail, systemPush, followRequestPush, followAcceptPush
 */
export interface NotificationPreferencesFlat {
  likesEmail: boolean;
  likesPush: boolean;
  commentsEmail: boolean;
  commentsPush: boolean;
  followsEmail: boolean;
  followsPush: boolean;
  mentionsEmail: boolean;
  mentionsPush: boolean;
  systemEmail: boolean;
  systemPush: boolean;
  followRequestPush: boolean;
  followAcceptPush: boolean;
}

export type PartialNotificationPreferences = Partial<NotificationPreferencesFlat>;

interface StandardResponse {
  success: boolean;
  message: string;
  data: unknown;
  errors: string[];
  timestamp: number;
  path: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function buildErrorResponse(url: string, error: unknown): StandardResponse {
  if (isAxiosError(error)) {
    const axiosError = error as AxiosError<StandardResponse>;
    return (
      axiosError.response?.data || {
        success: false,
        message: "Request failed",
        data: null,
        errors: [axiosError.message],
        timestamp: Date.now(),
        path: url,
      }
    );
  }
  return {
    success: false,
    message: error instanceof Error ? error.message : "Unexpected error",
    data: null,
    errors: ["Unknown error"],
    timestamp: Date.now(),
    path: url,
  };
}

// ── Service Functions ──────────────────────────────────────────────────────────

/** GET /api/user-notification-preferences */
export async function getNotificationPreferencesService(
  accessToken: string
): Promise<StandardResponse> {
  const url = UserNotificationPreferencesMapper.getNotificationPreferences;
  try {
    const response = await axiosInstance.get<StandardResponse>(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return response.data;
  } catch (error: unknown) {
    return buildErrorResponse(url, error);
  }
}

/** PATCH /api/user-notification-preferences — partial update (any subset of fields) */
export async function patchNotificationPreferencesService(
  accessToken: string,
  data: PartialNotificationPreferences
): Promise<StandardResponse> {
  const url = UserNotificationPreferencesMapper.partialUpdateNotificationPreferences;
  try {
    const response = await axiosInstance.patch<StandardResponse>(url, data, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return response.data;
  } catch (error: unknown) {
    return buildErrorResponse(url, error);
  }
}

/** PUT /api/user-notification-preferences — full update (all fields required) */
export async function updateNotificationPreferencesService(
  accessToken: string,
  data: NotificationPreferencesFlat
): Promise<StandardResponse> {
  const url = UserNotificationPreferencesMapper.updateNotificationPreferences;
  try {
    const response = await axiosInstance.put<StandardResponse>(url, data, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return response.data;
  } catch (error: unknown) {
    return buildErrorResponse(url, error);
  }
}

/** POST /api/user-notification-preferences/reset */
export async function resetNotificationPreferencesService(
  accessToken: string
): Promise<StandardResponse> {
  const url = UserNotificationPreferencesMapper.resetToDefaults;
  try {
    const response = await axiosInstance.post<StandardResponse>(url, {}, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return response.data;
  } catch (error: unknown) {
    return buildErrorResponse(url, error);
  }
}

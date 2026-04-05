import { axiosInstance, isAxiosError, AxiosError } from "@/hooks/axios";
import { UserNotificationPreferencesMapper } from "@/mapper/user-notification-preferences";

// ── Types ──────────────────────────────────────────────────────────────────────

export interface ChannelPreferences {
  email: boolean;
  push: boolean;
}

export interface NotificationPreferencesData {
  comments: ChannelPreferences;
  likes: ChannelPreferences;
  follows: ChannelPreferences;
  mentions: ChannelPreferences;
  system: ChannelPreferences;
}

interface StandardResponse {
  success: boolean;
  message: string;
  data: unknown;
  errors: string[];
  timestamp: number;
  path: string;
}

// Channel name to mapper key mapping
const channelEndpointMap: Record<string, string> = {
  comments: UserNotificationPreferencesMapper.updateCommentsPreferences,
  likes: UserNotificationPreferencesMapper.updateLikesPreferences,
  follows: UserNotificationPreferencesMapper.updateFollowsPreferences,
  mentions: UserNotificationPreferencesMapper.updateMentionsPreferences,
  system: UserNotificationPreferencesMapper.updateSystemPreferences,
};

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

export async function updateNotificationPreferencesService(
  accessToken: string,
  data: NotificationPreferencesData
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

export async function updateChannelPreferencesService(
  accessToken: string,
  channel: string,
  data: ChannelPreferences
): Promise<StandardResponse> {
  const url = channelEndpointMap[channel];

  if (!url) {
    return {
      success: false,
      message: `Unknown notification channel: ${channel}`,
      data: null,
      errors: [`Invalid channel: ${channel}`],
      timestamp: Date.now(),
      path: "",
    };
  }

  try {
    const response = await axiosInstance.patch<StandardResponse>(url, data, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return response.data;
  } catch (error: unknown) {
    return buildErrorResponse(url, error);
  }
}

export async function resetNotificationPreferencesService(
  accessToken: string
): Promise<StandardResponse> {
  const url = UserNotificationPreferencesMapper.resetToDefaults;

  try {
    const response = await axiosInstance.post<StandardResponse>(
      url,
      {},
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );
    return response.data;
  } catch (error: unknown) {
    return buildErrorResponse(url, error);
  }
}

export async function toggleAllEmailService(
  accessToken: string,
  enable: boolean
): Promise<StandardResponse> {
  const url = enable
    ? UserNotificationPreferencesMapper.enableAllEmail
    : UserNotificationPreferencesMapper.disableAllEmail;

  try {
    const response = await axiosInstance.patch<StandardResponse>(
      url,
      {},
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );
    return response.data;
  } catch (error: unknown) {
    return buildErrorResponse(url, error);
  }
}

export async function toggleAllPushService(
  accessToken: string,
  enable: boolean
): Promise<StandardResponse> {
  const url = enable
    ? UserNotificationPreferencesMapper.enableAllPush
    : UserNotificationPreferencesMapper.disableAllPush;

  try {
    const response = await axiosInstance.patch<StandardResponse>(
      url,
      {},
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );
    return response.data;
  } catch (error: unknown) {
    return buildErrorResponse(url, error);
  }
}

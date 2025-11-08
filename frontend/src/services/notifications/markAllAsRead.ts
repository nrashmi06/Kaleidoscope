import NotificationMapper from "@/mapper/notificationMapper";
import type { MarkAllReadResponse } from "@/lib/types/notifications";

export const markAllAsReadService = async (
  accessToken: string
): Promise<{ success: boolean; data?: MarkAllReadResponse['data']; error?: string }> => {
  try {
    const url = NotificationMapper.markAllAsRead;
    const res = await fetch(url, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!res.ok) {
      const body = await res.text();
      return { success: false, error: body || `HTTP ${res.status}` };
    }

    const json = await res.json();
    return { success: true, data: json.data };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
};

export default markAllAsReadService;

import NotificationMapper from "@/mapper/notificationMapper";
import type { NotificationItem } from "@/lib/types/notifications";

export const markAsReadService = async (
  accessToken: string,
  notificationId: number
): Promise<{ success: boolean; data?: NotificationItem; error?: string }> => {
  try {
    const url = NotificationMapper.markAsRead(notificationId);
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

export default markAsReadService;

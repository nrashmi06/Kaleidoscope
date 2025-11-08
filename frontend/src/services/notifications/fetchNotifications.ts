import { NotificationMapper } from "@/mapper/notificationMapper";
import type { GetNotificationsResponse } from "@/lib/types/notifications";

export const fetchNotificationsService = async (
  accessToken: string,
  options?: { page?: number; size?: number; isRead?: boolean }
): Promise<{ success: boolean; data?: GetNotificationsResponse; error?: string }> => {
  try {
    const params = new URLSearchParams();
    if (options?.page !== undefined) params.append("page", String(options.page));
    if (options?.size !== undefined) params.append("size", String(options.size));
    if (options?.isRead !== undefined) params.append("isRead", String(options.isRead));

    const url = `${NotificationMapper.getNotifications}${params.toString() ? `?${params.toString()}` : ""}`;

    const res = await fetch(url, {
      method: "GET",
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
    return { success: true, data: json };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
};

export default fetchNotificationsService;

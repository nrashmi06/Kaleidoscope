import NotificationMapper from "@/mapper/notificationMapper";

export const deleteNotificationService = async (
  accessToken: string,
  notificationId: number
): Promise<{ success: boolean; data?: string; error?: string }> => {
  try {
    const url = NotificationMapper.deleteNotification(notificationId);
    const res = await fetch(url, {
      method: "DELETE",
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
    // backend returns data as a string on success
    return { success: true, data: json.data };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
};

export default deleteNotificationService;

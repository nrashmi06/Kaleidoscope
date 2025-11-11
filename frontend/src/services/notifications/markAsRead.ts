import NotificationMapper from "@/mapper/notificationMapper";
import type { NotificationItem } from "@/lib/types/notifications";

import { axiosInstance, isAxiosError, AxiosError } from "@/hooks/axios";
import type { StandardAPIResponse } from "@/lib/types/auth";

// Define the expected API response type
type MarkAsReadApiResponse = StandardAPIResponse<NotificationItem>;

export const markAsReadService = async (
  accessToken: string,
  notificationId: number
): Promise<{ success: boolean; data?: NotificationItem; error?: string }> => {
  try {
    // ✅ 3. Token check
    if (!accessToken) {
      return { success: false, error: "Authentication token is missing." };
    }

    const url = NotificationMapper.markAsRead(notificationId);

    // ✅ 4. Call axiosInstance.patch
    // Pass 'null' as the request body, as this endpoint likely doesn't send one.
    const res = await axiosInstance.patch<MarkAsReadApiResponse>(url, null, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const responseData = res.data;

    // ✅ 5. Check backend-defined success flag
    if (!responseData.success) {
      return { success: false, error: responseData.message || "Failed to mark as read" };
    }

    // Return the nested 'data' property (the updated NotificationItem)
    return { success: true, data: responseData.data || undefined };

  } catch (err) {
    // ✅ 6. Use isAxiosError to handle non-2xx responses
    if (isAxiosError(err)) {
      const error = err as AxiosError<MarkAsReadApiResponse>;
      const responseData = error.response?.data;

      // Return the error message from the backend payload, or a fallback
      return { success: false, error: responseData?.message || `HTTP ${error.response?.status}` };
    }
    
    // Fallback for non-network errors
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
};

export default markAsReadService;
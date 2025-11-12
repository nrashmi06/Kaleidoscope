import NotificationMapper from "@/mapper/notificationMapper";
// ✅ 1. Import the response type (assuming it's the StandardAPIResponse wrapper)
import type { MarkAllReadResponse } from "@/lib/types/notifications";
// ✅ 2. Import axios instance and error types
import { axiosInstance, isAxiosError, AxiosError } from "@/hooks/axios";

export const markAllAsReadService = async (
  accessToken: string
): Promise<{ success: boolean; data?: MarkAllReadResponse['data']; error?: string }> => {
  try {
    // ✅ 3. Token check
    if (!accessToken) {
      return { success: false, error: "Authentication token is missing." };
    }

    const url = NotificationMapper.markAllAsRead;

    // ✅ 4. Call axiosInstance.patch
    // We pass 'null' as the request body since PATCH expects one, but this endpoint doesn't send data.
    const res = await axiosInstance.patch<MarkAllReadResponse>(url, null, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const responseData = res.data;

    // ✅ 5. Check backend-defined success flag
    if (!responseData.success) {
      return { success: false, error: responseData.message || "Failed to mark all as read" };
    }

    // Return the nested 'data' property
    return { success: true, data: responseData.data || undefined };

  } catch (err) {
    // ✅ 6. Use isAxiosError to handle non-2xx responses
    if (isAxiosError(err)) {
      const error = err as AxiosError<MarkAllReadResponse>;
      const responseData = error.response?.data;

      // Return the error message from the backend payload, or a fallback
      return { success: false, error: responseData?.message || `HTTP ${error.response?.status}` };
    }
    
    // Fallback for non-network errors
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
};

export default markAllAsReadService;
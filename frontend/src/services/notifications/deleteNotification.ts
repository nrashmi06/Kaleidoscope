import NotificationMapper from "@/mapper/notificationMapper";
// ✅ 1. Import axios instance and error types
import { axiosInstance, isAxiosError, AxiosError } from "@/hooks/axios";
// ✅ 2. Import the standard response wrapper to type the API response
import type { StandardAPIResponse } from "@/lib/types/auth";

// Define the expected API response type (data is a string)
type DeleteNotificationApiResponse = StandardAPIResponse<string>;

export const deleteNotificationService = async (
  accessToken: string,
  notificationId: number
): Promise<{ success: boolean; data?: string; error?: string }> => {
  try {
    // ✅ 3. Token check
    if (!accessToken) {
      return { success: false, error: "Authentication token is missing." };
    }

    const url = NotificationMapper.deleteNotification(notificationId);
    
    // ✅ 4. Call axiosInstance.delete
    const res = await axiosInstance.delete<DeleteNotificationApiResponse>(url, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const responseData = res.data;

    // ✅ 5. Check backend-defined success flag
    if (!responseData.success) {
      return { success: false, error: responseData.message || "Failed to delete notification" };
    }

    // backend returns data as a string on success
    return { success: true, data: responseData.data || undefined };

  } catch (err) {
    // ✅ 6. Use isAxiosError to handle non-2xx responses
    if (isAxiosError(err)) {
      const error = err as AxiosError<DeleteNotificationApiResponse>;
      const responseData = error.response?.data;

      // Replicate the original 'fetch' error logic
      return { success: false, error: responseData?.message || `HTTP ${error.response?.status}` };
    }
    
    // Fallback for non-network errors
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
};

export default deleteNotificationService;
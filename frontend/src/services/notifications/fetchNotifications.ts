import { NotificationMapper } from "@/mapper/notificationMapper";
import type { GetNotificationsResponse } from "@/lib/types/notifications";
// ✅ 1. Import axios instance and error types
import { axiosInstance, isAxiosError, AxiosError } from "@/hooks/axios";
// ✅ 2. Import the standard response wrapper
import type { StandardAPIResponse } from "@/lib/types/auth";

// Define the expected API response type, wrapping the original data type
type GetNotificationsApiResponse = StandardAPIResponse<GetNotificationsResponse>;

export const fetchNotificationsService = async (
  accessToken: string,
  options?: { page?: number; size?: number; isRead?: boolean }
): Promise<{ success: boolean; data?: GetNotificationsResponse; error?: string }> => {
  try {
    // ✅ 3. Token check
    if (!accessToken) {
      return { success: false, error: "Authentication token is missing." };
    }

    const url = NotificationMapper.getNotifications;

    // ✅ 4. Call axiosInstance.get, passing options as 'params'
    // Axios will automatically serialize 'options' into query parameters
    // e.g., ?page=1&size=10
    const res = await axiosInstance.get<GetNotificationsApiResponse>(url, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      params: options, // Axios handles query params
    });

    const responseData = res.data;

    // ✅ 5. Check backend-defined success flag
    if (!responseData.success) {
      return { success: false, error: responseData.message || "Failed to fetch notifications" };
    }

    // Return the nested 'data' property from the API response
    return { success: true, data: responseData.data || undefined };

  } catch (err) {
    // ✅ 6. Use isAxiosError to handle non-2xx responses
    if (isAxiosError(err)) {
      const error = err as AxiosError<GetNotificationsApiResponse>;
      const responseData = error.response?.data;

      // Return the error message from the backend payload, or a fallback
      return { success: false, error: responseData?.message || `HTTP ${error.response?.status}` };
    }
    
    // Fallback for non-network errors
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
};

export default fetchNotificationsService;
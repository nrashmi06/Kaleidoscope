import NotificationMapper from "@/mapper/notificationMapper";
import type { MarkAllReadResponse } from "@/lib/types/notifications";
import { axiosInstance, isAxiosError, AxiosError } from "@/hooks/axios";

export const markAllAsReadService = async (
  accessToken: string
): Promise<MarkAllReadResponse> => { // ✅ 1. Promise the full StandardAPIResponse
  
  const url = NotificationMapper.markAllAsRead;

  try {
    if (!accessToken) {
      throw new Error("Authentication token is missing.");
    }

    const res = await axiosInstance.patch<MarkAllReadResponse>(url, null, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    });

    // ✅ 2. Return the full standard response from the API
    return res.data;

  } catch (err) {
    // ✅ 3. Handle ALL errors by returning a manufactured StandardAPIResponse
    if (isAxiosError(err)) {
      const error = err as AxiosError<MarkAllReadResponse>;
      if (error.response?.data) {
        return error.response.data;
      }
    }

    const message = err instanceof Error ? err.message : "An unknown error occurred";
    return {
      success: false,
      message: message,
      data: null,
      errors: [message],
      timestamp: Date.now(),
      path: url,
    };
  }
};

export default markAllAsReadService;
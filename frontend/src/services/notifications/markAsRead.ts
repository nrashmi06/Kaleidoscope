import { NotificationMapper } from "@/mapper/notificationMapper";
// ✅ 1. Import the correct response type from your types file
import type { GetNotificationResponse } from "@/lib/types/notifications";

import { axiosInstance, isAxiosError, AxiosError } from "@/hooks/axios";


export const markAsReadService = async (
  accessToken: string,
  notificationId: number
): Promise<GetNotificationResponse> => { // ✅ 2. Promise the full StandardAPIResponse
  
  const url = NotificationMapper.markAsRead(notificationId);

  try {
    if (!accessToken) {
      // This is an application error. We must manufacture a StandardAPIResponse.
      throw new Error("Authentication token is missing.");
    }

    // Call axios, expecting the full GetNotificationResponse in the 'data' field
    const res = await axiosInstance.patch<GetNotificationResponse>(url, null, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    });

    // ✅ 3. Return the full standard response from the API
    return res.data;

  } catch (err) {
    // ✅ 4. Handle ALL errors by returning a manufactured StandardAPIResponse
    if (isAxiosError(err)) {
      const error = err as AxiosError<GetNotificationResponse>;
      
      if (error.response?.data) {
        return error.response.data;
      }
    }

    const message = err instanceof Error ? err.message : "An unknown error occurred";
    return {
      success: false,
      message: message,
      data: null, // No 'NotificationItem' on failure
      errors: [message],
      timestamp: Date.now(),
      path: url,
    };
  }
};

export default markAsReadService;
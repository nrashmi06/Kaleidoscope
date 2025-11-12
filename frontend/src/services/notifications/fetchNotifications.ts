import { NotificationMapper } from "@/mapper/notificationMapper";
import type {
  GetNotificationsResponse,
  GetNotificationsParams,
} from "@/lib/types/notifications";
import { axiosInstance, isAxiosError, AxiosError } from "@/hooks/axios";

// ❌ The circular 'GetNotificationsApiResponse' type is removed. We use 'GetNotificationsResponse' directly.

export const getNotificationsService = async (
  accessToken: string,
  options?: GetNotificationsParams
): Promise<GetNotificationsResponse> => { // ✅ 1. Promise the full StandardAPIResponse
  
  const url = NotificationMapper.getNotifications;

  try {
    if (!accessToken) {
      // This is an application error, not an API error.
      // We must manufacture a StandardAPIResponse.
      throw new Error("Authentication token is missing.");
    }

    // Call axios, expecting the full GetNotificationsResponse
    const res = await axiosInstance.get<GetNotificationsResponse>(url, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      params: options, // Axios handles query params
    });

    // ✅ 2. Return the full standard response on success
    // The 'data' field (res.data) is the GetNotificationsResponse
    return res.data;

  } catch (err) {
    // ✅ 3. Handle ALL errors by returning a manufactured StandardAPIResponse
    if (isAxiosError(err)) {
      const error = err as AxiosError<GetNotificationsResponse>;
      
      // If the backend sent its own standard error (e.g., 401, 404),
      // return that, as it's the most accurate error.
      if (error.response?.data) {
        return error.response.data;
      }
    }

    // If it's a network error, auth error, or any other JS error,
    // create a standard error response to satisfy the type contract.
    const message = err instanceof Error ? err.message : "An unknown error occurred";
    return {
      success: false,
      message: message,
      data: null, // No data on failure
      errors: [message],
      timestamp: Date.now(),
      path: url,
    };
  }
};

export default getNotificationsService;
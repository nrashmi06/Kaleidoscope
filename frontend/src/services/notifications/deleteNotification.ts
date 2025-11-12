import NotificationMapper from "@/mapper/notificationMapper";
import { axiosInstance, isAxiosError, AxiosError } from "@/hooks/axios";
// ✅ 1. Import the base StandardAPIResponse type
import type { StandardAPIResponse } from "@/lib/types/auth";

// ✅ 2. Define the expected API response type for this specific call
// A successful delete likely returns 'null' or a simple message.
// We'll align with the controller and expect 'null'.
type DeleteNotificationApiResponse = StandardAPIResponse<null>;

export const deleteNotificationService = async (
  accessToken: string,
  notificationId: number
): Promise<DeleteNotificationApiResponse> => { // ✅ 3. Promise the full StandardAPIResponse
  
  const url = NotificationMapper.deleteNotification(notificationId);

  try {
    if (!accessToken) {
      // This is an application error. We must manufacture a StandardAPIResponse.
      throw new Error("Authentication token is missing.");
    }

    // Call axios, expecting the full DeleteNotificationApiResponse in the 'data' field
    const res = await axiosInstance.delete<DeleteNotificationApiResponse>(url, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    });

    // ✅ 4. Return the full standard response from the API
    return res.data;

  } catch (err) {
    // ✅ 5. Handle ALL errors by returning a manufactured StandardAPIResponse
    if (isAxiosError(err)) {
      const error = err as AxiosError<DeleteNotificationApiResponse>;
      
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

export default deleteNotificationService;
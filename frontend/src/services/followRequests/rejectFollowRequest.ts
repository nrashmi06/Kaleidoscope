// src/services/followRequests/rejectFollowRequest.ts
import FollowMapper from "@/mapper/followMapper";
import type { FollowRequestActionResponse } from "@/lib/types/followRequests";
// ✅ 1. Import axios instance and error types
import { axiosInstance, isAxiosError, AxiosError } from "@/hooks/axios";

/**
 * Sends a DELETE request to reject a pending follow request.
 *
 * @param accessToken - The user's authentication token.
 * @param requesterUserId - The ID of the user who sent the follow request.
 * @returns A structured result indicating success or failure.
 */
export const rejectFollowRequestService = async (
  accessToken: string | null,
  requesterUserId: number
): Promise<{ success: boolean; data?: FollowRequestActionResponse; error?: string }> => {
  try {
    // ✅ 2. Token check (same as before)
    if (!accessToken) {
      return { success: false, error: "Authentication token is missing." };
    }
    
    // Endpoint: /api/follows/requests/reject
    const base = FollowMapper.rejectRequest();

    // ✅ 3. Define axios config for headers and params
    const config = {
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}` 
      },
      // Axios will append this as a query param: ?requesterUserId=...
      params: {
        requesterUserId: requesterUserId
      }
      // No 'data' (body) needed for this DELETE
    };

    // ✅ 4. Call axiosInstance.delete
    const res = await axiosInstance.delete<FollowRequestActionResponse>(base, config);

    const responseData = res.data;
    
    // ✅ 5. Check for backend-defined success flag
    if (!responseData.success) {
      return { success: false, error: responseData?.message || "Failed to reject follow request" };
    }

    return { success: true, data: responseData };

  } catch (err) {
    // ✅ 6. Use isAxiosError to handle non-2xx responses
    if (isAxiosError(err)) {
      const error = err as AxiosError<FollowRequestActionResponse>;
      const responseData = error.response?.data;

      // Handle 401, 404, or other errors gracefully
      if (error.response?.status === 401) {
          return { success: false, error: "Unauthorized access or invalid token." };
      }
      if (error.response?.status === 404 && responseData?.message === "Follow request not found") {
          return { success: false, error: "The pending follow request was not found." };
      }
      return { success: false, error: responseData?.message || `HTTP ${error.response?.status}: Failed to reject follow request` };
    }

    // Fallback for non-network errors
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
};
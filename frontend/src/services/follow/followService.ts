import { FollowMapper } from "@/mapper/followMapper";
import type { FollowResponse } from "@/lib/types/follow";
// ✅ 1. Import axios instance and error types
import { axiosInstance, isAxiosError, AxiosError } from "@/hooks/axios";

const followUserService = async (
  accessToken: string | null,
  targetUserId: number
): Promise<{ success: boolean; data?: FollowResponse; error?: string }> => {
  try {
    // ✅ 2. Token check (same as before)
    if (!accessToken) {
      return { success: false, error: "Authentication token is missing." };
    }

    const url = FollowMapper.follow(targetUserId);

    // ✅ 3. Define axios config (headers)
    const config = {
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`,
      },
    };

    // ✅ 4. Call axiosInstance.post with an empty body ({})
    // The targetUserId is in the URL query parameter, not the body
    const response = await axiosInstance.post<FollowResponse>(url, {}, config);

    const responseData = response.data;

    // ✅ 5. Check backend-defined success flag
    if (!responseData.success) {
      return { success: false, error: responseData?.message || "Failed to follow user" };
    }

    return { success: true, data: responseData };
    
  } catch (err) {
    // ✅ 6. Use isAxiosError to handle non-2xx responses
    if (isAxiosError(err)) {
      const error = err as AxiosError<FollowResponse>;
      const responseData = error.response?.data;

      if (error.response?.status === 401) {
        return { success: false, error: "Unauthorized. Please log in again." };
      }
      if (error.response?.status === 404) {
        return { success: false, error: responseData?.message || "User not found." };
      }
      
      return { success: false, error: responseData?.message || `HTTP ${error.response?.status}: Failed to follow user` };
    }

    // Fallback for non-network errors
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
};

export default followUserService;
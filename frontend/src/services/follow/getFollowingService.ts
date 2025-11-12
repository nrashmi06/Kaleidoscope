import FollowMapper from "@/mapper/followMapper";
import type { GetFollowingResponse, GetFollowingParams } from "@/lib/types/following";
// ✅ 1. Import axios instance and error types
import { axiosInstance, isAxiosError, AxiosError } from "@/hooks/axios";

const getFollowingService = async (
  accessToken: string | null,
  params: GetFollowingParams
): Promise<{ success: boolean; data?: GetFollowingResponse; error?: string }> => {
  try {
    // ✅ 2. Token check (same as before)
    if (!accessToken) {
      return { success: false, error: "Authentication token is missing." };
    }

    const base = FollowMapper.following();

    // ✅ 3. Define axios config for headers and params
    const config = {
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`,
      },
      // Axios will automatically build the query string:
      // ?userId=...&page=...&size=...
      params: {
        userId: params.userId,
        page: params.page,
        size: params.size,
      },
    };

    // ✅ 4. Call axiosInstance.get instead of fetch
    const response = await axiosInstance.get<GetFollowingResponse>(base, config);

    const responseData = response.data;

    // ✅ 5. Check backend-defined success flag
    if (!responseData.success) {
      return { success: false, error: responseData?.message || "Failed to fetch following" };
    }

    // Return the full API response object
    return { success: true, data: responseData };

  } catch (err) {
    // ✅ 6. Use isAxiosError to handle non-2xx responses
    if (isAxiosError(err)) {
      const error = err as AxiosError<GetFollowingResponse>;
      const responseData = error.response?.data;

      if (error.response?.status === 401) {
        return { success: false, error: "Unauthorized. Please log in again." };
      }
      if (error.response?.status === 404) {
        return { success: false, error: responseData?.message || "User not found." };
      }
      
      return { success: false, error: responseData?.message || `HTTP ${error.response?.status}: Failed to fetch following` };
    }

    // Fallback for non-network errors
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
};

export default getFollowingService;
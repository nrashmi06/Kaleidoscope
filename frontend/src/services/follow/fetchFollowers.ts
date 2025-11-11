// src/services/followers/fetchFollowers.ts
import FollowMapper from "@/mapper/followMapper";
import type { StandardAPIResponse } from "@/lib/types/auth"; 
import type { FollowersResponsePayload } from "@/lib/types/followers"; 
// ✅ 1. Import axios instance and error types
import { axiosInstance, isAxiosError, AxiosError } from "@/hooks/axios";

type GetFollowersAPIResponse = StandardAPIResponse<FollowersResponsePayload>;
interface FetchFollowersParams {
    userId: number;
    page?: number;
    size?: number;
    sort?: string; 
}

export const fetchFollowersService = async (
  accessToken: string | null,
  params: FetchFollowersParams
): Promise<{ success: boolean; data?: FollowersResponsePayload; error?: string }> => {
  try {
    if (!accessToken) {
        return { success: false, error: "Authentication token is missing." };
    }

    const base = FollowMapper.followers();
    
    // ✅ 2. Use axios config object for params and headers
    const config = {
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}` 
      },
      // Axios will automatically build the query string from this object
      params: {
        userId: params.userId,
        page: params.page,
        size: params.size,
        sort: params.sort
      }
    };

    // ✅ 3. Use axiosInstance.get instead of fetch
    const response = await axiosInstance.get<GetFollowersAPIResponse>(base, config);
    
    const responseData = response.data;
    
    // ✅ 4. Check for backend-defined success flag
    if (!responseData.success || !responseData.data) {
        return { success: false, error: responseData?.message || "Failed to fetch followers" };
    }

    // Return the API response data payload directly
    return { success: true, data: responseData.data };

  } catch (err) {
    // ✅ 5. Use isAxiosError to handle non-2xx responses
    if (isAxiosError(err)) {
        const error = err as AxiosError<GetFollowersAPIResponse>;
        const responseData = error.response?.data;
        
        if (error.response?.status === 401) {
            return { success: false, error: "Unauthorized access or invalid token." };
        }
        if (error.response?.status === 404) {
             return { success: false, error: responseData?.message || "User not found." };
        }
        return { success: false, error: responseData?.message || `HTTP ${error.response?.status}: Failed to fetch followers` };
    }

    // Fallback for non-network errors
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
};
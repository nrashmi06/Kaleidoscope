// src/services/followRequests/getPendingFollowRequests.ts
import FollowMapper from "@/mapper/followMapper";
import type {
  GetPendingFollowRequestsResponse,
  GetPendingFollowRequestsParams,
} from "@/lib/types/followRequests";
// ✅ 1. Import axios instance and error types
import { axiosInstance, isAxiosError, AxiosError } from "@/hooks/axios";

export const getPendingFollowRequestsService = async (
  accessToken: string | null,
  options: GetPendingFollowRequestsParams = {}
): Promise<{ success: boolean; data?: GetPendingFollowRequestsResponse; error?: string }> => {
  try {
    // ✅ 2. Token check (same as before)
    if (!accessToken) {
      return { success: false, error: "Authentication token is missing." };
    }
    
    const base = FollowMapper.pendingRequests();

    // ✅ 3. Replicate params logic exactly as before
    const search = new URLSearchParams();

    if (options.page !== undefined) search.append("page", String(options.page));
    if (options.size !== undefined) search.append("size", String(options.size));
    
    // Handle array of sort strings, defaulting if none is provided
    const sortOptions = options.sort && Array.isArray(options.sort) && options.sort.length > 0
        ? options.sort
        : ["createdAt,desc"]; 
    
    // Append each sort item individually to match 'fetch' behavior
    sortOptions.forEach(s => search.append("sort", s));

    // ✅ 4. Define axios config
    const config = {
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}` 
      },
      // Pass the manually constructed URLSearchParams
      params: search
    };

    // ✅ 5. Call axiosInstance.get
    const res = await axiosInstance.get<GetPendingFollowRequestsResponse>(base, config);

    const responseData = res.data;
    
    // ✅ 6. Check for backend-defined success flag
    if (!responseData.success || !responseData.data) {
      return { success: false, error: responseData?.message || `Failed to fetch pending follow requests` };
    }

    return { success: true, data: responseData };
    
  } catch (err) {
    // ✅ 7. Use isAxiosError to handle non-2xx responses
    if (isAxiosError(err)) {
      const error = err as AxiosError<GetPendingFollowRequestsResponse>;
      const responseData = error.response?.data;

      // Handle 401 Unauthorized case
      if (error.response?.status === 401) {
          return { success: false, error: "Unauthorized access or invalid token." };
      }
      return { success: false, error: responseData?.message || `HTTP ${error.response?.status}: Failed to fetch pending follow requests` };
    }

    // Fallback for non-network errors
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
};
// src/services/followRequests/getPendingFollowRequests.ts
import FollowMapper from "@/mapper/followMapper";
import type {
  GetPendingFollowRequestsResponse,
  GetPendingFollowRequestsParams,
} from "@/lib/types/followRequests";

export const getPendingFollowRequestsService = async (
  accessToken: string | null,
  options: GetPendingFollowRequestsParams = {}
): Promise<{ success: boolean; data?: GetPendingFollowRequestsResponse; error?: string }> => {
  try {
    const base = FollowMapper.pendingRequests();
    const search = new URLSearchParams();

    if (options.page !== undefined) search.append("page", String(options.page));
    if (options.size !== undefined) search.append("size", String(options.size));
    
    // Handle array of sort strings, defaulting if none is provided
    const sortOptions = options.sort && Array.isArray(options.sort) && options.sort.length > 0
        ? options.sort
        : ["createdAt,desc"]; 
    
    sortOptions.forEach(s => search.append("sort", s));

    const url = `${base}?${search.toString()}`;

    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;

    const res = await fetch(url, { method: "GET", headers });
    const responseData = await res.json();
    
    if (!res.ok) {
        // Handle 401 Unauthorized case
        if (res.status === 401) {
            return { success: false, error: "Unauthorized access or invalid token." };
        }
        return { success: false, error: responseData?.message || `HTTP ${res.status}: Failed to fetch pending follow requests` };
    }

    return { success: true, data: responseData as GetPendingFollowRequestsResponse };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
};
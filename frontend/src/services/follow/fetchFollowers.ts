// src/services/followers/fetchFollowers.ts
import FollowMapper from "@/mapper/followMapper";
import type { StandardAPIResponse } from "@/lib/types/auth"; 
import type { FollowersResponsePayload } from "@/lib/types/followers"; 

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
    const search = new URLSearchParams();

    search.append("userId", String(params.userId));
    if (params.page !== undefined) search.append("page", String(params.page));
    if (params.size !== undefined) search.append("size", String(params.size));
    if (params.sort) search.append("sort", params.sort);

    const url = `${base}?${search.toString()}`;

    const headers: Record<string, string> = { "Content-Type": "application/json" };
    headers["Authorization"] = `Bearer ${accessToken}`;

    const res = await fetch(url, { method: "GET", headers });
    const responseData: GetFollowersAPIResponse = await res.json();
    
    if (!res.ok || !responseData.success || !responseData.data) {
        if (res.status === 401) {
            return { success: false, error: "Unauthorized access or invalid token." };
        }
        if (res.status === 404) {
             return { success: false, error: responseData?.message || "User not found." };
        }
        return { success: false, error: responseData?.message || `HTTP ${res.status}: Failed to fetch followers` };
    }

    // Return the API response data payload directly, skipping the mapper
    return { success: true, data: responseData.data };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
};
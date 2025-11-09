// src/controllers/followers/fetchFollowersController.ts
import { fetchFollowersService } from "@/services/follow/fetchFollowers";
import type { FollowersResponsePayload } from "@/lib/types/followers";

export interface FetchFollowersParams {
    userId: number;
    page?: number;
    size?: number;
    sort?: string; 
}

export interface FetchFollowersResult {
    success: boolean;
    message: string;
    data?: FollowersResponsePayload; // Data payload is the raw API response structure
    error?: string;
}

export const fetchFollowersController = async (
  accessToken: string | null,
  params: FetchFollowersParams
): Promise<FetchFollowersResult> => {
  if (!accessToken) {
    return { success: false, message: "Authentication is required.", error: "Unauthorized" };
  }
  
  const finalParams = {
    sort: "createdAt,desc",
    ...params
  };

  const result = await fetchFollowersService(accessToken, finalParams);

  if (result.success && result.data) {
    return { 
        success: true, 
        message: "Followers retrieved successfully.", 
        data: result.data 
    };
  } else {
    return {
        success: false,
        message: result.error || "Failed to retrieve followers list.",
        error: result.error,
    };
  }
};
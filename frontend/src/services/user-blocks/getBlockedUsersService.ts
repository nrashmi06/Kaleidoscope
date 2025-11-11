// src/services/user-blocks/getBlockedUsersService.ts

import { UserBlocksMapper } from "@/mapper/userBlocksMapper";
import type { 
  BlockedUsersApiResponse, 
  GetBlockedUsersParams 
} from "@/lib/types/blockedUsersList";

/**
 * Calls the API to fetch a paginated list of blocked users.
 *
 * @param params - The request object (page, size, sort).
 * @param accessToken - The authenticated user's JWT.
 * @returns The full API response (BlockedUsersApiResponse).
 */
export const getBlockedUsersService = async (
  params: GetBlockedUsersParams,
  accessToken: string
): Promise<BlockedUsersApiResponse> => {
  const { page, size, sort } = params;
  const url = UserBlocksMapper.getBlockedUsers(page, size, sort?.join(","));

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    const responseData = await response.json();

    if (!response.ok) {
      if (responseData && !responseData.success) {
        return responseData as BlockedUsersApiResponse;
      }
      throw new Error(responseData.message || `HTTP error! Status: ${response.status}`);
    }

    return responseData as BlockedUsersApiResponse;

  } catch (error) {
    console.error("[getBlockedUsersService] Error:", error);
    
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to fetch blocked users. Please check your connection.",
      data: null,
      errors: [error instanceof Error ? error.message : "Unknown error"],
      timestamp: Date.now(),
      path: url,
    };
  }
};
// src/services/user-blocks/getUsersBlockedByService.ts

import { UserBlocksMapper } from "@/mapper/userBlocksMapper";
import type { 
  UsersBlockedByApiResponse, 
  GetUsersBlockedByParams 
} from "@/lib/types/usersBlockedBy";

/**
 * Calls the API to fetch a paginated list of users who have blocked
 * the authenticated user.
 *
 * @param params - The request object (page, size, sort).
 * @param accessToken - The authenticated user's JWT.
 * @returns The full API response (UsersBlockedByApiResponse).
 */
export const getUsersBlockedByService = async (
  params: GetUsersBlockedByParams,
  accessToken: string
): Promise<UsersBlockedByApiResponse> => {
  const { page, size, sort } = params;
  
  // ✅ Using the mapper function you provided
  const url = UserBlocksMapper.getUsersBlockedBy(page, size, sort?.join(","));

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
        return responseData as UsersBlockedByApiResponse;
      }
      throw new Error(responseData.message || `HTTP error! Status: ${response.status}`);
    }

    return responseData as UsersBlockedByApiResponse;

  } catch (error) {
    console.error("[getUsersBlockedByService] Error:", error);
    
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to fetch users. Please check your connection.",
      data: null,
      errors: [error instanceof Error ? error.message : "Unknown error"],
      timestamp: Date.now(),
      path: url,
    };
  }
};
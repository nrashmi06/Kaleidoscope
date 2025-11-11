// src/controllers/user-blocks/getBlockedUsersController.ts

import { getBlockedUsersService } from "@/services/user-blocks/getBlockedUsersService";
import type { 
  GetBlockedUsersParams, 
  BlockedUsersControllerResult 
} from "@/lib/types/blockedUsersList";

/**
 * Controller to handle the logic for fetching blocked users.
 *
 * @param params - The request object (page, size, sort).
 * @param accessToken - The authenticated user's JWT.
 * @returns A normalized result (BlockedUsersControllerResult) for the frontend.
 */
export const getBlockedUsersController = async (
  params: GetBlockedUsersParams,
  accessToken: string
): Promise<BlockedUsersControllerResult> => {
  
  if (!accessToken) {
    return { success: false, message: "Authentication token is missing." };
  }

  try {
    const response = await getBlockedUsersService(params, accessToken);

    if (response.success && response.data) {
      return {
        success: true,
        message: response.message || "Blocked users retrieved successfully.",
        data: response.data,
      };
    } else {
      return {
        success: false,
        message: response.message || "An error occurred while fetching blocked users.",
      };
    }
  } catch (error) {
    console.error("[getBlockedUsersController] Unexpected error:", error);
    return {
      success: false,
      message: "An unexpected error occurred. Please try again.",
    };
  }
};
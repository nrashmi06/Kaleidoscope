// src/controllers/user-blocks/getUsersBlockedByController.ts

import { getUsersBlockedByService } from "@/services/user-blocks/getUsersBlockedByService";
import type { 
  GetUsersBlockedByParams, 
  UsersBlockedByControllerResult 
} from "@/lib/types/usersBlockedBy";

/**
 * Controller to handle the logic for fetching users who have
 * blocked the current user.
 *
 * @param params - The request object (page, size, sort).
 * @param accessToken - The authenticated user's JWT.
 * @returns A normalized result (UsersBlockedByControllerResult) for the frontend.
 */
export const getUsersBlockedByController = async (
  params: GetUsersBlockedByParams,
  accessToken: string
): Promise<UsersBlockedByControllerResult> => {
  
  if (!accessToken) {
    return { success: false, message: "Authentication token is missing." };
  }

  try {
    const response = await getUsersBlockedByService(params, accessToken);

    if (response.success && response.data) {
      return {
        success: true,
        message: response.message || "Data retrieved successfully.",
        data: response.data,
      };
    } else {
      return {
        success: false,
        message: response.message || "An error occurred while fetching data.",
      };
    }
  } catch (error) {
    console.error("[getUsersBlockedByController] Unexpected error:", error);
    return {
      success: false,
      message: "An unexpected error occurred. Please try again.",
    };
  }
};
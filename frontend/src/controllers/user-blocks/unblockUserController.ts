// src/controllers/user-blocks/unblockUserController.ts

import { unblockUserService } from "@/services/user-blocks/unblockUserService";
import type { 
  UnblockUserRequest, 
  UnblockUserControllerResult 
} from "@/lib/types/unblockUser";

/**
 * Controller to handle the logic for unblocking a user.
 *
 * @param payload - The request body (userIdToUnblock).
 * @param accessToken - The authenticated user's JWT.
 * @returns A normalized result (UnblockUserControllerResult) for the frontend.
 */
export const unblockUserController = async (
  payload: UnblockUserRequest,
  accessToken: string
): Promise<UnblockUserControllerResult> => {
  
  // 1. Input Validation
  if (!accessToken) {
    return { success: false, message: "Authentication token is missing." };
  }
  if (!payload.userIdToUnblock || payload.userIdToUnblock <= 0) {
    return { success: false, message: "A valid User ID to unblock is required." };
  }

  try {
    // 2. Call Service
    const response = await unblockUserService(payload, accessToken);

    // 3. Normalize Response
    if (response.success) {
      // On success, return the clean message
      return {
        success: true,
        message: response.message || "User unblocked successfully.",
      };
    } else {
      // On failure, return the standardized error message
      return {
        success: false,
        message: response.message || "An error occurred while unblocking the user.",
      };
    }
  } catch (error) {
    // Catch any unexpected errors (should be rare)
    console.error("[unblockUserController] Unexpected error:", error);
    return {
      success: false,
      message: "An unexpected error occurred. Please try again.",
    };
  }
};
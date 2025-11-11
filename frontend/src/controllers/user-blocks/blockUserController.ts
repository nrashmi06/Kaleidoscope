// src/controllers/user-blocks/blockUserController.ts

import { blockUserService } from "@/services/user-blocks/blockUserService";
import type { BlockUserRequest, BlockUserControllerResult } from "@/lib/types/user-blocks";

/**
 * Controller to handle the logic for blocking a user.
 *
 * @param payload - The request body (userIdToBlock, reason).
 * @param accessToken - The authenticated user's JWT.
 * @returns A normalized result (BlockUserControllerResult) for the frontend.
 */
export const blockUserController = async (
  payload: BlockUserRequest,
  accessToken: string
): Promise<BlockUserControllerResult> => {
  
  // 1. Input Validation
  if (!accessToken) {
    return { success: false, message: "Authentication token is missing." };
  }
  if (!payload.userIdToBlock || payload.userIdToBlock <= 0) {
    return { success: false, message: "A valid User ID to block is required." };
  }
  if (!payload.reason || payload.reason.trim().length < 10) {
    return { success: false, message: "A reason (minimum 10 characters) is required to block a user." };
  }

  try {
    // 2. Call Service
    const response = await blockUserService(payload, accessToken);

    // 3. Normalize Response
    if (response.success && response.data) {
      // On success, return the clean message and data
      return {
        success: true,
        message: response.message || "User blocked successfully.",
        data: response.data,
      };
    } else {
      // On failure, return the standardized error message
      return {
        success: false,
        message: response.message || "An error occurred while blocking the user.",
      };
    }
  } catch (error) {
    // Catch any unexpected errors (should be rare)
    console.error("[blockUserController] Unexpected error:", error);
    return {
      success: false,
      message: "An unexpected error occurred. Please try again.",
    };
  }
};
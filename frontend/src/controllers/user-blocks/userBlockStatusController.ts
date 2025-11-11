// src/controllers/user-blocks/userBlockStatusController.ts

import { userBlockStatusService } from "@/services/user-blocks/userBlockStatusService";
import type {
  UserBlockStatusRequest,
  UserBlockStatusControllerResult,
} from "@/lib/types/userBlockStatus";

/**
 * Controller to handle the logic for checking block status.
 *
 * @param params - The request object (targetUserId).
 * @param accessToken - The authenticated user's JWT.
 * @returns A normalized result (UserBlockStatusControllerResult) for the frontend.
 */
export const userBlockStatusController = async (
  params: UserBlockStatusRequest,
  accessToken: string
): Promise<UserBlockStatusControllerResult> => {
  // 1. Input Validation
  if (!accessToken) {
    return { success: false, message: "Authentication token is missing." };
  }
  if (!params.targetUserId || params.targetUserId <= 0) {
    return {
      success: false,
      message: "A valid Target User ID is required.",
    };
  }

  try {
    // 2. Call Service (which now uses axios)
    const response = await userBlockStatusService(params, accessToken);

    // 3. Normalize Response
    if (response.success && response.data) {
      // On success, return the clean message and data
      return {
        success: true,
        message: response.message || "Status retrieved successfully.",
        data: response.data,
      };
    } else {
      // On failure, return the standardized error message
      return {
        success: false,
        message:
          response.message || "An error occurred while checking status.",
      };
    }
  } catch (error) {
    // Catch any unexpected errors (should be rare)
    console.error("[userBlockStatusController] Unexpected error:", error);
    return {
      success: false,
      message: "An unexpected error occurred. Please try again.",
    };
  }
};
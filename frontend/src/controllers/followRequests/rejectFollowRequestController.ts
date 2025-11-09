// src/controllers/followRequests/rejectFollowRequestController.ts
import { rejectFollowRequestService } from "@/services/followRequests/rejectFollowRequest";

/**
 * Controller to handle the business logic and error wrapping for rejecting a follow request.
 *
 * @param accessToken - The user's authentication token.
 * @param requesterUserId - The ID of the user who sent the follow request.
 * @returns A structured result indicating success, along with a message.
 */
export const rejectFollowRequestController = async (
  accessToken: string | null,
  requesterUserId: number
): Promise<{ success: boolean; message: string; error?: string }> => {
  if (!accessToken) {
    return { success: false, message: "Access token is missing.", error: "Unauthorized" };
  }
  
  const result = await rejectFollowRequestService(accessToken, requesterUserId);
  
  if (result.success && result.data) {
    // Return the success message from the API response body (data or message field)
    return { 
      success: true, 
      message: result.data.message || result.data.data || "Follow request rejected." 
    };
  } else {
    return { 
      success: false, 
      message: result.error || "Failed to reject request.", 
      error: result.error 
    };
  }
};
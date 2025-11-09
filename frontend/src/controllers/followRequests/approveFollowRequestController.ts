// src/controllers/followRequests/approveFollowRequestController.ts
import { approveFollowRequestService } from "@/services/followRequests/approveFollowRequest";
/**
 * Controller to handle the business logic and error wrapping for approving a follow request.
 *
 * @param accessToken - The user's authentication token.
 * @param requesterUserId - The ID of the user who sent the follow request.
 * @returns A structured result indicating success, along with a message.
 */
export const approveFollowRequestController = async (
  accessToken: string | null,
  requesterUserId: number
): Promise<{ success: boolean; message: string; error?: string }> => {
  if (!accessToken) {
    return { success: false, message: "Access token is missing.", error: "Unauthorized" };
  }
  
  const result = await approveFollowRequestService(accessToken, requesterUserId);
  
  if (result.success && result.data) {
    // Return the success message from the API response body (data or message field)
    return { 
      success: true, 
      message: result.data.message || result.data.data || "Follow request approved." 
    };
  } else {
    return { 
      success: false, 
      message: result.error || "Failed to approve request.", 
      error: result.error 
    };
  }
};